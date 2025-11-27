'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { auth, db, storage } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Upload, FileText, Zap, X, ArrowLeft, ArrowRight, Eye, Check } from 'lucide-react'
import { useVerification } from '@/hooks/useVerification'
import { useRouter } from 'next/navigation'

// 블라인드 스타일 카테고리
const blindCategories = [
  { value: '전체', label: '전체', emoji: '' },
  { value: '베스트', label: '🔥베스트', emoji: '🔥' },
  { value: '대나무숲', label: '🗣️대나무숲', emoji: '🗣️' },
  { value: '빌런박제소', label: '❓빌런박제소', emoji: '❓' },
  { value: '유머 & 이슈', label: '유머 & 이슈', emoji: '' },
  { value: '비틱방(자랑방)', label: '비틱방(자랑방)', emoji: '🥕' },
  { value: '결정장애', label: '💭결정장애', emoji: '💭' },
]

// 업종 목록
const businessCategories = [
  { value: '치킨', emoji: '🍗' },
  { value: '카페', emoji: '☕' },
  { value: '한식', emoji: '🍚' },
  { value: '중식', emoji: '🥟' },
  { value: '일식', emoji: '🍣' },
  { value: '양식', emoji: '🍝' },
  { value: '분식', emoji: '🍢' },
  { value: '기타', emoji: '🏪' },
]

// 익명 닉네임 생성용 상수 (컴포넌트 외부로 이동)
const ANONYMOUS_ADJECTIVES = ['지친', '행복한', '대박난', '화난', '새벽의']
const ANONYMOUS_NOUNS = ['닭발', '족발', '아메리카노', '마라탕', '포스기', '사장님']

interface WriteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultBusinessType?: string
  defaultRegion?: string
}

type WriteMode = 'quick' | 'detailed'
type DetailedStep = 1 | 2 | 3

export default function WriteModal({
  isOpen,
  onClose,
  onSuccess,
  defaultBusinessType,
  defaultRegion,
}: WriteModalProps) {
  const router = useRouter()
  const { isVerified, loading: verificationLoading } = useVerification()
  const [user, setUser] = useState<any>(null)
  const [userAnonymousName, setUserAnonymousName] = useState<string>('')
  const [userRegion, setUserRegion] = useState<string>('')
  const [userBusinessType, setUserBusinessType] = useState<string>('치킨')
  
  // 모드 선택
  const [writeMode, setWriteMode] = useState<WriteMode>('quick')
  const [detailedStep, setDetailedStep] = useState<DetailedStep>(1)
  
  // 빠른 작성 모드
  const [quickContent, setQuickContent] = useState('')
  const [quickCategory, setQuickCategory] = useState('대나무숲')
  
  // 상세 작성 모드
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [postCategory, setPostCategory] = useState('대나무숲')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // 익명 닉네임 생성 (useCallback으로 메모이제이션)
  const generateAnonymousName = useCallback(() => {
    const randomAdjective = ANONYMOUS_ADJECTIVES[Math.floor(Math.random() * ANONYMOUS_ADJECTIVES.length)]
    const randomNoun = ANONYMOUS_NOUNS[Math.floor(Math.random() * ANONYMOUS_NOUNS.length)]
    return `${randomAdjective} ${randomNoun}`
  }, [])

  // 로그인 상태 및 사용자 정보 불러오기
  useEffect(() => {
    if (!auth || !db) return

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser && db) {
        try {
          const userRef = doc(db, 'users', currentUser.uid)
          const userSnap = await getDoc(userRef)
          if (userSnap.exists()) {
            const userData = userSnap.data()
            if (userData.anonymousName) setUserAnonymousName(userData.anonymousName)
            if (userData.region) setUserRegion(userData.region)
            if (userData.businessType) setUserBusinessType(userData.businessType)
          }
        } catch (error) {
          console.error('사용자 정보 불러오기 오류:', error)
        }
      }
    })
    return () => unsubscribe()
  }, [])

  // 모달 열 때 초기화 (최적화: 중복 제거)
  const resetForm = useCallback(() => {
    setWriteMode('quick')
    setDetailedStep(1)
    setQuickContent('')
    setQuickCategory('대나무숲')
    setTitle('')
    setContent('')
    setPostCategory('대나무숲')
    setUploadedImages([])
    setUploading(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen, resetForm])

  // 카테고리 필터링 (useMemo로 메모이제이션)
  const availableCategories = useMemo(
    () => blindCategories.filter(cat => cat.value !== '전체' && cat.value !== '베스트'),
    []
  )

  // 이미지 업로드 (useCallback으로 메모이제이션)
  const handleImageUpload = useCallback(async (file: File) => {
    if (!user || !storage) {
      alert('로그인이 필요합니다.')
      return
    }

    setUploading(true)
    try {
      const imageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${file.name}`)
      await uploadBytes(imageRef, file)
      const downloadURL = await getDownloadURL(imageRef)
      setUploadedImages(prev => [...prev, downloadURL])
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      alert('이미지 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }, [user])

  // 이미지 삭제 (useCallback으로 메모이제이션)
  const handleImageRemove = useCallback((index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }, [])

  // 공통 저장 로직 (중복 제거)
  const savePost = useCallback(async (
    postData: {
      title: string
      content: string
      category: string
      images: string[]
      isSimpleMode: boolean
    }
  ) => {
    if (!user || !db) {
      alert('로그인이 필요합니다.')
      return false
    }

    if (!isVerified) {
      alert('사업자 인증이 필요합니다. 인증된 찐사장들만 글을 작성할 수 있습니다.')
      router.push('/auth/verify')
      onClose()
      return false
    }

    try {
      const authorName = userAnonymousName || generateAnonymousName()
      const finalBusinessType = defaultBusinessType || userBusinessType || '치킨'
      const finalRegion = defaultRegion || userRegion || ''

      await addDoc(collection(db, 'posts'), {
        title: postData.title,
        content: postData.content,
        category: postData.category,
        businessType: finalBusinessType,
        region: finalRegion,
        author: authorName,
        uid: user.uid,
        timestamp: serverTimestamp(),
        likes: 0,
        comments: 0,
        images: postData.images,
        isSimpleMode: postData.isSimpleMode,
      })

      return true
    } catch (e) {
      console.error('글 저장 실패:', e)
      alert('글 저장 실패: ' + (e instanceof Error ? e.message : String(e)))
      return false
    }
  }, [user, userAnonymousName, generateAnonymousName, defaultBusinessType, userBusinessType, defaultRegion, userRegion, db, isVerified, router, onClose])

  // 빠른 작성 모드 - 글 저장
  const handleQuickWrite = useCallback(async () => {
    if (!quickContent.trim()) {
      alert('본문을 입력해주세요')
      return
    }

    const finalTitle = quickContent.split('\n')[0].substring(0, 50) || '제목 없음'
    
    const success = await savePost({
      title: finalTitle,
      content: quickContent,
      category: quickCategory,
      images: [],
      isSimpleMode: true,
    })

    if (success) {
      resetForm()
      setShowSuccessModal(true)
      setTimeout(() => {
        setShowSuccessModal(false)
        onSuccess?.()
        onClose()
      }, 2000)
    }
  }, [quickContent, quickCategory, savePost, resetForm, onSuccess, onClose])

  // 상세 작성 모드 - 글 저장
  const handleDetailedWrite = useCallback(async () => {
    if (!content.trim()) {
      alert('본문을 입력해주세요')
      return
    }

    const finalTitle = title || content.split('\n')[0].substring(0, 50) || '제목 없음'
    
    const success = await savePost({
      title: finalTitle,
      content: content,
      category: postCategory,
      images: uploadedImages,
      isSimpleMode: false,
    })

    if (success) {
      resetForm()
      setShowSuccessModal(true)
      setTimeout(() => {
        setShowSuccessModal(false)
        onSuccess?.()
        onClose()
      }, 2000)
    }
  }, [title, content, postCategory, uploadedImages, savePost, resetForm, onSuccess, onClose])

  // 모달 닫기
  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  // 다음 단계로
  const handleNextStep = useCallback(() => {
    if (detailedStep === 1) {
      setDetailedStep(2)
    } else if (detailedStep === 2) {
      if (!content.trim()) {
        alert('본문을 입력해주세요')
        return
      }
      setDetailedStep(3)
    }
  }, [detailedStep, content])

  // 이전 단계로
  const handlePrevStep = useCallback(() => {
    if (detailedStep > 1) {
      setDetailedStep((detailedStep - 1) as DetailedStep)
    }
  }, [detailedStep])

  // 모드 전환
  const toggleWriteMode = useCallback(() => {
    setWriteMode(prev => prev === 'quick' ? 'detailed' : 'quick')
  }, [])

  // 미리보기 데이터 (useMemo로 메모이제이션)
  const previewData = useMemo(() => {
    if (detailedStep !== 3) return null
    
    const business = defaultBusinessType || userBusinessType || '치킨'
    const category = businessCategories.find(c => c.value === business)
    const categoryInfo = blindCategories.find(cat => cat.value === postCategory)
    
    return {
      business: category ? `${category.emoji} ${business}` : business,
      categoryLabel: categoryInfo?.label || postCategory,
      categoryEmoji: categoryInfo?.emoji || '',
    }
  }, [detailedStep, defaultBusinessType, userBusinessType, postCategory])

  if (!isOpen) return null

  // 인증 확인 중이거나 인증되지 않은 경우 안내 메시지 표시
  if (verificationLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
        <div className="bg-white w-full rounded-t-3xl p-6 h-[85vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-[#1A2B4E] mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="text-gray-600">인증 상태를 확인하는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (user && !isVerified) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
        <div className="bg-white w-full rounded-t-3xl p-6 h-[85vh] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-6">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">사업자 인증이 필요합니다</h2>
            <p className="text-gray-600 mb-2">
              인증된 찐사장들만 게시글을 작성할 수 있습니다.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              사업자등록증을 통해 인증을 완료해주세요.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  onClose()
                  router.push('/auth/verify')
                }}
                className="w-full bg-[#FFBF00] text-[#1A2B4E] px-6 py-4 rounded-xl font-bold hover:bg-[#FFBF00]/90 transition shadow-lg"
              >
                사업자 인증하기
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
        <div className="bg-white w-full rounded-t-3xl p-6 h-[85vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">글쓰기</h2>
              <button
                onClick={toggleWriteMode}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  writeMode === 'quick'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                }`}
                title={writeMode === 'quick' ? '상세 작성 모드로 전환' : '빠른 작성 모드로 전환'}
              >
                <Zap size={14} />
                <span>{writeMode === 'quick' ? '빠른 작성' : '상세 작성'}</span>
              </button>
            </div>
            <button
              onClick={handleClose}
              className="text-2xl text-gray-400 hover:text-gray-600 transition"
            >
              ✕
            </button>
          </div>

          {/* 모드 선택 (처음 열 때만) */}
          {writeMode === 'quick' && !quickContent && !title && !content && (
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setWriteMode('quick')}
                  className="p-4 border-2 border-blue-500 bg-blue-50 rounded-xl text-center hover:bg-blue-100 transition"
                >
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-bold text-blue-700">빠른 작성</div>
                  <div className="text-xs text-gray-600 mt-1">본문만 입력하고 바로 등록</div>
                </button>
                <button
                  onClick={() => setWriteMode('detailed')}
                  className="p-4 border-2 border-gray-300 bg-white rounded-xl text-center hover:bg-gray-50 transition"
                >
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-bold text-gray-700">상세 작성</div>
                  <div className="text-xs text-gray-600 mt-1">제목, 이미지 등 상세 옵션</div>
                </button>
              </div>
            </div>
          )}

          {/* 빠른 작성 모드 */}
          {writeMode === 'quick' && (
            <div className="space-y-4">
              <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                <FileText size={14} />
                <span>빠른 작성: 본문만 입력하면 자동으로 설정됩니다</span>
              </div>

              {/* 개인정보 보호 안내 */}
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <span className="text-red-600 font-bold text-lg">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-700 mb-1">
                      개인정보 절대 노출금지
                    </p>
                    <p className="text-xs text-red-600">
                      전화번호, 이름, 매장명 등 개인정보를 게시하면 안전에 위험할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 카테고리 선택 */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-700 mb-1">
                  카테고리
                </label>
                <div className="flex flex-wrap gap-1">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setQuickCategory(cat.value)}
                      className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition whitespace-nowrap ${
                        quickCategory === cat.value
                          ? 'bg-[#1A2B4E] text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className="w-full h-64 outline-none resize-none text-gray-700 border-2 border-gray-200 rounded-xl p-4 focus:border-[#1A2B4E] focus:ring-2 focus:ring-[#1A2B4E]/10 text-base"
                placeholder="사장님들의 이야기를 들려주세요...&#10;&#10;⚠️ 개인정보 절대 노출금지 (전화번호, 이름, 매장명)&#10;&#10;(제목은 자동 생성됩니다)"
                value={quickContent}
                onChange={(e) => setQuickContent(e.target.value)}
                maxLength={2000}
              />
              <div className="text-xs text-gray-400 text-right">
                {quickContent.length}/2000
              </div>

              <button
                onClick={handleQuickWrite}
                disabled={!quickContent.trim()}
                className="w-full bg-[#1A2B4E] text-white py-4 rounded-xl font-bold hover:bg-[#1A2B4E]/90 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                등록하기
              </button>
            </div>
          )}

          {/* 상세 작성 모드 */}
          {writeMode === 'detailed' && (
            <div className="space-y-4">
              {/* 진행 단계 표시 */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className={`flex items-center gap-2 ${detailedStep >= 1 ? 'text-[#1A2B4E]' : 'text-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${detailedStep >= 1 ? 'bg-[#1A2B4E] text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {detailedStep > 1 ? <Check size={16} /> : '1'}
                  </div>
                  <span className="text-sm font-medium">기본 설정</span>
                </div>
                <div className={`flex-1 h-0.5 ${detailedStep >= 2 ? 'bg-[#1A2B4E]' : 'bg-gray-200'}`} />
                <div className={`flex items-center gap-2 ${detailedStep >= 2 ? 'text-[#1A2B4E]' : 'text-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${detailedStep >= 2 ? 'bg-[#1A2B4E] text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {detailedStep > 2 ? <Check size={16} /> : '2'}
                  </div>
                  <span className="text-sm font-medium">내용 작성</span>
                </div>
                <div className={`flex-1 h-0.5 ${detailedStep >= 3 ? 'bg-[#1A2B4E]' : 'bg-gray-200'}`} />
                <div className={`flex items-center gap-2 ${detailedStep >= 3 ? 'text-[#1A2B4E]' : 'text-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${detailedStep >= 3 ? 'bg-[#1A2B4E] text-white' : 'bg-gray-200 text-gray-400'}`}>
                    3
                  </div>
                  <span className="text-sm font-medium">미리보기</span>
                </div>
              </div>

              {/* Step 1: 기본 설정 */}
              {detailedStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">
                      카테고리 선택
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {availableCategories.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => setPostCategory(cat.value)}
                          className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition whitespace-nowrap ${
                            postCategory === cat.value
                              ? 'bg-[#1A2B4E] text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {cat.emoji} {cat.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1.5">
                      업종은 마이페이지에서 설정한 값이 자동으로 사용됩니다.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="flex-1 px-4 py-3 bg-[#1A2B4E] text-white rounded-xl font-medium hover:bg-[#1A2B4E]/90 transition flex items-center justify-center gap-2"
                    >
                      다음
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: 내용 작성 */}
              {detailedStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      제목
                    </label>
                    <input
                      className="w-full text-lg font-bold outline-none border-2 border-gray-200 rounded-xl p-3 focus:border-[#1A2B4E] focus:ring-2 focus:ring-[#1A2B4E]/10 text-gray-900"
                      placeholder="제목을 입력하세요"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      본문
                    </label>
                    
                    {/* 개인정보 보호 안내 */}
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-3">
                      <div className="flex items-start gap-2">
                        <span className="text-red-600 font-bold text-lg">⚠️</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-red-700 mb-1">
                            개인정보 절대 노출금지
                          </p>
                          <p className="text-xs text-red-600">
                            전화번호, 이름, 매장명 등 개인정보를 게시하면 안전에 위험할 수 있습니다.
                          </p>
                        </div>
                      </div>
                    </div>

                    <textarea
                      className="w-full h-48 outline-none resize-none text-gray-700 border-2 border-gray-200 rounded-xl p-4 focus:border-[#1A2B4E] focus:ring-2 focus:ring-[#1A2B4E]/10"
                      placeholder="사장님들의 이야기를 들려주세요 (익명 보장)&#10;&#10;⚠️ 개인정보 절대 노출금지 (전화번호, 이름, 매장명)"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      maxLength={2000}
                    />
                    <div className="text-xs text-gray-400 mt-2 text-right">
                      {content.length}/2000
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이미지 첨부 (최대 5개)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {uploadedImages.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`업로드 ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            onClick={() => handleImageRemove(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {uploadedImages.length < 5 && (
                        <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#1A2B4E] transition">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(file)
                              }
                            }}
                            disabled={uploading}
                          />
                          {uploading ? (
                            <div className="animate-spin text-gray-400">
                              <Upload size={20} />
                            </div>
                          ) : (
                            <Upload size={20} className="text-gray-400" />
                          )}
                        </label>
                      )}
                    </div>
                    {uploadedImages.length >= 5 && (
                      <p className="text-xs text-gray-500">이미지는 최대 5개까지 첨부할 수 있습니다.</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handlePrevStep}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={18} />
                      이전
                    </button>
                    <button
                      onClick={handleNextStep}
                      disabled={!content.trim()}
                      className="flex-1 px-4 py-3 bg-[#1A2B4E] text-white rounded-xl font-medium hover:bg-[#1A2B4E]/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      미리보기
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: 미리보기 */}
              {detailedStep === 3 && previewData && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 text-sm">👤</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">
                          {userAnonymousName || '익명의 사장님'}
                        </div>
                        <div className="text-xs text-gray-500">방금 전</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {postCategory && (
                          <span className="px-2 py-1 bg-[#1A2B4E] text-white text-xs font-medium rounded-full">
                            {previewData.categoryEmoji} {previewData.categoryLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {defaultRegion && (
                        <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                          {defaultRegion}
                        </span>
                      )}
                      <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
                        {previewData.business}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {title || '제목 없음'}
                    </h3>

                    <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
                      {content}
                    </p>

                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {uploadedImages.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`미리보기 ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 border-t border-gray-200">
                      <span>❤️ 0</span>
                      <span>💬 0</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handlePrevStep}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={18} />
                      수정
                    </button>
                    <button
                      onClick={handleDetailedWrite}
                      className="flex-1 px-4 py-3 bg-[#1A2B4E] text-white rounded-xl font-bold hover:bg-[#1A2B4E]/90 transition shadow-lg flex items-center justify-center gap-2"
                    >
                      <Check size={18} />
                      등록하기
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 등록 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">등록되었습니다</h3>
              <p className="text-sm text-gray-500">글이 성공적으로 등록되었습니다.</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

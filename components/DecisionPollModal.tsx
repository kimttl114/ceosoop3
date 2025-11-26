'use client'

import { useState, useEffect, useCallback } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { X, Loader2, Clock, Check } from 'lucide-react'
import { useVerification } from '@/hooks/useVerification'
import { useRouter } from 'next/navigation'

interface DecisionPollModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultBusinessType?: string
  defaultRegion?: string
}

export default function DecisionPollModal({
  isOpen,
  onClose,
  onSuccess,
  defaultBusinessType,
  defaultRegion,
}: DecisionPollModalProps) {
  const router = useRouter()
  const { isVerified, loading: verificationLoading } = useVerification()
  const [user, setUser] = useState<any>(null)
  const [userAnonymousName, setUserAnonymousName] = useState<string>('')
  const [userBusinessType, setUserBusinessType] = useState<string>('치킨')
  const [userRegion, setUserRegion] = useState<string>('')
  
  // 폼 상태
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')
  const [deadlineHours, setDeadlineHours] = useState(24)
  const [allowChangeVote, setAllowChangeVote] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
            if (userData.businessType) setUserBusinessType(userData.businessType)
            if (userData.region) setUserRegion(userData.region)
          }
        } catch (error) {
          console.error('사용자 정보 불러오기 오류:', error)
        }
      }
    })
    return () => unsubscribe()
  }, [])

  // 모달 닫을 때 폼 초기화
  const resetForm = useCallback(() => {
    setTitle('')
    setDescription('')
    setOptionA('')
    setOptionB('')
    setDeadlineHours(24)
    setAllowChangeVote(true)
    setIsSubmitting(false)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen, resetForm])

  // 투표 생성
  const handleCreatePoll = async () => {
    if (!user || !db) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!isVerified) {
      alert('사업자 인증이 필요합니다. 인증된 찐사장들만 투표를 생성할 수 있습니다.')
      router.push('/auth/verify')
      onClose()
      return
    }

    if (!title.trim()) {
      alert('투표 제목을 입력해주세요.')
      return
    }

    if (!optionA.trim() || !optionB.trim()) {
      alert('두 가지 선택지를 모두 입력해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const authorName = userAnonymousName || '익명의 사장님'
      const finalBusinessType = defaultBusinessType || userBusinessType || '치킨'
      const finalRegion = defaultRegion || userRegion || ''

      // 마감 시간 계산
      const deadlineDate = new Date()
      deadlineDate.setHours(deadlineDate.getHours() + deadlineHours)
      const deadlineTimestamp = Timestamp.fromDate(deadlineDate)

      await addDoc(collection(db, 'decision_polls'), {
        authorId: user.uid,
        authorName: authorName,
        title: title.trim(),
        description: description.trim() || '',
        optionA: {
          text: optionA.trim(),
          votes: 0,
        },
        optionB: {
          text: optionB.trim(),
          votes: 0,
        },
        businessType: finalBusinessType,
        region: finalRegion,
        deadline: deadlineTimestamp,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        views: 0,
        allowChangeVote: allowChangeVote,
        isAnonymous: false,
        status: 'active',
      })

      resetForm()
      onSuccess?.()
      onClose()
      alert('투표가 생성되었습니다!')
    } catch (error: any) {
      console.error('투표 생성 실패:', error)
      alert('투표 생성에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  // 인증 확인 중
  if (verificationLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
        <div className="bg-white w-full rounded-t-3xl h-[90vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-[#1A2B4E] mb-4">
              <Loader2 size={48} />
            </div>
            <p className="text-gray-600">인증 상태를 확인하는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  // 인증되지 않은 사용자 안내
  if (user && !isVerified) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
        <div className="bg-white w-full rounded-t-3xl h-[90vh] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="text-6xl mb-6">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">사업자 인증이 필요합니다</h2>
            <p className="text-gray-600 mb-2">
              인증된 찐사장들만 투표를 생성할 수 있습니다.
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
        <div className="bg-white w-full rounded-t-3xl h-[90vh] flex flex-col">
          {/* 헤더 */}
          <div className="flex justify-between items-center p-5 pb-3 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>💭</span>
              <span>결정장애 투표 만들기</span>
            </h2>
            <button
              onClick={onClose}
              className="text-2xl text-gray-400 hover:text-gray-600 transition"
            >
              ✕
            </button>
          </div>

          {/* 등록 버튼 (헤더 바로 아래 고정) */}
          <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0 bg-gray-50">
            <button
              onClick={handleCreatePoll}
              disabled={isSubmitting || !title.trim() || !optionA.trim() || !optionB.trim()}
              className="w-full py-3 bg-[#FFBF00] text-[#1A2B4E] rounded-xl font-bold hover:bg-[#FFBF00]/90 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>등록 중...</span>
                </>
              ) : (
                <>
                  <Check size={20} />
                  <span>투표 등록하기</span>
                </>
              )}
            </button>
          </div>

          {/* 폼 (스크롤 가능) */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-3">
            {/* 제목 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                투표 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 치킨집 포장 용기 바꿀까요?"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1A2B4E] text-gray-800"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                상황 설명 (선택사항)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="상황을 자세히 설명해주세요..."
                className="w-full h-24 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1A2B4E] text-gray-800 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
            </div>

            {/* 선택지 A */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                선택지 A <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                placeholder="예: 종이 포장으로 전환 (환경 친화적)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1A2B4E] text-gray-800"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{optionA.length}/100</p>
            </div>

            {/* 선택지 B */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                선택지 B <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                placeholder="예: 기존 플라스틱 유지 (비용 절감)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1A2B4E] text-gray-800"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{optionB.length}/100</p>
            </div>

            {/* 마감 시간 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Clock size={16} className="inline mr-1" />
                마감 시간
              </label>
              <select
                value={deadlineHours}
                onChange={(e) => setDeadlineHours(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1A2B4E] text-gray-800"
              >
                <option value={1}>1시간</option>
                <option value={6}>6시간</option>
                <option value={24}>24시간</option>
                <option value={48}>48시간</option>
                <option value={168}>1주일</option>
              </select>
            </div>

            {/* 투표 변경 허용 */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                id="allowChangeVote"
                checked={allowChangeVote}
                onChange={(e) => setAllowChangeVote(e.target.checked)}
                className="w-5 h-5 text-[#1A2B4E] border-gray-300 rounded focus:ring-[#1A2B4E]"
              />
              <label htmlFor="allowChangeVote" className="text-sm text-gray-700 cursor-pointer">
                투표 변경 허용 (마감 전까지 선택 변경 가능)
              </label>
            </div>

            {/* 안내 메시지 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs text-blue-800">
                💡 <strong>팁:</strong> 구체적인 선택지를 작성할수록 더 유용한 의견을 받을 수 있습니다.
              </p>
            </div>

            {/* 하단 여백 */}
            <div className="pb-6"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


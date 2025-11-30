'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mic, Loader2, Upload } from 'lucide-react'
import { auth, storage, db } from '@/lib/firebase'
import { ref, listAll, getDownloadURL, uploadBytes } from 'firebase/storage'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import BottomNav from '@/components/BottomNav'
import { SmartAudioGenerator } from '@/components/SmartAudioGenerator'

interface BgmFile {
  name: string
  url: string
  type: 'public' | 'private'
}

export default function AnnouncementPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [bgmFiles, setBgmFiles] = useState<BgmFile[]>([])
  const [loadingBgm, setLoadingBgm] = useState(false)
  const [uploadingBgm, setUploadingBgm] = useState(false)

  // 사용자 인증 확인 및 로그인 체크
  useEffect(() => {
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
        router.push('/login')
      }
    })
    return () => unsubscribe()
  }, [router])

  // BGM 파일 목록 불러오기
  useEffect(() => {
    loadBgmFiles()
  }, [user])

  const loadBgmFiles = async () => {
    if (!storage) return

    setLoadingBgm(true)
    
    try {
      const allFiles: BgmFile[] = []

      // 1. 공용 BGM 로드 (모든 사용자가 사용 가능)
      try {
        const publicBgmRef = ref(storage, 'bgm/public')
        const publicFileList = await listAll(publicBgmRef)
        
        const publicFiles = await Promise.all(
          publicFileList.items.map(async (item) => {
            const url = await getDownloadURL(item)
            return { 
              name: item.name, 
              url,
              type: 'public' as const
            }
          })
        )
        
        allFiles.push(...publicFiles)
      } catch (error: any) {
        // 공용 폴더가 없거나 접근 불가능한 경우는 무시
        if (error.code !== 'storage/object-not-found' && error.code !== 'storage/unauthorized') {
          console.warn('공용 BGM 파일 목록 불러오기 실패:', error)
        }
      }

      // 2. 개인 BGM 로드 (로그인한 사용자만)
      if (user) {
        try {
          const privateBgmRef = ref(storage, `bgm/${user.uid}`)
          const privateFileList = await listAll(privateBgmRef)
          
          const privateFiles = await Promise.all(
            privateFileList.items.map(async (item) => {
              const url = await getDownloadURL(item)
              return { 
                name: item.name, 
                url,
                type: 'private' as const
              }
            })
          )
          
          allFiles.push(...privateFiles)
        } catch (error: any) {
          // 개인 폴더가 없거나 접근 불가능한 경우는 무시
          if (error.code !== 'storage/object-not-found' && error.code !== 'storage/unauthorized') {
            console.warn('개인 BGM 파일 목록 불러오기 실패:', error)
          }
        }
      }
      
      setBgmFiles(allFiles)
    } catch (error: any) {
      console.error('BGM 파일 목록 불러오기 오류:', error)
      setBgmFiles([])
    } finally {
      setLoadingBgm(false)
    }
  }

  // BGM 파일 업로드
  const handleBgmUpload = async (file: File, isPublic: boolean = true) => {
    if (!user || !storage) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!file.type.startsWith('audio/')) {
      alert('오디오 파일만 업로드 가능합니다.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.')
      return
    }

    setUploadingBgm(true)

    try {
      const folderPath = isPublic ? 'bgm/public' : `bgm/${user.uid}`
      const bgmRef = ref(storage, `${folderPath}/${Date.now()}_${file.name}`)
      
      await uploadBytes(bgmRef, file)
      
      // Firestore에 메타데이터 저장 (선택사항)
      if (db && isPublic) {
        try {
          await addDoc(collection(db, 'public_bgm'), {
            fileName: file.name,
            uploadedBy: user.uid,
            uploadedAt: serverTimestamp(),
            fileSize: file.size,
            fileType: file.type,
            storagePath: bgmRef.fullPath
          })
        } catch (dbError: any) {
          console.warn('Firestore 메타데이터 저장 실패 (무시 가능):', dbError)
        }
      }
      
      await loadBgmFiles()
      
      const message = isPublic 
        ? 'BGM 파일이 공용 폴더에 업로드되었습니다. 모든 사용자가 사용할 수 있습니다.'
        : 'BGM 파일이 업로드되었습니다.'
      alert(message)
    } catch (error: any) {
      console.error('BGM 업로드 실패:', error)
      const errorMessage = error.message || '알 수 없는 오류'
      
      if (error.code === 'storage/unauthorized' || error.code === 'storage/permission-denied') {
        alert('BGM 업로드 권한이 없습니다. Firebase Storage 규칙을 확인해주세요.')
      } else {
        alert(`BGM 업로드에 실패했습니다: ${errorMessage}`)
      }
    } finally {
      setUploadingBgm(false)
    }
  }

  // SmartAudioGenerator에 전달할 BGM 옵션 생성
  const bgmOptions = [
    { label: 'BGM 없음', value: '', url: '' },
    ...bgmFiles.map((file) => ({
      label: file.type === 'public' 
        ? `[공용] ${file.name.replace(/^\d+_/, '')}` 
        : `[내 BGM] ${file.name.replace(/^\d+_/, '')}`,
      value: `${file.type}_${file.name}`,
      url: file.url,
    })),
  ]

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition active:bg-gray-200"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Mic size={20} className="sm:w-6 sm:h-6" />
            <span className="hidden sm:inline">안내방송 생성기</span>
            <span className="sm:hidden">방송 생성</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-4 sm:py-6">
        {/* AI 올인원 생성기 */}
        <div className="mb-6">
          {loadingBgm ? (
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <Loader2 size={24} className="animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">BGM 목록을 불러오는 중...</p>
            </div>
          ) : (
            <SmartAudioGenerator bgmOptions={bgmOptions} />
          )}
        </div>

        {/* BGM 업로드 섹션 */}
        {user && (
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">BGM 관리</h2>
            
            <div className="space-y-2">
              {/* 공용 BGM 업로드 */}
              <label className="block">
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (confirm('공용 BGM으로 업로드하시겠습니까? 모든 사용자가 사용할 수 있습니다.')) {
                        handleBgmUpload(file, true)
                      }
                    }
                    e.target.value = ''
                  }}
                  disabled={uploadingBgm}
                />
                <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-[#1A2B4E] rounded-lg cursor-pointer hover:bg-[#1A2B4E] hover:text-white transition bg-blue-50 disabled:opacity-50">
                  {uploadingBgm ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-gray-400" />
                      <span className="text-sm text-gray-500">업로드 중...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="text-[#1A2B4E]" />
                      <span className="text-sm font-medium text-[#1A2B4E]">🔊 공용 BGM 업로드 (모든 사용자 공유)</span>
                    </>
                  )}
                </div>
              </label>
              
              {/* 개인 BGM 업로드 */}
              <label className="block">
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleBgmUpload(file, false)
                    e.target.value = ''
                  }}
                  disabled={uploadingBgm}
                />
                <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition">
                  {uploadingBgm ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-gray-400" />
                      <span className="text-sm text-gray-500">업로드 중...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">🎵 개인 BGM 업로드 (본인만 사용)</span>
                    </>
                  )}
                </div>
              </label>
              
              <p className="text-xs text-gray-500 text-center">
                💡 공용 BGM은 모든 사용자가 사용할 수 있습니다. 개인 BGM은 본인만 사용 가능합니다.
              </p>
            </div>
          </div>
        )}

        {!user && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-800">
              로그인하면 BGM을 업로드할 수 있습니다
            </p>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs sm:text-sm text-blue-800 mb-2 font-semibold">
            💡 사용 방법:
          </p>
          <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
            <li>상황 키워드를 입력하세요 (예: 재료 소진, 브레이크 타임)</li>
            <li>원하는 분위기를 선택하세요 (정중하게, 유쾌하게, 단호하게)</li>
            <li>BGM을 선택하거나 업로드하세요 (선택사항)</li>
            <li>"AI로 방송 만들기" 버튼을 클릭하세요</li>
          </ul>
          <p className="text-xs text-blue-600 mt-3">
            ✅ AI가 대본을 자동으로 작성하고, 음성 생성 및 BGM 합성까지 모두 서버에서 처리됩니다.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
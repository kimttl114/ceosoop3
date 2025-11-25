'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ArrowLeft, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react'
import AIAvatarGenerator from '@/components/AIAvatarGenerator'
import BottomNav from '@/components/BottomNav'

export default function AvatarPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  const [businessType, setBusinessType] = useState<string>('치킨')

  // 로그인 상태 확인 및 사용자 정보 불러오기
  useEffect(() => {
    if (!auth || !db) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        
        // 사용자 정보 불러오기
        try {
          const userRef = doc(db, 'users', currentUser.uid)
          const userSnap = await getDoc(userRef)
          
          if (userSnap.exists()) {
            const userData = userSnap.data()
            if (userData.avatarUrl) {
              setCurrentAvatarUrl(userData.avatarUrl)
            }
            if (userData.businessType) {
              setBusinessType(userData.businessType)
            }
          }
        } catch (error) {
          console.error('사용자 정보 불러오기 오류:', error)
        }
      } else {
        router.push('/')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const handleAvatarSave = async (imageUrl: string) => {
    if (!user || !db) return

    try {
      const userRef = doc(db, 'users', user.uid)
      await setDoc(
        userRef,
        {
          avatarUrl: imageUrl,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )
      
      setCurrentAvatarUrl(imageUrl)
      alert('아바타가 저장되었습니다!')
    } catch (error: any) {
      console.error('아바타 저장 실패:', error)
      alert('아바타 저장에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#1A2B4E] mx-auto mb-4" size={48} />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen pb-24 relative z-10 bg-[#F5F7FA]">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles size={24} className="text-[#FFBF00]" />
              <span>AI 아바타 생성</span>
            </h1>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 pt-6">
        {/* 안내 카드 */}
        <div className="bg-gradient-to-br from-[#1A2B4E] to-[#2C3E50] rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-start gap-3">
            <Sparkles size={24} className="text-[#FFBF00] flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-bold mb-2">나만의 AI 아바타 만들기</h2>
              <p className="text-sm text-white/90 leading-relaxed">
                키워드를 입력하면 AI가 나만의 아바타를 생성해드립니다. 
                생성된 아바타는 프로필과 게시글에 표시됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 현재 아바타 표시 */}
        {currentAvatarUrl && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ImageIcon size={18} className="text-[#1A2B4E]" />
              <span>현재 아바타</span>
            </h3>
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#1A2B4E] bg-gray-100">
                <img
                  src={currentAvatarUrl}
                  alt="현재 아바타"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              새로운 아바타를 생성하면 기존 아바타가 교체됩니다.
            </p>
          </div>
        )}

        {/* AI 아바타 생성기 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <AIAvatarGenerator
            currentAvatarUrl={currentAvatarUrl || undefined}
            onAvatarGenerated={handleAvatarSave}
          />
        </div>

        {/* 사용 팁 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">💡 사용 팁</h3>
          <ul className="text-xs text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>구체적인 키워드를 입력할수록 더 정확한 아바타가 생성됩니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>예: "치킨집 사장님, 밝은 미소, 빨간 앞치마"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>아바타는 최대 3회까지 생성할 수 있습니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>생성된 아바타는 프로필과 게시글에 자동으로 표시됩니다.</span>
            </li>
          </ul>
        </div>
      </main>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  )
}


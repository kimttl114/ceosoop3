'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import { ArrowLeft, Clock, TrendingUp, Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import DecisionPollModal from '@/components/DecisionPollModal'
import AvatarMini from '@/components/AvatarMini'
import { useVerification } from '@/hooks/useVerification'

export default function PollsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [polls, setPolls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isPollModalOpen, setIsPollModalOpen] = useState(false)
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({})
  const { isVerified } = useVerification()

  // 로그인 상태 확인
  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // 투표 목록 실시간 업데이트
  useEffect(() => {
    if (!db) return

    const q = query(
      collection(db, 'decision_polls'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const pollList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // 활성 상태만 필터링 및 마감 시간 확인
      const now = new Date()
      const activePolls = pollList.filter((poll: any) => {
        if (poll.status === 'closed') return false
        if (poll.deadline) {
          const deadline = poll.deadline.toDate ? poll.deadline.toDate() : new Date(poll.deadline)
          if (deadline < now) return false
        }
        return true
      })

      setPolls(activePolls)

      // 아바타 불러오기
      const uniqueUserIds = [...new Set(activePolls.map((p: any) => p.authorId))]
      const avatarPromises = uniqueUserIds.map(async (uid: string) => {
        if (userAvatars[uid]) return null
        try {
          const { doc, getDoc } = await import('firebase/firestore')
          const userRef = doc(db, 'users', uid)
          const userSnap = await getDoc(userRef)
          if (userSnap.exists()) {
            const userData = userSnap.data()
            const avatarUrl = userData.avatarUrl || null
            if (avatarUrl && avatarUrl.trim() !== '') {
              return { uid, avatarUrl }
            }
          }
        } catch (error) {
          console.error(`사용자 ${uid} 아바타 불러오기 오류:`, error)
        }
        return null
      })

      const avatarResults = await Promise.all(avatarPromises)
      const newAvatars: Record<string, string> = {}
      avatarResults.forEach((result: any) => {
        if (result && result.avatarUrl) {
          newAvatars[result.uid] = result.avatarUrl
        }
      })
      if (Object.keys(newAvatars).length > 0) {
        setUserAvatars((prev) => ({ ...prev, ...newAvatars }))
      }
    })

    return () => unsubscribe()
  }, [db, userAvatars])

  // 상대적 시간 포맷팅
  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return ''

    const now = new Date()
    const postTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const diff = now.getTime() - postTime.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    return postTime.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  // 마감까지 남은 시간
  const getTimeRemaining = (deadline: any) => {
    if (!deadline) return ''

    const now = new Date()
    const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline)
    const diff = deadlineDate.getTime() - now.getTime()

    if (diff <= 0) return '마감됨'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours < 1) {
      if (minutes < 1) return '마감 임박'
      return `${minutes}분 남음`
    }
    if (hours < 24) return `${hours}시간 남음`
    const days = Math.floor(hours / 24)
    return `${days}일 남음`
  }

  // 총 투표 수
  const getTotalVotes = (poll: any) => {
    return (poll.optionA?.votes || 0) + (poll.optionB?.votes || 0)
  }

  // 인기 투표 여부
  const isPopular = (poll: any) => {
    const totalVotes = getTotalVotes(poll)
    return totalVotes >= 10
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#1A2B4E]" size={48} />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 relative z-10 bg-[#F5F7FA]">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-[#1A2B4E] to-[#2C3E50] sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/20 rounded-full transition text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>💭</span>
              <span>결정장애 투표</span>
            </h1>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-4 space-y-3">
        {polls.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-500 shadow-sm">
            <p className="text-sm mb-2">아직 투표가 없습니다.</p>
            {user && isVerified && (
              <button
                onClick={() => setIsPollModalOpen(true)}
                className="mt-4 px-6 py-2 bg-[#1A2B4E] text-white rounded-lg font-medium hover:bg-[#1A2B4E]/90 transition"
              >
                첫 투표 만들기
              </button>
            )}
            {user && !isVerified && (
              <button
                onClick={() => router.push('/auth/verify')}
                className="mt-4 px-6 py-2 bg-[#FFBF00] text-[#1A2B4E] rounded-lg font-medium hover:bg-[#FFBF00]/90 transition"
              >
                사업자 인증하기
              </button>
            )}
          </div>
        ) : (
          polls.map((poll: any) => {
            const totalVotes = getTotalVotes(poll)
            const optionAPercent = totalVotes > 0 ? Math.round((poll.optionA?.votes || 0) / totalVotes * 100) : 0
            const optionBPercent = totalVotes > 0 ? Math.round((poll.optionB?.votes || 0) / totalVotes * 100) : 0

            return (
              <div
                key={poll.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100"
              >
                <div className="p-4">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">
                        {poll.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <AvatarMini size={20} avatarUrl={userAvatars[poll.authorId]} userId={poll.authorId} />
                        <span>{poll.authorName || '익명의 사장님'}</span>
                        <span>·</span>
                        <span>{formatRelativeTime(poll.createdAt)}</span>
                      </div>
                    </div>
                    {isPopular(poll) && (
                      <span className="px-2 py-1 bg-gradient-to-r from-[#FFBF00] to-[#F59E0B] text-[#1A2B4E] text-[10px] font-bold rounded-full flex items-center gap-1 flex-shrink-0">
                        <TrendingUp size={12} />
                        <span>인기</span>
                      </span>
                    )}
                  </div>

                  {/* 선택지 미리보기 */}
                  <div className="space-y-2 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">A. {poll.optionA?.text || ''}</span>
                        <span className="text-xs font-bold text-gray-900">{optionAPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-[#1A2B4E] h-1.5 rounded-full transition-all"
                          style={{ width: `${optionAPercent}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">B. {poll.optionB?.text || ''}</span>
                        <span className="text-xs font-bold text-gray-900">{optionBPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-[#1A2B4E] h-1.5 rounded-full transition-all"
                          style={{ width: `${optionBPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 메타 정보 및 투표하기 버튼 */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-3">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span>🗳️</span>
                        <span>{totalVotes}명 참여</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>💬</span>
                        <span>{poll.comments || 0}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{getTimeRemaining(poll.deadline)}</span>
                      </span>
                    </div>
                    <Link
                      href={`/polls/${poll.id}`}
                      className="px-4 py-1.5 bg-[#1A2B4E] text-white text-xs font-bold rounded-lg hover:bg-[#1A2B4E]/90 transition whitespace-nowrap flex-shrink-0"
                    >
                      투표하기
                    </Link>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </main>

      {/* 투표 작성 모달 */}
      <DecisionPollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        onSuccess={() => {
          setIsPollModalOpen(false)
        }}
      />

      {/* 하단 네비게이션 */}
      <BottomNav />

      {/* 글쓰기 버튼 (네비게이션 바 바로 위) */}
      {user && isVerified && (
        <div className="fixed bottom-[68px] left-1/2 -translate-x-1/2 z-[60] max-w-md w-full flex justify-center pointer-events-none">
          <button
            onClick={() => setIsPollModalOpen(true)}
            className="w-10 h-10 bg-[#FFBF00] text-[#1A2B4E] rounded-full shadow-lg flex items-center justify-center hover:bg-[#FFBF00]/90 transition transform hover:scale-110 active:scale-95 pointer-events-auto"
            type="button"
            title="투표 만들기"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  )
}


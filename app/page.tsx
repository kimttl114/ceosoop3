'use client'

import { useState, useEffect } from 'react'
import { auth, googleProvider, db } from '@/lib/firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { User, Trash2, Image, Search, Bell, Mail, Flag } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AvatarMini from '@/components/AvatarMini'
import BottomNav from '@/components/BottomNav'
import WriteModal from '@/components/WriteModal'
import MessageModal from '@/components/MessageModal'
import ReportModal from '@/components/ReportModal'
import PostAuthorBadge from '@/components/PostAuthorBadge'
import MorphingBackground from '@/components/MorphingBackground'
import { useVerification } from '@/hooks/useVerification'

// 블라인드 스타일 카테고리
const blindCategories = [
  { value: '전체', label: '전체', emoji: '' },
  { value: '베스트', label: '🔥베스트', emoji: '🔥' },
  { value: '대나무숲', label: '🗣️대나무슾', emoji: '🗣️' },
  { value: '빌런박제소', label: '❓빌런박제소', emoji: '❓' },
  { value: '꿀팁공유', label: '🍯꿀팁공유', emoji: '🍯' },
  { value: '비틱방(자랑질)', label: '비틱방(자랑질)', emoji: '🥕' },
]

// 업종 목록 (글쓰기 모달용)
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

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userAnonymousName, setUserAnonymousName] = useState<string>('')
  const [userRegion, setUserRegion] = useState<string>('')
  const [userBusinessType, setUserBusinessType] = useState<string>('치킨')
  const [posts, setPosts] = useState<any[]>([])
  const [polls, setPolls] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [isWriteMode, setIsWriteMode] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [messageReceiver, setMessageReceiver] = useState<{ id: string; name: string; postTitle?: string } | null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState<{ type: 'post', id: string, authorId?: string, content?: string } | null>(null)
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({})
  const { isVerified, loading: verificationLoading } = useVerification()

  // 익명 닉네임 생성: [형용사] + [명사] 조합
  const generateAnonymousName = () => {
    const adjectives = ['지친', '행복한', '대박난', '화난', '새벽의']
    const nouns = ['닭발', '족발', '아메리카노', '마라탕', '포스기', '사장님']

    // 랜덤하게 선택
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]

    return `${randomAdjective} ${randomNoun}`
  }

  // 상대적 시간 포맷팅 함수
  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return ''

    const now = new Date()
    const postTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const diff = now.getTime() - postTime.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    if (weeks < 4) return `${weeks}주 전`
    if (months < 12) return `${months}개월 전`
    return postTime.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // 업종 이모지 가져오기
  const getBusinessEmoji = (business: string) => {
    const found = businessCategories.find((c) => c.value === business)
    return found ? found.emoji : '🏪'
  }

  // 투표 마감까지 남은 시간
  const getPollTimeRemaining = (deadline: any) => {
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

  // 1. 로그인 상태 확인 및 아바타 설정 불러오기
  useEffect(() => {
    if (!auth) return

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      
      // 사용자의 아바타 설정 불러오기
      if (currentUser && db) {
        try {
          const userRef = doc(db, 'users', currentUser.uid)
          const userSnap = await getDoc(userRef)
          
          if (userSnap.exists()) {
            const userData = userSnap.data()
            if (userData.anonymousName) {
              setUserAnonymousName(userData.anonymousName)
            }
            if (userData.region) {
              setUserRegion(userData.region)
            }
            if (userData.businessType) {
              setUserBusinessType(userData.businessType)
            }
          }
        } catch (error) {
          // 오류 무시
        }
      }
    })
    return () => unsubscribe()
  }, [db])

  // 2. 글 목록 불러오기 (실시간 업데이트)
  useEffect(() => {
    if (!db) return

    // 전체 카테고리는 모든 글을 가져오고, 나머지는 클라이언트 사이드에서 필터링
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const postList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setPosts(postList)

        // 각 게시글 작성자의 아바타 가져오기
        const currentDb = db
        if (currentDb) {
          const userIds = postList.map((post: any) => post.uid).filter(Boolean) as string[]
          const uniqueUserIds = Array.from(new Set(userIds))
          
          // 현재 캐시된 아바타 확인 (함수형 업데이트로 최신 상태 참조)
          setUserAvatars((prevAvatars) => {
            const avatarPromises = uniqueUserIds.map(async (uid: string) => {
              // 이미 캐시에 있고 유효한 값이 있으면 스킵
              if (prevAvatars[uid] && prevAvatars[uid] !== null && prevAvatars[uid] !== '') {
                return null
              }
              try {
                const userRef = doc(currentDb, 'users', uid)
                const userSnap = await getDoc(userRef)
                if (userSnap.exists()) {
                  const userData = userSnap.data()
                  const avatarUrl = userData.avatarUrl || null
                  // null이나 빈 문자열이 아닐 때만 반환
                  if (avatarUrl && avatarUrl.trim() !== '') {
                    return { uid, avatarUrl }
                  }
                }
              } catch (error) {
                console.error(`사용자 ${uid} 아바타 불러오기 오류:`, error)
              }
              return null
            })

            Promise.all(avatarPromises).then((avatarResults) => {
              const newAvatars: Record<string, string> = {}
              avatarResults.forEach((result) => {
                if (result && result.avatarUrl) {
                  newAvatars[result.uid] = result.avatarUrl
                }
              })
              if (Object.keys(newAvatars).length > 0) {
                setUserAvatars((current) => {
                  // 중복 업데이트 방지: 이미 있는 값은 덮어쓰지 않음
                  const updated = { ...current }
                  Object.keys(newAvatars).forEach((uid) => {
                    // 기존 값이 없거나 빈 값일 때만 업데이트
                    if (!updated[uid] || updated[uid] === '') {
                      updated[uid] = newAvatars[uid]
                    }
                  })
                  return updated
                })
              }
            })

            return prevAvatars // 즉시 반환 (비동기 업데이트는 위에서 처리)
          })
        }
      },
      (error) => {
        console.error('글 목록 불러오기 오류:', error)
      }
    )
    return () => unsubscribe()
  }, [db]) // userAvatars dependency 제거

  // 2-2. 투표 목록 불러오기 (실시간 업데이트)
  useEffect(() => {
    if (!db) return

    const q = query(collection(db, 'decision_polls'), orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const now = new Date()
        const pollList = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            type: 'poll' as const,
          }))
          .filter((poll: any) => {
            // 활성 상태만 필터링
            if (poll.status === 'closed') return false
            if (poll.deadline) {
              const deadline = poll.deadline.toDate ? poll.deadline.toDate() : new Date(poll.deadline)
              if (deadline < now) return false
            }
            return true
          })
        
        setPolls(pollList)

        // 투표 작성자의 아바타 가져오기
        const userIds = pollList.map((poll: any) => poll.authorId).filter(Boolean) as string[]
        const uniqueUserIds = Array.from(new Set(userIds))
        
        setUserAvatars((prevAvatars) => {
          const avatarPromises = uniqueUserIds.map(async (uid: string) => {
            if (prevAvatars[uid] && prevAvatars[uid] !== null && prevAvatars[uid] !== '') {
              return null
            }
            try {
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

          Promise.all(avatarPromises).then((avatarResults) => {
            const newAvatars: Record<string, string> = {}
            avatarResults.forEach((result) => {
              if (result && result.avatarUrl) {
                newAvatars[result.uid] = result.avatarUrl
              }
            })
            if (Object.keys(newAvatars).length > 0) {
              setUserAvatars((current) => {
                const updated = { ...current }
                Object.keys(newAvatars).forEach((uid) => {
                  if (!updated[uid] || updated[uid] === '') {
                    updated[uid] = newAvatars[uid]
                  }
                })
                return updated
              })
            }
          })

          return prevAvatars
        })
      },
      (error) => {
        console.error('투표 목록 불러오기 오류:', error)
      }
    )
    return () => unsubscribe()
  }, [db])

  // 3. 안읽은 쪽지 개수 불러오기
  useEffect(() => {
    if (!user || !db) return

    const q = query(
      collection(db, 'messages'),
      where('receiverId', '==', user.uid),
      where('deletedByReceiver', '==', false)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // 클라이언트 사이드에서 필터링
        const unreadCount = snapshot.docs.filter((doc) => {
          const data = doc.data()
          return !data.read && !data.deletedByReceiver
        }).length
        setUnreadMessageCount(unreadCount)
      },
      (error: any) => {
        console.error('안읽은 쪽지 개수 불러오기 오류:', error)
        if (error?.code === 'failed-precondition') {
          console.warn('Firestore 인덱스가 필요할 수 있습니다.')
        }
      }
    )

    return () => unsubscribe()
  }, [user, db])

  // 글쓰기 모달 열기 이벤트 리스너
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOpenWriteModal = () => {
      if (user) {
        setIsWriteMode(true)
      }
    }

    window.addEventListener('openWriteModal', handleOpenWriteModal)
    return () => window.removeEventListener('openWriteModal', handleOpenWriteModal)
  }, [user])

  // 3. 로그인 함수
  const handleLogin = async () => {
    if (!auth || !googleProvider) {
      alert('Firebase가 초기화되지 않았습니다.')
      return
    }

    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error('로그인 실패:', error)
      alert('로그인 창이 안 열리나요? 팝업 차단을 확인해주세요!')
    }
  }


  // 5. 글 삭제 함수
  const handleDelete = async (postId: string, postUid: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    if (user.uid !== postUid) {
      alert('본인이 작성한 글만 삭제할 수 있습니다.')
      return
    }

    if (!confirm('정말 삭제하시겠습니까?')) {
      return
    }

    if (!db) {
      alert('Firebase가 초기화되지 않았습니다.')
      return
    }

    try {
      await deleteDoc(doc(db, 'posts', postId))
    } catch (e) {
      console.error('글 삭제 실패:', e)
      alert('글 삭제 실패: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  // 필터링된 글 목록 및 정렬
  const allItems = [
    ...posts.map((post) => ({ ...post, type: 'post' as const, sortTime: post.timestamp })),
    ...polls.map((poll) => ({ ...poll, type: 'poll' as const, sortTime: poll.createdAt })),
  ].sort((a, b) => {
    // 생성 시간 기준 내림차순 정렬
    const timeA = a.sortTime?.toDate ? a.sortTime.toDate() : new Date(a.sortTime || 0)
    const timeB = b.sortTime?.toDate ? b.sortTime.toDate() : new Date(b.sortTime || 0)
    return timeB.getTime() - timeA.getTime()
  })

  const filteredItems = allItems.filter((item: any) => {
    // 투표글은 항상 표시 (카테고리 필터와 무관)
    if (item.type === 'poll') {
      return true
    }
    
    // 일반 게시글은 기존 필터링 로직 적용
    const postCategory = item.category || '잡담'
    
    if (selectedCategory === '전체') {
      return true
    }
    
    if (selectedCategory === '베스트') {
      return postCategory === '베스트' || (item.likes && item.likes >= 10)
    }
    
    return postCategory === selectedCategory
  })

  return (
    <div className="min-h-screen pb-24 relative z-10">
      {/* 블러 모핑 배경 */}
      <MorphingBackground />
      
      {/* 통합 헤더 */}
      <header className="bg-gradient-to-br from-[#1A2B4E] to-[#2C3E50] sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto">
          {/* 상단: 로고 + 검색 + 알림 + 프로필 */}
          <div className="px-4 py-3 flex justify-between items-center">
            <h1 className="text-xl font-bold text-white flex items-center gap-2 animate-title-fade-in">
              <span className="text-2xl animate-emoji-bounce filter drop-shadow-lg">🎋</span>
              <span className="relative inline-block">
                <span className="relative z-10 animate-title-glow font-extrabold drop-shadow-[0_2px_8px_rgba(255,191,0,0.5)]">
                  자영업자 <span className="text-green-500 animate-forest-glow inline-block">대나무숲</span>
                </span>
                <span className="absolute inset-0 animate-title-glow opacity-50 blur-[2px] font-extrabold">
                  자영업자 <span className="text-green-500">대나무숲</span>
                </span>
              </span>
            </h1>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <button
                    className="p-2 hover:bg-white/20 rounded-full transition text-white"
                    title="검색"
                    type="button"
                  >
                    <Search size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      router.push('/messages')
                    }}
                    className="p-2 hover:bg-white/20 rounded-full transition text-white relative"
                    title="쪽지함"
                    type="button"
                  >
                    <Mail size={20} />
                    {unreadMessageCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      router.push('/mypage')
                    }}
                    className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer"
                    title="마이페이지"
                    type="button"
                  >
                    <div className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                      <User size={18} className="text-white" />
                    </div>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="text-sm text-white hover:text-white/80 transition font-medium"
                  type="button"
                >
                  로그인
                </button>
              )}
            </div>
          </div>

          {/* 구분선 */}
          <div className="h-1 bg-gradient-to-r from-transparent via-[#FFBF00]/40 to-transparent"></div>

          {/* 카테고리 탭 (통합) */}
          <div className="px-3 py-2">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {blindCategories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition whitespace-nowrap ${
                    selectedCategory === cat.value
                      ? 'bg-[#FFBF00] text-[#1A2B4E] shadow-md font-bold'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* 환영 문구 - 가게 간판 스타일 */}
      <div className="max-w-md mx-auto px-4 pt-5 pb-4">
        <div className="relative animate-welcome-fade-in scale-[0.75] origin-top">
          {/* 간판 본체 */}
          <div className="bg-gradient-to-br from-[#3a3a3a] via-[#2a2a2a] to-[#3a3a3a] rounded-lg p-5 border-2 border-[#FFBF00]/70 relative overflow-hidden shadow-lg">
            {/* LED 배경 효과 (매우 약하게) */}
            <div className="absolute inset-0 opacity-[0.02]">
              <div className="absolute inset-0 led-background animate-led-scroll"></div>
            </div>
            
            {/* 간판 상하단 라인 (약하게) */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FFBF00]/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FFBF00]/30 to-transparent"></div>
            
            {/* 모서리 장식 (작고 약하게) */}
            <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-[#FFBF00]/40"></div>
            <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-[#FFBF00]/40"></div>
            <div className="absolute bottom-1 left-1 w-2 h-2 border-l border-b border-[#FFBF00]/40"></div>
            <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-[#FFBF00]/40"></div>
            
            <div className="relative z-10 text-center">
              {/* 메인 제목 - 선명하게 */}
              <h2 className="text-2xl font-black mb-2.5 text-[#FFBF00] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{
                letterSpacing: '1px',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 15px rgba(255, 191, 0, 0.3)',
              }}>
                환영합니다.!!
              </h2>
              
              {/* 부제목 */}
              <div className="space-y-1">
                <p className="text-sm font-bold text-white leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" style={{
                  letterSpacing: '0.5px',
                }}>
                  인증된 찐사장들만을 위한
                </p>
                <p className="text-base font-black text-[#FFBF00] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{
                  letterSpacing: '1px',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 12px rgba(255, 191, 0, 0.25)',
                }}>
                  익명 커뮤니티!!
                </p>
              </div>
            </div>
            
            {/* 간판 하단 LED 점등 효과 (작고 약하게) */}
            <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-[#FFBF00]/40"
                ></div>
              ))}
            </div>
          </div>
          
          {/* 간판 지지대 */}
          <div className="mx-auto mt-2 flex justify-center gap-3.5">
            <div className="w-7 h-2.5 bg-gradient-to-b from-gray-500 to-gray-700 rounded-b-lg opacity-50"></div>
            <div className="w-7 h-2.5 bg-gradient-to-b from-gray-500 to-gray-700 rounded-b-lg opacity-50"></div>
          </div>
        </div>
      </div>

      {/* 게시글 리스트 */}
      <main className="max-w-md mx-auto px-4 py-2 space-y-1.5">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-500 shadow-sm">
            <p className="text-sm">아직 등록된 글이 없습니다.</p>
            <p className="text-xs mt-2 text-gray-400">첫 번째 글을 작성해보세요!</p>
          </div>
        ) : (
          filteredItems.map((item: any) => {
            // 투표글 렌더링
            if (item.type === 'poll') {
              const totalVotes = (item.optionA?.votes || 0) + (item.optionB?.votes || 0)
              const optionAPercent = totalVotes > 0 ? Math.round((item.optionA?.votes || 0) / totalVotes * 100) : 0
              const optionBPercent = totalVotes > 0 ? Math.round((item.optionB?.votes || 0) / totalVotes * 100) : 0
              const isPopular = totalVotes >= 10

              return (
                <Link
                  key={item.id}
                  href={`/polls/${item.id}`}
                  className="block rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200"
                >
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-blue-500 to-purple-500 opacity-50"></div>
                    <div className="pl-2.5 pr-2.5 py-2">
                      {/* 투표 배지 */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] font-semibold bg-purple-600 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <span>💭</span>
                          <span>투표</span>
                        </span>
                        {isPopular && (
                          <span className="px-1.5 py-0.5 bg-gradient-to-r from-[#FFBF00] to-[#F59E0B] text-[#1A2B4E] text-[10px] font-bold rounded-full shadow-sm flex items-center gap-0.5">
                            <span>🔥</span>
                            <span>인기</span>
                          </span>
                        )}
                      </div>

                      {/* 제목 */}
                      <h3 className="font-bold line-clamp-1 text-xs text-gray-900 mb-1.5">
                        {item.title}
                      </h3>

                      {/* 선택지 미리보기 */}
                      <div className="space-y-1.5 mb-1.5">
                        <div className="bg-white/70 rounded-lg p-1.5">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-medium text-gray-700">A. {item.optionA?.text || ''}</span>
                            <span className="text-[10px] font-bold text-purple-700">{optionAPercent}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-purple-600 h-1 rounded-full transition-all"
                              style={{ width: `${optionAPercent}%` }}
                            />
                          </div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-1.5">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-medium text-gray-700">B. {item.optionB?.text || ''}</span>
                            <span className="text-[10px] font-bold text-blue-700">{optionBPercent}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-blue-600 h-1 rounded-full transition-all"
                              style={{ width: `${optionBPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 메타 정보 */}
                      <div className="flex items-center justify-between pt-1 border-t border-purple-200">
                        <div className="flex items-center gap-1">
                          <AvatarMini size={20} avatarUrl={userAvatars[item.authorId]} userId={item.authorId} />
                          <div className="flex items-center gap-0.5 text-[9px] text-gray-500">
                            <span className="font-medium text-gray-700">{item.authorName || '익명의 사장님'}</span>
                            <span>·</span>
                            <span>{formatRelativeTime(item.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                          <span className="flex items-center gap-0.5">
                            <span className="text-[10px]">🗳️</span>
                            <span>{totalVotes}</span>
                          </span>
                          <span className="flex items-center gap-0.5">
                            <span className="text-[10px]">💬</span>
                            <span>{item.comments || 0}</span>
                          </span>
                          <span className="flex items-center gap-0.5 text-[8px]">
                            <span className="text-[9px]">⏰</span>
                            <span>{getPollTimeRemaining(item.deadline)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            }

            // 일반 게시글 렌더링
            const isBest = item.category === '베스트' || (item.likes || 0) >= 10
            const hasImages = item.images && item.images.length > 0
            
            return (
              <Link
                key={item.id}
                href={`/post/${item.id}`}
                className={`block rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden ${
                  isBest
                    ? 'bg-gradient-to-br from-[#FFBF00]/10 to-[#F59E0B]/10 border border-[#FFBF00]/30'
                    : 'bg-white border border-gray-100'
                }`}
              >
                {/* 대나무 줄기 패턴 (좌측) */}
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#1A2B4E] via-[#2C3E50] to-[#1A2B4E] opacity-30"></div>
                  
                  <div className="pl-2.5 pr-2.5 py-2">
                    {/* 상단: 인기글 배지 + 카테고리 */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {/* 카테고리 배지 */}
                      {item.category && (
                        <span className="text-[10px] font-semibold bg-[#1A2B4E] text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          {blindCategories.find(cat => cat.value === item.category)?.emoji || ''}
                          <span>{blindCategories.find(cat => cat.value === item.category)?.label || item.category}</span>
                        </span>
                      )}
                      {/* 인기글 배지 */}
                      {isBest && (
                        <span className="px-1.5 py-0.5 bg-gradient-to-r from-[#FFBF00] to-[#F59E0B] text-[#1A2B4E] text-[10px] font-bold rounded-full shadow-sm flex items-center gap-0.5">
                          <span>🔥</span>
                          <span>인기글</span>
                        </span>
                      )}
                    </div>

                    {/* 제목 */}
                    <div className="flex items-start justify-between gap-1.5 mb-1">
                      <h3 className={`font-bold line-clamp-1 flex-1 text-xs text-gray-900`}>
                        {item.title}
                      </h3>
                      {user && user.uid === item.uid && (
                        <button
                          onClick={(e) => handleDelete(item.id, item.uid, e)}
                          className="text-red-500 hover:text-red-700 transition p-0.5 rounded-full hover:bg-red-50 flex-shrink-0"
                          title="삭제"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      {user && user.uid !== item.uid && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setReportTarget({
                              type: 'post',
                              id: item.id,
                              authorId: item.uid,
                              content: item.content,
                            })
                            setIsReportModalOpen(true)
                          }}
                          className="flex-shrink-0 p-0.5 hover:bg-orange-50 rounded-full transition text-orange-600"
                          title="게시글 신고"
                        >
                          <Flag size={12} />
                        </button>
                      )}
                    </div>

                    {/* 이미지 썸네일 (있는 경우) - 더 작게 */}
                    {hasImages && (
                      <div className="mb-1 rounded-lg overflow-hidden">
                        <img
                          src={item.images[0]}
                          alt="썸네일"
                          className="w-full h-16 object-cover"
                        />
                      </div>
                    )}

                    {/* 본문 */}
                    <p className="text-[11px] text-gray-600 line-clamp-1 mb-1 leading-relaxed whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {user && isVerified ? item.content : !user ? '🔒 로그인이 필요합니다' : !isVerified ? '🔒 사업자 인증이 필요합니다' : item.content}
                    </p>

                    {/* 뱃지 - 매우 작게 */}
                    <div className="flex flex-wrap gap-0.5 mb-1">
                      {item.region && (
                        <span className="flex-shrink-0 text-[8px] font-medium bg-blue-100 text-blue-700 px-1 py-0.5 rounded-full leading-tight">
                          {item.region}
                        </span>
                      )}
                      <span className="flex-shrink-0 text-[8px] font-medium bg-amber-100 text-amber-700 px-1 py-0.5 rounded-full leading-tight">
                        {item.businessType ? `${getBusinessEmoji(item.businessType)} ${item.businessType}` : '🏪 기타'}
                      </span>
                    </div>

                    {/* 아바타 + 메타 정보 */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <AvatarMini size={20} avatarUrl={userAvatars[item.uid]} userId={item.uid} />
                        <div className="flex items-center gap-0.5 text-[9px] text-gray-500">
                          <span className="font-medium text-gray-700">{item.author || '익명의 사장님'}</span>
                          <PostAuthorBadge authorId={item.uid} />
                          <span>·</span>
                          <span>{formatRelativeTime(item.timestamp)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {user && user.uid !== item.uid && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setMessageReceiver({
                                id: item.uid,
                                name: item.author || '익명의 사장님',
                                postTitle: item.title,
                              })
                              setIsMessageModalOpen(true)
                            }}
                            className="p-0.5 hover:bg-blue-50 rounded-full transition text-blue-600"
                            title="쪽지 보내기"
                          >
                            <Mail size={11} />
                          </button>
                        )}
                        <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                          <span className="flex items-center gap-0.5">
                            <span className="text-[10px]">❤️</span>
                            <span>{item.likes || 0}</span>
                          </span>
                          <span className="flex items-center gap-0.5">
                            <span className="text-[10px]">💬</span>
                            <span>{item.comments || 0}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}

        {/* 비로그인/미인증 시 안내 */}
        {((!user || (user && !isVerified && !verificationLoading)) && filteredItems.length > 0) && (
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-amber-200">
            {!user ? (
              <>
                <p className="text-sm text-gray-700 font-medium mb-2">
                  로그인하면 전체 내용을 볼 수 있습니다.
                </p>
                <button
                  onClick={handleLogin}
                  className="bg-[#1A2B4E] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#1A2B4E]/90 transition"
                >
                  구글 로그인
                </button>
              </>
            ) : !isVerified ? (
              <>
                <p className="text-sm text-gray-700 font-medium mb-2">
                  🔒 사업자 인증이 필요합니다.
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  인증된 찐사장들만 게시글을 볼 수 있습니다.
                </p>
                <button
                  onClick={() => router.push('/auth/verify')}
                  className="bg-[#FFBF00] text-[#1A2B4E] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#FFBF00]/90 transition"
                >
                  사업자 인증하기
                </button>
              </>
            ) : null}
          </div>
        )}
      </main>


      {/* 글쓰기 모달 */}
      <WriteModal
        isOpen={isWriteMode}
        onClose={() => {
          setIsWriteMode(false)
        }}
        onSuccess={() => {
          setIsWriteMode(false)
          // 글 목록 새로고침은 실시간 업데이트로 자동 처리됨
        }}
      />

      {/* 쪽지 보내기 모달 */}
      {messageReceiver && (
        <MessageModal
          isOpen={isMessageModalOpen}
          onClose={() => {
            setIsMessageModalOpen(false)
            setMessageReceiver(null)
          }}
          receiverId={messageReceiver.id}
          receiverName={messageReceiver.name}
          postTitle={messageReceiver.postTitle}
        />
      )}

      {/* 신고 모달 */}
      {reportTarget && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false)
            setReportTarget(null)
          }}
          reportType={reportTarget.type}
          targetId={reportTarget.id}
          targetAuthorId={reportTarget.authorId}
          targetContent={reportTarget.content}
        />
      )}

      {/* 하단 네비게이션 */}
      <BottomNav onWriteClick={() => {
        if (!user) {
          handleLogin()
        } else if (!isVerified) {
          router.push('/auth/verify')
        } else {
          setIsWriteMode(true)
        }
      }} />
    </div>
  )
}

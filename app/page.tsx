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
import { User, Trash2, Image, Search, Bell, Mail, Flag, ShoppingBag, Heart, MessageCircle, Clock, Vote } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AvatarMini from '@/components/AvatarMini'
import BottomNav from '@/components/BottomNav'
import WriteModal from '@/components/WriteModal'
import MessageModal from '@/components/MessageModal'
import ReportModal from '@/components/ReportModal'
import PostAuthorBadge from '@/components/PostAuthorBadge'
import MainLayout from '@/components/MainLayout'
import { useVerification } from '@/hooks/useVerification'

// 블라인드 스타일 카테고리 (메인 페이지는 베스트만)
const blindCategories = [
  { value: '베스트', label: '베스트', emoji: '' },
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
  const [selectedCategory, setSelectedCategory] = useState('베스트')
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
    // 투표글은 베스트 페이지에서 표시하지 않음
    if (item.type === 'poll') {
      return false
    }
    
    // 일반 게시글: 베스트만 표시
    const postCategory = item.category || '잡담'
    return postCategory === '베스트' || (item.likes && item.likes >= 10)
  })

  return (
    <MainLayout>
      <div className="min-h-screen pb-24 bg-gray-50">
        {/* 헤더 섹션 */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">베스트</h1>
                <p className="text-sm text-gray-500">인기 게시글을 확인하세요</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/checkin')}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  출석체크
                </button>
                <button
                  onClick={() => router.push('/shop')}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <ShoppingBag size={16} />
                  포인트상점
                </button>
              </div>
            </div>

            {/* 빠른 접근 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => router.push('/games/box')}
                className="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-lg p-4 text-white shadow-sm transition-all"
              >
                <div className="text-sm font-semibold mb-1">랜덤 박스</div>
                <div className="text-xs opacity-90">매일 무료 박스 열기</div>
              </button>

              <button
                onClick={() => router.push('/diagnose')}
                className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-lg p-4 text-white shadow-sm transition-all"
              >
                <div className="text-sm font-semibold mb-1">시급 진단</div>
                <div className="text-xs opacity-90">AI가 내 시급 판독</div>
              </button>

              <Link
                href="/games"
                className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg p-4 text-white shadow-sm transition-all block"
              >
                <div className="text-sm font-semibold mb-1">게임</div>
                <div className="text-xs opacity-90">스트레스 해소 게임</div>
              </Link>

              <Link
                href="/tools"
                className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg p-4 text-white shadow-sm transition-all block"
              >
                <div className="text-sm font-semibold mb-1">도구</div>
                <div className="text-xs opacity-90">실용 도구 모음</div>
              </Link>
            </div>
          </div>
        </div>

        {/* 게시글 리스트 - 침하하 스타일 */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 메인 컨텐츠 영역 */}
            <div className="lg:col-span-2">
              {/* 탭 메뉴 */}
              <div className="bg-white border-b border-gray-200 mb-4">
                <div className="flex gap-4">
                  <button className="px-4 py-3 font-semibold text-gray-900 border-b-2 border-gray-900">
                    베스트
                  </button>
                  <button className="px-4 py-3 font-medium text-gray-600 hover:text-gray-900">
                    인기글
                  </button>
                </div>
              </div>

              {/* 게시글 목록 */}
              {filteredItems.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center text-gray-500 shadow-sm">
                  <p className="text-sm">아직 등록된 글이 없습니다.</p>
                  <p className="text-xs mt-2 text-gray-400">첫 번째 글을 작성해보세요!</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredItems.map((item: any) => {
                    // 투표글은 베스트 페이지에서 표시하지 않음 (사이드바에만 표시)
                    if (item.type === 'poll') {
                      return null
                    }

                    // 일반 게시글 렌더링 - 침하하 스타일
                    const isBest = item.category === '베스트' || (item.likes || 0) >= 10
                    
                    return (
                      <Link
                        key={item.id}
                        href={`/post/${item.id}`}
                        className="block bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <div className="px-4 py-3">
                          <div className="flex items-start justify-between gap-4">
                            {/* 메인 컨텐츠 */}
                            <div className="flex-1 min-w-0">
                              {/* 카테고리 + 제목 */}
                              <div className="flex items-center gap-2 mb-1">
                                {item.category && (
                                  <span className="text-xs text-gray-500">
                                    {blindCategories.find(cat => cat.value === item.category)?.label || item.category}
                                  </span>
                                )}
                              </div>
                              
                              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 text-sm">
                                {item.title}
                              </h3>
                              
                              {/* 작성자 정보 */}
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="font-medium">{item.author || '익명의 사장님'}</span>
                                <span>·</span>
                                <span>{formatRelativeTime(item.timestamp)}</span>
                              </div>
                            </div>
                            
                            {/* 좋아요/댓글 수 */}
                            <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                              <span className="flex items-center gap-1">
                                <Heart size={14} className={item.likes > 0 ? 'fill-red-500 text-red-500' : ''} />
                                {item.likes || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle size={14} />
                                {item.comments || 0}
                              </span>
                              {user && user.uid === item.uid && (
                                <button
                                  onClick={(e) => handleDelete(item.id, item.uid, e)}
                                  className="text-red-500 hover:text-red-700 transition p-1 rounded"
                                  title="삭제"
                                >
                                  <Trash2 size={14} />
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
                                  className="text-gray-400 hover:text-gray-600 transition p-1 rounded"
                                  title="신고"
                                >
                                  <Flag size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* 오른쪽 사이드바 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm sticky top-20">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900">투표 | 이벤트</h3>
                </div>
                <div className="p-4">
                  {polls.length > 0 ? (
                    <div className="space-y-3">
                      {polls.slice(0, 5).map((poll: any) => {
                        const totalVotes = (poll.optionA?.votes || 0) + (poll.optionB?.votes || 0)
                        return (
                          <Link
                            key={poll.id}
                            href={`/polls/${poll.id}`}
                            className="block p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                          >
                            <h4 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">
                              {poll.title}
                            </h4>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{poll.authorName || '익명'}</span>
                              <span className="flex items-center gap-1">
                                <Vote size={12} />
                                {totalVotes}
                              </span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      진행 중인 투표가 없습니다
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {/* 하단 네비게이션 (모바일용) */}
      <div className="lg:hidden">
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
    </MainLayout>
  )
}

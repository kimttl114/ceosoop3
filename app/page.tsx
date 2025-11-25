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

// 블라인드 스타일 카테고리
const blindCategories = [
  { value: '전체', label: '전체', emoji: '' },
  { value: '베스트', label: '🔥베스트', emoji: '🔥' },
  { value: '잡담', label: '🗣️대나무슾', emoji: '🗣️' },
  { value: '질문', label: '❓질문', emoji: '❓' },
  { value: '꿀팁', label: '🍯할인정보', emoji: '🍯' },
  { value: '장터', label: '🥕장터', emoji: '🥕' },
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
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [isWriteMode, setIsWriteMode] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [messageReceiver, setMessageReceiver] = useState<{ id: string; name: string; postTitle?: string } | null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState<{ type: 'post', id: string, authorId?: string, content?: string } | null>(null)
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({})

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

  // 필터링된 글 목록
  const filteredPosts = posts.filter((post: any) => {
    // 카테고리가 없는 글은 기본값 '잡담'으로 처리
    const postCategory = post.category || '잡담'
    
    if (selectedCategory === '전체') {
      return true
    }
    
    // 베스트 카테고리는 likes가 10 이상이거나 category가 '베스트'인 글
    if (selectedCategory === '베스트') {
      return postCategory === '베스트' || (post.likes && post.likes >= 10)
    }
    
    // 정확한 카테고리 매칭
    const matches = postCategory === selectedCategory
    
    // 디버깅용 (개발 중에만)
    if (process.env.NODE_ENV === 'development' && !matches && selectedCategory !== '전체' && selectedCategory !== '베스트') {
      console.log('필터링:', {
        postId: post.id,
        postCategory,
        selectedCategory,
        matches
      })
    }
    
    return matches
  })

  return (
    <div className="min-h-screen pb-24 relative z-10">
      {/* 통합 헤더 */}
      <header className="bg-gradient-to-br from-[#1A2B4E] to-[#2C3E50] sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto">
          {/* 상단: 로고 + 검색 + 알림 + 프로필 */}
          <div className="px-4 py-3 flex justify-between items-center">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">💼</span>
              <span>자영업자 대나무숲</span>
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

      {/* 게시글 리스트 */}
      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-500 shadow-sm">
            <p className="text-sm">아직 등록된 글이 없습니다.</p>
            <p className="text-xs mt-2 text-gray-400">첫 번째 글을 작성해보세요!</p>
          </div>
        ) : (
          filteredPosts.map((post: any) => {
            const isBest = post.category === '베스트' || (post.likes || 0) >= 10
            const hasImages = post.images && post.images.length > 0
            
            return (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className={`block rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden ${
                  isBest
                    ? 'bg-gradient-to-br from-[#FFBF00]/10 to-[#F59E0B]/10 border-2 border-[#FFBF00]/30'
                    : 'bg-white'
                }`}
              >
                {/* 대나무 줄기 패턴 (좌측) */}
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#1A2B4E] via-[#2C3E50] to-[#1A2B4E] opacity-40"></div>
                  
                  <div className="pl-4 pr-5 py-5">
                    {/* 인기글 배지 */}
                    {isBest && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-gradient-to-r from-[#FFBF00] to-[#F59E0B] text-[#1A2B4E] text-xs font-bold rounded-full shadow-md flex items-center gap-1">
                          <span>🔥</span>
                          <span>인기글</span>
                        </span>
                      </div>
                    )}

                    {/* 뱃지 + 제목 */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {post.region && (
                          <span className="flex-shrink-0 text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                            {post.region}
                          </span>
                        )}
                        <span className="flex-shrink-0 text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                          {post.businessType ? `${getBusinessEmoji(post.businessType)} ${post.businessType}` : '🏪 기타'}
                        </span>
                      </div>
                      {user && user.uid === post.uid && (
                        <button
                          onClick={(e) => handleDelete(post.id, post.uid, e)}
                          className="text-red-500 hover:text-red-700 transition p-1.5 rounded-full hover:bg-red-50 flex-shrink-0"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* 이미지 썸네일 (있는 경우) */}
                    {hasImages && (
                      <div className="mb-3 rounded-xl overflow-hidden">
                        <img
                          src={post.images[0]}
                          alt="썸네일"
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    )}

                    {/* 제목 */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className={`font-bold line-clamp-2 flex-1 ${
                            isBest ? 'text-lg text-gray-900' : 'text-base text-gray-900'
                          }`}>
                            {post.title}
                          </h3>
                          {user && user.uid !== post.uid && (
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setReportTarget({
                                  type: 'post',
                                  id: post.id,
                                  authorId: post.uid,
                                  content: post.content,
                                })
                                setIsReportModalOpen(true)
                              }}
                              className="flex-shrink-0 p-1.5 hover:bg-orange-50 rounded-full transition text-orange-600"
                              title="게시글 신고"
                            >
                              <Flag size={16} />
                            </button>
                          )}
                        </div>

                        {/* 본문 */}
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                          {user ? post.content : '🔒 로그인해야 볼 수 있어요'}
                        </p>

                        {/* 아바타 + 메타 정보 */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <AvatarMini size={32} avatarUrl={userAvatars[post.uid]} userId={post.uid} />
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-700">{post.author || '익명의 사장님'}</span>
                            <PostAuthorBadge authorId={post.uid} />
                          </div>
                          <span>·</span>
                          <span>{formatRelativeTime(post.timestamp)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {user && user.uid !== post.uid && (
                          <>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setMessageReceiver({
                                  id: post.uid,
                                  name: post.author || '익명의 사장님',
                                  postTitle: post.title,
                                })
                                setIsMessageModalOpen(true)
                              }}
                              className="p-1.5 hover:bg-blue-50 rounded-full transition text-blue-600"
                              title="쪽지 보내기"
                            >
                              <Mail size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setReportTarget({
                                  type: 'post',
                                  id: post.id,
                                  authorId: post.uid,
                                  content: post.content,
                                })
                                setIsReportModalOpen(true)
                              }}
                              className="p-1.5 hover:bg-orange-50 rounded-full transition text-orange-600"
                              title="신고"
                            >
                              <Flag size={16} />
                            </button>
                          </>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <span>❤️</span>
                            <span className="font-medium">{post.likes || 0}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span>💬</span>
                            <span className="font-medium">{post.comments || 0}</span>
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

        {/* 비로그인 시 안내 */}
        {!user && filteredPosts.length > 0 && (
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-amber-200">
            <p className="text-sm text-gray-700 font-medium mb-2">
              로그인하면 전체 내용을 볼 수 있습니다.
            </p>
            <button
              onClick={handleLogin}
              className="bg-[#1A2B4E] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#1A2B4E]/90 transition"
            >
              구글 로그인
            </button>
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
      <BottomNav onWriteClick={() => user && setIsWriteMode(true)} />
    </div>
  )
}

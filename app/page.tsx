'use client'

import { useState, useEffect, Suspense } from 'react'
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
  limit,
  getDocs,
} from 'firebase/firestore'
import { User, Trash2, Image, Search, Bell, Mail, Flag, Heart, MessageCircle, Clock, Vote, Sparkles, Calculator, Megaphone, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import AvatarMini from '@/components/AvatarMini'
import BottomNav from '@/components/BottomNav'
import WriteModal from '@/components/WriteModal'
import MessageModal from '@/components/MessageModal'
import ReportModal from '@/components/ReportModal'
import PostAuthorBadge from '@/components/PostAuthorBadge'
import MainLayout from '@/components/MainLayout'

// 게시판 카테고리 목록
const boardCategories = [
  { value: '베스트', label: '🔥 베스트', emoji: '🔥' },
  { value: '대나무숲', label: '🗣️ 대나무숲', emoji: '🗣️' },
  { value: '빌런박제소', label: '❓ 빌런박제소', emoji: '❓' },
  { value: '유머 & 이슈', label: '유머 & 이슈', emoji: '' },
  { value: '비틱방(자랑방)', label: '🥕 비틱방', emoji: '🥕' },
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

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [userAnonymousName, setUserAnonymousName] = useState<string>('')
  const [userRegion, setUserRegion] = useState<string>('')
  const [userBusinessType, setUserBusinessType] = useState<string>('치킨')
  const [posts, setPosts] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('베스트')

  // URL 쿼리 파라미터에서 카테고리 읽기
  useEffect(() => {
    const categoryParam = searchParams?.get('category')
    if (categoryParam) {
      const decodedCategory = decodeURIComponent(categoryParam)
      // 유효한 카테고리인지 확인
      const isValidCategory = boardCategories.some(cat => cat.value === decodedCategory)
      if (isValidCategory) {
        setSelectedCategory(decodedCategory)
        // 스크롤을 해당 게시판 섹션으로 이동
        setTimeout(() => {
          const element = document.getElementById(`category-${decodedCategory}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      }
    }
  }, [searchParams])
  const [isWriteMode, setIsWriteMode] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [messageReceiver, setMessageReceiver] = useState<{ id: string; name: string; postTitle?: string } | null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState<{ type: 'post', id: string, authorId?: string, content?: string } | null>(null)
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({})
  const [notices, setNotices] = useState<any[]>([])

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


  // 공지사항 불러오기
  useEffect(() => {
    if (!db) return

    const noticesRef = collection(db, 'notices')
    const q = query(noticesRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const noticesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        
        // 공개된 공지사항만 필터링 (삭제되지 않은 것, 공개된 것)
        const activeNotices = noticesList.filter((notice: any) => 
          !notice.deleted && notice.visible !== false
        )
        
        // 중요 공지를 먼저 정렬
        const sortedNotices = activeNotices.sort((a: any, b: any) => {
          if (a.isImportant && !b.isImportant) return -1
          if (!a.isImportant && b.isImportant) return 1
          return 0
        })
        
        setNotices(sortedNotices)
      },
      (error: any) => {
        console.error('공지사항 불러오기 오류:', error)
        // 권한 오류인 경우 빈 배열로 설정하여 앱이 크래시하지 않도록 함
        if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
          console.warn('공지사항 읽기 권한이 없습니다. Firestore 보안 규칙을 확인해주세요.')
          setNotices([])
        }
      }
    )

    return () => unsubscribe()
  }, [db])

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
  const allItems = posts
    .map((post) => ({ ...post, sortTime: post.timestamp }))
    .sort((a, b) => {
      // 생성 시간 기준 내림차순 정렬
      const timeA = a.sortTime?.toDate ? a.sortTime.toDate() : new Date(a.sortTime || 0)
      const timeB = b.sortTime?.toDate ? b.sortTime.toDate() : new Date(b.sortTime || 0)
      return timeB.getTime() - timeA.getTime()
    })

  // 카테고리별 게시글 필터링 함수
  const getPostsByCategory = (category: string, limitCount: number = 10) => {
    return allItems
      .filter((item: any) => {
        const postCategory = item.category || '잡담'
        if (category === '베스트') {
          return postCategory === '베스트' || (item.likes && item.likes >= 10)
        }
        return postCategory === category
      })
      .slice(0, limitCount)
  }

  return (
    <MainLayout>
      <div className="min-h-screen pb-24 bg-gray-50">
        {/* 널자 브랜딩 헤더 */}
        <div className="bg-gradient-to-r from-[#1A2B4E] via-[#2A3B5E] to-[#1A2B4E] border-b-4 border-[#FFBF00] sticky top-0 z-20 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFBF00] to-[#FF9500] flex items-center justify-center text-[#1A2B4E] font-bold text-xl shadow-lg">
                  널
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">널자</h1>
                  <p className="text-sm text-white/90">널리 자영업자를 이롭게</p>
                </div>
              </div>
              <div className="hidden md:block text-right">
                <p className="text-sm text-white/80 font-medium">7년 치킨집 사장이 만든</p>
                <p className="text-sm text-[#FFBF00] font-semibold">AI 도구 모음집</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-sm text-white/90 leading-relaxed">
                내가 불편했던 것들을 AI로 해결했어요. 실제 자영업 현장에서 필요한 AI 도구들을 직접 만들고 사용하며 검증한 솔루션만을 제공합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 헤더 섹션 - eToLand 스타일 */}
        <div className="bg-white border-b border-gray-300 sticky top-[120px] z-20">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Link
                  href="/notices"
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap border border-red-200"
                >
                  <span className="text-base">📢</span>
                  <span className="hidden sm:inline">공지사항</span>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                {user ? (
                  <>
                    {/* 모바일에서는 BottomNav의 글쓰기 버튼 사용, 데스크톱에서만 헤더 버튼 표시 */}
                    <button
                      onClick={() => setIsWriteMode(true)}
                      className="hidden md:flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-[#1A2B4E] hover:bg-[#1A2B4E]/90 text-white rounded text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      <span className="text-base sm:text-lg">✏️</span>
                      <span className="hidden sm:inline">글쓰기</span>
                    </button>
                  </>
                ) : (
                  // 로그인 버튼은 MainLayout 헤더에서만 표시 (중복 방지)
                  null
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 공지사항 섹션 - 최상단에 배치 */}
        {notices.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Megaphone size={20} className="text-red-600" />
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">📢 공지사항</h2>
                </div>
                <Link
                  href="/notices"
                  className="text-xs sm:text-sm text-red-600 font-medium hover:underline"
                >
                  전체보기 →
                </Link>
              </div>
              <div className="space-y-2">
                {notices.slice(0, 3).map((notice: any) => (
                  <Link
                    key={notice.id}
                    href={`/notices?id=${notice.id}`}
                    className="block p-3 bg-white rounded-lg border border-red-200 hover:border-red-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {notice.isImportant && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                          중요
                        </span>
                      )}
                      <span className="text-xs text-blue-600 font-bold">공지</span>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1 flex-1">
                        {notice.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 도구존 섹션 - 최상단에 배치, 모든 도구 한 화면에 표시 */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>🛠️ 실용 도구</span>
              </h2>
              <Link
                href="/tools"
                className="text-sm text-[#1A2B4E] font-medium hover:underline"
              >
                전체보기 →
              </Link>
            </div>

            {/* 필수 도구 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {/* 미성년자 출입 방어기 */}
              <Link
                href="/tools/id-check"
                className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0">
                        🚨
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg md:text-xl font-black text-white">미성년자 출입 방어기</h3>
                          <span className="px-2 py-1 text-xs font-bold bg-yellow-400 text-red-900 rounded-full animate-pulse">
                            필수
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-white/90">신분증 나이 확인 - 영업정지 방지</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-white/90">
                    <span className="px-2 py-1 bg-white/20 rounded-full">✅ 만 19세 자동</span>
                    <span className="px-2 py-1 bg-white/20 rounded-full">⚠️ 빨간색 경고</span>
                  </div>
                </div>
              </Link>

              {/* 와이파이 QR 생성기 */}
              <Link
                href="/tools/wifi-qr"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0">
                        📶
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg md:text-xl font-black text-white">매장 와이파이 QR</h3>
                          <span className="px-2 py-1 text-xs font-bold bg-green-400 text-green-900 rounded-full">
                            인기
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-white/90">QR로 자동 연결 - 프린트 가능</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-white/90">
                    <span className="px-2 py-1 bg-white/20 rounded-full">🖨️ PDF 다운로드</span>
                    <span className="px-2 py-1 bg-white/20 rounded-full">🎨 4가지 템플릿</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* AI 도구 */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-700">🤖 AI 도구</h3>
              </div>
              <div className="flex flex-wrap gap-3">
            {[
              // 실용성 높은 순서로 배치
              { id: 'diagnose', title: '내 시급은?', description: '사장님 실제 시급 계산', route: '/diagnose', icon: '🎯', badge: 'HOT' },
              { id: 'ai-marketing', title: 'AI 마케팅 문구', description: 'SNS/전단지 즉시 사용', route: '/tools/ai-marketing', icon: '✨' },
              { id: 'ai-customer-service', title: 'AI 고객 대응', description: '까다로운 손님 응대법', route: '/tools/ai-customer-service', icon: '💬' },
              { id: 'announcement', title: '안내방송 생성', description: '매장 방송 제작+재생', route: '/tools/announcement', icon: '🎙️' },
              { id: 'music', title: 'AI 매장음악', description: '분위기별 BGM 추천', route: '/tools/music', icon: '🎵' },
              { id: 'document', title: 'AI 문서 생성', description: '계약서 자동 생성', route: '/ai-document', icon: '📄' },
              { id: 'ai-pricing', title: 'AI 가격 조언', description: '최적 가격 전략', route: '/tools/ai-pricing', icon: '🧠' },
              { id: 'food-battle', title: '오늘 뭐먹지?', description: 'AI 음식 배틀 게임', route: '/tools/food-battle', icon: '🍽️' },
              { id: 'fortune', title: '무료 종합 운세', description: 'AI 운세 서비스', route: 'https://all-fo.vercel.app/', icon: '🔮', external: true },
            ].map((tool: any) => {
              const isExternal = tool.external || tool.route?.startsWith('http')
              
              const cardContent = (
                <>
                  <div className="absolute top-2 right-2 flex gap-1">
                    {tool.badge && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                        {tool.badge}
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-xs font-bold text-purple-600 bg-purple-100 rounded-full">
                      AI
                    </span>
                  </div>
                  <div className="text-3xl mb-2 text-center group-hover:scale-110 transition-transform">{tool.icon}</div>
                  <div className="text-sm font-semibold text-gray-900 mb-1 text-center leading-tight">{tool.title}</div>
                  <div className="text-xs text-gray-600 text-center leading-tight">{tool.description}</div>
                </>
              )

              if (isExternal) {
                return (
                  <a
                    key={tool.id}
                    href={tool.route}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-purple-100 hover:border-purple-300 relative group flex-shrink-0"
                    style={{ minWidth: '160px', width: '160px' }}
                  >
                    {cardContent}
                  </a>
                )
              }

              return (
                <Link
                  key={tool.id}
                  href={tool.route}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-purple-100 hover:border-purple-300 relative group flex-shrink-0"
                  style={{ minWidth: '160px', width: '160px' }}
                >
                  {cardContent}
                </Link>
              )
            })}
              </div>
            </div>

            {/* 일반 도구 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calculator size={16} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-700">📊 계산기 & 도구</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'salary', title: '월급 계산기', description: '시급/일급/월급 계산', route: '/tools/salary', icon: '💰' },
                  { id: 'margin', title: '마진율 계산기', description: '손익분기점 계산', route: '/tools/margin', icon: '📊' },
                  { id: 'vat', title: '부가세 계산기', description: '부가세 빠르게 계산', route: '/tools/vat', icon: '🧮' },
                  { id: 'labor', title: '인건비 계산기', description: '4대보험 포함 계산', route: '/tools/labor', icon: '👥' },
                  { id: 'pricing', title: '가격 책정 도우미', description: '원가 기반 가격 제안', route: '/tools/pricing', icon: '💵' },
                  { id: 'discount', title: '할인율 계산기', description: '할인 후 가격 분석', route: '/tools/discount', icon: '🎯' },
                ].map((tool) => (
                  <Link
                    key={tool.id}
                    href={tool.route}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-[#1A2B4E] group flex-shrink-0"
                    style={{ minWidth: '160px', width: '160px' }}
                  >
                    <div className="text-3xl mb-2 text-center group-hover:scale-110 transition-transform">{tool.icon}</div>
                    <div className="text-sm font-semibold text-gray-900 mb-1 text-center leading-tight">{tool.title}</div>
                    <div className="text-xs text-gray-600 text-center leading-tight">{tool.description}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 중고장터 섹션 */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>🛒 자영업자 중고장터</span>
              </h2>
              <Link
                href="/marketplace"
                className="text-sm text-green-600 font-medium hover:underline"
              >
                전체보기 →
              </Link>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              자영업자 장비, 기기, 가구 등을 중고로 거래하세요
            </p>
            <Link
              href="/marketplace"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-md"
            >
              장터 둘러보기 →
            </Link>
          </div>
        </div>

        {/* 게시판 탭 및 컨텐츠 */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
          {/* 게시판 탭 */}
          <div className="bg-white border-b border-gray-200 mb-4 sticky top-0 z-10">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {boardCategories.map((category) => {
                const isActive = selectedCategory === category.value
                return (
                  <button
                    key={category.value}
                    onClick={() => {
                      setSelectedCategory(category.value)
                      const element = document.getElementById(`category-${category.value}`)
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                      // URL 업데이트
                      const newUrl = category.value === '베스트' 
                        ? '/' 
                        : `/?category=${encodeURIComponent(category.value)}`
                      router.push(newUrl, { scroll: false })
                    }}
                    className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? 'border-[#1A2B4E] text-[#1A2B4E] bg-blue-50'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <span className="whitespace-nowrap">{category.label}</span>
                    <span className="ml-1 text-xs text-gray-500">
                      ({getPostsByCategory(category.value, 10).length})
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 메인 컨텐츠 영역 */}
            <div className="lg:col-span-3 space-y-6">
              {/* 선택된 게시판만 표시 또는 전체 표시 */}
              {selectedCategory === '베스트' ? (
                // 베스트 선택 시 모든 게시판 표시
                boardCategories.map((category) => {
                const categoryPosts = getPostsByCategory(category.value, 10)
                
                return (
                  <div key={category.value} id={`category-${category.value}`} className="bg-white border border-gray-200">
                    {/* 게시판 헤더 */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-sm text-gray-900">
                          {category.label}
                        </h2>
                        <span className="text-xs text-gray-500">
                          ({categoryPosts.length})
                        </span>
                      </div>
                      <Link
                        href={category.value === '베스트' ? '/' : `/?category=${encodeURIComponent(category.value)}`}
                        className="text-xs text-gray-600 hover:text-gray-900 font-medium"
                      >
                        더보기 →
                      </Link>
                    </div>

                    {/* 게시글 리스트 */}
                    {categoryPosts.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">
                        아직 게시글이 없습니다
                      </div>
                    ) : (
                      <>
                        {/* 테이블 헤더 (데스크톱) */}
                        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600">
                          <div className="col-span-1 text-center">번호</div>
                          <div className="col-span-6">제목</div>
                          <div className="col-span-2 text-center">작성자</div>
                          <div className="col-span-2 text-center">시간</div>
                          <div className="col-span-1 text-center">조회</div>
                        </div>
                        
                        {/* 게시글 리스트 */}
                        {categoryPosts.map((item: any, index: number) => {
                          return (
                            <Link
                              key={item.id}
                              href={`/post/${item.id}`}
                              className="block border-b border-gray-200 hover:bg-gray-50 transition-colors last:border-b-0"
                            >
                              {/* 모바일 레이아웃 */}
                              <div className="md:hidden px-3 py-3">
                                <div className="flex items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-sm text-gray-900 line-clamp-2 flex-1">
                                        {item.title}
                                      </span>
                                      {(item.likes || 0) >= 10 && (
                                        <span className="flex-shrink-0 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
                                          HIT
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                      <span>{item.author || item.authorName || '익명'}</span>
                                      <span>•</span>
                                      <span>{formatRelativeTime(item.timestamp || item.createdAt)}</span>
                                      <span>•</span>
                                      <span>{item.likes || 0}</span>
                                      {item.comments > 0 && (
                                        <>
                                          <span>•</span>
                                          <span className="text-blue-600 font-semibold">댓글 {item.comments}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    {user && item.uid && user.uid === item.uid && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          handleDelete(item.id, item.uid, e)
                                        }}
                                        className="flex-shrink-0 text-red-500 hover:text-red-700 transition p-1"
                                        title="삭제"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    )}
                                    {user && item.uid && user.uid !== item.uid && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          setReportTarget({
                                            type: 'post',
                                            id: item.id,
                                            authorId: item.uid,
                                            content: item.content || item.title,
                                          })
                                          setIsReportModalOpen(true)
                                        }}
                                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition p-1"
                                        title="신고"
                                      >
                                        <Flag size={16} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* 데스크톱 레이아웃 */}
                              <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-sm">
                                {/* 번호 */}
                                <div className="col-span-1 text-center text-gray-500 text-xs">
                                  {categoryPosts.length - index}
                                </div>
                                
                                {/* 제목 */}
                                <div className="col-span-6 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 truncate">
                                      {item.title}
                                    </span>
                                    {(item.likes || 0) >= 10 && (
                                      <span className="flex-shrink-0 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
                                        HIT
                                      </span>
                                    )}
                                    {item.comments > 0 && (
                                      <span className="flex-shrink-0 text-xs text-blue-600 font-semibold">
                                        [{item.comments}]
                                      </span>
                                    )}
                                    {user && item.uid && user.uid === item.uid && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          handleDelete(item.id, item.uid, e)
                                        }}
                                        className="flex-shrink-0 text-red-500 hover:text-red-700 transition p-0.5"
                                        title="삭제"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                    {user && item.uid && user.uid !== item.uid && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          setReportTarget({
                                            type: 'post',
                                            id: item.id,
                                            authorId: item.uid,
                                            content: item.content || item.title,
                                          })
                                          setIsReportModalOpen(true)
                                        }}
                                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition p-0.5"
                                        title="신고"
                                      >
                                        <Flag size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                
                                {/* 작성자 */}
                                <div className="col-span-2 text-center text-xs text-gray-600 truncate">
                                  {item.author || item.authorName || '익명'}
                                </div>
                                
                                {/* 시간 */}
                                <div className="col-span-2 text-center text-xs text-gray-500">
                                  {formatRelativeTime(item.timestamp || item.createdAt)}
                                </div>
                                
                                {/* 조회수 */}
                                <div className="col-span-1 text-center text-xs text-gray-500">
                                  {item.likes || 0}
                                </div>
                              </div>
                            </Link>
                          )
                        })}
                      </>
                    )}
                  </div>
                )
              })) : (
                // 특정 게시판 선택 시 해당 게시판만 표시
                (() => {
                  const category = boardCategories.find(cat => cat.value === selectedCategory)
                  if (!category) return null
                  const categoryPosts = getPostsByCategory(category.value, 50)
                  
                  return (
                    <div key={category.value} id={`category-${category.value}`} className="bg-white border border-gray-200">
                      {/* 게시판 헤더 */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <h2 className="font-bold text-lg text-gray-900">
                            {category.label}
                          </h2>
                          <span className="text-sm text-gray-500">
                            ({categoryPosts.length})
                          </span>
                        </div>
                      </div>

                      {/* 게시글 리스트 */}
                      {categoryPosts.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-sm">
                          아직 게시글이 없습니다
                        </div>
                      ) : (
                        <>
                          {/* 테이블 헤더 (데스크톱) */}
                          <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600">
                            <div className="col-span-1 text-center">번호</div>
                            <div className="col-span-6">제목</div>
                            <div className="col-span-2 text-center">작성자</div>
                            <div className="col-span-2 text-center">시간</div>
                            <div className="col-span-1 text-center">조회</div>
                          </div>
                          
                          {/* 게시글 리스트 */}
                          {categoryPosts.map((item: any, index: number) => {
                            return (
                              <Link
                                key={item.id}
                                href={`/post/${item.id}`}
                                className="block border-b border-gray-200 hover:bg-gray-50 transition-colors last:border-b-0"
                              >
                                {/* 모바일 레이아웃 */}
                                <div className="md:hidden px-3 py-3">
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm text-gray-900 line-clamp-2 flex-1">
                                          {item.title}
                                        </span>
                                        {(item.likes || 0) >= 10 && (
                                          <span className="flex-shrink-0 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
                                            HIT
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                        <span>{item.author || item.authorName || '익명'}</span>
                                        <span>•</span>
                                        <span>{formatRelativeTime(item.timestamp || item.createdAt)}</span>
                                        <span>•</span>
                                        <span>{item.likes || 0}</span>
                                        {item.comments > 0 && (
                                          <>
                                            <span>•</span>
                                            <span className="text-blue-600 font-semibold">댓글 {item.comments}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      {user && item.uid && user.uid === item.uid && (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handleDelete(item.id, item.uid, e)
                                          }}
                                          className="flex-shrink-0 text-red-500 hover:text-red-700 transition p-1"
                                          title="삭제"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      )}
                                      {user && item.uid && user.uid !== item.uid && (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setReportTarget({
                                              type: 'post',
                                              id: item.id,
                                              authorId: item.uid,
                                              content: item.content || item.title,
                                            })
                                            setIsReportModalOpen(true)
                                          }}
                                          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition p-1"
                                          title="신고"
                                        >
                                          <Flag size={16} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* 데스크톱 레이아웃 */}
                                <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-sm">
                                  {/* 번호 */}
                                  <div className="col-span-1 text-center text-gray-500 text-xs">
                                    {categoryPosts.length - index}
                                  </div>
                                  
                                  {/* 제목 */}
                                  <div className="col-span-6 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900 truncate">
                                        {item.title}
                                      </span>
                                      {(item.likes || 0) >= 10 && (
                                        <span className="flex-shrink-0 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
                                          HIT
                                        </span>
                                      )}
                                      {item.comments > 0 && (
                                        <span className="flex-shrink-0 text-xs text-blue-600 font-semibold">
                                          [{item.comments}]
                                        </span>
                                      )}
                                      {user && item.uid && user.uid === item.uid && (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handleDelete(item.id, item.uid, e)
                                          }}
                                          className="flex-shrink-0 text-red-500 hover:text-red-700 transition p-0.5"
                                          title="삭제"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                      {user && item.uid && user.uid !== item.uid && (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setReportTarget({
                                              type: 'post',
                                              id: item.id,
                                              authorId: item.uid,
                                              content: item.content || item.title,
                                            })
                                            setIsReportModalOpen(true)
                                          }}
                                          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition p-0.5"
                                          title="신고"
                                        >
                                          <Flag size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* 작성자 */}
                                  <div className="col-span-2 text-center text-xs text-gray-600 truncate">
                                    {item.author || item.authorName || '익명'}
                                  </div>
                                  
                                  {/* 시간 */}
                                  <div className="col-span-2 text-center text-xs text-gray-500">
                                    {formatRelativeTime(item.timestamp || item.createdAt)}
                                  </div>
                                  
                                  {/* 조회수 */}
                                  <div className="col-span-1 text-center text-xs text-gray-500">
                                    {item.likes || 0}
                                  </div>
                                </div>
                              </Link>
                            )
                          })}
                        </>
                      )}
                    </div>
                  )
                })()
              )}
            </div>
            
            {/* 오른쪽 사이드바 - 게시판 목록 */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-20">
                <h3 className="font-bold text-sm text-gray-900 mb-3">게시판 목록</h3>
                <div className="space-y-1">
                  {boardCategories.map((category) => {
                    const isActive = selectedCategory === category.value
                    const postCount = getPostsByCategory(category.value, 10).length
                    return (
                      <button
                        key={category.value}
                        onClick={() => {
                          setSelectedCategory(category.value)
                          const element = document.getElementById(`category-${category.value}`)
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                          const newUrl = category.value === '베스트' 
                            ? '/' 
                            : `/?category=${encodeURIComponent(category.value)}`
                          router.push(newUrl, { scroll: false })
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-[#1A2B4E] text-white font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{category.label}</span>
                          <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                            {postCount}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 인기 게시글 (베스트) */}
              {selectedCategory === '베스트' && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-bold text-sm text-gray-900 mb-3">🔥 인기 게시글</h3>
                  <div className="space-y-2">
                    {getPostsByCategory('베스트', 5)
                      .filter((post: any) => (post.likes || 0) >= 10)
                      .slice(0, 5)
                      .map((post: any) => (
                        <Link
                          key={post.id}
                          href={`/post/${post.id}`}
                          className="block p-2 rounded hover:bg-gray-50 transition"
                        >
                          <p className="text-xs text-gray-900 line-clamp-2 mb-1">{post.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500">
                            <span>{post.likes || 0} 좋아요</span>
                            <span>•</span>
                            <span>{post.comments || 0} 댓글</span>
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>
              )}
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


      {/* 하단 네비게이션 (모바일용) - 항상 표시 */}
      <BottomNav onWriteClick={() => {
        if (!user) {
          handleLogin()
        } else {
          setIsWriteMode(true)
        }
      }} />
    </MainLayout>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pb-24 bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2B4E]"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}

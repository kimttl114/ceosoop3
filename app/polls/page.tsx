'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { ArrowLeft, Clock, TrendingUp, Loader2, Plus, Trash2, Flag, Sparkles } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import DecisionPollModal from '@/components/DecisionPollModal'
import WriteModal from '@/components/WriteModal'
import MessageModal from '@/components/MessageModal'
import ReportModal from '@/components/ReportModal'
import AvatarMini from '@/components/AvatarMini'
import PostAuthorBadge from '@/components/PostAuthorBadge'
import MorphingBackground from '@/components/MorphingBackground'
import { useVerification } from '@/hooks/useVerification'

// 커뮤니티 카테고리 (베스트 제외)
const communityCategories = [
  { value: '전체', label: '전체', emoji: '' },
  { value: '대나무숲', label: '🗣️대나무숲', emoji: '🗣️' },
  { value: '빌런박제소', label: '❓빌런박제소', emoji: '❓' },
  { value: '꿀팁공유', label: '🍯꿀팁공유', emoji: '🍯' },
  { value: '비틱방(자랑질)', label: '비틱방(자랑질)', emoji: '🥕' },
  { value: '결정장애', label: '💭결정장애', emoji: '💭' },
]

export default function CommunityPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [polls, setPolls] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [loading, setLoading] = useState(true)
  const [isPollModalOpen, setIsPollModalOpen] = useState(false)
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [messageReceiver, setMessageReceiver] = useState<{ id: string; name: string; postTitle?: string } | null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState<{ type: 'post', id: string, authorId?: string, content?: string } | null>(null)
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

  // 게시글 목록 불러오기
  useEffect(() => {
    if (!db) return

    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const postList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: 'post' as const,
        }))

        // 베스트 제외 (베스트는 메인 페이지에서만 표시)
        const filteredPosts = postList.filter((post: any) => {
          const postCategory = post.category || '잡담'
          return postCategory !== '베스트' && !(post.likes && post.likes >= 10)
        })

        setPosts(filteredPosts)

        // 아바타 불러오기
        const userIds = filteredPosts.map((post: any) => post.uid).filter(Boolean) as string[]
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
            avatarResults.forEach((result: any) => {
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
        console.error('게시글 목록 불러오기 오류:', error)
      }
    )
    return () => unsubscribe()
  }, [db])

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
        type: 'poll' as const,
      }))

      // 활성 상태만 필터링
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

      // 아바타 불러오기 (함수형 업데이트 사용)
      const uniqueUserIds = Array.from(new Set(activePolls.map((p: any) => p.authorId)))
      
      setUserAvatars((prevAvatars) => {
        const avatarPromises = uniqueUserIds.map(async (uid: string) => {
          // 이미 캐시에 있고 유효한 값이 있으면 스킵
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
          avatarResults.forEach((result: any) => {
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
    })

    return () => unsubscribe()
  }, [db]) // userAvatars dependency 제거하여 무한 루프 방지

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

  // 글 삭제 함수
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

  // 더미 글 생성 함수
  const generateDummyPost = async () => {
    if (!user || !db) {
      alert('로그인이 필요합니다.')
      return
    }

    const count = prompt('생성할 더미 글 개수를 입력하세요 (1-50):', '10')
    if (!count) return

    const numCount = parseInt(count)
    if (isNaN(numCount) || numCount < 1 || numCount > 50) {
      alert('1에서 50 사이의 숫자를 입력해주세요.')
      return
    }

    if (!confirm(`${numCount}개의 더미 글을 생성하시겠습니까?`)) {
      return
    }

    // 더미 데이터 - 실제 자영업자가 쓸 만한 내용
    const dummyPosts = [
      {
        title: '오늘 매출 50만원... 너무 심각해요',
        content: '안녕하세요. 치킨집 운영하고 있는데 요즘 매출이 너무 안나와서 걱정이에요. 이번 달 평균 매출이 50만원대로 떨어졌는데, 임대료도 150만원에 원재료비, 인건비까지 생각하면 정말 막막하네요. 다른 사장님들은 어떻게 버티고 계신가요? 힘내시고 계신 분들 응원합니다.',
      },
      {
        title: '알바생 구하기 진짜 너무 힘들어요',
        content: '카페 운영 중인데 알바생 구하기가 정말 어렵네요. 한 달째 구인구직에 올렸는데 연락도 제대로 없고... 오픈 시간에 혼자서 커피 만들고 서빙하고 정리까지 하다 보니 정말 체력 한계예요. 혹시 알바생 잘 구하는 방법 아시는 분 계신가요?',
      },
      {
        title: '신메뉴 출시했는데 손님 반응이...',
        content: '한식당 운영 중인데 새로운 메뉴를 추가했어요. 개발하는데 시간도 오래 걸렸고 원가도 생각보다 많이 나와서 고민이 많았는데, 막상 출시하니 손님들이 별로 관심을 안 보이네요. 홍보를 더 해야 할까요? 신메뉴 홍보 잘 하시는 분 있으면 조언 부탁드려요.',
      },
      {
        title: '리뷰에 별점 1개 받았는데 속상해요',
        content: '배달 주문한 손님이 별점 1개 주면서 불만 리뷰를 남겼어요. 내용 보니까 주문이 좀 늦게 도착했다고 하는데, 그 날 정말 바빠서 배달이 10분 정도 늦어졌어요. 하지만 리뷰에는 정말 심하게 써있더라고요... 리뷰 관리 어떻게 하시는지 궁금해요.',
      },
      {
        title: '세금 신고 때문에 밤잠을 못 자요',
        content: '올해 첫 사업이어서 세금 신고가 정말 어려워요. 부가세도 복잡하고 종합소득세도 헷갈리고... 혼자 하려니까 너무 어려워서 회계사 분한테 맡기려고 하는데 비용이 부담되네요. 혼자 신고 하시는 분 있으신가요?',
      },
      {
        title: '인스타그램 홍보 어떻게 시작하나요?',
        content: '인스타그램으로 홍보를 해보고 싶은데 막막하네요. 사진 찍는 것도 어렵고 해시태그도 뭘 해야 할지 모르겠어요. 인스타로 홍보 잘 하시는 사장님들 있으시면 팁 좀 알려주세요. 작은 카페 운영하고 있어요!',
      },
      {
        title: '첫 손님 받았을 때 그 기분 아시죠?',
        content: '오늘 가게 오픈하고 첫 손님 받았어요! 정말 떨렸는데 손님이 맛있다고 해주시니까 너무 기뻐서... 이런 경험 하신 분들 아시죠? 작은 일이지만 정말 행복했어요. 힘들지만 열심히 하려고 합니다!',
      },
      {
        title: '앞집에 같은 업종 가게 생겼어요',
        content: '우리 가게 바로 앞에 같은 업종 가게가 생겼어요. 처음엔 걱정이 많았는데 막상 보니 오히려 좋은 것 같기도 해요? 손님들이 이제 이 동네를 더 찾게 되는 느낌이에요. 하지만 장기적으로는 경쟁이 치열해질 것 같아서 걱정이에요.',
      },
      {
        title: '배달 앱 수수료 너무 높지 않나요?',
        content: '요기요, 배달의민족 수수료가 정말 많이 나가요. 매출의 12%를 내야 하니까 이익이 거의 없어요. 하지만 배달 앱 없으면 주문이 안 들어오니까 어쩔 수 없이 사용하고 있네요. 다른 분들도 이렇게 힘드시나요?',
      },
      {
        title: 'POS기 도입할까 말까 고민이에요',
        content: '현금 계산만 하다가 POS기 도입을 생각하고 있어요. 초기 비용도 있고 수수료도 나가는데, 장기적으로는 편할 것 같긴 해요. POS 사용하시는 분들 어떠세요? 만족하시나요? 추천해주실만한 업체 있으면 알려주세요.',
      },
      {
        title: '재료비 올라서 메뉴 가격 올렸는데',
        content: '요즘 닭고기, 기름값이 너무 올라서 메뉴 가격을 올릴 수밖에 없었어요. 그런데 손님들이 가격 올린 것에 불만을 가지시는 분들이 있네요. 이해는 하는데 정말 어쩔 수 없었어요. 가격 인상 어떻게 하시는지 조언 부탁드려요.',
      },
      {
        title: '손님 불만 접수 받았는데 어떻게 해야 할까요',
        content: '손님이 음식에 이물질이 들어있다고 항의를 받았어요. 정말 죄송하고 사과드렸는데 손님 분이 너무 화가 나셔서... 어떻게 대응하는 게 좋을까요? 처음 겪는 일이라 너무 당황스러워요.',
      },
      {
        title: '하루 매출 300만원 찍었어요!',
        content: '오늘 정말 특별한 날이었어요. 하루 매출이 300만원을 넘었어요! 평소보다 손님이 훨씬 많았는데, 직원분들과 함께 열심히 버텨서 무사히 마무리했어요. 이런 날이 있어야 힘이 나죠. 다들 힘내세요!',
      },
      {
        title: '인테리어 리뉴얼 했는데 손님 반응은?',
        content: '가게 인테리어를 새로 했어요. 비용도 많이 들었고 기대가 많이 됐는데, 손님들은 어떤 반응을 보일지 궁금하네요. 일단 우리는 마음에 들어요! 이번 주말에 오픈할 예정이에요. 다들 응원해주세요.',
      },
      {
        title: '폐업 고민이에요 정말 막막해요',
        content: '3개월째 적자예요. 임대료도 못 내고 있네요. 매일 손님 기다리는데 손님도 안 오고... 정말 폐업을 고민 중이에요. 하지만 아직 포기하기는 싫어요. 혹시 이런 경험 하시고 살아나신 분 있으신가요? 조언 부탁드려요.',
      },
      {
        title: '직원이 자꾸 실수해서 고민이에요',
        content: '새로 온 직원이 자꾸 실수를 하네요. 주문 잘못 받고, 계산 실수도 하고... 직원 교육 어떻게 하시는지 궁금해요. 한 번씩은 이해하지만 계속 반복되니까 답답해요. 좋은 교육 방법 있으면 알려주세요.',
      },
      {
        title: '카드 결제 단말기 수수료 부담되네요',
        content: '카드 결제 단말기 수수료가 생각보다 많이 나가요. 특히 체크카드는 수수료가 더 높더라고요. 하지만 현금만 받으면 손님들이 불편해하시니까 어쩔 수 없이 쓰고 있어요. 수수료 낮은 업체 추천해주실 분 있나요?',
      },
      {
        title: '손님들이 자꾸 가격 흥정하시는데',
        content: '가게에 오시는 분들이 가격 흥정을 자꾸 하시네요. 특히 장사 잘 안 되는 시간대에 더 그러시는 것 같아요. 어떻게 대응하는 게 좋을까요? 거절하면 손님 마음이 상할 것 같고, 승낙하면 손해보고... 고민이에요.',
      },
      {
        title: '오늘 하루 손님 한 명도 안 왔어요',
        content: '정말 심각해요. 오늘 하루종일 손님 한 명도 안 왔어요. 창문에 얼굴을 대고 하루종일 기다렸는데... 이런 날이 있으면 정말 위축되네요. 내일은 꼭 손님 오셨으면 좋겠어요. 다들 이런 경험 하셨죠?',
      },
      {
        title: '신메뉴 개발 중인데 원가 계산이 헷갈려요',
        content: '새로운 메뉴를 개발하고 있는데 원가 계산이 정말 복잡해요. 재료비, 인건비, 전기세, 가스비... 이걸 다 어떻게 계산해야 할지 모르겠어요. 원가 계산 잘 하시는 분 계시면 도움 부탁드려요. 정말 고민이에요.',
      },
    ]

    const dummyCategories = ['대나무숲', '빌런박제소', '꿀팁공유', '비틱방(자랑질)']
    const dummyBusinessTypes = ['치킨', '카페', '한식', '중식', '일식', '양식', '분식', '기타']
    const dummyRegions = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산']

    const anonymousAdjectives = ['지친', '행복한', '대박난', '화난', '새벽의', '피곤한', '즐거운', '고민많은']
    const anonymousNouns = ['닭발', '족발', '아메리카노', '마라탕', '포스기', '사장님', '치킨', '카페']

    const generateAnonymousName = () => {
      const adj = anonymousAdjectives[Math.floor(Math.random() * anonymousAdjectives.length)]
      const noun = anonymousNouns[Math.floor(Math.random() * anonymousNouns.length)]
      return `${adj} ${noun}`
    }

    try {
      let successCount = 0
      let failCount = 0

      for (let i = 0; i < numCount; i++) {
        try {
          const randomPost = dummyPosts[Math.floor(Math.random() * dummyPosts.length)]
          const randomCategory = dummyCategories[Math.floor(Math.random() * dummyCategories.length)]
          const randomBusinessType = dummyBusinessTypes[Math.floor(Math.random() * dummyBusinessTypes.length)]
          const randomRegion = dummyRegions[Math.floor(Math.random() * dummyRegions.length)]

          await addDoc(collection(db, 'posts'), {
            title: randomPost.title,
            content: randomPost.content,
            category: randomCategory,
            businessType: randomBusinessType,
            region: randomRegion,
            author: generateAnonymousName(),
            uid: user.uid,
            timestamp: serverTimestamp(),
            likes: Math.floor(Math.random() * 20),
            comments: Math.floor(Math.random() * 10),
            images: [],
            isSimpleMode: Math.random() > 0.5,
          })
          successCount++
        } catch (error) {
          console.error(`더미 글 생성 실패 (${i + 1}번째):`, error)
          failCount++
        }

        // 너무 빠르게 생성하지 않도록 약간의 딜레이
        if (i < numCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      alert(`${successCount}개의 더미 글이 생성되었습니다.${failCount > 0 ? `\n${failCount}개 실패했습니다.` : ''}`)
    } catch (error) {
      console.error('더미 글 생성 오류:', error)
      alert('더미 글 생성 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  // 필터링된 항목
  const allItems = [
    ...posts.map((post) => ({ ...post, type: 'post' as const, sortTime: post.timestamp })),
    ...polls.map((poll) => ({ ...poll, type: 'poll' as const, sortTime: poll.createdAt })),
  ].sort((a, b) => {
    const timeA = a.sortTime?.toDate ? a.sortTime.toDate() : new Date(a.sortTime || 0)
    const timeB = b.sortTime?.toDate ? b.sortTime.toDate() : new Date(b.sortTime || 0)
    return timeB.getTime() - timeA.getTime()
  })

  const filteredItems = allItems.filter((item: any) => {
    // 투표글은 결정장애 카테고리에서만 표시
    if (item.type === 'poll') {
      return selectedCategory === '결정장애'
    }

    // 일반 게시글은 카테고리 필터 적용
    const postCategory = item.category || '잡담'

    if (selectedCategory === '전체') {
      return true
    }

    return postCategory === selectedCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen relative z-10 flex items-center justify-center">
        <MorphingBackground />
        <Loader2 className="animate-spin text-[#1A2B4E] relative z-10" size={48} />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 relative z-10">
      {/* 블러 모핑 배경 */}
      <MorphingBackground />
      
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-[#1A2B4E] to-[#2C3E50] sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/20 rounded-full transition text-white"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span>💬</span>
                <span>커뮤니티</span>
              </h1>
            </div>
            <button
              onClick={generateDummyPost}
              className="p-2 hover:bg-white/20 rounded-full transition text-white"
              title="더미 글 생성"
            >
              <Sparkles size={20} />
            </button>
          </div>

          {/* 카테고리 탭 */}
          <div className="px-3 py-2">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {communityCategories.map((cat) => (
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

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-4 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-500 shadow-sm">
            <p className="text-sm mb-2">아직 게시글이 없습니다.</p>
            {user && isVerified && (
              <button
                onClick={() => setIsWriteModalOpen(true)}
                className="mt-4 px-6 py-2 bg-[#1A2B4E] text-white rounded-lg font-medium hover:bg-[#1A2B4E]/90 transition"
              >
                첫 글쓰기
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
          filteredItems.map((item: any) => {
            // 투표글 렌더링
            if (item.type === 'poll') {
              const totalVotes = getTotalVotes(item)
              const optionAPercent = totalVotes > 0 ? Math.round((item.optionA?.votes || 0) / totalVotes * 100) : 0
              const optionBPercent = totalVotes > 0 ? Math.round((item.optionB?.votes || 0) / totalVotes * 100) : 0

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100"
                >
                  <Link href={`/polls/${item.id}`}>
                    <div className="p-4">
                      {/* 헤더 */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <AvatarMini size={20} avatarUrl={userAvatars[item.authorId]} userId={item.authorId} />
                            <span>{item.authorName || '익명의 사장님'}</span>
                            <span>·</span>
                            <span>{formatRelativeTime(item.createdAt)}</span>
                          </div>
                        </div>
                        {isPopular(item) && (
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
                            <span className="text-xs font-medium text-gray-700">A. {item.optionA?.text || ''}</span>
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
                            <span className="text-xs font-medium text-gray-700">B. {item.optionB?.text || ''}</span>
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
                            <span>{item.comments || 0}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{getTimeRemaining(item.deadline)}</span>
                          </span>
                        </div>
                        <div className="px-4 py-1.5 bg-[#1A2B4E] text-white text-xs font-bold rounded-lg whitespace-nowrap flex-shrink-0">
                          투표하기
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )
            }

            // 일반 게시글 렌더링
            const hasImages = item.images && item.images.length > 0

            return (
              <Link
                key={item.id}
                href={`/post/${item.id}`}
                className="block rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden bg-white border border-gray-100"
              >
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#1A2B4E] via-[#2C3E50] to-[#1A2B4E] opacity-30"></div>

                  <div className="pl-2.5 pr-2.5 py-2">
                    {/* 상단: 카테고리 */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {item.category && (
                        <span className="text-[12px] font-semibold bg-[#1A2B4E] text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          {communityCategories.find(cat => cat.value === item.category)?.emoji || ''}
                          <span>{communityCategories.find(cat => cat.value === item.category)?.label || item.category}</span>
                        </span>
                      )}
                      {user && user.uid === item.uid && (
                        <button
                          onClick={(e) => handleDelete(item.id, item.uid, e)}
                          className="text-red-500 hover:text-red-700 transition p-0.5 rounded-full hover:bg-red-50 flex-shrink-0 ml-auto"
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
                              content: item.title,
                            })
                            setIsReportModalOpen(true)
                          }}
                          className="text-gray-400 hover:text-gray-600 transition p-0.5 rounded-full hover:bg-gray-100 flex-shrink-0 ml-auto"
                          title="신고"
                        >
                          <Flag size={12} />
                        </button>
                      )}
                    </div>

                    {/* 제목 */}
                    <div className="flex items-start justify-between gap-1.5 mb-1">
                      <h3 className="font-bold line-clamp-1 flex-1 text-sm text-gray-900">
                        {item.title}
                      </h3>
                    </div>

                    {/* 내용 미리보기 */}
                    {item.content && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-1.5">
                        {item.content}
                      </p>
                    )}

                    {/* 이미지 미리보기 */}
                    {hasImages && (
                      <div className="mb-1.5">
                        <div className="flex gap-1 overflow-x-auto">
                          {item.images.slice(0, 3).map((img: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden"
                            >
                              <img
                                src={img}
                                alt={`첨부 이미지 ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {item.images.length > 3 && (
                            <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-[10px] text-gray-500 font-bold">
                              +{item.images.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 하단: 작성자 정보 및 메타 */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <AvatarMini size={20} avatarUrl={userAvatars[item.uid]} userId={item.uid} />
                        <PostAuthorBadge authorId={item.uid} />
                        <div className="flex items-center gap-0.5 text-[11px] text-gray-500">
                          <span className="font-medium text-gray-700">{item.anonymousName || '익명의 사장님'}</span>
                          <span>·</span>
                          <span>{formatRelativeTime(item.timestamp)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <span className="flex items-center gap-0.5">
                          <span>👍</span>
                          <span>{item.likes || 0}</span>
                        </span>
                        <span className="flex items-center gap-0.5">
                          <span>💬</span>
                          <span>{item.comments || 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </main>

      {/* 글쓰기 모달 */}
      <WriteModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        onSuccess={() => {
          setIsWriteModalOpen(false)
        }}
      />

      {/* 투표 작성 모달 */}
      <DecisionPollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        onSuccess={() => {
          setIsPollModalOpen(false)
        }}
      />

      {/* 쪽지 모달 */}
      <MessageModal
        isOpen={isMessageModalOpen}
        onClose={() => {
          setIsMessageModalOpen(false)
          setMessageReceiver(null)
        }}
        receiver={messageReceiver}
      />

      {/* 신고 모달 */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false)
          setReportTarget(null)
        }}
        target={reportTarget}
      />

      {/* 하단 네비게이션 */}
      <BottomNav />

      {/* 글쓰기 버튼 (네비게이션 바 바로 위) */}
      {user && isVerified && (
        <div className="fixed bottom-[68px] left-1/2 -translate-x-1/2 z-[60] max-w-md w-full flex justify-center gap-3 pointer-events-none">
          <button
            onClick={() => setIsWriteModalOpen(true)}
            className="w-10 h-10 bg-[#FFBF00] text-[#1A2B4E] rounded-full shadow-lg flex items-center justify-center hover:bg-[#FFBF00]/90 transition transform hover:scale-110 active:scale-95 pointer-events-auto"
            type="button"
            title="글쓰기"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setIsPollModalOpen(true)}
            className="w-10 h-10 bg-[#1A2B4E] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#1A2B4E]/90 transition transform hover:scale-110 active:scale-95 pointer-events-auto"
            type="button"
            title="투표 만들기"
          >
            <TrendingUp size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  )
}

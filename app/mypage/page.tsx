'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, collection, query, where, orderBy, onSnapshot, deleteDoc, getDocs, limit } from 'firebase/firestore'
import { ArrowLeft, LogOut, User, MapPin, Building2, UserCircle, Loader2, FileText, Trash2, Shield, CheckCircle, Sparkles, Award } from 'lucide-react'
import AvatarMini from '@/components/AvatarMini'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import VerificationBadge from '@/components/VerificationBadge'
import { getVerificationStatus, VerificationStatus } from '@/lib/verification'
import { getLevelByPoints, getNextLevel, getProgressToNextLevel } from '@/lib/levels'
import { getUnlockedBadges, getNewBadges, UserStats } from '@/lib/badges'
import { formatNumber } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// 지역 목록
const regions = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
]

// 업종 목록
const businessTypes = [
  { value: '치킨', emoji: '🍗' },
  { value: '카페', emoji: '☕' },
  { value: '한식', emoji: '🍚' },
  { value: '중식', emoji: '🥟' },
  { value: '일식', emoji: '🍣' },
  { value: '양식', emoji: '🍝' },
  { value: '분식', emoji: '🍢' },
  { value: '베이커리', emoji: '🥖' },
  { value: '술집', emoji: '🍺' },
  { value: '기타', emoji: '🏪' },
]

export default function MyPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [anonymousName, setAnonymousName] = useState('')
  const [region, setRegion] = useState('')
  const [businessType, setBusinessType] = useState('치킨')
  const [userId, setUserId] = useState('')
  const [myPosts, setMyPosts] = useState<any[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)
  const [userPoints, setUserPoints] = useState(0)
  const [userBadges, setUserBadges] = useState<string[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    points: 0,
    consecutiveDays: 0,
    postsCount: 0,
    commentsCount: 0,
    gamesPlayed: 0,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 10

  // 로그인 상태 확인 및 사용자 정보 불러오기
  useEffect(() => {
    if (!auth || !db) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        setUserId(currentUser.uid)
        
        if (!db) {
          setLoading(false)
          return
        }
        
        try {
          const userRef = doc(db, 'users', currentUser.uid)
          const userSnap = await getDoc(userRef)
          
          // 포인트와 뱃지 초기값 설정
          let points = 0
          let badges: string[] = []
          
          if (userSnap.exists()) {
            const userData = userSnap.data()
            if (userData.anonymousName) {
              setAnonymousName(userData.anonymousName)
            }
            if (userData.region) {
              setRegion(userData.region)
            }
            if (userData.businessType) {
              setBusinessType(userData.businessType)
            }
            if (userData.avatarUrl) {
              setAvatarUrl(userData.avatarUrl)
            }
            // 포인트 불러오기
            points = userData.points || 0
            setUserPoints(points)
            
            // 뱃지 불러오기
            badges = userData.badges || []
            setUserBadges(badges)
          }

          // 출석 기록 불러오기
          const checkInRef = doc(db, 'user_checkin', currentUser.uid)
          const checkInSnap = await getDoc(checkInRef)
          let consecutiveDays = 0
          if (checkInSnap.exists()) {
            consecutiveDays = checkInSnap.data()?.consecutiveDays || 0
          }

          // 내 글 수 계산
          const postsRef = collection(db, 'posts')
          const postsQuery = query(postsRef, where('uid', '==', currentUser.uid))
          const postsSnapshot = await getDocs(postsQuery)
          const postsCount = postsSnapshot.size || 0

          // 통계 계산
          const stats: UserStats = {
            points: points,
            consecutiveDays: consecutiveDays,
            postsCount: postsCount,
            commentsCount: 0, // TODO: 댓글 수 집계
            gamesPlayed: 0, // TODO: 게임 플레이 수 집계
          }
            setUserStats(stats)
            
            // 새로운 뱃지 확인 및 추가
            const newBadges = getNewBadges(stats, badges)
            if (newBadges.length > 0) {
              const updatedBadges = [...badges, ...newBadges.map(b => b.id)]
              await setDoc(userRef, { badges: updatedBadges }, { merge: true })
              setUserBadges(updatedBadges)
            }

            // 인증 상태 불러오기
            if (currentUser) {
              const verification = await getVerificationStatus(currentUser.uid)
              setVerificationStatus(verification)
            }
          } catch (error: any) {
            if (error?.code !== 'failed-precondition' && !error?.message?.includes('offline')) {
              console.error('사용자 정보 불러오기 오류:', error)
            }
          }
        } else {
          router.push('/')
        }
        setLoading(false)
      })

      return () => unsubscribe()
    }, [router])

  // 내가 쓴 글 불러오기
  useEffect(() => {
    if (!user || !db) return

    setLoadingPosts(true)
    const postsRef = collection(db, 'posts')
    
    // 인덱스가 없을 수 있으므로 orderBy 없이 먼저 시도
    const q = query(
      postsRef,
      where('uid', '==', user.uid)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const posts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        // 클라이언트 사이드에서 시간순 정렬
        posts.sort((a: any, b: any) => {
          const timeA = a.timestamp?.toMillis?.() || 0
          const timeB = b.timestamp?.toMillis?.() || 0
          return timeB - timeA
        })
        setMyPosts(posts)
        setLoadingPosts(false)
      },
      (error: any) => {
        console.error('내 글 불러오기 오류:', error)
        // 인덱스 오류인 경우 무시하고 빈 배열 설정
        if (error?.code === 'failed-precondition') {
          console.warn('Firestore 인덱스가 필요합니다. Firebase 콘솔에서 인덱스를 생성해주세요.')
          setMyPosts([])
        }
        setLoadingPosts(false)
      }
    )

    return () => unsubscribe()
  }, [user, db])


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
    return postTime.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // 업종 이모지 가져오기
  const getBusinessEmoji = (business: string) => {
    const found = businessTypes.find((bt) => bt.value === business)
    return found ? found.emoji : '🏪'
  }

  // 글 삭제 핸들러
  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return
    }

    if (!db) return

    try {
      await deleteDoc(doc(db, 'posts', postId))
      alert('글이 삭제되었습니다.')
    } catch (error: any) {
      console.error('글 삭제 실패:', error)
      alert('글 삭제에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
    }
  }

  // 로그아웃 핸들러
  const handleLogout = async () => {
    if (!auth) return

    if (!confirm('정말 로그아웃하시겠습니까?')) {
      return
    }

    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('로그아웃 실패:', error)
      alert('로그아웃에 실패했습니다.')
    }
  }

  // 프로필 저장 핸들러
  const handleSave = async () => {
    if (!user || !db) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!anonymousName.trim()) {
      alert('익명 아이디를 입력해주세요.')
      return
    }

    setSaving(true)

    try {
      const userRef = doc(db, 'users', user.uid)

      await setDoc(
        userRef,
        {
          anonymousName: anonymousName.trim(),
          region: region,
          businessType: businessType,
          avatarUrl: avatarUrl,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )

      alert('프로필이 저장되었습니다!')
    } catch (error: any) {
      console.error('프로필 저장 실패:', error)
      
      if (error?.code === 'failed-precondition' || error?.message?.includes('offline')) {
        alert('인터넷 연결을 확인해주세요. 오프라인 상태에서는 저장할 수 없습니다.')
      } else {
        alert('프로필 저장에 실패했습니다: ' + (error?.message || '알 수 없는 오류'))
      }
    } finally {
      setSaving(false)
    }
  }

  // 로딩 중
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

  // 로그인하지 않은 경우
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen pb-24 relative z-10">
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
            <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 rounded-full transition text-red-600"
            title="로그아웃"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 pt-6">
        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#1A2B4E] bg-gray-100 flex items-center justify-center flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="프로필 아바타"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} className="text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {user.displayName || '사용자'}
                </h2>
                {verificationStatus && (
                  <VerificationBadge status={verificationStatus.status} size="sm" />
                )}
              </div>
              <p className="text-sm text-gray-500">ID: {userId.substring(0, 8)}...</p>
            </div>
          </div>
        </div>

        {/* 레벨 & 포인트 카드 */}
        {user && (() => {
          const currentLevel = getLevelByPoints(userPoints);
          const nextLevel = getNextLevel(currentLevel);
          const progress = getProgressToNextLevel(userPoints, currentLevel);
          const unlockedBadges = getUnlockedBadges(userStats, userBadges);
          const newBadges = getNewBadges(userStats, userBadges);

          return (
            <>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 mb-6 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${currentLevel.color} flex items-center justify-center text-3xl shadow-lg`}>
                      {currentLevel.emoji}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">현재 레벨</div>
                      <div className="text-xl font-bold text-gray-800">{currentLevel.level}. {currentLevel.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">포인트</div>
                    <div className="text-xl font-bold text-purple-600">{formatNumber(userPoints)}P</div>
                  </div>
                </div>

                {nextLevel && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span>다음 레벨: {nextLevel.emoji} {nextLevel.name}</span>
                      <span>{userPoints} / {nextLevel.minPoints}P</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${nextLevel.color} transition-all duration-500 rounded-full`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 뱃지 섹션 */}
              {unlockedBadges.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-lg font-bold text-gray-800">획득한 뱃지</h3>
                    {newBadges.length > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                        새로 {newBadges.length}개!
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {unlockedBadges.map((badge) => (
                      <div
                        key={badge.id}
                        className={`p-3 rounded-xl bg-gradient-to-br ${badge.color} text-white text-center shadow-md ${
                          newBadges.find(b => b.id === badge.id) ? 'ring-4 ring-yellow-400 animate-pulse' : ''
                        }`}
                        title={badge.description}
                      >
                        <div className="text-2xl mb-1">{badge.emoji}</div>
                        <div className="text-xs font-semibold">{badge.name}</div>
                      </div>
                    ))}
                  </div>
                  {unlockedBadges.length < 8 && (
                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-500">
                        {8 - unlockedBadges.length}개의 뱃지를 더 획득할 수 있어요!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          );
        })()}


        {/* 사업자 인증 카드 - 프로필 카드 바로 다음 */}
        <div className="bg-gradient-to-br from-[#1A2B4E] to-[#2C3E50] rounded-2xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-start gap-3 mb-4">
            <Shield size={24} className="text-[#FFBF00] flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">사업자 인증</h3>
              {verificationStatus?.status === 'approved' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-300">
                    <CheckCircle size={20} />
                    <span className="font-semibold">인증 완료</span>
                  </div>
                  {verificationStatus.businessInfo && (
                    <div className="bg-white/10 rounded-lg p-4 space-y-2 text-sm backdrop-blur-sm">
                      <div className="flex justify-between">
                        <span className="text-white/80">사업자등록번호:</span>
                        <span className="font-medium text-white">
                          {verificationStatus.businessInfo.businessNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">대표자명:</span>
                        <span className="font-medium text-white">
                          {verificationStatus.businessInfo.representativeName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">개업일자:</span>
                        <span className="font-medium text-white">
                          {verificationStatus.businessInfo.openingDate}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : verificationStatus?.status === 'pending' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-yellow-300">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="font-semibold">인증 대기중</span>
                  </div>
                  <p className="text-sm text-white/90">인증이 검토 중입니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-white/90 leading-relaxed">
                    사업자 인증을 완료하면 더 많은 기능을 이용할 수 있습니다.
                  </p>
                  <Link
                    href="/auth/verify"
                    className="block w-full py-3 bg-[#FFBF00] text-[#1A2B4E] rounded-xl font-bold hover:bg-[#FFBF00]/90 transition text-center shadow-lg"
                  >
                    사업자 인증하기
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 프로필 설정 - 간결하게 */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <UserCircle size={18} className="text-[#1A2B4E]" />
            <span>프로필 설정</span>
          </h3>

          <div className="space-y-3">
            {/* 익명 아이디 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                익명 아이디 *
              </label>
              <input
                type="text"
                value={anonymousName}
                onChange={(e) => setAnonymousName(e.target.value)}
                placeholder="예: 행복한 치킨집 사장"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#1A2B4E] text-gray-800 text-sm"
                maxLength={20}
              />
            </div>

            {/* 지역 선택 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <MapPin size={14} />
                <span>지역</span>
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#1A2B4E] text-gray-800 bg-white text-sm"
              >
                <option value="">지역 선택</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* 업종 선택 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Building2 size={14} />
                <span>업종</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {businessTypes.map((bt) => (
                  <button
                    key={bt.value}
                    onClick={() => setBusinessType(bt.value)}
                    className={`py-2 rounded-lg border-2 transition ${
                      businessType === bt.value
                        ? 'border-[#1A2B4E] bg-[#1A2B4E] text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xl mb-0.5">{bt.emoji}</div>
                    <div className="text-[10px] font-medium">{bt.value}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 저장 버튼 */}
            <button
              onClick={handleSave}
              disabled={saving || !anonymousName.trim()}
              className="w-full py-2.5 bg-[#FFBF00] text-gray-900 rounded-lg font-bold hover:bg-[#FFBF00]/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>저장 중...</span>
                </>
              ) : (
                <span>저장하기</span>
              )}
            </button>
          </div>
        </div>

        {/* 현재 설정 표시 */}
        {(anonymousName || region || businessType) && (
          <div className="bg-blue-50 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">현재 설정</h3>
            <div className="space-y-2 text-sm">
              {anonymousName && (
                <div className="flex items-center gap-2">
                  <UserCircle size={16} className="text-gray-500" />
                  <span className="text-gray-700">익명 아이디: <strong>{anonymousName}</strong></span>
                </div>
              )}
              {region && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-500" />
                  <span className="text-gray-700">지역: <strong>{region}</strong></span>
                </div>
              )}
              {businessType && (
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-gray-500" />
                  <span className="text-gray-700">
                    업종: <strong>{businessTypes.find(bt => bt.value === businessType)?.emoji} {businessType}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 내가 쓴 글 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-[#1A2B4E]" />
            <span>내가 쓴 글 ({myPosts.length})</span>
          </h3>

          {loadingPosts ? (
            <div className="text-center py-8">
              <Loader2 className="animate-spin text-gray-400 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-500">로딩 중...</p>
            </div>
          ) : myPosts.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">아직 작성한 글이 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {(() => {
                  const totalPages = Math.ceil(myPosts.length / postsPerPage)
                  const startIndex = (currentPage - 1) * postsPerPage
                  const endIndex = startIndex + postsPerPage
                  const currentPosts = myPosts.slice(startIndex, endIndex)

                  return (
                    <>
                      {currentPosts.map((post: any) => (
                        <div
                          key={post.id}
                          className="flex items-center justify-between p-3 border-b border-gray-200 hover:bg-gray-50 transition rounded-lg group"
                        >
                          <Link 
                            href={`/post/${post.id}`}
                            className="flex-1 min-w-0"
                          >
                            <h4 className="font-medium text-gray-900 hover:text-[#1A2B4E] transition truncate pr-2">
                              {post.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                              <span>{formatRelativeTime(post.timestamp)}</span>
                            </div>
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDeletePost(post.id)
                            }}
                            className="p-2 hover:bg-red-50 rounded-full transition text-red-500 flex-shrink-0 opacity-0 group-hover:opacity-100"
                            title="삭제"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      
                      {/* 페이지네이션 */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            이전
                          </button>
                          
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum: number
                              if (totalPages <= 5) {
                                pageNum = i + 1
                              } else if (currentPage <= 3) {
                                pageNum = i + 1
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                              } else {
                                pageNum = currentPage - 2 + i
                              }

                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                                    currentPage === pageNum
                                      ? 'bg-[#1A2B4E] text-white'
                                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              )
                            })}
                          </div>

                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            다음
                          </button>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </>
          )}
        </div>

        {/* 안내 사항 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">💡 안내</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 익명 아이디는 게시글 작성 시 자동으로 사용됩니다.</li>
            <li>• 지역과 업종은 게시글에 뱃지로 표시됩니다.</li>
            <li>• 프로필을 변경해도 과거 게시글의 정보는 유지됩니다.</li>
            <li>• 내가 쓴 글에서 삭제할 수 있습니다.</li>
          </ul>
        </div>
      </main>


      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  )
}

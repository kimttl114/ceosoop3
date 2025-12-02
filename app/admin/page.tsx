'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, getDocs, where, Timestamp } from 'firebase/firestore'
import AdminLayout from '@/components/AdminLayout'
import { 
  FileText, 
  MessageSquare, 
  Users, 
  Flag, 
  TrendingUp,
  Activity,
  Sparkles,
  Loader2
} from 'lucide-react'

interface Stats {
  totalPosts: number
  totalComments: number
  totalUsers: number
  pendingReports: number
  todayPosts: number
  todayComments: number
  todayUsers: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    totalComments: 0,
    totalUsers: 0,
    pendingReports: 0,
    todayPosts: 0,
    todayComments: 0,
    todayUsers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('대나무숲')
  const [dummyCount, setDummyCount] = useState(3)
  const [generateResult, setGenerateResult] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 오늘 날짜 계산
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayTimestamp = Timestamp.fromDate(today)

        // 전체 게시글 수
        const postsQuery = query(collection(db, 'posts'))
        const postsSnapshot = await getDocs(postsQuery)
        const totalPosts = postsSnapshot.size

        // 오늘 게시글 수
        const todayPostsQuery = query(
          collection(db, 'posts'),
          where('timestamp', '>=', todayTimestamp)
        )
        const todayPostsSnapshot = await getDocs(todayPostsQuery)
        const todayPosts = todayPostsSnapshot.size

        // 전체 사용자 수
        const usersQuery = query(collection(db, 'users'))
        const usersSnapshot = await getDocs(usersQuery)
        const totalUsers = usersSnapshot.size

        // 오늘 가입한 사용자 수 (users 컬렉션에 createdAt 필드가 있다고 가정)
        // 실제로는 createdAt 필드가 있어야 합니다
        const todayUsers = 0 // 임시값

        // 대기 중인 신고 수
        const reportsQuery = query(
          collection(db, 'reports'),
          where('status', '==', 'pending')
        )
        const reportsSnapshot = await getDocs(reportsQuery)
        const pendingReports = reportsSnapshot.size

        // 전체 댓글 수 (각 게시글의 comments 서브컬렉션 합계)
        // 실제로는 더 효율적인 방법이 필요할 수 있습니다
        let totalComments = 0
        let todayComments = 0
        
        // 게시글별 댓글 수 집계 (샘플링 방식)
        const posts = postsSnapshot.docs.slice(0, 10) // 샘플링
        for (const postDoc of posts) {
          try {
            const commentsQuery = query(collection(db, 'posts', postDoc.id, 'comments'))
            const commentsSnapshot = await getDocs(commentsQuery)
            totalComments += commentsSnapshot.size
          } catch (error) {
            // 댓글 컬렉션이 없을 수 있음
          }
        }

        setStats({
          totalPosts,
          totalComments: Math.round(totalComments * (totalPosts / Math.min(posts.length, 10))), // 추정값
          totalUsers,
          pendingReports,
          todayPosts,
          todayComments: 0, // 임시값
          todayUsers,
        })
      } catch (error) {
        console.error('통계 불러오기 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const categories = [
    { value: '대나무숲', label: '🗣️ 대나무숲' },
    { value: '빌런박제소', label: '❓ 빌런박제소' },
    { value: '유머 & 이슈', label: '😄 유머 & 이슈' },
    { value: '비틱방(자랑방)', label: '🥕 비틱방(자랑방)' },
  ]

  const handleGenerateDummyPosts = async () => {
    if (!selectedCategory || dummyCount < 1 || dummyCount > 10) {
      alert('카테고리와 개수(1-10)를 올바르게 선택해주세요.')
      return
    }

    setGenerating(true)
    setGenerateResult(null)

    try {
      const response = await fetch('/api/generate-dummy-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: selectedCategory,
          count: dummyCount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '더미 글 생성에 실패했습니다.')
      }

      // 성공 메시지 포맷팅 (일부 실패 시 표시)
      const successMessage = data.created !== undefined && data.requested !== undefined && data.created < data.requested
        ? `${data.message} (일부 실패: ${data.requested - data.created}개)`
        : data.message || '더미 글이 생성되었습니다.'

      setGenerateResult(successMessage)
      // 통계 새로고침
      const fetchStats = async () => {
        try {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const todayTimestamp = Timestamp.fromDate(today)

          const postsQuery = query(collection(db, 'posts'))
          const postsSnapshot = await getDocs(postsQuery)
          const totalPosts = postsSnapshot.size

          const todayPostsQuery = query(
            collection(db, 'posts'),
            where('timestamp', '>=', todayTimestamp)
          )
          const todayPostsSnapshot = await getDocs(todayPostsQuery)
          const todayPosts = todayPostsSnapshot.size

          setStats((prev) => ({
            ...prev,
            totalPosts,
            todayPosts,
          }))
        } catch (error) {
          console.error('통계 새로고침 오류:', error)
        }
      }
      fetchStats()
    } catch (error: any) {
      setGenerateResult(`오류: ${error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const statCards = [
    {
      title: '전체 게시글',
      value: stats.totalPosts,
      today: stats.todayPosts,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: '전체 댓글',
      value: stats.totalComments,
      today: stats.todayComments,
      icon: MessageSquare,
      color: 'bg-green-500',
    },
    {
      title: '전체 사용자',
      value: stats.totalUsers,
      today: stats.todayUsers,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      title: '대기 중인 신고',
      value: stats.pendingReports,
      today: null,
      icon: Flag,
      color: 'bg-red-500',
    },
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2B4E] mx-auto mb-4"></div>
            <p className="text-gray-600">통계를 불러오는 중...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
          <p className="text-gray-600">시스템 현황을 한눈에 확인하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="text-white" size={24} />
                  </div>
                  {stat.today !== null && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">오늘</p>
                      <p className="text-sm font-semibold text-gray-900">+{stat.today}</p>
                    </div>
                  )}
                </div>
                <h3 className="text-sm text-gray-600 mb-1">{stat.title}</h3>
                <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
              </div>
            )
          })}
        </div>

        {/* 빠른 액션 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">빠른 액션</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/reports"
              className="p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition flex items-center gap-3"
            >
              <Flag className="text-red-600" size={24} />
              <div>
                <p className="font-semibold text-gray-900">신고 관리</p>
                <p className="text-sm text-gray-600">{stats.pendingReports}건 대기중</p>
              </div>
            </a>
            <a
              href="/admin/posts"
              className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition flex items-center gap-3"
            >
              <FileText className="text-blue-600" size={24} />
              <div>
                <p className="font-semibold text-gray-900">게시글 관리</p>
                <p className="text-sm text-gray-600">전체 {stats.totalPosts}개</p>
              </div>
            </a>
            <a
              href="/admin/users"
              className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition flex items-center gap-3"
            >
              <Users className="text-purple-600" size={24} />
              <div>
                <p className="font-semibold text-gray-900">사용자 관리</p>
                <p className="text-sm text-gray-600">전체 {stats.totalUsers}명</p>
              </div>
            </a>
          </div>
        </div>

        {/* 더미 글 생성 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="text-purple-600" size={24} />
            <span>더미 글 자동 생성</span>
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                게시판 선택
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-4 py-2 rounded-lg border-2 transition ${
                      selectedCategory === cat.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                생성할 글 개수 (1-10개)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={dummyCount}
                onChange={(e) => setDummyCount(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              onClick={handleGenerateDummyPosts}
              disabled={generating}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>더미 글 생성 중...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>더미 글 생성하기</span>
                </>
              )}
            </button>

            {generateResult && (
              <div className={`p-4 rounded-lg ${
                generateResult.includes('오류') 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                <p className="text-sm font-medium">{generateResult}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-semibold mb-2">💡 안내</p>
              <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                <li>선택한 게시판의 분위기에 맞는 글을 자동으로 생성합니다.</li>
                <li>각 글마다 3~6개의 자연스러운 댓글이 자동 생성됩니다.</li>
                <li>생성된 글은 실제 게시판에 등록됩니다.</li>
                <li>API 호출 제한을 고려하여 생성에 시간이 걸릴 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 최근 활동 (추후 구현) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">최근 활동</h2>
          <div className="text-center py-8 text-gray-500">
            <Activity size={48} className="mx-auto mb-2 opacity-50" />
            <p>최근 활동 내역이 없습니다</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}


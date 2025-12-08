'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  Home,
  Sparkles,
  FileText,
  Vote,
  User,
  Menu,
  X,
  Search,
  Bell,
  Mail,
  Gamepad2,
  Wrench,
  MessageSquare,
  TrendingUp,
  Lightbulb,
  Trophy,
  HelpCircle,
  Settings,
  LogIn,
  LogOut,
} from 'lucide-react'
import Link from 'next/link'

interface MainLayoutProps {
  children: React.ReactNode
}

// 사이드바 카테고리 메뉴
const sidebarCategories = [
  {
    title: '홈',
    items: [
      { path: '/', label: '🏠 홈', icon: Home },
    ],
  },
  {
    title: '커뮤니티',
    items: [
      { path: '/', label: '🔥 베스트', icon: TrendingUp },
      { path: '/polls', label: '💬 커뮤니티', icon: MessageSquare, submenu: true },
    ],
  },
  {
    title: '게임 & 도구',
    items: [
      { path: '/games', label: '🎮 게임존', icon: Gamepad2 },
      { path: '/tools', label: '🛠️ 도구존', icon: Wrench },
    ],
  },
  {
    title: '마이',
    items: [
      { path: '/mypage', label: '👤 마이페이지', icon: User },
    ],
  },
]

// 커뮤니티 서브메뉴 (커뮤니티 페이지에서만 표시)
const communitySubmenu = [
  { path: '/polls', label: '전체', icon: null },
  { path: '/polls', label: '🗣️ 대나무숲', icon: null },
  { path: '/polls', label: '❓ 빌런박제소', icon: null },
  { path: '/polls', label: '유머 & 이슈', icon: null },
  { path: '/polls', label: '비틱방(자랑질)', icon: null },
  { path: '/polls', label: '💭 결정장애', icon: null },
]

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [communitySubmenuOpen, setCommunitySubmenuOpen] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [loading, setLoading] = useState(true)

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

  // 안읽은 쪽지 개수 불러오기 (실제 구현은 페이지에서 처리)
  useEffect(() => {
    // 쪽지 개수는 각 페이지에서 props로 전달받거나 전역 상태로 관리
    setUnreadMessageCount(0)
  }, [])

  // 경로에 따라 서브메뉴 자동 열기
  useEffect(() => {
    if (pathname?.startsWith('/polls')) {
      setCommunitySubmenuOpen(true)
    } else {
      setCommunitySubmenuOpen(false)
    }
  }, [pathname])

  // 데스크톱에서 사이드바 항상 열기 (lg 이상)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogin = async () => {
    // 로그인 페이지로 이동
    router.push('/login')
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname?.startsWith(path)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2B4E] mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 왼쪽 사이드바 */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1A2B4E] text-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* 로고 */}
          <div className="p-4 lg:p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFBF00] to-[#FF9500] flex items-center justify-center text-[#1A2B4E] font-bold text-lg shadow-lg">
                  널
                </div>
                <div>
                  <h1 className="text-lg font-bold">널자</h1>
                  <p className="text-xs text-white/70">널리 자영업자를 이롭게</p>
                </div>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-white/80 leading-relaxed">
                7년 치킨집 사장이 만든<br />
                AI 도구 모음집
              </p>
            </div>
          </div>

          {/* 메뉴 */}
          <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <div className="space-y-6">
              {sidebarCategories.map((category, idx) => (
                <div key={idx}>
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 px-2">
                    {category.title}
                  </h3>
                  <div className="space-y-1">
                    {category.items.map((item) => {
                      const Icon = item.icon
                      const active = isActive(item.path)
                      const hasSubmenu = item.submenu && pathname?.startsWith('/polls')

                      return (
                        <div key={item.path}>
                          <Link
                            href={item.path}
                            onClick={() => {
                              if (item.submenu) {
                                setCommunitySubmenuOpen(!communitySubmenuOpen)
                              } else {
                                setSidebarOpen(false)
                              }
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                              active
                                ? 'bg-[#FFBF00] text-[#1A2B4E] font-semibold'
                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {Icon && <Icon size={18} />}
                            <span className="text-sm">{item.label}</span>
                          </Link>
                          {hasSubmenu && communitySubmenuOpen && (
                            <div className="ml-4 mt-1 space-y-1 pl-4 border-l-2 border-white/20">
                              {communitySubmenu.map((subItem, subIdx) => {
                                const categoryMap: Record<string, string> = {
                                  '전체': '전체',
                                  '🗣️ 대나무숲': '대나무숲',
                                  '❓ 빌런박제소': '빌런박제소',
                                  '유머 & 이슈': '유머 & 이슈',
                                  '비틱방(자랑질)': '비틱방(자랑질)',
                                  '💭 결정장애': '결정장애',
                                }
                                const category = categoryMap[subItem.label] || '전체'
                                const subPath = category === '전체' ? '/polls' : `/polls?category=${encodeURIComponent(category)}`
                                
                                return (
                                  <Link
                                    key={subIdx}
                                    href={subPath}
                                    onClick={() => setSidebarOpen(false)}
                                    className="block px-3 py-1.5 rounded-lg text-sm transition text-white/60 hover:bg-white/5 hover:text-white/80"
                                  >
                                    {subItem.label}
                                  </Link>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* 하단: 사용자 정보 */}
          <div className="p-4 border-t border-white/10">
            {user ? (
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.displayName || '사용자'}</p>
                  <p className="text-xs text-white/60 truncate">{user.email}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="w-full flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-sm font-medium"
              >
                <LogIn size={18} />
                <span>로그인</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 상단 헤더 */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="px-4 lg:px-6 py-3 flex items-center justify-between">
            {/* 햄버거 메뉴 + 검색 */}
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="검색..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2B4E] focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* 우측 아이콘들 */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Link
                    href="/messages"
                    className="p-2 hover:bg-gray-100 rounded-lg transition relative"
                    title="쪽지"
                  >
                    <Mail size={20} />
                    {unreadMessageCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/mypage"
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    title="마이페이지"
                  >
                    <User size={20} />
                  </Link>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 bg-[#1A2B4E] text-white rounded-lg text-sm font-medium hover:bg-[#1A2B4E]/90 transition"
                >
                  로그인
                </button>
              )}
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}


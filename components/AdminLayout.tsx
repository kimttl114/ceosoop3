'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { checkAdminStatus, AdminUser } from '@/lib/admin'
import { 
  LayoutDashboard, 
  Flag, 
  FileText, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react'
import Link from 'next/link'

interface AdminLayoutProps {
  children: React.ReactNode
}

const menuItems = [
  { path: '/admin', label: '대시보드', icon: LayoutDashboard },
  { path: '/admin/reports', label: '신고 관리', icon: Flag },
  { path: '/admin/posts', label: '게시글 관리', icon: FileText },
  { path: '/admin/comments', label: '댓글 관리', icon: MessageSquare },
  { path: '/admin/users', label: '사용자 관리', icon: Users },
  { path: '/admin/settings', label: '설정', icon: Settings },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        
        // 관리자 권한 확인
        const adminStatus = await checkAdminStatus(currentUser.uid)
        if (!adminStatus || !adminStatus.isAdmin) {
          alert('관리자 권한이 없습니다.')
          router.push('/')
          return
        }
        setAdmin(adminStatus)
      } else {
        router.push('/')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    if (!confirm('로그아웃하시겠습니까?')) return

    if (!auth) {
      console.error('Auth가 초기화되지 않았습니다.')
      return
    }

    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2B4E] mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user || !admin || !admin.isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex">
      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1A2B4E] text-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* 로고 */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Shield className="text-[#FFBF00]" size={28} />
              <div>
                <h1 className="text-xl font-bold">관리자</h1>
                <p className="text-xs text-white/70">자영업자 대나무숲</p>
              </div>
            </div>
          </div>

          {/* 메뉴 */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.path || 
                (item.path !== '/admin' && pathname?.startsWith(item.path))

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-[#FFBF00] text-[#1A2B4E] font-semibold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* 사용자 정보 */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#FFBF00] flex items-center justify-center">
                <span className="text-[#1A2B4E] font-bold">
                  {user.displayName?.[0] || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName || '관리자'}</p>
                <p className="text-xs text-white/60 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 transition"
            >
              <LogOut size={18} />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 lg:px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {admin.adminLevel === 'super' ? '슈퍼 관리자' : '일반 관리자'}
              </span>
            </div>
          </div>
        </header>

        {/* 컨텐츠 */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}


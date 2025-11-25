'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, User, Plus, Sparkles, FileText } from 'lucide-react'

interface BottomNavProps {
  onWriteClick?: () => void
}

export default function BottomNav({ onWriteClick }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { path: '/', label: '홈', icon: Home, isExternal: false },
    { path: '/ai-document', label: 'AI서류', icon: FileText, isExternal: false },
    { path: 'https://all-fo.vercel.app/', label: '운세', icon: Sparkles, isExternal: true },
    { path: '/mypage', label: '마이', icon: User, isExternal: false },
  ]

  const handleNavClick = (path: string, isExternal: boolean) => {
    if (isExternal) {
      window.open(path, '_blank', 'noopener,noreferrer')
    } else {
      router.push(path)
    }
  }

  const handleWriteClick = () => {
    if (onWriteClick) {
      onWriteClick()
    } else {
      // 기본 동작: 홈으로 이동 후 글쓰기 모달 열기
      if (pathname !== '/') {
        router.push('/')
        setTimeout(() => {
          // 이벤트를 통해 글쓰기 모달 열기
          window.dispatchEvent(new CustomEvent('openWriteModal'))
        }, 100)
      } else {
        window.dispatchEvent(new CustomEvent('openWriteModal'))
      }
    }
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="max-w-md mx-auto relative">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = !item.isExternal && (
                pathname === item.path || 
                (item.path === '/' && pathname === '/') ||
                (item.path !== '/' && pathname?.startsWith(item.path))
              )

              return (
                <div key={item.path} className="flex items-center">
                  {index === 2 && (
                    // 중앙 글쓰기 버튼 공간 (플레이스홀더)
                    <div className="w-16 h-16 flex-shrink-0" />
                  )}
                  <button
                    onClick={() => handleNavClick(item.path, item.isExternal || false)}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-4 min-w-[60px] transition-colors ${
                      isActive
                        ? 'text-[#1A2B4E]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    type="button"
                  >
                    <Icon
                      size={24}
                      className={isActive ? 'text-[#1A2B4E]' : 'text-gray-500'}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className={`text-xs font-medium ${isActive ? 'text-[#1A2B4E]' : 'text-gray-500'}`}>
                      {item.label}
                    </span>
                    {isActive && !item.isExternal && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#1A2B4E] rounded-t-full" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </nav>

      {/* 중앙 글쓰기 버튼 (네비게이션 바 위에 별도 배치) */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[60] max-w-md w-full flex justify-center pointer-events-none">
        <button
          onClick={handleWriteClick}
          className="w-16 h-16 bg-[#1A2B4E] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#1A2B4E]/90 transition transform hover:scale-110 active:scale-95 pointer-events-auto"
          type="button"
          title="글쓰기"
        >
          <Plus size={28} strokeWidth={3} />
        </button>
      </div>
    </>
  )
}


'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { ArrowLeft, Loader2, Megaphone, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

function NoticesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null)

  // 공지사항 불러오기
  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }

    const noticesRef = collection(db, 'notices')
    const q = query(noticesRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const noticesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        
        // 공지사항 필터링 (삭제되지 않은 것만)
        const activeNotices = noticesList.filter((notice: any) => !notice.deleted && notice.visible !== false)
        
        setNotices(activeNotices)
        setLoading(false)
      },
      (error: any) => {
        console.error('공지사항 불러오기 오류:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // URL 파라미터로 선택된 공지사항 확인
  useEffect(() => {
    const noticeId = searchParams.get('id')
    if (noticeId && notices.length > 0) {
      const notice = notices.find((n) => n.id === noticeId)
      if (notice) {
        setSelectedNotice(notice)
      }
    } else {
      setSelectedNotice(null)
    }
  }, [searchParams, notices])

  // 상대적 시간 포맷팅
  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return ''
    const now = new Date()
    const noticeTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const diff = now.getTime() - noticeTime.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    return noticeTime.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // 날짜 포맷팅
  const formatDate = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#1A2B4E] mx-auto mb-4" size={48} />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <ArrowLeft size={20} className="text-gray-700" />
              </button>
              <div className="flex items-center gap-2">
                <Megaphone size={24} className="text-[#1A2B4E]" />
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">공지사항</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {selectedNotice ? (
          // 공지사항 상세 보기
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#1A2B4E] to-[#2C3E50] text-white p-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={20} />
                <span className="text-sm font-semibold">공지</span>
                {selectedNotice.isImportant && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                    중요
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-2">{selectedNotice.title}</h2>
              <p className="text-sm text-white/80">{formatDate(selectedNotice.createdAt)}</p>
            </div>
            
            <div className="p-6">
              <div 
                className="prose max-w-none text-gray-700 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: selectedNotice.content.replace(/\n/g, '<br />') }}
              />
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-4 py-2 bg-[#1A2B4E] text-white rounded-lg font-medium hover:bg-[#1A2B4E]/90 transition"
              >
                목록으로
              </button>
            </div>
          </div>
        ) : (
          // 공지사항 목록
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* 테이블 헤더 (데스크톱) */}
            <div className="hidden md:grid grid-cols-12 gap-2 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600">
              <div className="col-span-1 text-center">번호</div>
              <div className="col-span-7">제목</div>
              <div className="col-span-2 text-center">작성일</div>
              <div className="col-span-2 text-center">작성자</div>
            </div>

            {notices.length === 0 ? (
              <div className="p-12 text-center">
                <Megaphone size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">등록된 공지사항이 없습니다.</p>
              </div>
            ) : (
              <>
                {notices.map((notice, index) => (
                  <Link
                    key={notice.id}
                    href={`/notices?id=${notice.id}`}
                    className="block border-b border-gray-200 hover:bg-gray-50 transition-colors last:border-b-0"
                  >
                    {/* 모바일 레이아웃 */}
                    <div className="md:hidden px-4 py-4">
                      <div className="flex items-start gap-2 mb-2">
                        {notice.isImportant && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full flex-shrink-0">
                            중요
                          </span>
                        )}
                        <span className="text-xs text-blue-600 font-bold flex-shrink-0">공지</span>
                        <h3 className="font-bold text-gray-900 line-clamp-2 flex-1">
                          {notice.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                        <span>{formatRelativeTime(notice.createdAt)}</span>
                        {notice.authorName && (
                          <>
                            <span>•</span>
                            <span>{notice.authorName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 데스크톱 레이아웃 */}
                    <div className="hidden md:grid grid-cols-12 gap-2 px-6 py-4 items-center text-sm">
                      <div className="col-span-1 text-center text-gray-500 text-xs">
                        {notices.length - index}
                      </div>
                      
                      <div className="col-span-7 min-w-0">
                        <div className="flex items-center gap-2">
                          {notice.isImportant && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full flex-shrink-0">
                              중요
                            </span>
                          )}
                          <span className="text-xs text-blue-600 font-bold flex-shrink-0">공지</span>
                          <span className="font-medium text-gray-900 truncate">
                            {notice.title}
                          </span>
                        </div>
                      </div>
                      
                      <div className="col-span-2 text-center text-xs text-gray-500">
                        {formatRelativeTime(notice.createdAt)}
                      </div>
                      
                      <div className="col-span-2 text-center text-xs text-gray-600 truncate">
                        {notice.authorName || '관리자'}
                      </div>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        )}
      </main>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  )
}

export default function NoticesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#1A2B4E] mx-auto mb-4" size={48} />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <NoticesPageContent />
    </Suspense>
  )
}


'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AnnouncementError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('[AnnouncementPage] Error:', error)
  }, [error])

  return (
    <div className="min-h-screen pb-24 bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-red-600 mb-4">안내방송 생성기 오류</h2>
        <p className="text-gray-700 mb-2">
          {error.message || '페이지를 로드하는 중 오류가 발생했습니다.'}
        </p>
        {error.stack && (
          <details className="mb-4">
            <summary className="text-sm text-gray-500 cursor-pointer">자세한 에러 정보</summary>
            <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40">
              {error.stack}
            </pre>
          </details>
        )}
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            다시 시도
          </button>
          <button
            onClick={() => router.push('/tools')}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            도구 목록으로
          </button>
        </div>
      </div>
    </div>
  )
}


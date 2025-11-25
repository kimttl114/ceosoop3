'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, googleProvider, ensureFirebaseInitialized } from '@/lib/firebase'
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [firebaseReady, setFirebaseReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setChecking(false)
      return
    }
    
    // Firebase 초기화 시도
    const initFirebase = () => {
      const initialized = ensureFirebaseInitialized()
      
      if (initialized && auth && googleProvider) {
        setFirebaseReady(true)
        setChecking(false)
        
        // 인증 상태 확인
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            router.push('/')
          }
        })

        return () => unsubscribe()
      } else {
        // 재시도
        console.warn('Firebase 초기화 실패, 재시도 중...')
        setTimeout(() => {
          const retryInitialized = ensureFirebaseInitialized()
          if (retryInitialized && auth && googleProvider) {
            setFirebaseReady(true)
            setChecking(false)
          } else {
            setChecking(false)
            console.error('Firebase 초기화 실패:', {
              initialized: retryInitialized,
              hasAuth: !!auth,
              hasProvider: !!googleProvider,
              envVars: {
                apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
              }
            })
          }
        }, 500)
      }
    }

    const cleanup = initFirebase()
    return cleanup
  }, [router])

  const handleGoogleLogin = async () => {
    setLoading(true)
    
    try {
      // Firebase 초기화 강제 실행
      const initialized = ensureFirebaseInitialized()
      
      if (!initialized) {
        alert('Firebase 초기화에 실패했습니다. 환경 변수를 확인해주세요.')
        console.error('Firebase 초기화 실패')
        setLoading(false)
        return
      }

      // 실제 auth와 googleProvider 가져오기
      const currentAuth = auth
      const currentProvider = googleProvider

      if (!currentAuth || !currentProvider) {
        alert('Firebase 인증이 초기화되지 않았습니다. 페이지를 새로고침해주세요.')
        console.error('auth 또는 googleProvider가 null입니다', { currentAuth, currentProvider })
        setLoading(false)
        return
      }

      console.log('로그인 시도 중...', { auth: !!currentAuth, provider: !!currentProvider })
      
      // Google 로그인 팝업 열기
      await signInWithPopup(currentAuth, currentProvider)
      
      console.log('로그인 성공')
      router.push('/')
    } catch (error: any) {
      console.error('로그인 실패:', error)
      
      if (error.code === 'auth/popup-closed-by-user') {
        alert('로그인 창이 닫혔습니다. 다시 시도해주세요.')
      } else if (error.code === 'auth/popup-blocked') {
        alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.')
      } else if (error.code === 'auth/invalid-api-key') {
        alert('Firebase API 키가 잘못되었습니다. 환경 변수를 확인해주세요.')
      } else if (error.code === 'auth/unauthorized-domain') {
        alert('인증되지 않은 도메인입니다. Firebase 콘솔에서 도메인을 추가해주세요.')
      } else {
        alert('로그인에 실패했습니다: ' + (error.message || error.code || '알 수 없는 오류'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00C73C] to-[#00A84D] flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00C73C] to-[#00A84D] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">자영업자 대나무숲</h1>
          <p className="text-gray-600">자영업자 전용 익명 커뮤니티</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-[#00C73C] hover:bg-[#00A84D] text-white font-bold py-4 px-6 rounded-xl transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>로그인 중...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Google로 로그인</span>
            </>
          )}
        </button>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>로그인하면 게시글을 작성할 수 있습니다</p>
        </div>
      </div>
    </div>
  )
}

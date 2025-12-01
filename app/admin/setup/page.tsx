'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, setDoc, getDoc, collection, query, getDocs, where } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { Crown, Copy, Check, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminSetupPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [settingUp, setSettingUp] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      
      if (currentUser) {
        // 관리자 존재 여부 확인
        try {
          const usersQuery = query(collection(db, 'users'), where('isAdmin', '==', true))
          const snapshot = await getDocs(usersQuery)
          setHasAdmin(snapshot.size > 0)
        } catch (error) {
          console.error('관리자 확인 오류:', error)
          setHasAdmin(false)
        }
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const setupScript = `
(async function() {
  try {
    const { db, auth } = await import('/lib/firebase.js');
    const { doc, setDoc, getDoc } = await import('firebase/firestore');
    const user = auth.currentUser;
    
    if (!user) {
      alert('❌ 로그인이 필요합니다. 먼저 로그인해주세요.');
      return;
    }
    
    console.log('✅ 현재 사용자:', user.email);
    
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log('⚠️ 사용자 문서가 없습니다. 생성 중...');
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || '관리자',
        createdAt: new Date(),
      });
    }
    
    await setDoc(userRef, {
      isAdmin: true,
      adminLevel: 'super',
      adminSince: new Date(),
      permissions: {
        canDeletePosts: true,
        canBanUsers: true,
        canManageSettings: true,
        canManageReports: true,
        canManageComments: true,
      },
    }, { merge: true });
    
    alert('✅ 슈퍼 관리자 권한이 부여되었습니다!\\n페이지를 새로고침합니다.');
    window.location.href = '/admin';
  } catch (error) {
    console.error('❌ 오류:', error);
    alert('오류 발생: ' + error.message);
  }
})();
  `.trim()

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(setupScript)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // 복사 실패 시 텍스트 영역으로 대체
      const textarea = document.createElement('textarea')
      textarea.value = setupScript
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAutoSetup = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }

    if (!db) {
      alert('Firebase가 초기화되지 않았습니다.')
      return
    }

    setSettingUp(true)

    try {
      const { doc, setDoc, getDoc } = await import('firebase/firestore')
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || '관리자',
          createdAt: new Date(),
        })
      }

      await setDoc(
        userRef,
        {
          isAdmin: true,
          adminLevel: 'super',
          adminSince: new Date(),
          permissions: {
            canDeletePosts: true,
            canBanUsers: true,
            canManageSettings: true,
            canManageReports: true,
            canManageComments: true,
          },
        },
        { merge: true }
      )

      alert('✅ 슈퍼 관리자 권한이 부여되었습니다!')
      router.push('/admin')
    } catch (error: any) {
      console.error('설정 오류:', error)
      alert('오류 발생: ' + (error.message || '알 수 없는 오류'))
    } finally {
      setSettingUp(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2B4E] mx-auto mb-4"></div>
          <p className="text-gray-600">확인 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="text-yellow-500 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h1>
          <p className="text-gray-600 mb-6">관리자 설정을 위해 먼저 로그인해주세요.</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full px-6 py-3 bg-[#1A2B4E] text-white rounded-lg font-semibold hover:bg-[#1A2B4E]/90 transition"
          >
            로그인하기
          </button>
        </div>
      </div>
    )
  }

  if (hasAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Crown className="text-yellow-500 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">이미 관리자가 있습니다</h1>
          <p className="text-gray-600 mb-6">시스템에 관리자가 이미 존재합니다.</p>
          <button
            onClick={() => router.push('/admin')}
            className="w-full px-6 py-3 bg-[#1A2B4E] text-white rounded-lg font-semibold hover:bg-[#1A2B4E]/90 transition"
          >
            관리자 페이지로 이동
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
            <Crown className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">초기 슈퍼 관리자 설정</h1>
          <p className="text-lg text-gray-600">시스템에 관리자가 없습니다. 슈퍼 관리자 권한을 설정해주세요.</p>
        </div>

        {/* 현재 사용자 정보 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">현재 로그인한 사용자</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#1A2B4E] flex items-center justify-center text-white font-bold text-lg">
              {(user.displayName || user.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900">{user.displayName || '이름 없음'}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* 방법 1: 자동 설정 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <span>자동 설정 (가장 쉬운 방법)</span>
              </h2>
              <p className="text-gray-600">버튼 클릭 한 번으로 슈퍼 관리자 권한을 부여합니다.</p>
            </div>
          </div>
          <button
            onClick={handleAutoSetup}
            disabled={settingUp}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {settingUp ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>설정 중...</span>
              </>
            ) : (
              <>
                <Crown size={20} />
                <span>슈퍼 관리자 권한 부여하기</span>
              </>
            )}
          </button>
        </div>

        {/* 방법 2: 수동 설정 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <span>수동 설정 (브라우저 콘솔 사용)</span>
              </h2>
              <p className="text-gray-600">브라우저 개발자 도구를 사용하여 설정합니다.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">단계별 가이드</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>아래 "스크립트 복사" 버튼 클릭</li>
                <li>브라우저 개발자 도구 열기 (F12 키 또는 우클릭 → 검사)</li>
                <li>콘솔(Console) 탭 선택</li>
                <li>복사한 스크립트 붙여넣기 (Ctrl+V)</li>
                <li>Enter 키 누르기</li>
                <li>완료 메시지 확인 후 페이지 새로고침</li>
              </ol>
            </div>

            <button
              onClick={handleCopyScript}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check size={20} />
                  <span>복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy size={20} />
                  <span>스크립트 복사</span>
                </>
              )}
            </button>

            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-green-400 font-mono">
                <code>{setupScript}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* 방법 3: Firebase Console */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <span>Firebase Console에서 설정</span>
              </h2>
              <p className="text-gray-600">Firebase 웹 콘솔에서 직접 데이터를 수정합니다.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">단계별 가이드</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Firebase Console
                  </a>
                  {' '}접속
                </li>
                <li>프로젝트 선택</li>
                <li>Firestore Database → 데이터 탭</li>
                <li>users 컬렉션에서 본인의 사용자 ID 찾기</li>
                <li>문서 클릭하여 편집</li>
                <li>다음 필드 추가:</li>
              </ol>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <pre className="text-xs text-gray-800 overflow-x-auto">
                <code>{JSON.stringify(
                  {
                    isAdmin: true,
                    adminLevel: 'super',
                    adminSince: new Date().toISOString(),
                    permissions: {
                      canDeletePosts: true,
                      canBanUsers: true,
                      canManageSettings: true,
                      canManageReports: true,
                      canManageComments: true,
                    },
                  },
                  null,
                  2
                )}</code>
              </pre>
            </div>

            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition flex items-center justify-center gap-2"
            >
              <span>Firebase Console 열기</span>
              <ArrowRight size={20} />
            </a>
          </div>
        </div>

        {/* 안내 */}
        <div className="mt-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">주의사항</h3>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>슈퍼 관리자는 모든 권한을 가지며, 다른 사용자에게도 관리자 권한을 부여할 수 있습니다.</li>
                <li>초기 설정은 최초 1회만 필요합니다.</li>
                <li>설정 완료 후에는 관리자 페이지에서 다른 사용자에게 권한을 부여할 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import { collection, query, getDocs, doc, updateDoc, orderBy, Timestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import AdminLayout from '@/components/AdminLayout'
import { checkAdminStatus, AdminUser } from '@/lib/admin'
import { Users, Shield, ShieldCheck, ShieldOff, Search, Loader2, Crown } from 'lucide-react'

interface User {
  id: string
  email?: string
  displayName?: string
  anonymousName?: string
  isAdmin?: boolean
  adminLevel?: 'super' | 'moderator'
  createdAt?: any
  adminSince?: any
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const adminStatus = await checkAdminStatus(currentUser.uid)
        setCurrentAdmin(adminStatus)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
        const snapshot = await getDocs(usersQuery)
        const usersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[]

        setUsers(usersList)
      } catch (error) {
        console.error('사용자 목록 불러오기 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleToggleAdmin = async (userId: string, isAdmin: boolean, adminLevel: 'super' | 'moderator' = 'moderator') => {
    if (!currentAdmin || !currentAdmin.isAdmin) {
      alert('관리자 권한이 없습니다.')
      return
    }

    // 슈퍼 관리자만 다른 사용자를 관리자로 만들 수 있음
    if (currentAdmin.adminLevel !== 'super') {
      alert('슈퍼 관리자만 다른 사용자에게 관리자 권한을 부여할 수 있습니다.')
      return
    }

    if (!confirm(isAdmin ? '관리자 권한을 해제하시겠습니까?' : `${adminLevel === 'super' ? '슈퍼' : '일반'} 관리자 권한을 부여하시겠습니까?`)) {
      return
    }

    setProcessing(userId)

    try {
      const userRef = doc(db, 'users', userId)
      
      if (isAdmin) {
        // 관리자 권한 해제
        await updateDoc(userRef, {
          isAdmin: false,
          adminLevel: null,
          adminSince: null,
        })
      } else {
        // 관리자 권한 부여
        await updateDoc(userRef, {
          isAdmin: true,
          adminLevel: adminLevel,
          adminSince: Timestamp.now(),
          permissions: {
            canDeletePosts: true,
            canBanUsers: adminLevel === 'super',
            canManageSettings: adminLevel === 'super',
            canManageReports: true,
            canManageComments: true,
          },
        })
      }

      // 목록 새로고침
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(usersQuery)
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[]
      setUsers(usersList)

      alert(isAdmin ? '관리자 권한이 해제되었습니다.' : '관리자 권한이 부여되었습니다.')
    } catch (error) {
      console.error('관리자 권한 변경 오류:', error)
      alert('권한 변경에 실패했습니다.')
    } finally {
      setProcessing(null)
    }
  }

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.displayName?.toLowerCase().includes(searchLower) ||
      user.anonymousName?.toLowerCase().includes(searchLower) ||
      user.id.toLowerCase().includes(searchLower)
    )
  })

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '-'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2B4E] mx-auto mb-4"></div>
            <p className="text-gray-600">사용자 목록을 불러오는 중...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const [hasAdmin, setHasAdmin] = useState(false)

  useEffect(() => {
    // 관리자 존재 여부 확인
    const checkAdminExists = async () => {
      try {
        const adminUsers = users.filter((u) => u.isAdmin)
        setHasAdmin(adminUsers.length > 0)
      } catch (error) {
        console.error('관리자 확인 오류:', error)
      }
    }
    checkAdminExists()
  }, [users])

  const handleQuickSetup = async () => {
    if (!auth || !auth.currentUser) {
      alert('로그인이 필요합니다.')
      return
    }

    const user = auth.currentUser
    const script = `
(async function() {
  try {
    const { db, auth } = await import('/lib/firebase.js');
    const { doc, setDoc, getDoc } = await import('firebase/firestore');
    const user = auth.currentUser;
    if (!user) { alert('로그인이 필요합니다.'); return; }
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
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
    window.location.reload();
  } catch (error) {
    console.error('오류:', error);
    alert('오류 발생: ' + error.message);
  }
})();
    `.trim()

    // 클립보드에 복사
    navigator.clipboard.writeText(script).then(() => {
      alert('✅ 스크립트가 클립보드에 복사되었습니다!\n\n브라우저 콘솔(F12)을 열고 붙여넣기(Ctrl+V) 후 Enter를 누르세요.')
    }).catch(() => {
      // 복사 실패 시 텍스트 영역으로 표시
      const textarea = document.createElement('textarea')
      textarea.value = script
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert('✅ 스크립트가 클립보드에 복사되었습니다!\n\n브라우저 콘솔(F12)을 열고 붙여넣기(Ctrl+V) 후 Enter를 누르세요.')
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">사용자 관리</h1>
          <p className="text-gray-600">사용자 목록을 확인하고 관리자 권한을 부여할 수 있습니다.</p>
        </div>

        {/* 초기 슈퍼 관리자 설정 가이드 */}
        {!hasAdmin && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Crown className="text-yellow-600" size={24} />
                  <span>초기 슈퍼 관리자 설정</span>
                </h2>
                <p className="text-gray-700 mb-4">
                  아직 관리자가 없습니다. 먼저 슈퍼 관리자 권한을 설정해야 합니다.
                </p>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">방법 1: 빠른 설정 (권장)</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 mb-3">
                      <li>아래 "설정 스크립트 복사" 버튼 클릭</li>
                      <li>브라우저 개발자 도구 열기 (F12 키)</li>
                      <li>콘솔 탭에서 붙여넣기 (Ctrl+V)</li>
                      <li>Enter 키 누르기</li>
                      <li>페이지 자동 새로고침 후 완료</li>
                    </ol>
                    <button
                      onClick={handleQuickSetup}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition"
                    >
                      📋 설정 스크립트 복사
                    </button>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">방법 2: Firebase Console에서 설정</h3>
                    <button
                      onClick={() => setShowSetupGuide(!showSetupGuide)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {showSetupGuide ? '접기' : '상세 가이드 보기'}
                    </button>
                    {showSetupGuide && (
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 mt-3">
                        <li>
                          <a
                            href="https://console.firebase.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Firebase Console
                          </a>
                          {' '}접속
                        </li>
                        <li>프로젝트 선택</li>
                        <li>Firestore Database → 데이터 탭</li>
                        <li>users 컬렉션에서 본인의 사용자 ID 찾기</li>
                        <li>문서 편집하여 다음 필드 추가:</li>
                        <li className="ml-4">
                          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mt-2">
{JSON.stringify({
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
}, null, 2)}
                          </pre>
                        </li>
                      </ol>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 검색 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="이메일, 이름, ID로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E]"
            />
          </div>
        </div>

        {/* 사용자 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    익명 닉네임
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리자 권한
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {searchQuery ? '검색 결과가 없습니다.' : '사용자가 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#1A2B4E] flex items-center justify-center text-white font-bold">
                            {(user.displayName || user.email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {user.displayName || user.email || '이름 없음'}
                            </p>
                            <p className="text-xs text-gray-500">{user.email || user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.anonymousName || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {user.isAdmin ? (
                          <div className="flex items-center gap-2">
                            {user.adminLevel === 'super' ? (
                              <>
                                <Crown className="text-yellow-500" size={16} />
                                <span className="text-sm font-medium text-yellow-600">슈퍼 관리자</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="text-blue-500" size={16} />
                                <span className="text-sm font-medium text-blue-600">일반 관리자</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">일반 사용자</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatTime(user.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        {currentAdmin?.adminLevel === 'super' && (
                          <div className="flex items-center gap-2">
                            {user.isAdmin ? (
                              <button
                                onClick={() => handleToggleAdmin(user.id, true)}
                                disabled={processing === user.id}
                                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                {processing === user.id ? (
                                  <>
                                    <Loader2 className="animate-spin" size={12} />
                                    <span>처리 중...</span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldOff size={12} />
                                    <span>권한 해제</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleToggleAdmin(user.id, false, 'moderator')}
                                  disabled={processing === user.id}
                                  className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                  {processing === user.id ? (
                                    <>
                                      <Loader2 className="animate-spin" size={12} />
                                      <span>처리 중...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Shield size={12} />
                                      <span>일반 관리자</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleToggleAdmin(user.id, false, 'super')}
                                  disabled={processing === user.id}
                                  className="px-3 py-1.5 text-xs font-medium text-yellow-600 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                  {processing === user.id ? (
                                    <>
                                      <Loader2 className="animate-spin" size={12} />
                                      <span>처리 중...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Crown size={12} />
                                      <span>슈퍼 관리자</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {currentAdmin?.adminLevel !== 'super' && user.isAdmin && (
                          <span className="text-xs text-gray-400">권한 없음</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">전체 사용자</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="text-blue-500" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">관리자</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u) => u.isAdmin).length}
                </p>
              </div>
              <ShieldCheck className="text-green-500" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">슈퍼 관리자</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u) => u.adminLevel === 'super').length}
                </p>
              </div>
              <Crown className="text-yellow-500" size={32} />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}


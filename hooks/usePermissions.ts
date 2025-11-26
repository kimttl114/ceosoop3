// 권한 체크 React Hook

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getUserPermissions, UserPermissions, Permission, hasPermission } from '@/lib/permissions'

export function usePermissions() {
  const [userPerms, setUserPerms] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserPerms(null)
        setLoading(false)
        return
      }

      try {
        const perms = await getUserPermissions(user.uid)
        setUserPerms(perms)
      } catch (error) {
        console.error('권한 로드 오류:', error)
        setUserPerms(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  /**
   * 특정 권한이 있는지 확인
   */
  const can = (permission: Permission): boolean => {
    return hasPermission(userPerms, permission)
  }

  /**
   * 여러 권한 중 하나라도 있으면 true
   */
  const canAny = (permissions: Permission[]): boolean => {
    return permissions.some(permission => can(permission))
  }

  /**
   * 모든 권한이 있어야 true
   */
  const canAll = (permissions: Permission[]): boolean => {
    return permissions.every(permission => can(permission))
  }

  /**
   * 관리자인지 확인
   */
  const isAdmin = userPerms?.role === 'moderator' || userPerms?.role === 'super_admin'

  /**
   * 인증된 사용자인지 확인
   */
  const isVerified = userPerms?.isVerified || false

  /**
   * 정지된 사용자인지 확인
   */
  const isBanned = userPerms?.isBanned || false

  return {
    userPerms,
    loading,
    can,
    canAny,
    canAll,
    isAdmin,
    isVerified,
    isBanned,
  }
}


// 권한 기반 접근 제어 컴포넌트

import { ReactNode } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/lib/permissions'

interface PermissionGuardProps {
  permission: Permission | Permission[]
  fallback?: ReactNode
  requireAll?: boolean // true면 모든 권한 필요, false면 하나만 있으면 됨
  children: ReactNode
}

/**
 * 권한이 있는 사용자에게만 컨텐츠 표시
 * 
 * @example
 * <PermissionGuard permission={Permission.POST_DELETE_ANY}>
 *   <button>삭제</button>
 * </PermissionGuard>
 * 
 * @example
 * <PermissionGuard 
 *   permission={[Permission.POST_DELETE_ANY, Permission.POST_HIDE]}
 *   requireAll={false}
 *   fallback={<p>권한이 없습니다</p>}
 * >
 *   <AdminPanel />
 * </PermissionGuard>
 */
export default function PermissionGuard({
  permission,
  fallback = null,
  requireAll = false,
  children,
}: PermissionGuardProps) {
  const { can, canAny, canAll, loading } = usePermissions()

  if (loading) {
    return null // 또는 로딩 스피너
  }

  const hasAccess = Array.isArray(permission)
    ? requireAll
      ? canAll(permission)
      : canAny(permission)
    : can(permission)

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}


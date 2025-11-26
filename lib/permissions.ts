// 권한 시스템 라이브러리

import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'

export enum UserRole {
  USER = 'user',
  VERIFIED = 'verified',
  MODERATOR = 'moderator',
  SUPER_ADMIN = 'super_admin'
}

export enum Permission {
  // 게시글 권한
  POST_CREATE = 'post:create',
  POST_EDIT = 'post:edit',
  POST_DELETE = 'post:delete',
  POST_DELETE_ANY = 'post:delete:any',
  POST_HIDE = 'post:hide',
  POST_UNLIMITED = 'post:unlimited', // 일일 제한 없음
  
  // 댓글 권한
  COMMENT_CREATE = 'comment:create',
  COMMENT_DELETE = 'comment:delete',
  COMMENT_DELETE_ANY = 'comment:delete:any',
  
  // 사용자 관리
  USER_BAN_TEMP = 'user:ban:temp',
  USER_BAN_PERM = 'user:ban:perm',
  USER_WARN = 'user:warn',
  USER_VIEW_DETAILS = 'user:view:details',
  
  // 신고 관리
  REPORT_VIEW = 'report:view',
  REPORT_HANDLE = 'report:handle',
  
  // 관리자 권한
  ADMIN_MANAGE = 'admin:manage',
  SETTINGS_MANAGE = 'settings:manage',
  
  // 프리미엄 기능
  PREMIUM_FEATURES = 'premium:access',
  NO_ADS = 'ads:disable',
  
  // 통계 및 분석
  ANALYTICS_VIEW = 'analytics:view',
}

// 역할별 기본 권한 매핑
export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.POST_CREATE,
    Permission.COMMENT_CREATE,
  ],
  [UserRole.VERIFIED]: [
    Permission.POST_CREATE,
    Permission.POST_EDIT,
    Permission.COMMENT_CREATE,
    Permission.PREMIUM_FEATURES,
    Permission.NO_ADS,
  ],
  [UserRole.MODERATOR]: [
    Permission.POST_CREATE,
    Permission.POST_EDIT,
    Permission.POST_DELETE_ANY,
    Permission.POST_HIDE,
    Permission.COMMENT_CREATE,
    Permission.COMMENT_DELETE_ANY,
    Permission.USER_BAN_TEMP,
    Permission.USER_WARN,
    Permission.REPORT_VIEW,
    Permission.REPORT_HANDLE,
    Permission.USER_VIEW_DETAILS,
  ],
  [UserRole.SUPER_ADMIN]: [
    // 모든 권한
    ...Object.values(Permission),
  ],
}

// 사용자 권한 정보 인터페이스
export interface UserPermissions {
  uid: string
  role: UserRole
  isVerified: boolean
  isBanned: boolean
  banUntil?: Date
  warnings: number
  permissions: Permission[]
  customPermissions?: Permission[]
  reputation?: number
}

/**
 * 역할에 따른 권한 목록 가져오기
 */
export function getPermissionsForRole(
  role: UserRole | string,
  customPermissions?: Permission[]
): Permission[] {
  const roleKey = role as UserRole
  const basePermissions = rolePermissions[roleKey] || rolePermissions[UserRole.USER]
  
  // 커스텀 권한 추가
  if (customPermissions && customPermissions.length > 0) {
    return Array.from(new Set([...basePermissions, ...customPermissions]))
  }
  
  return basePermissions
}

/**
 * 사용자가 특정 권한을 가지고 있는지 확인
 */
export function hasPermission(
  userPerms: UserPermissions | null,
  permission: Permission
): boolean {
  if (!userPerms) return false
  
  // 정지된 사용자는 모든 권한 차단
  if (userPerms.isBanned) {
    if (userPerms.banUntil && userPerms.banUntil > new Date()) {
      return false // 일시 정지 중
    }
    // 정지 기간이 지났으면 정지 해제 처리 필요
  }
  
  return userPerms.permissions.includes(permission)
}

/**
 * 사용자 권한 정보 가져오기
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions | null> {
  if (!db || !userId) return null

  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return null
    }

    const data = userSnap.data()
    
    // 역할 결정
    let role: UserRole = UserRole.USER
    
    if (data.isAdmin) {
      role = data.adminLevel === 'super' ? UserRole.SUPER_ADMIN : UserRole.MODERATOR
    } else if (data.isVerified) {
      role = UserRole.VERIFIED
    } else {
      role = UserRole.USER
    }

    const permissions = getPermissionsForRole(role, data.customPermissions)

    return {
      uid: userId,
      role,
      isVerified: data.isVerified || false,
      isBanned: data.isBanned || false,
      banUntil: data.banUntil?.toDate(),
      warnings: data.warnings || 0,
      permissions,
      customPermissions: data.customPermissions,
      reputation: data.reputation || 0,
    }
  } catch (error) {
    console.error('권한 정보 가져오기 오류:', error)
    return null
  }
}

/**
 * 역할 이름 가져오기 (한글)
 */
export function getRoleName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    [UserRole.USER]: '일반 사용자',
    [UserRole.VERIFIED]: '인증된 자영업자',
    [UserRole.MODERATOR]: '모더레이터',
    [UserRole.SUPER_ADMIN]: '슈퍼 관리자',
  }
  return roleNames[role] || '알 수 없음'
}

/**
 * 일일 게시글 제한 확인
 */
export function getDailyPostLimit(userPerms: UserPermissions | null): number {
  if (!userPerms) return 3 // 기본값
  
  if (hasPermission(userPerms, Permission.POST_UNLIMITED)) {
    return Infinity
  }
  
  if (hasPermission(userPerms, Permission.PREMIUM_FEATURES)) {
    return 10 // 인증된 사용자
  }
  
  return 3 // 일반 사용자
}

/**
 * 사용자가 관리자인지 확인
 */
export function isAdmin(userPerms: UserPermissions | null): boolean {
  if (!userPerms) return false
  return userPerms.role === UserRole.MODERATOR || userPerms.role === UserRole.SUPER_ADMIN
}

/**
 * 사용자가 슈퍼 관리자인지 확인
 */
export function isSuperAdmin(userPerms: UserPermissions | null): boolean {
  if (!userPerms) return false
  return userPerms.role === UserRole.SUPER_ADMIN
}


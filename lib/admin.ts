// 관리자 권한 체크 유틸리티

import { auth, db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'

export interface AdminUser {
  isAdmin: boolean
  adminLevel?: 'super' | 'moderator'
  adminSince?: any
  permissions?: {
    canDeletePosts: boolean
    canBanUsers: boolean
    canManageSettings: boolean
    canManageReports: boolean
    canManageComments: boolean
  }
}

/**
 * 현재 사용자가 관리자인지 확인
 */
export async function checkAdminStatus(userId: string): Promise<AdminUser | null> {
  if (!db || !userId) return null

  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return null
    }

    const userData = userSnap.data()
    
    // 관리자 여부 확인
    if (userData.isAdmin === true) {
      return {
        isAdmin: true,
        adminLevel: userData.adminLevel || 'moderator',
        adminSince: userData.adminSince,
        permissions: userData.permissions || {
          canDeletePosts: true,
          canBanUsers: userData.adminLevel === 'super',
          canManageSettings: userData.adminLevel === 'super',
          canManageReports: true,
          canManageComments: true,
        },
      }
    }

    return { isAdmin: false }
  } catch (error) {
    console.error('관리자 권한 확인 오류:', error)
    return null
  }
}

/**
 * 관리자 권한이 필요한 작업인지 확인
 */
export function hasPermission(admin: AdminUser | null, permission: keyof AdminUser['permissions']): boolean {
  if (!admin || !admin.isAdmin) return false
  return admin.permissions?.[permission] ?? false
}

/**
 * 관리자 목록 가져오기 (관리자만 사용 가능)
 */
export async function getAdminList(): Promise<string[]> {
  if (!db) return []

  try {
    // 실제로는 Firestore 쿼리로 관리자 목록을 가져와야 하지만,
    // 여기서는 간단히 users 컬렉션에서 isAdmin이 true인 사용자들을 찾습니다
    // 실제 구현 시에는 Firestore 인덱스가 필요할 수 있습니다
    return []
  } catch (error) {
    console.error('관리자 목록 가져오기 오류:', error)
    return []
  }
}


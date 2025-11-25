// 인증 상태 확인 및 관리 유틸리티

import { auth, db } from './firebase'
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore'

export interface VerificationStatus {
  isVerified: boolean
  status: 'none' | 'pending' | 'approved' | 'rejected'
  verifiedAt?: any
  businessInfo?: {
    businessNumber: string // 마스킹된 번호
    representativeName: string
    openingDate: string
    businessName?: string
    businessType?: string
  }
  rejectionReason?: string
}

/**
 * 사용자의 인증 상태 확인
 */
export async function getVerificationStatus(userId: string): Promise<VerificationStatus | null> {
  if (!db || !userId) return null

  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return {
        isVerified: false,
        status: 'none',
      }
    }

    const userData = userSnap.data()
    const verification = userData.verification

    if (!verification) {
      return {
        isVerified: false,
        status: 'none',
      }
    }

    return {
      isVerified: verification.isVerified === true && verification.status === 'approved',
      status: verification.status || 'none',
      verifiedAt: verification.verifiedAt,
      businessInfo: verification.businessInfo,
      rejectionReason: verification.rejectionReason,
    }
  } catch (error) {
    console.error('인증 상태 확인 오류:', error)
    return null
  }
}

/**
 * 사업자등록번호 마스킹 처리
 */
export function maskBusinessNumber(businessNumber: string): string {
  if (!businessNumber || businessNumber.length !== 10) {
    return businessNumber
  }
  // 123-45-67890 형식으로 마스킹: 123-45-*****
  return `${businessNumber.substring(0, 3)}-${businessNumber.substring(3, 5)}-*****`
}

/**
 * 인증 정보를 Firebase에 저장
 */
export async function saveVerificationData(
  userId: string,
  verificationData: {
    businessNumber: string
    representativeName: string
    openingDate: string
    businessName?: string
    businessType?: string
  }
): Promise<{ success: boolean; error?: string }> {
  if (!db || !userId) {
    return { success: false, error: 'Firebase가 초기화되지 않았습니다.' }
  }

  try {
    const userRef = doc(db, 'users', userId)

    // 마스킹된 사업자등록번호
    const maskedBusinessNumber = maskBusinessNumber(verificationData.businessNumber)

    // businessInfo 객체 생성 (undefined 필드 제외)
    const businessInfo: any = {
      businessNumber: maskedBusinessNumber,
      representativeName: verificationData.representativeName,
      openingDate: verificationData.openingDate,
    }

    // 선택적 필드가 있을 때만 추가
    if (verificationData.businessName) {
      businessInfo.businessName = verificationData.businessName
    }
    if (verificationData.businessType) {
      businessInfo.businessType = verificationData.businessType
    }

    await setDoc(
      userRef,
      {
        verification: {
          isVerified: true,
          status: 'approved', // 자동 승인
          verifiedAt: Timestamp.now(),
          businessInfo: businessInfo,
        },
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    )

    return { success: true }
  } catch (error: any) {
    console.error('인증 정보 저장 오류:', error)
    return {
      success: false,
      error: error.message || '인증 정보 저장에 실패했습니다.',
    }
  }
}

/**
 * 현재 로그인한 사용자의 인증 상태 확인
 */
export async function getCurrentUserVerificationStatus(): Promise<VerificationStatus | null> {
  if (!auth?.currentUser) {
    return null
  }

  return await getVerificationStatus(auth.currentUser.uid)
}


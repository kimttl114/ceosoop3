// 사업자 인증 상태 확인 Hook

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export interface VerificationStatus {
  isVerified: boolean
  status: 'none' | 'pending' | 'approved' | 'rejected'
  verifiedAt?: any
  businessInfo?: {
    businessNumber: string
    representativeName: string
    openingDate: string
    businessName?: string
    businessType?: string
  }
  rejectionReason?: string
}

export function useVerification() {
  const [verification, setVerification] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      
      if (!currentUser) {
        setVerification(null)
        setLoading(false)
        return
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid)
        const userSnap = await getDoc(userRef)
        
        if (userSnap.exists()) {
          const userData = userSnap.data()
          const verificationData = userData.verification
          
          if (verificationData) {
            setVerification({
              isVerified: verificationData.isVerified || false,
              status: verificationData.status || 'none',
              verifiedAt: verificationData.verifiedAt,
              businessInfo: verificationData.businessInfo,
              rejectionReason: verificationData.rejectionReason,
            })
          } else {
            setVerification({
              isVerified: false,
              status: 'none',
            })
          }
        } else {
          setVerification({
            isVerified: false,
            status: 'none',
          })
        }
      } catch (error) {
        console.error('인증 상태 확인 오류:', error)
        setVerification({
          isVerified: false,
          status: 'none',
        })
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // 인증 완료 여부 (approved 상태이면서 isVerified가 true)
  const isVerified = verification?.status === 'approved' && verification?.isVerified === true

  return {
    user,
    verification,
    loading,
    isVerified,
  }
}


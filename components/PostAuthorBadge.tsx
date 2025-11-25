'use client'

import { useEffect, useState } from 'react'
import { getVerificationStatus, VerificationStatus } from '@/lib/verification'
import VerificationBadge from './VerificationBadge'

interface PostAuthorBadgeProps {
  authorId: string
  showBadge?: boolean
}

export default function PostAuthorBadge({ authorId, showBadge = true }: PostAuthorBadgeProps) {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authorId || !showBadge) {
      setLoading(false)
      return
    }

    const fetchVerification = async () => {
      try {
        const status = await getVerificationStatus(authorId)
        setVerificationStatus(status)
      } catch (error) {
        console.error('인증 상태 확인 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVerification()
  }, [authorId, showBadge])

  if (loading || !verificationStatus || verificationStatus.status === 'none') {
    return null
  }

  return <VerificationBadge status={verificationStatus.status} size="sm" showText={false} />
}


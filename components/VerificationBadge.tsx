'use client'

import { CheckCircle, Clock, XCircle } from 'lucide-react'

interface VerificationBadgeProps {
  status: 'none' | 'pending' | 'approved' | 'rejected'
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function VerificationBadge({
  status,
  size = 'md',
  showText = true,
}: VerificationBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  if (status === 'none') {
    return null
  }

  if (status === 'approved') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
        <CheckCircle className={sizeClasses[size]} />
        {showText && <span className={`font-medium ${textSizeClasses[size]}`}>인증된 사장님</span>}
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200">
        <Clock className={sizeClasses[size]} />
        {showText && <span className={`font-medium ${textSizeClasses[size]}`}>인증 대기중</span>}
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
        <XCircle className={sizeClasses[size]} />
        {showText && <span className={`font-medium ${textSizeClasses[size]}`}>인증 실패</span>}
      </div>
    )
  }

  return null
}


# 권한 시스템 사용 예시

## 📚 기본 사용법

### 1. usePermissions Hook 사용

```typescript
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/lib/permissions'

export default function MyComponent() {
  const { can, isVerified, isAdmin, userPerms } = usePermissions()

  return (
    <div>
      {can(Permission.POST_DELETE_ANY) && (
        <button>게시글 삭제</button>
      )}
      
      {isVerified && (
        <span className="badge">✅ 인증된 자영업자</span>
      )}
      
      {isAdmin && (
        <Link href="/admin">관리자 페이지</Link>
      )}
    </div>
  )
}
```

### 2. PermissionGuard 컴포넌트 사용

```typescript
import PermissionGuard from '@/components/PermissionGuard'
import { Permission } from '@/lib/permissions'

export default function PostActions({ postId }: { postId: string }) {
  return (
    <div>
      {/* 일반 사용자도 볼 수 있음 */}
      <button>좋아요</button>
      
      {/* 관리자만 볼 수 있음 */}
      <PermissionGuard permission={Permission.POST_DELETE_ANY}>
        <button onClick={() => deletePost(postId)}>삭제</button>
      </PermissionGuard>
      
      {/* 인증된 사용자만 볼 수 있음 */}
      <PermissionGuard 
        permission={Permission.PREMIUM_FEATURES}
        fallback={<p>인증이 필요합니다</p>}
      >
        <button>프리미엄 기능</button>
      </PermissionGuard>
    </div>
  )
}
```

## 🎯 실제 적용 예시

### 1. 게시글 작성 제한

```typescript
// components/WriteModal.tsx
import { usePermissions } from '@/hooks/usePermissions'
import { Permission, getDailyPostLimit } from '@/lib/permissions'
import { useState, useEffect } from 'react'

export default function WriteModal() {
  const { userPerms, can } = usePermissions()
  const [dailyPostCount, setDailyPostCount] = useState(0)
  
  useEffect(() => {
    // 오늘 작성한 게시글 수 확인
    if (userPerms) {
      checkDailyPostCount(userPerms.uid).then(setDailyPostCount)
    }
  }, [userPerms])
  
  const maxPosts = userPerms ? getDailyPostLimit(userPerms) : 3
  const canPost = dailyPostCount < maxPosts
  
  if (!canPost) {
    return (
      <div className="alert">
        오늘 게시글 작성 한도({maxPosts}개)를 초과했습니다.
        {can(Permission.PREMIUM_FEATURES) && (
          <p>인증된 사용자는 더 많은 게시글을 작성할 수 있습니다.</p>
        )}
      </div>
    )
  }
  
  // 게시글 작성 UI...
}
```

### 2. 인증 배지 표시

```typescript
// components/PostAuthorBadge.tsx
import { usePermissions } from '@/hooks/usePermissions'
import { getUserPermissions } from '@/lib/permissions'
import { useEffect, useState } from 'react'

export default function PostAuthorBadge({ userId }: { userId: string }) {
  const [authorPerms, setAuthorPerms] = useState(null)
  
  useEffect(() => {
    getUserPermissions(userId).then(setAuthorPerms)
  }, [userId])
  
  if (!authorPerms?.isVerified) return null
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      인증된 자영업자
    </span>
  )
}
```

### 3. 관리자 페이지 접근 제어

```typescript
// app/admin/page.tsx
'use client'

import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/lib/permissions'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminPage() {
  const { can, isAdmin, loading } = usePermissions()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && !isAdmin) {
      alert('관리자 권한이 필요합니다.')
      router.push('/')
    }
  }, [loading, isAdmin, router])
  
  if (loading) {
    return <div>로딩 중...</div>
  }
  
  if (!isAdmin) {
    return null
  }
  
  return (
    <div>
      <h1>관리자 대시보드</h1>
      {/* 관리자 컨텐츠 */}
    </div>
  )
}
```

### 4. 게시글 삭제 버튼 (권한별)

```typescript
// components/PostActions.tsx
import { usePermissions } from '@/hooks/usePermissions'
import PermissionGuard from '@/components/PermissionGuard'
import { Permission } from '@/lib/permissions'

export default function PostActions({ 
  post, 
  currentUserId 
}: { 
  post: any
  currentUserId: string 
}) {
  const { can } = usePermissions()
  const isOwner = post.uid === currentUserId
  
  return (
    <div className="flex gap-2">
      {/* 본인 게시글은 항상 삭제 가능 */}
      {isOwner && (
        <button onClick={() => deletePost(post.id)}>삭제</button>
      )}
      
      {/* 관리자는 모든 게시글 삭제 가능 */}
      <PermissionGuard permission={Permission.POST_DELETE_ANY}>
        <button onClick={() => deletePost(post.id)}>관리자 삭제</button>
      </PermissionGuard>
      
      {/* 관리자는 게시글 숨김 가능 */}
      <PermissionGuard permission={Permission.POST_HIDE}>
        <button onClick={() => hidePost(post.id)}>숨김</button>
      </PermissionGuard>
    </div>
  )
}
```

### 5. 프리미엄 기능 접근

```typescript
// components/PremiumFeature.tsx
import PermissionGuard from '@/components/PermissionGuard'
import { Permission } from '@/lib/permissions'

export default function PremiumFeature() {
  return (
    <PermissionGuard 
      permission={Permission.PREMIUM_FEATURES}
      fallback={
        <div className="premium-locked">
          <p>인증된 자영업자만 사용할 수 있는 기능입니다.</p>
          <Link href="/auth/verify">인증하기</Link>
        </div>
      }
    >
      <div className="premium-content">
        {/* 프리미엄 기능 컨텐츠 */}
      </div>
    </PermissionGuard>
  )
}
```

### 6. 광고 표시 제어

```typescript
// components/AdBanner.tsx
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/lib/permissions'

export default function AdBanner() {
  const { can } = usePermissions()
  
  // 광고 제거 권한이 있으면 광고 표시 안 함
  if (can(Permission.NO_ADS)) {
    return null
  }
  
  return (
    <div className="ad-banner">
      {/* 광고 컨텐츠 */}
    </div>
  )
}
```

### 7. 사용자 정지 확인

```typescript
// app/page.tsx 또는 레이아웃
import { usePermissions } from '@/hooks/usePermissions'
import { useEffect } from 'react'

export default function HomePage() {
  const { isBanned, userPerms } = usePermissions()
  
  useEffect(() => {
    if (isBanned && userPerms?.banUntil) {
      const banDate = new Date(userPerms.banUntil)
      const now = new Date()
      
      if (banDate > now) {
        const daysLeft = Math.ceil((banDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        alert(`정지된 계정입니다. ${daysLeft}일 후 해제됩니다.`)
      }
    }
  }, [isBanned, userPerms])
  
  if (isBanned) {
    return (
      <div className="banned-message">
        <h2>계정이 정지되었습니다</h2>
        {userPerms?.banUntil && (
          <p>해제일: {new Date(userPerms.banUntil).toLocaleDateString()}</p>
        )}
      </div>
    )
  }
  
  // 정상 컨텐츠
}
```

## 🔧 서버 사이드 권한 체크

### API Route에서 권한 확인

```typescript
// app/api/posts/delete/route.ts
import { getUserPermissions, hasPermission, Permission } from '@/lib/permissions'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { postId, userId } = await request.json()
  
  // 권한 확인
  const userPerms = await getUserPermissions(userId)
  
  if (!userPerms) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }
  
  // 게시글 소유자 확인 또는 관리자 권한 확인
  const post = await getPost(postId)
  const isOwner = post.uid === userId
  const canDeleteAny = hasPermission(userPerms, Permission.POST_DELETE_ANY)
  
  if (!isOwner && !canDeleteAny) {
    return NextResponse.json({ error: '삭제 권한 없음' }, { status: 403 })
  }
  
  // 삭제 로직...
}
```

## 📊 권한별 UI 차별화

```typescript
// components/UserMenu.tsx
import { usePermissions } from '@/hooks/usePermissions'
import { getRoleName } from '@/lib/permissions'

export default function UserMenu() {
  const { userPerms, isAdmin, isVerified } = usePermissions()
  
  return (
    <div className="user-menu">
      {userPerms && (
        <div className="user-info">
          <p>역할: {getRoleName(userPerms.role)}</p>
          {isVerified && <span className="badge">✅ 인증됨</span>}
          {isAdmin && <Link href="/admin">관리자</Link>}
        </div>
      )}
    </div>
  )
}
```

## 🎨 권한별 스타일링

```typescript
// CSS 클래스 예시
.verified-user {
  border-left: 3px solid #10b981; /* 초록색 */
}

.admin-user {
  border-left: 3px solid #f59e0b; /* 주황색 */
}

.banned-user {
  opacity: 0.5;
  pointer-events: none;
}
```


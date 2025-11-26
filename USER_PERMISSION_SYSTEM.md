# 유저 권한 시스템 설계안

## 📋 권한 레벨 구조

### 1. 사용자 역할 (User Roles)

```
일반 사용자 (Guest/User)
  ↓
인증된 자영업자 (Verified Business Owner)
  ↓
모더레이터 (Moderator)
  ↓
슈퍼 관리자 (Super Admin)
```

## 🎭 역할별 권한 상세

### 1️⃣ 일반 사용자 (User)
**기본 권한:**
- ✅ 게시글 조회
- ✅ 댓글 조회
- ✅ 게시글 작성 (제한적)
- ✅ 댓글 작성
- ✅ 좋아요/반응
- ✅ 쪽지 보내기/받기
- ❌ 인증 배지 없음
- ❌ 특정 카테고리 제한 가능

**제한 사항:**
- 일부 프리미엄 기능 제한
- 광고 표시
- 일일 게시글 작성 제한 (예: 3개)

### 2️⃣ 인증된 자영업자 (Verified Business Owner)
**추가 권한:**
- ✅ 인증 배지 표시
- ✅ 모든 카테고리 접근
- ✅ 일일 게시글 제한 증가 (예: 10개)
- ✅ 광고 제거
- ✅ 프리미엄 기능 사용
- ✅ 사업자 정보 표시 (선택적)
- ✅ 신뢰도 점수 시스템 참여

**인증 조건:**
- 사업자등록번호 검증 완료
- 사업자등록증 이미지 검증 완료
- 관리자 승인 (선택적)

### 3️⃣ 모더레이터 (Moderator)
**관리 권한:**
- ✅ 게시글 삭제/숨김
- ✅ 댓글 삭제/숨김
- ✅ 신고 처리
- ✅ 사용자 경고
- ✅ 일시 정지 (1-7일)
- ❌ 영구 정지 불가
- ❌ 관리자 권한 부여 불가
- ❌ 시스템 설정 변경 불가

**제한:**
- 자신의 조치 내역 기록
- 관리자 감독 하에 운영

### 4️⃣ 슈퍼 관리자 (Super Admin)
**모든 권한:**
- ✅ 모든 모더레이터 권한
- ✅ 사용자 영구 정지
- ✅ 관리자 권한 부여/해제
- ✅ 시스템 설정 변경
- ✅ 데이터베이스 직접 접근
- ✅ 통계 및 분석
- ✅ 백업 및 복구

## 🔐 권한 체크 시스템

### 권한 확인 함수 구조

```typescript
// lib/permissions.ts

export enum UserRole {
  USER = 'user',
  VERIFIED = 'verified',
  MODERATOR = 'moderator',
  SUPER_ADMIN = 'super_admin'
}

export enum Permission {
  // 게시글
  POST_CREATE = 'post:create',
  POST_EDIT = 'post:edit',
  POST_DELETE = 'post:delete',
  POST_DELETE_ANY = 'post:delete:any',
  POST_HIDE = 'post:hide',
  
  // 댓글
  COMMENT_CREATE = 'comment:create',
  COMMENT_DELETE = 'comment:delete',
  COMMENT_DELETE_ANY = 'comment:delete:any',
  
  // 사용자 관리
  USER_BAN_TEMP = 'user:ban:temp',
  USER_BAN_PERM = 'user:ban:perm',
  USER_WARN = 'user:warn',
  USER_VIEW_DETAILS = 'user:view:details',
  
  // 신고
  REPORT_VIEW = 'report:view',
  REPORT_HANDLE = 'report:handle',
  
  // 관리
  ADMIN_MANAGE = 'admin:manage',
  SETTINGS_MANAGE = 'settings:manage',
  
  // 프리미엄 기능
  PREMIUM_FEATURES = 'premium:access',
  NO_ADS = 'ads:disable'
}

// 역할별 권한 매핑
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
    Permission.POST_DELETE_ANY,
    Permission.POST_HIDE,
    Permission.COMMENT_DELETE_ANY,
    Permission.USER_BAN_TEMP,
    Permission.USER_WARN,
    Permission.REPORT_VIEW,
    Permission.REPORT_HANDLE,
  ],
  [UserRole.SUPER_ADMIN]: [
    // 모든 권한
    ...Object.values(Permission),
  ],
}

// 권한 확인 함수
export function hasPermission(
  userRole: UserRole,
  permission: Permission
): boolean {
  const permissions = rolePermissions[userRole] || []
  return permissions.includes(permission)
}

// 사용자 정보 타입
export interface UserPermissions {
  uid: string
  role: UserRole
  isVerified: boolean
  isBanned: boolean
  banUntil?: Date
  warnings: number
  permissions: Permission[]
  customPermissions?: Permission[] // 커스텀 권한 (관리자가 개별 부여)
}
```

## 📊 Firebase 데이터 구조

### users/{userId} 스키마

```typescript
{
  // 기본 정보
  uid: string
  email: string
  displayName: string
  anonymousName: string
  avatarUrl?: string
  createdAt: Timestamp
  
  // 권한 정보
  role: 'user' | 'verified' | 'moderator' | 'super_admin'
  isVerified: boolean
  verifiedAt?: Timestamp
  verificationData?: {
    businessNumber: string
    representativeName: string
    openingDate: string
    businessType?: string
  }
  
  // 관리자 정보
  isAdmin?: boolean
  adminLevel?: 'super' | 'moderator'
  adminSince?: Timestamp
  permissions?: {
    canDeletePosts: boolean
    canBanUsers: boolean
    canManageSettings: boolean
    canManageReports: boolean
    canManageComments: boolean
    // 확장 가능
    canManageUsers?: boolean
    canViewAnalytics?: boolean
  }
  
  // 제재 정보
  isBanned: boolean
  banReason?: string
  banUntil?: Timestamp
  warnings: number
  warningHistory?: Array<{
    reason: string
    issuedAt: Timestamp
    issuedBy: string
  }>
  
  // 활동 정보
  postCount: number
  commentCount: number
  likeCount: number
  reputation: number // 신뢰도 점수
  
  // 커스텀 권한 (개별 부여)
  customPermissions?: string[]
  
  // 메타데이터
  lastActiveAt: Timestamp
  region?: string
  businessType?: string
}
```

## 🛡️ 권한 체크 미들웨어/훅

### React Hook 예시

```typescript
// hooks/usePermissions.ts
import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { UserPermissions, Permission, hasPermission } from '@/lib/permissions'

export function usePermissions() {
  const [userPerms, setUserPerms] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth || !db) {
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
        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)
        
        if (userSnap.exists()) {
          const data = userSnap.data()
          const perms: UserPermissions = {
            uid: user.uid,
            role: data.role || 'user',
            isVerified: data.isVerified || false,
            isBanned: data.isBanned || false,
            banUntil: data.banUntil?.toDate(),
            warnings: data.warnings || 0,
            permissions: getPermissionsForRole(data.role, data.customPermissions),
            customPermissions: data.customPermissions,
          }
          setUserPerms(perms)
        }
      } catch (error) {
        console.error('권한 로드 오류:', error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const can = (permission: Permission): boolean => {
    if (!userPerms || userPerms.isBanned) return false
    return hasPermission(userPerms.role, permission) ||
           userPerms.customPermissions?.includes(permission) ||
           false
  }

  return { userPerms, loading, can }
}
```

## 🎯 기능별 권한 적용 예시

### 1. 게시글 작성 제한

```typescript
// components/WriteModal.tsx
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/lib/permissions'

export default function WriteModal() {
  const { can, userPerms } = usePermissions()
  
  const maxPostsPerDay = can(Permission.PREMIUM_FEATURES) ? 10 : 3
  
  // 일일 게시글 제한 체크
  const canPost = checkDailyPostLimit(userPerms?.uid, maxPostsPerDay)
  
  if (!canPost) {
    return <Alert>오늘 게시글 작성 한도를 초과했습니다.</Alert>
  }
  
  // ...
}
```

### 2. 인증 배지 표시

```typescript
// components/PostAuthorBadge.tsx
import { usePermissions } from '@/hooks/usePermissions'

export default function PostAuthorBadge({ userId }: { userId: string }) {
  const { userPerms } = usePermissions()
  
  if (userPerms?.isVerified) {
    return (
      <span className="badge verified">
        ✅ 인증된 자영업자
      </span>
    )
  }
  
  return null
}
```

### 3. 관리자 전용 기능

```typescript
// app/admin/posts/page.tsx
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/lib/permissions'

export default function PostsPage() {
  const { can, userPerms } = usePermissions()
  
  if (!can(Permission.POST_DELETE_ANY)) {
    return <div>권한이 없습니다.</div>
  }
  
  // 관리자 기능 표시
  return (
    <div>
      <button onClick={handleDelete}>삭제</button>
      {can(Permission.USER_BAN_PERM) && (
        <button onClick={handleBan}>영구 정지</button>
      )}
    </div>
  )
}
```

## 🔄 권한 업그레이드 프로세스

### 1. 일반 사용자 → 인증된 자영업자

```
사용자 인증 신청
  ↓
국세청 API 검증 (1차)
  ↓
GPT-4 Vision 이미지 검증 (2차)
  ↓
관리자 승인 (선택적, 자동 승인 가능)
  ↓
권한 업그레이드
  ↓
인증 배지 부여
```

### 2. 인증된 자영업자 → 모더레이터

```
관리자 추천 또는 신청
  ↓
활동 내역 검토
  ↓
슈퍼 관리자 승인
  ↓
모더레이터 권한 부여
  ↓
교육 및 가이드라인 제공
```

## 📈 신뢰도 점수 시스템 (Reputation)

```typescript
interface ReputationSystem {
  // 점수 획득
  postCreated: +1
  postLiked: +0.1 (받은 좋아요)
  commentHelpful: +0.5
  verifiedBusiness: +10 (인증 시)
  
  // 점수 감소
  postDeleted: -5
  commentDeleted: -2
  warningReceived: -10
  banReceived: -50
  
  // 레벨 시스템
  levels: {
    0-10: '새내기'
    11-50: '활동가'
    51-100: '베테랑'
    101-200: '전문가'
    201+: '마스터'
  }
  
  // 레벨별 혜택
  benefits: {
    '전문가': '광고 제거, 프리미엄 기능'
    '마스터': '모더레이터 추천 자격'
  }
}
```

## 🚫 제재 시스템

### 경고 (Warning)
- 1차: 경고만
- 2차: 1일 정지
- 3차: 3일 정지
- 4차: 7일 정지
- 5차: 30일 정지 또는 영구 정지 검토

### 정지 (Ban)
- **일시 정지**: 모더레이터 권한
  - 1일, 3일, 7일, 30일
- **영구 정지**: 슈퍼 관리자만 가능

### 정지 사유 카테고리
- 스팸/광고
- 욕설/혐오 표현
- 개인정보 노출
- 허위 정보
- 기타 규칙 위반

## 🔍 감사 로그 (Audit Log)

```typescript
interface AuditLog {
  id: string
  action: 'delete_post' | 'ban_user' | 'warn_user' | 'grant_permission'
  targetUserId: string
  targetPostId?: string
  performedBy: string
  performedAt: Timestamp
  reason?: string
  details: Record<string, any>
}
```

모든 관리자 행동을 기록하여 투명성 확보

## 💡 추가 아이디어

### 1. 역할 기반 UI 표시
- 인증된 사용자: 프리미엄 배너, 광고 없음
- 관리자: 관리자 메뉴, 통계 대시보드

### 2. 동적 권한
- 이벤트 기간 특별 권한
- 지역별 모더레이터
- 카테고리별 관리자

### 3. 권한 위임
- 슈퍼 관리자가 특정 권한만 위임
- 임시 관리자 (기간 제한)

### 4. 권한 요청 시스템
- 사용자가 특정 권한 요청
- 관리자 승인 프로세스

## 📝 구현 우선순위

### Phase 1 (필수)
1. ✅ 기본 역할 시스템 (user, verified, moderator, super_admin)
2. ✅ 권한 체크 함수
3. ✅ 인증 배지 표시
4. ✅ 관리자 권한 체크

### Phase 2 (중요)
5. ⏳ 일일 게시글 제한
6. ⏳ 제재 시스템 (경고, 정지)
7. ⏳ 권한 기반 UI 표시
8. ⏳ 감사 로그

### Phase 3 (선택)
9. ⏳ 신뢰도 점수 시스템
10. ⏳ 동적 권한
11. ⏳ 권한 요청 시스템


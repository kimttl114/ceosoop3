# 관리자 페이지 설정 가이드

## 1. 관리자 권한 부여 방법

Firebase Firestore에서 사용자에게 관리자 권한을 부여하려면:

### 방법 1: Firebase Console에서 직접 설정

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. **Firestore Database** → **데이터** 탭
4. `users` 컬렉션에서 관리자로 지정할 사용자 문서 찾기
5. 문서 편집:
   ```json
   {
     "isAdmin": true,
     "adminLevel": "super",  // 또는 "moderator"
     "adminSince": "2024-01-01T00:00:00Z",
     "permissions": {
       "canDeletePosts": true,
       "canBanUsers": true,
       "canManageSettings": true,
       "canManageReports": true,
       "canManageComments": true
     }
   }
   ```

### 방법 2: 코드로 설정 (일회성)

임시로 관리자 권한을 부여하려면 브라우저 콘솔에서 실행:

```javascript
// Firebase SDK가 로드된 상태에서 실행
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';

// 현재 로그인한 사용자를 관리자로 설정
const user = auth.currentUser;
if (user) {
  await setDoc(doc(db, 'users', user.uid), {
    isAdmin: true,
    adminLevel: 'super',
    adminSince: new Date().toISOString(),
    permissions: {
      canDeletePosts: true,
      canBanUsers: true,
      canManageSettings: true,
      canManageReports: true,
      canManageComments: true,
    }
  }, { merge: true });
  console.log('관리자 권한이 부여되었습니다!');
}
```

## 2. 관리자 레벨 설명

### Super Admin (슈퍼 관리자)
- 모든 권한 보유
- 사용자 정지/해제 가능
- 시스템 설정 변경 가능
- 모든 게시글/댓글 삭제 가능

### Moderator (일반 관리자)
- 게시글/댓글 관리 가능
- 신고 처리 가능
- 사용자 정지 불가
- 시스템 설정 변경 불가

## 3. 관리자 페이지 접근

1. 로그인 후 `/admin` 경로로 접근
2. 관리자 권한이 없으면 자동으로 메인 페이지로 리다이렉트
3. 관리자 권한이 있으면 대시보드 표시

## 4. 관리자 페이지 기능

### 대시보드 (`/admin`)
- 전체 통계 (게시글, 댓글, 사용자, 신고)
- 오늘의 통계
- 빠른 액션 링크

### 신고 관리 (`/admin/reports`)
- 신고 목록 조회
- 신고 상세 보기
- 신고 승인/기각 처리
- 필터링 (전체/대기중/처리완료/기각)

### 게시글 관리 (`/admin/posts`)
- 게시글 목록 조회
- 게시글 검색 (제목, 내용, 작성자)
- 게시글 숨김/복구
- 게시글 삭제
- 게시글 상세 보기

### 댓글 관리 (`/admin/comments`) - 추후 구현
- 댓글 목록 조회
- 댓글 검색
- 댓글 숨김/삭제

### 사용자 관리 (`/admin/users`) - 추후 구현
- 사용자 목록 조회
- 사용자 검색
- 사용자 정지/해제
- 사용자 상세 정보

### 설정 (`/admin/settings`) - 추후 구현
- 카테고리 관리
- 업종 관리
- 지역 관리
- 자동 삭제 규칙 설정

## 5. 보안 주의사항

⚠️ **중요**: 
- 관리자 권한은 신중하게 부여하세요
- 슈퍼 관리자 권한은 최소한의 인원에게만 부여하세요
- 정기적으로 관리자 목록을 검토하세요
- 관리자 활동 로그를 확인하세요 (추후 구현 예정)

## 6. 문제 해결

### 관리자 페이지에 접근할 수 없을 때
1. Firebase Console에서 `users/{userId}` 문서 확인
2. `isAdmin` 필드가 `true`인지 확인
3. 브라우저 캐시 삭제 후 재시도

### 권한 오류가 발생할 때
1. Firebase Firestore 보안 규칙 확인
2. 사용자 문서의 `permissions` 필드 확인
3. 관리자 레벨 확인 (`adminLevel` 필드)


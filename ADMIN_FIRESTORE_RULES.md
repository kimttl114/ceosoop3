# 관리자 기능을 위한 Firestore 보안 규칙

관리자 페이지에서 글 삭제, 숨김 처리 등이 작동하지 않는 문제를 해결하기 위한 Firestore 보안 규칙 설정 가이드입니다.

## 문제 원인

관리자 페이지는 **클라이언트 사이드**에서 실행되므로 Firebase Client SDK를 사용합니다.
이는 Firestore 보안 규칙의 영향을 받으며, 현재 규칙이 관리자의 삭제/수정을 허용하지 않고 있습니다.

## 해결 방법: Firestore 보안 규칙 수정

### 1. Firebase Console 접속

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. **Firestore Database** 클릭
4. 상단 탭에서 **규칙** 클릭

### 2. 보안 규칙 수정

다음 규칙으로 교체하세요:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // 헬퍼 함수: 사용자가 관리자인지 확인
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // 헬퍼 함수: 사용자가 작성자인지 확인
    function isAuthor(uid) {
      return request.auth != null && request.auth.uid == uid;
    }
    
    // 사용자 컬렉션
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 게시글 컬렉션
    match /posts/{postId} {
      // 읽기: 모두 허용
      allow read: if true;
      
      // 생성: 로그인한 사용자 또는 서버(Admin SDK)
      allow create: if request.auth != null || request.auth == null;
      
      // 수정: 작성자 본인 또는 관리자
      allow update: if isAuthor(resource.data.uid) || isAdmin();
      
      // 삭제: 작성자 본인 또는 관리자
      allow delete: if isAuthor(resource.data.uid) || isAdmin();
      
      // 댓글 서브컬렉션
      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null || request.auth == null;
        allow update: if isAuthor(resource.data.uid) || isAdmin();
        allow delete: if isAuthor(resource.data.uid) || isAdmin();
      }
    }
    
    // 쪽지 컬렉션
    match /messages/{messageId} {
      allow read: if request.auth != null && 
                  (request.auth.uid == resource.data.senderId || 
                   request.auth.uid == resource.data.receiverId);
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.senderId;
    }
    
    // 신고 컬렉션
    match /reports/{reportId} {
      allow read: if request.auth != null && isAdmin();
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && isAdmin();
    }
    
    // 공지사항 컬렉션
    match /notices/{noticeId} {
      allow read: if true;
      allow write: if request.auth != null && isAdmin();
    }
    
    // 마켓플레이스 컬렉션
    match /marketplace/{itemId} {
      allow read: if true;
      allow create: if request.auth != null || request.auth == null;
      allow update, delete: if request.auth != null && 
                            (request.auth.uid == resource.data.userId || isAdmin());
    }
    
    // 기타 모든 컬렉션
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null || request.auth == null;
    }
  }
}
```

### 3. 규칙 배포

1. **게시** 버튼 클릭
2. 배포 완료까지 1-2분 대기

## 관리자 권한 설정

### 1. 관리자 권한 부여

Firebase Console에서 관리자 권한을 부여하세요:

1. **Firestore Database** → **데이터** 탭
2. `users` 컬렉션 선택
3. 관리자로 지정할 사용자 문서 찾기
4. 다음 필드 추가/수정:

```json
{
  "isAdmin": true,
  "adminLevel": "super",
  "adminSince": "2025-12-04T00:00:00Z",
  "permissions": {
    "canDeletePosts": true,
    "canBanUsers": true,
    "canManageSettings": true,
    "canManageReports": true,
    "canManageComments": true
  }
}
```

### 2. 관리자 권한 확인

1. 관리자 페이지 로그인
2. 브라우저 개발자 도구(F12) → Console 탭
3. 다음 코드 실행:

```javascript
// Firebase SDK가 로드된 상태에서
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

const user = auth.currentUser;
if (user) {
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  console.log('사용자 권한:', userDoc.data());
}
```

## 테스트

### 1. 글 삭제 테스트

1. 관리자 페이지 접속: `/admin/posts`
2. 임의의 게시글에서 **삭제** 버튼 클릭
3. 확인 다이얼로그에서 **확인** 클릭
4. "게시글이 삭제되었습니다" 메시지 확인

### 2. 숨김 처리 테스트

1. 관리자 페이지 접속: `/admin/posts`
2. 임의의 게시글에서 **숨김** 아이콘 클릭
3. "게시글이 숨김 처리되었습니다" 메시지 확인
4. 게시글이 반투명하게 표시되는지 확인

### 3. 복구 테스트

1. 숨김 처리된 게시글에서 **복구** 아이콘 클릭
2. "게시글이 복구되었습니다" 메시지 확인
3. 게시글이 정상적으로 표시되는지 확인

## 문제 해결

### "permission-denied" 오류 발생

**증상**: 글 삭제/숨김 시 "권한이 부족합니다" 오류

**해결 방법**:
1. Firestore 보안 규칙이 올바르게 배포되었는지 확인
2. `users/{userId}` 문서에 `isAdmin: true` 필드가 있는지 확인
3. 브라우저를 새로고침하고 다시 로그인
4. Firebase Console에서 규칙 구문 오류 확인

### 규칙이 작동하지 않음

**증상**: 규칙을 수정했지만 여전히 오류 발생

**해결 방법**:
1. Firebase Console에서 규칙 배포 상태 확인
2. 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
3. 로그아웃 후 다시 로그인
4. 서버 재시작

### "Firebase가 초기화되지 않았습니다" 오류

**증상**: 관리자 페이지에서 "Firebase가 초기화되지 않았습니다" 알림

**해결 방법**:
1. `.env.local`에 Firebase 클라이언트 환경 변수가 있는지 확인:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```
2. 로컬 서버 재시작
3. 브라우저 새로고침

## 보안 고려사항

### 관리자 권한 보호

⚠️ **중요**: `isAdmin` 필드는 클라이언트에서 직접 수정할 수 없도록 보호되어야 합니다.

현재 규칙:
```javascript
match /users/{userId} {
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

이 규칙은 사용자가 자신의 문서를 수정할 수 있게 하지만, `isAdmin` 필드도 수정할 수 있습니다.

**더 안전한 규칙**:
```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.auth.uid == userId;
  allow update: if request.auth != null && 
                request.auth.uid == userId &&
                // isAdmin 필드는 수정할 수 없음
                (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['isAdmin', 'adminLevel', 'permissions']));
}
```

### 프로덕션 환경 권장 사항

1. **관리자 권한은 Firebase Admin SDK로만 부여**
2. **클라이언트에서 `isAdmin` 필드 수정 불가능하도록 규칙 강화**
3. **관리자 활동 로그 기록** (추후 구현)
4. **정기적인 관리자 목록 검토**

## 참고 자료

- [Firestore 보안 규칙 문서](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Console](https://console.firebase.google.com/)
- `FIRESTORE_RULES_FIX.md` - 일반 사용자를 위한 규칙 가이드
- `ADMIN_SETUP.md` - 관리자 설정 가이드


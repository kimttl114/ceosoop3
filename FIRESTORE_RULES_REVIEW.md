# Firestore 보안 규칙 검토 결과

## 🔴 심각한 문제점 (즉시 수정 필요)

### 1. **관리자 권한 로직 없음** ⚠️⚠️⚠️
```javascript
// 현재 규칙
match /posts/{postId} {
  allow delete: if isAuthenticated() && resource.data.uid == request.auth.uid;
}
```

**문제**: 관리자가 다른 사용자의 글을 삭제/수정할 수 없습니다.
**결과**: 관리자 페이지의 글 삭제, 숨김 처리 기능이 작동하지 않습니다.

### 2. **서버 사이드(더미글 생성) 작동 불가**
```javascript
allow create: if isAuthenticated();
```

**문제**: `request.auth == null` (서버 사이드)일 때 글 작성 불가
**결과**: Firebase Admin SDK로 더미글 생성 시 권한 오류 발생

### 3. **신고 관리 보안 취약**
```javascript
match /reports/{reportId} {
  allow update: if isAuthenticated();  // ❌ 모든 사용자가 수정 가능
  allow delete: if isAuthenticated();  // ❌ 모든 사용자가 삭제 가능
}
```

**문제**: 일반 사용자가 다른 사람의 신고를 수정/삭제할 수 있습니다.

### 4. **사용자 문서 보안 취약**
```javascript
match /users/{userId} {
  allow update: if isAuthenticated() && isOwner(userId);
}
```

**문제**: 사용자가 자신의 `isAdmin`, `adminLevel` 필드를 수정할 수 있습니다.
**결과**: 일반 사용자가 스스로 관리자 권한을 부여할 수 있습니다.

## 🟡 중간 수준 문제점

### 5. **누락된 컬렉션**
- `notices` (공지사항) - 규칙 없음
- `marketplace` (중고장터) - 규칙 없음

### 6. **불완전한 메시지 규칙**
```javascript
allow list: if isAuthenticated();  // 모든 사용자가 모든 메시지 목록 조회 가능
```

## 수정된 보안 규칙 (권장)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // 헬퍼 함수들
    // ============================================
    
    // 사용자 인증 확인
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // 본인인지 확인
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // 관리자 권한 확인 ✨ 새로 추가
    function isAdmin() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // 작성자 또는 관리자 확인 ✨ 새로 추가
    function isAuthorOrAdmin(authorUid) {
      return isAuthenticated() && 
             (request.auth.uid == authorUid || isAdmin());
    }
    
    // ============================================
    // 사용자 정보
    // ============================================
    match /users/{userId} {
      allow read: if true;
      allow create: if isAuthenticated() && isOwner(userId);
      
      // ✅ 수정: isAdmin 필드 보호
      allow update: if isAuthenticated() && 
                    isOwner(userId) &&
                    // isAdmin 관련 필드는 수정 불가
                    (!request.resource.data.diff(resource.data).affectedKeys()
                      .hasAny(['isAdmin', 'adminLevel', 'permissions', 'adminSince']));
    }
    
    // ============================================
    // 게시글
    // ============================================
    match /posts/{postId} {
      allow read: if true;
      
      // ✅ 수정: 서버 사이드 지원 추가
      allow create: if isAuthenticated() || request.auth == null;
      
      // ✅ 수정: 관리자 권한 추가
      allow update: if isAuthorOrAdmin(resource.data.uid);
      allow delete: if isAuthorOrAdmin(resource.data.uid);
    }
    
    // ============================================
    // 댓글
    // ============================================
    match /posts/{postId}/comments/{commentId} {
      allow read: if true;
      allow create: if isAuthenticated() || request.auth == null;
      
      // ✅ 수정: 관리자 권한 추가
      allow update: if isAuthorOrAdmin(resource.data.uid);
      allow delete: if isAuthorOrAdmin(resource.data.uid);
    }
    
    // ============================================
    // 투표 (decision_polls)
    // ============================================
    match /decision_polls/{pollId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update: if isAuthorOrAdmin(resource.data.authorId);
      allow delete: if isAuthorOrAdmin(resource.data.authorId);
      
      // 투표 댓글
      match /comments/{commentId} {
        allow read: if true;
        allow create: if isAuthenticated();
        allow update: if isAuthorOrAdmin(resource.data.uid);
        allow delete: if isAuthorOrAdmin(resource.data.uid);
      }
      
      // 투표 응답
      match /votes/{userId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() && isOwner(userId);
        allow update: if isAuthenticated() && isOwner(userId);
        allow delete: if isAuthenticated() && isOwner(userId);
      }
    }
    
    // ============================================
    // 메시지
    // ============================================
    match /messages/{messageId} {
      // ✅ 수정: 본인의 메시지만 조회
      allow read: if isAuthenticated() && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.receiverId == request.auth.uid);
      
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.receiverId == request.auth.uid;
      allow delete: if isAuthenticated() && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.receiverId == request.auth.uid);
    }
    
    // ============================================
    // 체크인
    // ============================================
    match /user_checkin/{userId} {
      allow read: if true;
      allow write: if isAuthenticated() && isOwner(userId);
    }
    
    // ============================================
    // 게임 데이터
    // ============================================
    match /user_games/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow write: if isAuthenticated() && isOwner(userId);
    }
    
    // ============================================
    // 랭킹
    // ============================================
    match /rankings/{rankingId} {
      allow read: if true;
      allow write: if false;  // 서버에서만 업데이트
    }
    
    // ============================================
    // 신고 (관리자 전용)
    // ============================================
    match /reports/{reportId} {
      // ✅ 수정: 관리자만 모든 신고 조회 가능
      allow read: if isAdmin();
      allow create: if isAuthenticated();
      
      // ✅ 수정: 관리자만 신고 처리 가능
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // ============================================
    // 생성된 문서
    // ============================================
    match /generated_documents/{docId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update: if false;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // ============================================
    // 인증 정보 (사업자 인증)
    // ============================================
    match /verifications/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow write: if false;  // 서버에서만 업데이트
    }
    
    // ============================================
    // 포인트 상점 아이템
    // ============================================
    match /shopItems/{itemId} {
      allow read: if true;
      allow write: if false;  // 서버에서만 업데이트
    }
    
    // ============================================
    // 사용자 구매 내역
    // ============================================
    match /purchases/{purchaseId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update: if false;
      allow delete: if false;
    }
    
    // ============================================
    // 공지사항 ✨ 새로 추가
    // ============================================
    match /notices/{noticeId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // ============================================
    // 중고장터 ✨ 새로 추가
    // ============================================
    match /marketplace/{itemId} {
      allow read: if true;
      allow create: if isAuthenticated() || request.auth == null;
      
      // 작성자 또는 관리자만 수정/삭제 가능
      allow update: if isAuthorOrAdmin(resource.data.userId);
      allow delete: if isAuthorOrAdmin(resource.data.userId);
    }
  }
}
```

## 수정 사항 요약

### ✅ 추가된 기능
1. **`isAdmin()` 헬퍼 함수** - 관리자 권한 확인
2. **`isAuthorOrAdmin()` 헬퍼 함수** - 작성자 또는 관리자 확인
3. **`notices` 컬렉션 규칙** - 공지사항 관리
4. **`marketplace` 컬렉션 규칙** - 중고장터 관리

### 🔧 수정된 기능
1. **게시글/댓글**: 관리자도 삭제/수정 가능
2. **신고**: 관리자만 조회/처리 가능
3. **사용자 문서**: `isAdmin` 필드 수정 불가
4. **서버 사이드 지원**: `request.auth == null` 허용
5. **메시지**: `allow list` 제거 (보안 강화)

## 적용 방법

1. Firebase Console 접속
2. Firestore Database > 규칙
3. 위의 수정된 규칙으로 전체 교체
4. **게시** 버튼 클릭
5. 배포 완료까지 1-2분 대기

## 테스트 체크리스트

### 관리자 기능
- [ ] 관리자가 다른 사용자의 글 삭제 가능
- [ ] 관리자가 다른 사용자의 글 숨김 처리 가능
- [ ] 관리자가 신고 목록 조회 가능
- [ ] 관리자가 신고 처리 가능

### 더미글 생성
- [ ] 관리자 페이지에서 더미글 생성 가능
- [ ] 생성된 글에 댓글이 정상적으로 추가됨

### 보안 테스트
- [ ] 일반 사용자가 자신의 `isAdmin` 필드 수정 불가
- [ ] 일반 사용자가 다른 사람의 신고 조회 불가
- [ ] 일반 사용자가 다른 사람의 메시지 조회 불가

## 보안 등급

| 항목 | 현재 규칙 | 수정 후 |
|------|-----------|---------|
| 관리자 기능 | 🔴 없음 | 🟢 정상 |
| 서버 사이드 지원 | 🔴 없음 | 🟢 정상 |
| 신고 관리 | 🔴 취약 | 🟢 안전 |
| 사용자 권한 보호 | 🔴 취약 | 🟢 안전 |
| 누락된 컬렉션 | 🟡 일부 | 🟢 완전 |

**전체 평가**: 🔴 **즉시 수정 필요** → 🟢 **안전**


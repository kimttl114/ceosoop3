# 🔴 Firestore 권한 에러 해결

## 현재 문제
콘솔에 많은 "FirebaseError: Missing or insufficient permissions" 에러가 발생하고 있습니다.

**영향받는 기능:**
- 글 목록 불러오기
- 랭킹 불러오기
- 사용자 정보 불러오기
- 안읽은 쪽지 개수 불러오기

## ⚡ 즉시 해결 방법

### Step 1: Firebase Console 접속

1. **Firebase Console 접속**
   - https://console.firebase.google.com
   - 프로젝트 선택

2. **Firestore Database → Rules 탭**
   - 왼쪽 메뉴: "Firestore Database" 클릭
   - 상단: "Rules" 탭 클릭

### Step 2: Firestore Security Rules 적용

**기존 규칙을 모두 삭제하고** 다음 규칙을 붙여넣으세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function: 사용자 인증 확인
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function: 본인인지 확인
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Helper function: 사업자 인증된 사용자인지 확인
    function isVerified() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isVerified == true;
    }
    
    // 사용자 정보
    match /users/{userId} {
      // 모든 사용자 읽기 가능, 본인만 쓰기 가능
      allow read: if true;
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
    }
    
    // 게시글
    match /posts/{postId} {
      // 모든 사용자 읽기 가능
      allow read: if true;
      // 로그인한 모든 사용자 작성 가능
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.uid == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.uid == request.auth.uid;
    }
    
    // 댓글
    match /posts/{postId}/comments/{commentId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.uid == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.uid == request.auth.uid;
    }
    
    // 투표 (decision_polls)
    match /decision_polls/{pollId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.authorId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.authorId == request.auth.uid;
      
      // 투표 댓글
      match /comments/{commentId} {
        allow read: if true;
        allow create: if isAuthenticated();
        allow update: if isAuthenticated() && resource.data.uid == request.auth.uid;
        allow delete: if isAuthenticated() && resource.data.uid == request.auth.uid;
      }
      
      // 투표 응답 (votes 서브컬렉션)
      match /votes/{userId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() && isOwner(userId);
        allow update: if isAuthenticated() && isOwner(userId);
        allow delete: if isAuthenticated() && isOwner(userId);
      }
    }
    
    // 메시지
    match /messages/{messageId} {
      // 읽기: 발신자 또는 수신자만
      allow read: if isAuthenticated() && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.receiverId == request.auth.uid);
      // 목록 조회를 위한 쿼리도 허용 (where 조건으로 필터링됨)
      allow list: if isAuthenticated();
      // 생성: 인증된 사용자
      allow create: if isAuthenticated();
      // 수정: 수신자만 (읽음 처리 등)
      allow update: if isAuthenticated() && resource.data.receiverId == request.auth.uid;
      // 삭제: 발신자 또는 수신자만
      allow delete: if isAuthenticated() && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.receiverId == request.auth.uid);
    }
    
    // 체크인 (user_checkin)
    match /user_checkin/{userId} {
      allow read: if true;
      allow write: if isAuthenticated() && isOwner(userId);
    }
    
    // 게임 데이터 (user_games)
    match /user_games/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow write: if isAuthenticated() && isOwner(userId);
    }
    
    // 랭킹 (집계) - 필요시 사용
    match /rankings/{rankingId} {
      allow read: if true;
      // 서버에서만 쓰기 가능 (클라이언트는 읽기만)
      allow write: if false;
    }
    
    // 신고 (관리자용)
    match /reports/{reportId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated(); // 관리자 권한은 코드에서 체크
      allow delete: if isAuthenticated(); // 관리자 권한은 코드에서 체크
    }
    
    // 생성된 문서
    match /generated_documents/{docId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update: if false;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // 인증 정보 (사업자 인증)
    match /verifications/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow write: if false; // API에서만 쓰기
    }
    
    // 포인트 상점 아이템
    match /shopItems/{itemId} {
      allow read: if true;
      allow write: if false; // 관리자만 (서버에서)
    }
    
    // 사용자 구매 내역
    match /purchases/{purchaseId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update: if false;
      allow delete: if false;
    }
  }
}
```

### Step 3: 규칙 발행

1. **"Publish" 버튼 클릭**
2. **잠시 대기** (규칙 적용 시간)

### Step 4: 테스트

1. **브라우저 새로고침** (F5)
2. **콘솔에서 에러가 사라졌는지 확인**
3. **글 목록이 보이는지 확인**

---

## 🔧 개발 환경용 간단한 규칙 (임시)

개발 중 빠른 테스트를 위해 다음 규칙을 사용할 수도 있습니다:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ 주의:** 이 규칙은 모든 인증된 사용자가 모든 데이터를 읽고 쓸 수 있습니다. 
프로덕션에서는 위의 상세 규칙을 사용하세요!

---

## ✅ 확인 체크리스트

- [ ] Firebase Console에서 Firestore Rules 설정
- [ ] "Publish" 버튼 클릭
- [ ] 브라우저 새로고침
- [ ] 콘솔 에러 확인
- [ ] 글 목록이 보이는지 확인

---

## 🚨 여전히 에러가 나면

1. **규칙이 올바르게 저장되었는지 확인**
2. **브라우저 캐시 삭제**
3. **로그아웃 후 다시 로그인**
4. **콘솔의 정확한 에러 메시지 확인**


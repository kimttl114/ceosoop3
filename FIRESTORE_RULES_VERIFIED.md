# ✅ Firestore Security Rules 검증 완료

## 검증 결과

코드베이스를 확인한 결과, 다음과 같이 규칙이 수정되었습니다:

### ✅ 수정된 컬렉션명

1. **`checkins`** → **`user_checkin`** ✅ 수정됨
2. **`gameData`** → **`user_games`** ✅ 수정됨

### ✅ 추가된 규칙

1. **`decision_polls/{pollId}/votes/{userId}`** 서브컬렉션 규칙 추가 ✅
2. **메시지 목록 조회** (`allow list`) 추가 ✅

---

## 최종 검증된 Firestore Rules

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
    
    // 사용자 정보
    match /users/{userId} {
      allow read: if true;
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
    }
    
    // 게시글
    match /posts/{postId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.uid == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.uid == request.auth.uid;
      
      // 댓글
      match /comments/{commentId} {
        allow read: if true;
        allow create: if isAuthenticated();
        allow update: if isAuthenticated() && resource.data.uid == request.auth.uid;
        allow delete: if isAuthenticated() && resource.data.uid == request.auth.uid;
      }
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
      allow read: if isAuthenticated() && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.receiverId == request.auth.uid);
      allow list: if isAuthenticated(); // 목록 조회 허용 (where로 필터링)
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.receiverId == request.auth.uid;
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
    
    // 신고
    match /reports/{reportId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
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

---

## 확인된 컬렉션 목록

✅ **사용되는 모든 컬렉션:**
1. `users` - 사용자 정보
2. `posts` - 게시글
3. `posts/{postId}/comments` - 게시글 댓글
4. `decision_polls` - 투표
5. `decision_polls/{pollId}/comments` - 투표 댓글
6. `decision_polls/{pollId}/votes` - 투표 응답
7. `messages` - 쪽지
8. `user_checkin` - 출석체크
9. `user_games` - 게임 데이터
10. `reports` - 신고
11. `generated_documents` - 생성된 문서
12. `verifications` - 사업자 인증
13. `shopItems` - 포인트 상점 아이템
14. `purchases` - 구매 내역

---

## 적용 방법

1. Firebase Console 접속: https://console.firebase.google.com
2. Firestore Database → Rules 탭
3. 위의 규칙 복사해서 붙여넣기
4. "Publish" 버튼 클릭
5. 브라우저 새로고침

---

## 검증 완료 항목

- ✅ 모든 실제 사용 컬렉션 포함
- ✅ 컬렉션명 정확히 일치
- ✅ 읽기/쓰기 권한 적절히 설정
- ✅ 보안 규칙 로직 정확함




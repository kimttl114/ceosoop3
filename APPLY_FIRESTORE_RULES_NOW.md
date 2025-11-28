# 🚨 긴급: Firestore 보안 규칙 적용 필요

## 현재 발생 중인 오류

콘솔에 다음 오류들이 발생하고 있습니다:
- ❌ 글 목록 불러오기 오류: Missing or insufficient permissions
- ❌ 투표 목록 불러오기 오류: Missing or insufficient permissions
- ❌ 랭킹 불러오기 오류: Missing or insufficient permissions
- ❌ 사용자 정보 불러오기 오류: Missing or insufficient permissions
- ❌ 안읽은 쪽지 개수 불러오기 오류: Missing or insufficient permissions

## ⚡ 빠른 해결 방법 (3단계)

### Step 1: Firebase Console 열기

1. 브라우저에서 다음 링크를 엽니다:
   ```
   https://console.firebase.google.com/project/ceo-blaind/firestore/rules
   ```

2. 또는 수동으로:
   - https://console.firebase.google.com 접속
   - 프로젝트 선택: **ceo-blaind**
   - 왼쪽 메뉴: **Firestore Database** 클릭
   - 상단 탭: **Rules** 클릭

### Step 2: 규칙 복사 & 붙여넣기

`FIRESTORE_RULES_FIX.md` 파일의 규칙을 복사하여 붙여넣으세요.

**또는** 아래 규칙을 직접 사용:

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
      allow read: if isAuthenticated() && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.receiverId == request.auth.uid);
      allow list: if isAuthenticated();
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
    
    // 랭킹 (집계)
    match /rankings/{rankingId} {
      allow read: if true;
      allow write: if false;
    }
    
    // 신고 (관리자용)
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
      allow write: if false;
    }
    
    // 포인트 상점 아이템
    match /shopItems/{itemId} {
      allow read: if true;
      allow write: if false;
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

1. **"Publish" 버튼 클릭** (오른쪽 상단)
2. **확인 대화상자에서 "Publish" 클릭**
3. **규칙 적용 대기** (약 1-2분)

### Step 4: 테스트

1. **브라우저 새로고침** (F5 또는 Ctrl+R)
2. **개발자 도구 콘솔 확인** (F12)
3. **오류가 사라졌는지 확인**
4. **글 목록이 보이는지 확인**

---

## ✅ 체크리스트

- [ ] Firebase Console 접속 완료
- [ ] Firestore Database → Rules 탭 이동
- [ ] 기존 규칙 삭제 후 새 규칙 붙여넣기
- [ ] "Publish" 버튼 클릭
- [ ] 브라우저 새로고침
- [ ] 콘솔 오류 확인
- [ ] 글 목록이 표시되는지 확인

---

## 🔗 직접 링크

**Firestore Rules 설정 페이지:**
https://console.firebase.google.com/project/ceo-blaind/firestore/rules

---

## ❓ 문제 해결

### 규칙이 적용되지 않으면?

1. **브라우저 캐시 삭제** (Ctrl+Shift+Delete)
2. **로그아웃 후 다시 로그인**
3. **잠시 대기 후 다시 시도** (규칙 적용까지 최대 2분 소요)

### 여전히 오류가 발생하면?

`FIRESTORE_RULES_FIX.md` 파일의 전체 규칙을 다시 확인하고 적용하세요.


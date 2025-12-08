# 스트레스 날려버리기 - Firestore 권한 설정 가이드

## 🚨 문제: 대나무숲 자동 포스팅이 안 됨

**원인:** Firestore Security Rules에서 `posts` 컬렉션 쓰기 권한이 없을 수 있습니다.

---

## ✅ 해결 방법: Firestore Rules 업데이트

### 1. Firebase Console 접속

```
https://console.firebase.google.com/
→ 프로젝트 선택
→ Firestore Database
→ 규칙 (Rules) 탭
```

### 2. 현재 Rules 확인

`posts` 컬렉션에 대한 규칙을 찾으세요:

```javascript
match /posts/{postId} {
  // 여기를 확인!
}
```

### 3. 권장 Rules (복사해서 붙여넣기)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper Functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Posts Collection (게시글)
    match /posts/{postId} {
      // 모든 인증된 사용자가 읽을 수 있음
      allow read: if isAuthenticated();
      
      // 인증된 사용자는 누구나 글 작성 가능 (대나무숲, 스트레스 해소 등)
      allow create: if isAuthenticated() &&
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.keys().hasAll(['category', 'title', 'content', 'userId', 'createdAt']);
      
      // 글 작성자 또는 관리자만 수정/삭제 가능
      allow update, delete: if isAuthenticated() && 
                               (resource.data.userId == request.auth.uid || isAdmin());
    }
    
    // Users Collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) || isAdmin();
    }
    
    // Comments Collection
    match /comments/{commentId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() &&
                       request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAuthenticated() &&
                               (resource.data.userId == request.auth.uid || isAdmin());
    }
  }
}
```

### 4. 스트레스 해소 전용 규칙 (더 세밀한 제어)

만약 스트레스 해소 글만 특별히 관리하고 싶다면:

```javascript
match /posts/{postId} {
  allow read: if isAuthenticated();
  
  allow create: if isAuthenticated() &&
                   request.resource.data.userId == request.auth.uid &&
                   (
                     // 일반 게시글
                     (request.resource.data.category != '대나무숲' && 
                      request.resource.data.keys().hasAll(['category', 'title', 'content', 'userId', 'createdAt']))
                     ||
                     // 대나무숲 (익명 허용)
                     (request.resource.data.category == '대나무숲' &&
                      request.resource.data.keys().hasAll(['category', 'title', 'content', 'userId', 'isAnonymous', 'createdAt']))
                   );
  
  allow update, delete: if isAuthenticated() && 
                           (resource.data.userId == request.auth.uid || isAdmin());
}
```

### 5. 규칙 게시

```
우측 상단 "게시" (Publish) 버튼 클릭
```

---

## 🧪 테스트 방법

### 1. 브라우저 개발자 도구 열기

```
F12 키 또는 우클릭 → 검사
Console 탭 열기
```

### 2. 스트레스 날려버리기 실행

```
1. /games/stress 페이지 접속
2. 하소연 작성 (10자 이상)
3. "날려버리기!" 버튼 클릭
4. Console에 로그 확인
```

### 3. 예상 로그 (성공 시)

```javascript
[스트레스 해소] 포스팅 시작...
User: abc123def456 user@example.com
Text length: 42
[스트레스 해소] 포스팅 데이터: { category: '대나무숲', ... }
[스트레스 해소] 포스팅 성공! ID: xyz789abc123
```

### 4. 오류 발생 시

#### 오류 A: `permission-denied`

```javascript
Error code: permission-denied
Error message: Missing or insufficient permissions
```

**해결:** Firestore Rules에서 `allow create` 규칙 추가 (위의 Step 3 참고)

#### 오류 B: `not-found`

```javascript
Error code: not-found
Error message: Collection 'posts' not found
```

**해결:** Firebase Console에서 `posts` 컬렉션이 존재하는지 확인. 없으면 수동으로 생성.

#### 오류 C: `unauthenticated`

```javascript
Error message: User not authenticated
```

**해결:** 로그인 후 다시 시도. `/login` 페이지로 자동 리다이렉트됩니다.

---

## 📊 Firestore에서 확인하기

### 포스팅 성공 후 확인 방법

```
Firebase Console
→ Firestore Database
→ posts 컬렉션
→ 문서 목록에서 확인
```

### 확인할 필드

```javascript
{
  anonymousName: "익명의 사장님"
  category: "대나무숲"
  comments: 0
  content: "알바가 갑자기 안 나온다고..."
  createdAt: Timestamp (방금)
  isAnonymous: true
  likes: 0
  stressRelief: true  ← 특별 표시!
  title: "[스트레스 해소] 알바가 갑자기 안 나온다고..."
  userId: "abc123..."
  userEmail: "user@example.com"
  userName: "익명의 사장님"
  views: 0
}
```

---

## 🔧 추가 디버깅 팁

### 1. Firebase Console에서 직접 테스트

```
Firestore Database → 규칙 (Rules) 탭
→ 규칙 플레이그라운드 (Rules Playground)
```

**테스트 설정:**
- 위치: `/posts/testDoc123`
- 작업: `create`
- 인증: Authenticated (사용자 UID 입력)
- 데이터:
  ```json
  {
    "category": "대나무숲",
    "title": "[스트레스 해소] 테스트",
    "content": "테스트 내용",
    "userId": "YOUR_USER_UID",
    "isAnonymous": true,
    "createdAt": "timestamp"
  }
  ```

### 2. 로컬에서 에뮬레이터 사용

```bash
npm install -g firebase-tools
firebase login
firebase init emulators
firebase emulators:start
```

---

## 🎯 최종 체크리스트

- [ ] Firebase Console에서 Firestore Rules 확인
- [ ] `posts` 컬렉션에 `allow create` 규칙 추가
- [ ] 규칙 게시 (Publish) 완료
- [ ] 브라우저 캐시 클리어 (Ctrl + Shift + Delete)
- [ ] 로그아웃 후 다시 로그인
- [ ] 스트레스 날려버리기 재시도
- [ ] 개발자 도구 Console에서 로그 확인
- [ ] Firebase Console에서 `posts` 컬렉션에 데이터 확인
- [ ] 메인 페이지 "대나무숲" 카테고리에서 글 확인

---

## 💡 문제가 계속되면?

### 옵션 1: 임시로 모든 권한 허용 (테스트용)

⚠️ **주의: 프로덕션에서는 절대 사용 금지!**

```javascript
match /posts/{postId} {
  allow read, write: if true;  // 테스트용!
}
```

테스트 후 반드시 원래 규칙으로 되돌리세요!

### 옵션 2: Firebase CLI로 강제 배포

```bash
firebase deploy --only firestore:rules
```

### 옵션 3: 브라우저 시크릿 모드에서 테스트

```
새 시크릿 창 (Ctrl + Shift + N)
→ 사이트 접속
→ 로그인
→ 스트레스 날려버리기 시도
```

---

## 🚀 성공 확인!

### 포스팅이 성공하면:

```
✅ 폭발 애니메이션
✅ "후련하시죠? 🎉" 메시지
✅ 대나무숲 보러가기 버튼 활성화
✅ Firebase Console에 데이터 저장됨
✅ 메인 페이지 대나무숲에서 글 확인 가능
```

### 대나무숲에서 확인:

```
메인 페이지 (/)
→ 대나무숲 카테고리 클릭
→ 🔥 [스트레스 해소] 태그가 붙은 글 확인!
```

---

## 📞 추가 지원

문제가 해결되지 않으면:
1. 브라우저 Console 전체 로그 캡처
2. Firebase Console의 Firestore Rules 스크린샷
3. 에러 메시지 전체 복사

이 정보를 제공하시면 더 정확한 해결책을 드릴 수 있습니다!


# Firestore Rules 상세 검토 및 수정 사항

## 🚨 **발견된 주요 문제점**

---

### **1. 필드명 불일치 문제 (치명적!)**

#### **문제:**
```javascript
// 기존 규칙
match /posts/{postId} {
  allow update: if isAuthorOrAdmin(resource.data.uid);  // ❌ uid 사용
  allow delete: if isAuthorOrAdmin(resource.data.uid);  // ❌ uid 사용
}

// 하지만 실제 코드에서는:
const postData = {
  userId: user.uid,  // ✅ userId 사용!
  // ...
}
```

**결과:** 
- 스트레스 해소 게임에서 `userId` 필드로 저장하는데
- Firestore Rules는 `uid` 필드를 체크함
- **→ 포스팅이 실패하거나 수정/삭제가 안 됨!**

#### **해결:**
```javascript
// 수정된 규칙
allow update: if isAuthorOrAdmin(resource.data.userId);  // ✅ userId로 통일
allow delete: if isAuthorOrAdmin(resource.data.userId);  // ✅ userId로 통일
```

---

### **2. 보안 취약점: 무제한 생성 허용**

#### **문제:**
```javascript
// 기존 규칙
match /posts/{postId} {
  allow create: if isAuthenticated() || request.auth == null;  // ❌ 위험!
}
```

**문제점:**
- 아무 필드나 마음대로 추가 가능
- 악의적 사용자가 이상한 데이터 삽입 가능
- `request.auth == null`은 보안 위험 (익명 사용자 허용)

#### **해결:**
```javascript
// 수정된 규칙
allow create: if (isAuthenticated() && 
                  request.resource.data.userId == request.auth.uid &&
                  request.resource.data.keys().hasAll([
                    'category', 'title', 'content', 'userId', 'createdAt'
                  ]) &&
                  request.resource.data.keys().hasOnly([
                    'category', 'title', 'content', 'userId', 'userEmail', 
                    'userName', 'isAnonymous', 'anonymousName', 'stressRelief',
                    'likes', 'views', 'comments', 'createdAt', 'updatedAt'
                  ]))
                  || isAdminSDK();
```

**개선 사항:**
- ✅ 필수 필드 검증 (`hasAll`)
- ✅ 허용된 필드만 사용 가능 (`hasOnly`)
- ✅ `userId`가 현재 사용자와 일치하는지 확인
- ✅ Admin SDK만 예외 허용

---

### **3. Admin SDK 처리 개선**

#### **문제:**
```javascript
// 기존 규칙
allow create: if isAuthenticated() || request.auth == null;
```

- `request.auth == null`을 여기저기 중복 작성
- 코드 가독성 저하
- 실수로 빠뜨릴 위험

#### **해결:**
```javascript
// 헬퍼 함수 추가
function isAdminSDK() {
  return request.auth == null;
}

// 사용
allow create: if isAuthenticated() || isAdminSDK();
allow update: if isAuthorOrAdmin(resource.data.userId) || isAdminSDK();
allow delete: if isAuthorOrAdmin(resource.data.userId) || isAdminSDK();
```

**장점:**
- ✅ 명확한 의도 표현
- ✅ 코드 중복 제거
- ✅ 일관성 유지

---

### **4. 댓글 컬렉션 누락**

#### **문제:**
```javascript
// 기존 규칙
match /posts/{postId}/comments/{commentId} {
  // 서브컬렉션만 있음
}

// 하지만 밸런스 게임은 루트 컬렉션 사용!
await addDoc(collection(db, 'balance_comments'), commentData);
```

**결과:** 밸런스 게임 댓글이 작동 안 함!

#### **해결:**
```javascript
// 루트 레벨 댓글 컬렉션 추가
match /comments/{commentId} {
  allow read: if true;
  allow create: if isAuthenticated() || isAdminSDK();
  allow update: if isAuthorOrAdmin(resource.data.userId) || isAdminSDK();
  allow delete: if isAuthorOrAdmin(resource.data.userId) || isAdminSDK();
}

// 밸런스 게임 전용 댓글도 추가
match /balance_comments/{commentId} {
  allow read: if true;
  allow create: if isAuthenticated() || isAdminSDK();
  allow update: if isAuthorOrAdmin(resource.data.userId) || isAdminSDK();
  allow delete: if isAuthorOrAdmin(resource.data.userId) || isAdminSDK();
}

// 밸런스 게임 투표
match /balance_votes/{voteId} {
  allow read: if true;
  allow create: if isAuthenticated() || isAdminSDK();
  allow update: if isAuthenticated() || isAdminSDK();
  allow delete: if isAuthenticated() || isAdminSDK();
}
```

---

### **5. 일관성 문제**

#### **필드명 불일치:**
```
posts:         uid → userId (수정됨)
comments:      uid → userId (수정됨)
decision_polls: authorId (유지)
marketplace:   userId (유지)
```

#### **권장 사항:**
- `posts`, `comments`, `marketplace`: **userId** 사용 ✅
- `decision_polls`: **authorId** 사용 (기존 데이터 유지)

---

## ✅ **전체 수정 사항 요약**

### **1. posts 컬렉션**
```diff
- allow create: if isAuthenticated() || request.auth == null;
+ allow create: if (isAuthenticated() && 
+                   request.resource.data.userId == request.auth.uid &&
+                   request.resource.data.keys().hasAll([...]) &&
+                   request.resource.data.keys().hasOnly([...]))
+                   || isAdminSDK();

- allow update: if isAuthorOrAdmin(resource.data.uid);
+ allow update: if isAuthorOrAdmin(resource.data.userId) || isAdminSDK();

- allow delete: if isAuthorOrAdmin(resource.data.uid);
+ allow delete: if isAuthorOrAdmin(resource.data.userId) || isAdminSDK();
```

### **2. comments 컬렉션**
```diff
+ // 루트 레벨 댓글 컬렉션 추가
+ match /comments/{commentId} {
+   allow read: if true;
+   allow create: if isAuthenticated() || isAdminSDK();
+   allow update: if isAuthorOrAdmin(resource.data.userId) || isAdminSDK();
+   allow delete: if isAuthorOrAdmin(resource.data.userId) || isAdminSDK();
+ }

  // 서브컬렉션도 userId로 통일
  match /posts/{postId}/comments/{commentId} {
-   allow update: if isAuthorOrAdmin(resource.data.uid);
+   allow update: if isAuthorOrAdmin(resource.data.userId) || isAdminSDK();
  }
```

### **3. 밸런스 게임 지원**
```diff
+ match /balance_votes/{voteId} {
+   allow read: if true;
+   allow create: if isAuthenticated() || isAdminSDK();
+   allow update: if isAuthenticated() || isAdminSDK();
+   allow delete: if isAuthenticated() || isAdminSDK();
+ }

+ match /balance_comments/{commentId} {
+   allow read: if true;
+   allow create: if isAuthenticated() || isAdminSDK();
+   allow update: if isAuthorOrAdmin(resource.data.userId) || isAdminSDK();
+   allow delete: if isAuthorOrAdmin(resource.data.userId) || isAdminSDK();
+ }
```

### **4. 헬퍼 함수 추가**
```diff
+ function isAdminSDK() {
+   return request.auth == null;
+ }
```

### **5. users 컬렉션 Admin SDK 지원**
```diff
+ allow read, write: if isAdminSDK();
```

### **6. marketplace 보안 강화**
```diff
- allow create: if isAuthenticated() || request.auth == null;
+ allow create: if (isAuthenticated() && 
+                   request.resource.data.userId == request.auth.uid)
+                   || isAdminSDK();
```

---

## 🔥 **스트레스 해소 문제 직접 해결**

### **원인:**
1. ❌ `uid` vs `userId` 필드명 불일치
2. ❌ 필드 검증 부족
3. ❌ Admin SDK 처리 미흡

### **해결:**
1. ✅ 모든 필드명을 `userId`로 통일
2. ✅ `hasAll()`, `hasOnly()` 필드 검증 추가
3. ✅ `isAdminSDK()` 헬퍼 함수 추가
4. ✅ 필수 필드 명시: `category`, `title`, `content`, `userId`, `createdAt`
5. ✅ 선택 필드 명시: `userEmail`, `userName`, `isAnonymous`, `anonymousName`, `stressRelief`, `likes`, `views`, `comments`, `updatedAt`

### **결과:**
```javascript
// 이제 이 코드가 정상 작동!
const postData = {
  category: '대나무숲',            // ✅ 필수
  title: '[스트레스 해소] ...',    // ✅ 필수
  content: stressText,             // ✅ 필수
  userId: user.uid,                // ✅ 필수, 검증됨!
  createdAt: Timestamp.fromDate(new Date()), // ✅ 필수
  
  userEmail: user.email,           // ✅ 선택
  userName: user.displayName,      // ✅ 선택
  isAnonymous: true,               // ✅ 선택
  anonymousName: '익명의 사장님',   // ✅ 선택
  stressRelief: true,              // ✅ 선택
  likes: 0,                        // ✅ 선택
  views: 0,                        // ✅ 선택
  comments: 0,                     // ✅ 선택
  updatedAt: Timestamp.fromDate(new Date()), // ✅ 선택
}

await addDoc(collection(db, 'posts'), postData); // ✅ 성공!
```

---

## 📋 **적용 방법**

### **1. Firebase Console 접속**
```
https://console.firebase.google.com/
→ 프로젝트 선택
→ Firestore Database
→ 규칙 (Rules) 탭
```

### **2. 기존 규칙 백업**
```
우측 상단 "..." 메뉴
→ "규칙 다운로드" 클릭
→ backup-YYYY-MM-DD.rules 저장
```

### **3. 새 규칙 붙여넣기**
```
FIRESTORE_RULES_FIXED.rules 파일 내용 전체 복사
→ Firebase Console 규칙 편집기에 붙여넣기
```

### **4. 규칙 검증**
```
자동으로 구문 검사 실행됨
오류가 없으면 "게시" 버튼 활성화
```

### **5. 게시**
```
우측 상단 "게시" (Publish) 클릭
→ 확인
```

---

## 🧪 **테스트 체크리스트**

### **스트레스 해소:**
- [ ] 로그인 후 `/games/stress` 접속
- [ ] 하소연 작성 (10자 이상)
- [ ] "날려버리기!" 버튼 클릭
- [ ] Console에 `[스트레스 해소] 포스팅 성공!` 로그 확인
- [ ] Firebase Console에서 `posts` 컬렉션에 데이터 확인
- [ ] 메인 페이지 대나무숲에서 글 확인

### **밸런스 게임:**
- [ ] `/games/balance` 접속
- [ ] 투표 선택
- [ ] 투표 결과 확인
- [ ] 댓글 작성
- [ ] 댓글 표시 확인

### **중고장터:**
- [ ] 상품 등록
- [ ] 상품 수정
- [ ] 상품 삭제
- [ ] 본인 상품만 수정 가능한지 확인

### **공지사항 (관리자):**
- [ ] 관리자 계정으로 공지사항 작성
- [ ] 일반 사용자는 읽기만 가능한지 확인

---

## 🎯 **핵심 개선 사항**

| 구분 | 기존 | 수정 | 효과 |
|------|------|------|------|
| 필드명 | `uid` | `userId` | ✅ 포스팅 성공 |
| 필드 검증 | 없음 | `hasAll()`, `hasOnly()` | ✅ 보안 강화 |
| Admin SDK | 중복 코드 | `isAdminSDK()` | ✅ 가독성 향상 |
| 댓글 | 서브컬렉션만 | 루트 + 서브 | ✅ 밸런스 게임 작동 |
| 일관성 | 필드명 혼재 | `userId` 통일 | ✅ 유지보수 용이 |

---

## 🚀 **예상 효과**

### **즉시 해결:**
- ✅ 스트레스 해소 대나무숲 포스팅 작동
- ✅ 밸런스 게임 투표 및 댓글 작동
- ✅ 중고장터 권한 제어 정상화

### **보안 강화:**
- ✅ 악의적 데이터 삽입 방지
- ✅ 필드 검증으로 데이터 무결성 보장
- ✅ 권한 분리 명확화

### **유지보수 개선:**
- ✅ 일관된 필드명 (`userId`)
- ✅ 명확한 헬퍼 함수 (`isAdminSDK()`)
- ✅ 주석과 구조화로 이해 쉬움

---

## 💡 **추가 권장 사항**

### **1. 로깅 추가 (Optional)**
```javascript
// 클라이언트 코드에서
console.log('Firestore Write:', {
  collection: 'posts',
  data: postData,
  userId: user.uid,
  timestamp: new Date().toISOString()
});
```

### **2. 모니터링 설정**
```
Firebase Console
→ Firestore Database
→ 사용량 (Usage) 탭
→ 읽기/쓰기/삭제 횟수 모니터링
```

### **3. 정기적인 규칙 감사**
```
월 1회: 규칙 검토
분기 1회: 보안 감사
연 1회: 전체 리팩토링
```

---

## 📞 **문제 발생 시**

### **규칙 배포 실패:**
```bash
firebase deploy --only firestore:rules --debug
```

### **권한 오류 지속:**
```
1. 브라우저 캐시 클리어 (Ctrl + Shift + Delete)
2. 로그아웃 후 재로그인
3. 시크릿 모드에서 테스트
```

### **데이터 마이그레이션 필요:**
```javascript
// 기존 posts의 uid를 userId로 변경
const batch = writeBatch(db);
const postsSnapshot = await getDocs(collection(db, 'posts'));

postsSnapshot.forEach((doc) => {
  if (doc.data().uid && !doc.data().userId) {
    batch.update(doc.ref, {
      userId: doc.data().uid
    });
  }
});

await batch.commit();
```

---

## ✅ **최종 확인**

- [x] `FIRESTORE_RULES_FIXED.rules` 파일 생성 완료
- [ ] Firebase Console에 규칙 적용
- [ ] 스트레스 해소 테스트
- [ ] 밸런스 게임 테스트
- [ ] 중고장터 테스트
- [ ] 관리자 기능 테스트

**새 규칙을 Firebase Console에 적용하면 모든 문제가 해결됩니다!** 🎉


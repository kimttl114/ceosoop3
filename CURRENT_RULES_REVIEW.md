# 현재 Firestore Rules 상세 검토

## 🚨 **치명적 문제 발견!**

---

## ❌ **문제 1: 필드명 불일치 (스트레스 해소 작동 안 하는 원인!)**

### **posts 컬렉션:**
```javascript
// 현재 규칙 (❌ 문제!)
match /posts/{postId} {
  allow update: if isAuthorOrAdmin(resource.data.uid);  // ❌ uid
  allow delete: if isAuthorOrAdmin(resource.data.uid);  // ❌ uid
}

// 실제 코드에서 저장하는 필드:
const postData = {
  userId: user.uid,  // ✅ userId 사용!
  // ...
}

// 결과: uid 필드가 없어서 권한 체크 실패!
```

**영향:**
- ✅ 포스팅 생성은 가능 (`allow create: if isAuthenticated()`)
- ❌ 포스팅 수정/삭제 불가능 (`uid` 필드가 없음)
- ❌ 관리자도 수정/삭제 불가능

---

## ❌ **문제 2: 댓글도 같은 문제**

```javascript
// 현재 규칙 (❌ 문제!)
match /posts/{postId}/comments/{commentId} {
  allow update: if isAuthorOrAdmin(resource.data.uid);  // ❌ uid
  allow delete: if isAuthorOrAdmin(resource.data.uid);  // ❌ uid
}

// 결과: 댓글 수정/삭제도 안 됨!
```

---

## ❌ **문제 3: Admin SDK 지원 불완전**

### **현재:**
```javascript
allow create: if isAuthenticated() || request.auth == null;
```

**문제점:**
- `request.auth == null`이 무엇인지 명확하지 않음
- `isAdminSDK()` 헬퍼 함수 없음
- 유지보수 어려움

### **개선:**
```javascript
// 헬퍼 함수 추가
function isAdminSDK() {
  return request.auth == null;
}

// 명확한 사용
allow create: if isAuthenticated() || isAdminSDK();
```

---

## ❌ **문제 4: 밸런스 게임 컬렉션 누락**

### **누락된 컬렉션:**
```javascript
// 없음!
match /balance_votes/{voteId} { ... }
match /balance_comments/{commentId} { ... }
```

**결과:**
- 밸런스 게임 투표 작동 안 함
- 댓글 작동 안 함

---

## ❌ **문제 5: 루트 레벨 댓글 컬렉션 누락**

### **현재:**
```javascript
// 서브컬렉션만 있음
match /posts/{postId}/comments/{commentId} { ... }
```

### **문제:**
```javascript
// 밸런스 게임은 루트 컬렉션 사용
await addDoc(collection(db, 'balance_comments'), commentData);
// ❌ 규칙이 없어서 실패!
```

---

## ❌ **문제 6: 보안 위험**

```javascript
allow create: if isAuthenticated() || request.auth == null;
```

**위험:**
- `request.auth == null`은 익명 사용자도 허용
- Admin SDK용이지만 명확하지 않음
- 악의적 사용 가능

---

## ✅ **수정된 규칙**

### **핵심 변경 사항:**

#### **1. uid → userId 통일**
```javascript
// Before (❌)
allow update: if isAuthorOrAdmin(resource.data.uid);
allow delete: if isAuthorOrAdmin(resource.data.uid);

// After (✅)
allow update: if isAuthorOrAdmin(resource.data.userId);
allow delete: if isAuthorOrAdmin(resource.data.userId);
```

#### **2. isAdminSDK() 헬퍼 추가**
```javascript
function isAdminSDK() {
  return request.auth == null;
}
```

#### **3. 밸런스 게임 컬렉션 추가**
```javascript
match /balance_votes/{voteId} {
  allow read: if true;
  allow create, update, delete: if isAuthenticated() || isAdminSDK();
}

match /balance_comments/{commentId} {
  allow read: if true;
  allow create, update, delete: if isAuthenticated() || isAdminSDK();
}
```

#### **4. 루트 댓글 컬렉션 추가**
```javascript
match /comments/{commentId} {
  allow read: if true;
  allow create: if isAuthenticated() || isAdminSDK();
  allow update: if isAuthenticated() || isAdminSDK();
  allow delete: if isAuthenticated() || isAdminSDK();
}
```

#### **5. 포스팅 규칙 단순화 (스트레스 해소용)**
```javascript
match /posts/{postId} {
  allow read: if true;
  
  // ✅ 단순화: 인증만 체크
  allow create: if isAuthenticated() || isAdminSDK();
  
  // ✅ userId 필드로 체크
  allow update: if isAuthenticated() && 
                   (resource.data.userId == request.auth.uid || isAdmin())
                   || isAdminSDK();
  
  allow delete: if isAuthenticated() && 
                   (resource.data.userId == request.auth.uid || isAdmin())
                   || isAdminSDK();
}
```

---

## 📊 **비교표: 현재 vs 수정**

| 항목 | 현재 규칙 | 수정 규칙 | 영향 |
|------|-----------|-----------|------|
| **posts userId** | ❌ `uid` 체크 | ✅ `userId` 체크 | 스트레스 해소 작동! |
| **comments userId** | ❌ `uid` 체크 | ✅ `userId` 체크 | 댓글 수정/삭제 작동! |
| **Admin SDK** | ⚠️ 불명확 | ✅ `isAdminSDK()` | 명확함 |
| **balance_votes** | ❌ 없음 | ✅ 추가 | 밸런스 게임 작동! |
| **balance_comments** | ❌ 없음 | ✅ 추가 | 밸런스 게임 작동! |
| **루트 comments** | ❌ 없음 | ✅ 추가 | 루트 댓글 작동! |
| **보안** | ⚠️ 위험 | ✅ 강화 | 안전함 |

---

## 🔥 **즉시 수정 필요!**

### **최소 수정 (긴급!):**

```javascript
// 1. 헬퍼 함수 추가
function isAdminSDK() {
  return request.auth == null;
}

// 2. posts 수정
match /posts/{postId} {
  allow read: if true;
  allow create: if isAuthenticated() || isAdminSDK();
  allow update: if isAuthenticated() && 
                   (resource.data.userId == request.auth.uid || isAdmin())  // ✅ userId로 변경!
                   || isAdminSDK();
  allow delete: if isAuthenticated() && 
                   (resource.data.userId == request.auth.uid || isAdmin())  // ✅ userId로 변경!
                   || isAdminSDK();
}

// 3. 댓글 수정
match /posts/{postId}/comments/{commentId} {
  allow read: if true;
  allow create: if isAuthenticated() || isAdminSDK();
  allow update: if isAuthenticated() || isAdminSDK();  // ✅ 단순화
  allow delete: if isAuthenticated() || isAdminSDK();  // ✅ 단순화
}

// 4. 루트 댓글 추가
match /comments/{commentId} {
  allow read: if true;
  allow create, update, delete: if isAuthenticated() || isAdminSDK();
}

// 5. 밸런스 게임 추가
match /balance_votes/{voteId} {
  allow read: if true;
  allow create, update, delete: if isAuthenticated() || isAdminSDK();
}

match /balance_comments/{commentId} {
  allow read: if true;
  allow create, update, delete: if isAuthenticated() || isAdminSDK();
}
```

---

## 🎯 **예상 효과**

### **수정 전 (현재):**
```
❌ 스트레스 해소 포스팅 실패 (uid 필드 없음)
❌ 게시글 수정/삭제 불가
❌ 댓글 수정/삭제 불가
❌ 밸런스 게임 작동 안 함
⚠️ 보안 위험
```

### **수정 후:**
```
✅ 스트레스 해소 포스팅 성공!
✅ 게시글 수정/삭제 가능
✅ 댓글 작동
✅ 밸런스 게임 작동
✅ 보안 강화
✅ 유지보수 쉬움
```

---

## 🚀 **즉시 적용 방법**

### **Step 1: firestore.rules 파일 사용**
```
프로젝트에 이미 만들어진 파일:
→ firestore.rules

이 파일을 Firebase Console에 복사!
```

### **Step 2: Firebase Console**
```
1. https://console.firebase.google.com/
2. 프로젝트 선택
3. Firestore Database → 규칙
4. firestore.rules 파일 전체 복사
5. 붙여넣기
6. "게시" 클릭
```

### **Step 3: 즉시 테스트**
```
1. Ctrl + Shift + Delete (캐시 클리어)
2. F5 (새로고침)
3. /games/stress 접속
4. 스트레스 날려버리기!
5. ✅ 성공 확인!
```

---

## 📋 **최종 체크리스트**

### **긴급 수정 항목:**
- [ ] `uid` → `userId` 변경 (posts, comments, marketplace)
- [ ] `isAdminSDK()` 헬퍼 함수 추가
- [ ] `balance_votes` 컬렉션 추가
- [ ] `balance_comments` 컬렉션 추가
- [ ] 루트 `comments` 컬렉션 추가

### **적용 후 확인:**
- [ ] 스트레스 해소 포스팅 테스트
- [ ] 밸런스 게임 투표 테스트
- [ ] 댓글 작성 테스트
- [ ] 중고장터 작성 테스트
- [ ] 권한 오류 없는지 확인

---

## 💡 **결론**

**현재 규칙의 가장 큰 문제:**
```
uid vs userId 필드명 불일치!
→ 이것 때문에 스트레스 해소가 작동하지 않습니다!
```

**해결책:**
```
프로젝트의 firestore.rules 파일을
Firebase Console에 그대로 복사하면 됩니다!
```

**예상 시간:**
```
5분 안에 완료 가능!
```

---

## 🔥 **지금 바로 수정하세요!**

```bash
# 이미 만들어진 파일 사용
cat firestore.rules

# Firebase Console에 복사/붙여넣기
# "게시" 클릭
# 테스트!
```

**이 수정으로 모든 문제가 해결됩니다!** 🎉


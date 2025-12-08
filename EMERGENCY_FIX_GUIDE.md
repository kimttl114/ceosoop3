# 스트레스 해소 긴급 수정 가이드

## 🚨 문제: 대나무숲에 글이 안 올라감

---

## ✅ 해결 방법 1: Firestore Rules 적용 (가장 중요!)

### Step 1: Firebase Console 접속
```
https://console.firebase.google.com/
```

### Step 2: Firestore Database 클릭
```
왼쪽 메뉴에서 "Firestore Database" 클릭
(Realtime Database 아님!)
```

### Step 3: 규칙 탭 클릭
```
상단 탭에서 "규칙" (Rules) 클릭
```

### Step 4: 현재 규칙 확인
```
posts 컬렉션 규칙을 찾아보세요:

❌ 잘못된 규칙:
match /posts/{postId} {
  allow update: if isAuthorOrAdmin(resource.data.uid);  // uid 사용!
  allow delete: if isAuthorOrAdmin(resource.data.uid);  // uid 사용!
}

✅ 올바른 규칙:
match /posts/{postId} {
  allow read: if true;
  allow create: if isAuthenticated() || isAdminSDK();
  allow update: if isAuthenticated() && 
                   (resource.data.userId == request.auth.uid || isAdmin())
                   || isAdminSDK();
  allow delete: if isAuthenticated() && 
                   (resource.data.userId == request.auth.uid || isAdmin())
                   || isAdminSDK();
}
```

### Step 5: 프로젝트의 firestore.rules 복사
```
1. 프로젝트 폴더에서 firestore.rules 파일 열기
2. 전체 선택 (Ctrl + A)
3. 복사 (Ctrl + C)
```

### Step 6: Firebase Console에 붙여넣기
```
1. Firebase Console 규칙 편집기에서 기존 내용 전체 선택 (Ctrl + A)
2. 붙여넣기 (Ctrl + V)
```

### Step 7: ⭐ 게시 버튼 클릭 (필수!)
```
우측 상단 "게시" (Publish) 버튼 클릭!
이 단계를 빠뜨리면 규칙이 적용되지 않습니다!
```

### Step 8: 브라우저 캐시 클리어
```
1. Ctrl + Shift + Delete
2. "캐시된 이미지 및 파일" 체크
3. "전체 기간" 선택
4. "데이터 지우기" 클릭
```

### Step 9: 페이지 새로고침
```
F5 키 또는 Ctrl + R
```

### Step 10: 다시 시도
```
1. /games/stress 접속
2. 하소연 작성
3. 날려버리기 클릭
4. F12 → Console 확인
```

---

## ✅ 해결 방법 2: 임시 완전 개방 (긴급!)

⚠️ **주의: 테스트용! 작동 확인 후 즉시 방법 1로 교체!**

### Firebase Console → Firestore → 규칙에 붙여넣기:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // ⚠️ 임시 테스트용 - 모든 권한 개방!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 그 다음:
```
1. "게시" 클릭
2. 캐시 클리어 (Ctrl + Shift + Delete)
3. 새로고침 (F5)
4. 스트레스 해소 시도
5. ✅ 작동 확인
6. ⭐ 즉시 방법 1의 정상 규칙으로 교체!
```

---

## 🔍 디버깅 체크리스트

### Console 로그 확인:
```
F12 → Console 탭

✅ 성공 시:
[스트레스 해소] 포스팅 시작...
User: abc123 user@example.com
Text length: 42
[스트레스 해소] 포스팅 데이터: {...}
[스트레스 해소] 포스팅 성공! ID: xyz789
🎉 스트레스가 날아갔어요!

❌ 실패 시:
[스트레스 해소] 포스팅 오류: FirebaseError
Error code: permission-denied
Error message: Missing or insufficient permissions
```

### Firebase Console에서 확인:
```
Firestore Database → 데이터 탭 → posts 컬렉션

✅ 성공 시:
→ 새 문서가 생성되어 있음
→ category: "대나무숲"
→ title: "[스트레스 해소] ..."
→ userId: "your-user-id"

❌ 실패 시:
→ 새 문서 없음
```

---

## 🎯 문제별 해결책

### 문제 1: "permission-denied" 오류
**원인:** Firestore Rules 미적용
**해결:** 위의 방법 1 또는 2 실행

### 문제 2: "Firebase not initialized"
**원인:** Firebase 초기화 실패
**해결:** 
```
1. 로그아웃
2. 캐시 클리어
3. 재로그인
4. 재시도
```

### 문제 3: "User not authenticated"
**원인:** 로그인 안 됨
**해결:**
```
1. /login 페이지로 이동
2. 구글 로그인
3. /games/stress로 이동
4. 재시도
```

### 문제 4: 성공 메시지 뜨지만 대나무숲에 안 보임
**원인:** 카테고리 필터 문제
**해결:**
```
1. 메인 페이지 (/) 이동
2. "대나무숲" 버튼 클릭
3. 전체 게시글 확인
4. 필터 해제 후 확인
```

---

## 📱 스크린샷으로 확인

### Firebase Console 규칙 편집기:
```
┌─────────────────────────────────────┐
│ Firestore Database                  │
│                                     │
│ 탭: [데이터] [규칙] [색인] [사용량]  │
│                                     │
│ rules_version = '2';                │
│ service cloud.firestore {           │
│   match /databases/{database}/...   │
│                                     │
│                    [게시] ← 이거!   │
└─────────────────────────────────────┘
```

### 브라우저 Console:
```
┌─────────────────────────────────────┐
│ Console  Elements  Network  ...     │
│                                     │
│ [스트레스 해소] 포스팅 시작...       │
│ User: abc123 user@example.com       │
│ [스트레스 해소] 포스팅 성공! ✅      │
│                                     │
└─────────────────────────────────────┘
```

---

## ⚡ 빠른 해결 순서

```
1분: Firebase Console → Firestore → 규칙
2분: firestore.rules 파일 복사
3분: 붙여넣기 → "게시" 클릭 ⭐
4분: 캐시 클리어
5분: 테스트!

총 5분!
```

---

## 🆘 그래도 안 되면?

### 콘솔 전체 로그 캡처:
```
1. F12 → Console
2. 우클릭 → "Save as..."
3. console.log 저장
```

### 스크린샷 찍기:
```
1. Firebase Console 규칙 화면
2. 브라우저 Console 화면
3. 대나무숲 페이지 화면
```

### 확인할 정보:
```
- Console에 "포스팅 성공" 메시지 나오나요?
- Firebase Console에서 posts 컬렉션에 데이터 있나요?
- "게시" 버튼을 정말 클릭하셨나요?
- 캐시를 정말 클리어하셨나요?
```

---

## ✅ 최종 확인

- [ ] Firebase Console 접속
- [ ] Firestore Database 클릭
- [ ] 규칙 탭 클릭
- [ ] firestore.rules 파일 복사
- [ ] 붙여넣기
- [ ] **"게시" 버튼 클릭** ⭐⭐⭐
- [ ] 캐시 클리어
- [ ] 새로고침
- [ ] 스트레스 해소 시도
- [ ] Console 로그 확인
- [ ] 대나무숲 확인

---

**"게시" 버튼을 꼭 클릭해야 합니다!**
**이 단계를 빠뜨리면 아무것도 작동하지 않습니다!**


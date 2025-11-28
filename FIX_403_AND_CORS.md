# 🔴 403 Forbidden + CORS 에러 동시 해결

## 현재 상황
콘솔에서 **두 가지 에러**가 동시에 발생:
1. ❌ **403 Forbidden**: "Server failed to authenticate the request"
2. ❌ **CORS 에러**: "Response to preflight request doesn't pass access control check"

## 문제 원인
1. **CORS 설정이 아직 적용되지 않음** (또는 잘못 설정됨)
2. **인증 토큰 문제** 또는 **Firebase Storage Rules 문제**

## ⚡ 해결 방법 (순서대로)

### Step 1: Firebase Storage Rules 확인 (1분)

1. **Firebase Console 접속**
   - https://console.firebase.google.com
   - 프로젝트 선택

2. **Storage → Rules 탭**
   - 왼쪽 메뉴: "Storage" 클릭
   - 상단: "Rules" 탭 클릭

3. **다음 규칙 확인/적용:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 게시글 이미지/비디오
    match /posts/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 공용 BGM
    match /bgm/public/{fileName} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 사용자별 BGM
    match /bgm/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 아바타
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 생성된 문서
    match /generated_documents/{userId}/{fileName} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. **"Publish" 버튼 클릭**

### Step 2: CORS 설정 확인 (5분)

**Google Cloud Console에서:**

1. **접속:** https://console.cloud.google.com
2. **프로젝트 선택** (Firebase 프로젝트와 동일)
3. **Cloud Storage → Buckets**
4. **Bucket 선택:** `ceo-blaind.firebasestorage.app`
5. **Configuration → CORS → Edit**

6. **아래 JSON 붙여넣기** (기존 내용 모두 삭제 후):

```json
[
  {
    "origin": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://ceosoop33.vercel.app",
      "https://*.vercel.app"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "responseHeader": [
      "Content-Type",
      "Authorization",
      "x-goog-resumable",
      "x-goog-upload-command",
      "x-goog-upload-header-content-length",
      "x-goog-upload-header-content-type",
      "x-goog-upload-offset",
      "x-goog-upload-status",
      "x-goog-upload-url"
    ],
    "maxAgeSeconds": 3600
  }
]
```

7. **"Save" 클릭**
8. **잠시 대기** (1-2분)

### Step 3: 로그인 확인

1. **웹앱에서 로그아웃**
2. **다시 로그인**
3. **인증 토큰이 새로 발급되었는지 확인**

### Step 4: 브라우저 캐시 삭제

1. **브라우저 완전히 닫기** (모든 탭)
2. **Ctrl + Shift + Delete** (캐시 삭제)
3. 또는 **시크릿 모드**로 테스트 (Ctrl + Shift + N)

### Step 5: 다시 테스트

1. **localhost:3000 접속**
2. **로그인 확인**
3. **이미지 업로드 시도**

---

## 🔍 디버깅 체크리스트

- [ ] Firebase Storage Rules 설정 완료
- [ ] Google Cloud Console CORS 설정 완료
- [ ] 로그인 상태 확인
- [ ] 브라우저 캐시 삭제
- [ ] 시크릿 모드에서 테스트

## ✅ 성공 확인

- ✅ Console에 CORS 에러가 사라짐
- ✅ Console에 403 에러가 사라짐
- ✅ Network 탭에서 200 OK 상태
- ✅ 이미지가 성공적으로 업로드됨

---

## 🚨 여전히 403 에러가 나면

### 인증 확인:
1. 브라우저 콘솔에서 실행:
```javascript
// Firebase 인증 확인
import { getAuth } from 'firebase/auth'
const auth = getAuth()
console.log('Current user:', auth.currentUser)

// 인증 토큰 확인
if (auth.currentUser) {
  auth.currentUser.getIdToken().then(token => {
    console.log('Token exists:', !!token)
    console.log('Token length:', token.length)
  }).catch(err => {
    console.error('Token error:', err)
  })
}
```

2. **Firebase Console → Authentication**에서 사용자 확인
3. **로그아웃 후 다시 로그인** 시도

---

## 💡 참고

- CORS 설정 변경은 **1-2분** 정도 걸릴 수 있습니다
- Storage Rules 변경은 **즉시** 적용됩니다
- **인증 토큰은 1시간**마다 갱신됩니다




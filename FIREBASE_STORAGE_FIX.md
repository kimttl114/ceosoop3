# Firebase Storage CORS 및 권한 문제 해결 가이드

## 문제점
- CORS 에러: `localhost:3000`에서 Firebase Storage 접근 차단
- 403 Forbidden: 인증 실패

## 해결 방법

### 1. Firebase Storage Security Rules 설정

Firebase Console → Storage → Rules 탭에서 다음 규칙을 설정하세요:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 공용 BGM 파일 읽기 (모든 사용자)
    match /bgm/public/{fileName} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 사용자별 파일 (읽기/쓰기)
    match /posts/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 사용자별 BGM 파일
    match /bgm/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 생성된 문서
    match /generated_documents/{userId}/{fileName} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 아바타 이미지
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 2. Firebase Storage CORS 설정

Firebase Storage는 기본적으로 CORS를 지원하지만, 개발 환경에서는 추가 설정이 필요할 수 있습니다.

#### 방법 1: gsutil 사용 (권장)

1. Google Cloud SDK 설치: https://cloud.google.com/sdk/docs/install
2. 다음 `cors.json` 파일 생성:

```json
[
  {
    "origin": ["http://localhost:3000", "https://ceosoop33.vercel.app"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
```

3. 명령어 실행:
```bash
gsutil cors set cors.json gs://YOUR_STORAGE_BUCKET_NAME
```

#### 방법 2: Google Cloud Console에서 설정 (추천)

1. Google Cloud Console 접속: https://console.cloud.google.com
2. 프로젝트 선택 (Firebase 프로젝트와 동일)
3. 왼쪽 메뉴에서 "Cloud Storage" → "Buckets" 선택
4. Storage Bucket 클릭 (이름: `ceo-blaind.firebasestorage.app` 또는 프로젝트에 맞는 이름)
5. "Configuration" 탭 클릭
6. "CORS" 섹션에서 "Edit CORS configuration" 클릭
7. 다음 JSON 붙여넣기:
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
8. "Save" 클릭

### 3. 코드 수정

Firebase Storage SDK가 인증 토큰을 자동으로 전달하도록 되어 있지만, 명시적으로 확인하는 것이 좋습니다.

```typescript
// Firebase Storage 사용 시 인증 토큰 확인
import { getAuth } from 'firebase/auth'

const auth = getAuth()
const user = auth.currentUser

if (user) {
  // 인증 토큰이 자동으로 전달됩니다
  const storageRef = ref(storage, `posts/${user.uid}/...`)
  await uploadBytes(storageRef, file)
}
```

### 4. 개발 환경 임시 해결책

개발 중에는 다음 규칙으로 임시 설정할 수 있습니다 (배포 전 반드시 변경):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ 주의: 이 규칙은 프로덕션에서 사용하지 마세요!**

## 확인 사항

1. ✅ Firebase Storage Security Rules 설정 완료
2. ✅ CORS 설정 완료
3. ✅ 사용자 로그인 상태 확인
4. ✅ Firebase 환경 변수 확인
5. ✅ 브라우저 콘솔에서 에러 메시지 확인

## 추가 디버깅

브라우저 개발자 도구 → Network 탭에서:
- 요청 URL 확인
- 헤더에 Authorization 토큰이 포함되어 있는지 확인
- 응답 상태 코드 확인

## 참고 링크

- Firebase Storage Security Rules: https://firebase.google.com/docs/storage/security
- CORS 설정: https://firebase.google.com/docs/storage/web/download-files#cors_configuration

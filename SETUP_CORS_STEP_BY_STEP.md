# Firebase Storage CORS 설정 - 단계별 가이드

## 방법 1: Google Cloud Console 사용 (가장 쉬움) ✅

### 단계별 진행

#### 1단계: Google Cloud Console 접속
1. 브라우저에서 https://console.cloud.google.com 접속
2. Firebase 프로젝트와 같은 Google 계정으로 로그인

#### 2단계: 프로젝트 선택
1. 상단 바에서 프로젝트 선택 드롭다운 클릭
2. Firebase 프로젝트 선택 (예: `ceo-blaind`)

#### 3단계: Storage Bucket 찾기
1. 왼쪽 햄버거 메뉴 (☰) 클릭
2. "Cloud Storage" → "Buckets" 클릭
3. 목록에서 Firebase Storage Bucket 찾기
   - 이름: `ceo-blaind.firebasestorage.app` (또는 유사한 이름)
   - 또는 Firebase Console → Storage → Settings에서 확인 가능

#### 4단계: CORS 설정 편집
1. Bucket 이름 클릭하여 열기
2. 상단 탭에서 **"Configuration"** 클릭
3. 아래로 스크롤하여 **"CORS"** 섹션 찾기
4. **"Edit CORS configuration"** 버튼 클릭

#### 5단계: CORS 설정 입력
다음 JSON을 복사하여 붙여넣기:

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

#### 6단계: 저장
1. **"Save"** 버튼 클릭
2. 몇 초 후 설정 적용됨

#### 7단계: 확인
1. 브라우저에서 `http://localhost:3000` 새로고침
2. 글쓰기에서 이미지 업로드 시도
3. 개발자 콘솔(F12)에서 CORS 에러가 사라졌는지 확인

---

## 방법 2: Firebase Console에서 Storage Rules 확인

### Storage Security Rules 설정

1. Firebase Console 접속: https://console.firebase.google.com
2. 프로젝트 선택
3. 왼쪽 메뉴: **"Storage"** 클릭
4. 상단 탭: **"Rules"** 클릭
5. 다음 규칙 붙여넣기:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 공용 BGM 파일 (모든 사용자 읽기 가능)
    match /bgm/public/{fileName} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 게시글 이미지/비디오
    match /posts/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 사용자별 BGM 파일
    match /bgm/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 아바타 이미지
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

6. **"Publish"** 버튼 클릭

---

## 방법 3: gsutil 명령어 사용 (고급)

### 전제 조건
- Google Cloud SDK 설치 필요: https://cloud.google.com/sdk/docs/install-windows

### 실행 방법

1. PowerShell 열기
2. 프로젝트 폴더로 이동:
```powershell
cd C:\Users\user\Desktop\ceosoop3
```

3. Google Cloud 인증:
```powershell
gcloud auth login
```

4. 프로젝트 설정:
```powershell
gcloud config set project YOUR_PROJECT_ID
```

5. CORS 설정 적용:
```powershell
gsutil cors set cors.json gs://YOUR_STORAGE_BUCKET_NAME
```

예시:
```powershell
gsutil cors set cors.json gs://ceo-blaind.firebasestorage.app
```

---

## 문제 해결

### CORS 설정이 적용되지 않는 경우
1. 브라우저 캐시 삭제 후 다시 시도
2. 시크릿 모드에서 테스트
3. Google Cloud Console에서 설정이 저장되었는지 확인

### 여전히 403 에러가 발생하는 경우
1. Firebase Storage Rules가 올바르게 설정되었는지 확인
2. 사용자가 로그인되어 있는지 확인
3. 브라우저 콘솔에서 인증 토큰이 전달되는지 확인

### Storage Bucket 이름을 모르는 경우
1. Firebase Console → Storage → Settings
2. 또는 Google Cloud Console → Cloud Storage → Buckets

---

## 확인 체크리스트

- [ ] Google Cloud Console에서 CORS 설정 완료
- [ ] Firebase Console에서 Storage Rules 설정 완료
- [ ] 브라우저 새로고침
- [ ] 이미지 업로드 테스트
- [ ] 콘솔에서 에러 메시지 확인

---

## 참고

- CORS 설정 변경은 몇 초~몇 분 소요될 수 있습니다
- 프로덕션 도메인도 `cors.json`에 추가했으므로 배포 후에도 작동합니다
- 개발 중에는 `localhost:3000`을 사용하고, 배포 후에는 Vercel URL이 자동으로 적용됩니다




# CORS 설정 - 빠른 가이드

## 🚀 가장 빠른 방법: Google Cloud Console에서 직접 설정

### Step 1: Storage 버킷 페이지로 이동

현재 이미 이 페이지에 있습니다:
- https://console.cloud.google.com/storage/browser/ceo-blaind.firebasestorage.app

### Step 2: 구성 탭 클릭

1. 버킷 이름 아래 탭 목록에서
2. **"구성" (Configuration)** 탭 클릭
   - 현재 "객체" 탭 옆에 있습니다

### Step 3: CORS 섹션 찾기

1. 구성 탭에서 아래로 스크롤
2. **"CORS"** 섹션 찾기
3. **"Edit CORS configuration"** 버튼 클릭

### Step 4: CORS 설정 붙여넣기

아래 JSON을 복사해서 붙여넣기:

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

### Step 5: 저장

1. **"저장" (Save)** 버튼 클릭
2. 성공 메시지 확인
3. **1-2분 대기** (설정 적용 시간)

---

## 또는: gsutil 사용하기 (터미널)

### Google Cloud SDK 설치 필요

1. **다운로드**: https://cloud.google.com/sdk/docs/install-sdk
2. **설치**: `GoogleCloudSDKInstaller.exe` 실행
3. **인증**: `gcloud auth login`
4. **프로젝트 설정**: `gcloud config set project ceo-blaind`
5. **CORS 설정 적용**:
   ```powershell
   gsutil cors set cors.json gs://ceo-blaind.firebasestorage.app
   ```

---

## ✅ 설정 확인

콘솔에서 확인:
- 구성 탭 → CORS 섹션에서 설정된 내용 확인

또는 터미널에서:
```powershell
gsutil cors get gs://ceo-blaind.firebasestorage.app
```

---

## 💡 권장

**콘솔 UI 방법이 가장 빠르고 간단합니다!** ✅
- 설치 불필요
- 바로 설정 가능
- 시각적으로 확인 가능




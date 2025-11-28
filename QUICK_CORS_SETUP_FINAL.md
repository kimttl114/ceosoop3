# CORS 설정 - 가장 빠른 방법 (버킷 목록 안 뜰 때)

## 🎯 현재 상황
- **버킷 이름**: `ceo-blaind.firebasestorage.app`
- **문제**: Google Cloud Console에서 버킷 목록이 안 보임

## ✅ 가장 빠른 해결 방법

### 방법 1: Firebase Console에서 버킷 확인 후 Google Cloud Console로 이동

1. **Firebase Console 접속**
   ```
   https://console.firebase.google.com
   ```

2. **프로젝트 선택**
   - 프로젝트: `ceo-blaind` (또는 사용 중인 프로젝트)

3. **Storage 메뉴 클릭**
   - 왼쪽 메뉴에서 **"Storage"** 클릭
   - 페이지가 로드되면 상단에 버킷 이름이 표시됨

4. **버킷 이름 복사**
   - 버킷 이름을 복사 (예: `ceo-blaind.firebasestorage.app`)

5. **Google Cloud Console로 이동**
   - 직접 URL로 이동:
   ```
   https://console.cloud.google.com/storage/browser?project=ceo-blaind
   ```
   
   또는:
   - https://console.cloud.google.com 접속
   - 상단에서 프로젝트 선택: `ceo-blaind`
   - 왼쪽 메뉴: **Cloud Storage** → **Buckets**

6. **버킷 선택 및 CORS 설정**
   - 버킷 목록에서 버킷 찾기
   - 버킷 이름 클릭
   - **Configuration** 탭 클릭
   - **CORS** 섹션 → **Edit CORS configuration**
   - `cors.json` 내용 붙여넣기
   - **Save**

---

### 방법 2: 직접 URL로 버킷 접근 (권장)

다음 URL을 브라우저에서 직접 열기:

```
https://console.cloud.google.com/storage/browser/ceo-blaind.firebasestorage.app?project=ceo-blaind
```

또는:

```
https://console.cloud.google.com/storage/browser?project=ceo-blaind
```

---

### 방법 3: Firebase Console에서 Google Cloud Console로 바로 이동

1. **Firebase Console → Storage**
   - https://console.firebase.google.com/project/ceo-blaind/storage

2. **페이지 상단 오른쪽**
   - "Cloud Console에서 열기" 또는 "Open in Cloud Console" 버튼 클릭
   - (버튼이 있는 경우)

---

### 방법 4: gsutil로 직접 설정 (터미널)

버킷 이름이 확실하다면 터미널에서 직접 설정:

```powershell
gsutil cors set cors.json gs://ceo-blaind.firebasestorage.app
```

**참고:** Firebase Storage 버킷의 실제 gsutil 이름이 다를 수 있습니다.
- 표시 이름: `ceo-blaind.firebasestorage.app`
- 실제 이름: `ceosoop` 또는 `ceo-blaind.appspot.com`

---

## 🔍 버킷 이름이 다른 경우

만약 `ceo-blaind.firebasestorage.app`로 CORS 설정이 안 되면:

1. **실제 버킷 이름 확인**
   ```powershell
   gsutil ls
   ```
   또는
   ```powershell
   gsutil ls -p ceo-blaind
   ```

2. **나온 버킷 이름에 CORS 설정**
   ```powershell
   gsutil cors set cors.json gs://실제버킷이름
   ```

---

## 📋 CORS 설정 내용 (복사용)

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

---

## ✅ 확인 방법

CORS 설정 후:
1. **브라우저 완전히 재시작**
2. **파일 업로드 다시 시도**
3. **개발자 도구(F12) → Network 탭**
   - OPTIONS 요청이 200 상태여야 함
   - POST 요청도 성공해야 함

---

## 🚨 여전히 안 되면

1. **모든 가능한 버킷에 CORS 설정**
   - `ceo-blaind.firebasestorage.app`
   - `ceo-blaind.appspot.com`
   - `ceosoop`
   - 기타 관련 버킷

2. **프로젝트 권한 확인**
   - Google Cloud Console에서 프로젝트에 접근 권한이 있는지 확인

3. **Firebase Console에서 Storage 활성화 확인**
   - Firebase Console → Storage
   - Storage가 활성화되어 있는지 확인


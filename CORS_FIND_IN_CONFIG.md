# Configuration 탭에서 CORS 설정 찾기 - 상세 가이드

## 📍 Configuration 탭에서 CORS 위치

현재 Configuration 탭이 열려 있습니다. CORS 설정은 다음과 같이 찾으세요:

### ⚠️ 중요: CORS는 Configuration 탭의 맨 아래쪽에 있습니다!

1. **Configuration 탭 확인**
   - 현재 "configuration" 탭이 활성화되어 있음 ✅

2. **페이지를 끝까지 스크롤**
   - 마우스 휠을 **아래로 계속** 내리세요
   - 또는 **Page Down** 키를 누르세요
   - **End** 키를 눌러 페이지 맨 아래로 이동

3. **찾아야 할 섹션들** (위에서 아래 순서):
   - overview
   - replication
   - tag
   - label
   - Cloud Console URL
   - gsutil URI
   - privilege
   - protection
   - Object lifecycle
   - Location-independent cache
   - **← 여기까지 스크롤하세요**
   - **CORS** ← **여기에 있습니다!**

---

## 🔍 CORS 섹션이 보이지 않으면

### 방법 1: 검색 사용
1. **Ctrl + F** (또는 **Cmd + F**)
2. 검색창에 **"CORS"** 입력
3. 또는 **"Cross-origin"** 입력
4. 찾은 결과 클릭

### 방법 2: 스크롤바 확인
- Configuration 탭 오른쪽에 스크롤바가 있는지 확인
- 스크롤바를 **맨 아래로** 드래그

### 방법 3: 키보드 단축키
- **Ctrl + End**: 페이지 맨 아래로 이동
- **Page Down**: 한 화면씩 아래로

---

## 📋 CORS 설정 내용 (복사용)

CORS 섹션을 찾았다면:

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

## ✅ 터미널로 설정 (대안)

Configuration 탭에서 찾기 어려우면 터미널 사용:

```powershell
gsutil cors set cors.json gs://ceo-blaind.firebasestorage.app
```

터미널에서 설정하면 콘솔에서 찾을 필요가 없습니다!


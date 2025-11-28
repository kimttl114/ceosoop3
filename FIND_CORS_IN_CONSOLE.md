# Google Cloud Console에서 CORS 설정 찾기

## 🔍 Configuration 탭에서 CORS 찾기

현재 Configuration 탭이 열려 있습니다. CORS 설정을 찾는 방법:

### 방법 1: Configuration 탭에서 아래로 스크롤
1. **Configuration 탭이 열려 있음** ✅
2. **아래로 스크롤** (마우스 휠 또는 스크롤바 사용)
3. **"CORS" 또는 "Cross-origin resource sharing"** 섹션 찾기
4. "Edit CORS configuration" 버튼 클릭

### 방법 2: 검색 기능 사용
1. Configuration 탭에서 **Ctrl + F** (찾기)
2. **"CORS"** 또는 **"Cross"** 입력
3. 찾은 항목 클릭

### 방법 3: 일반적인 위치
CORS 설정은 보통 Configuration 탭의:
- **아래쪽 섹션**에 위치
- **"Networking"**, **"Access control"**, 또는 **"Security"** 관련 섹션 근처
- **"Location-independent cache"** 섹션 아래

---

## 📋 CORS 설정 내용 (복사용)

CORS 섹션을 찾았다면, 다음 JSON을 붙여넣으세요:

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

## 🔄 CORS 섹션이 안 보이는 경우

### 대안 1: gsutil 명령어 사용 (터미널)
```powershell
gsutil cors set cors.json gs://ceo-blaind.firebasestorage.app
```

### 대안 2: API로 설정
1. Google Cloud Console → APIs & Services → Enable APIs
2. Cloud Storage JSON API 활성화 확인
3. gsutil 사용

---

## ✅ 확인
CORS 설정 후:
- 1-2분 대기
- 브라우저 재시작
- 파일 업로드 테스트


# Configuration 탭에서 CORS 설정 찾기

## 🔍 CORS 설정 위치

Configuration 탭에서 CORS를 찾는 방법:

### 방법 1: 아래로 스크롤
1. **Configuration 탭이 열려 있음** ✅
2. **페이지를 아래로 스크롤** (마우스 휠 사용)
3. 다음 섹션들을 지나가세요:
   - Location-independent cache
   - 그 아래에 **"CORS"** 또는 **"Cross-origin resource sharing"** 섹션이 있습니다

### 방법 2: 검색 기능 사용
1. **Configuration 탭에서** `Ctrl + F` (Windows) 또는 `Cmd + F` (Mac)
2. 검색창에 **"CORS"** 입력
3. 찾은 항목 클릭

### 방법 3: 직접 섹션 찾기
Configuration 탭에서 다음 순서로 섹션을 확인:
1. overview
2. replication
3. tag
4. label
5. Cloud Console URL
6. gsutil URI
7. privilege
8. protection
9. Object lifecycle
10. **Location-independent cache** ← 여기 아래
11. **CORS** ← 여기에 있을 가능성 높음!

---

## 📝 CORS 설정 내용

CORS 섹션을 찾았다면:
1. **"Edit CORS configuration"** 또는 **"편집"** 버튼 클릭
2. 다음 JSON을 붙여넣기:

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

3. **Save** (저장) 클릭

---

## 🚨 CORS 섹션이 정말 없는 경우

일부 버킷에서는 CORS 설정이 다른 위치에 있을 수 있습니다:

### 대안 1: 다른 탭 확인
- **"privilege"** 탭 확인
- **"protection"** 탭 확인

### 대안 2: 상단 메뉴에서
- Configuration 탭 상단의 다른 메뉴 아이템 확인
- "Networking" 또는 "Security" 관련 메뉴

### 대안 3: 터미널 사용 (가장 확실)
터미널에서 직접 설정:
```powershell
gsutil cors set cors.json gs://ceo-blaind.firebasestorage.app
```

---

## 💡 빠른 팁

1. **스크롤**: Configuration 탭에서 끝까지 스크롤
2. **검색**: Ctrl+F로 "CORS" 검색
3. **시각적 확인**: "Edit" 또는 "편집" 버튼이 있는 섹션 찾기


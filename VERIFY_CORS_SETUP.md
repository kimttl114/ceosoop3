# CORS 설정 확인 및 적용 가이드

## 현재 상황
CORS 에러가 계속 발생합니다. Google Cloud Console에서 CORS 설정을 확인하고 적용해야 합니다.

## 🔍 CORS 설정 확인 방법

### Step 1: Google Cloud Console 접속

1. **브라우저 새 탭 열기**
2. **접속:** https://console.cloud.google.com
3. **로그인** (Firebase와 같은 계정)

### Step 2: Storage Bucket 열기

1. 왼쪽 햄버거 메뉴 (☰) 클릭
2. **"Cloud Storage"** 클릭
3. **"Buckets"** 클릭
4. 목록에서 찾기: **`ceo-blaind.firebasestorage.app`** 클릭

### Step 3: CORS 설정 확인

1. 상단 탭에서 **"Configuration"** 클릭
2. 아래로 스크롤하여 **"CORS"** 섹션 찾기
3. **현재 CORS 설정이 있는지 확인**

### Step 4-A: CORS 설정이 없는 경우

**"Edit CORS configuration"** 버튼 클릭 후 아래 JSON 붙여넣기:

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

**⚠️ 중요:**
- `"OPTIONS"` 메서드가 반드시 포함되어야 합니다!
- 모든 헤더가 포함되어야 합니다!

### Step 4-B: CORS 설정이 이미 있는 경우

1. **"Edit CORS configuration"** 클릭
2. **기존 내용을 모두 삭제**
3. 위의 JSON 다시 붙여넣기
4. **"OPTIONS"** 메서드가 포함되어 있는지 확인
5. **"Save"** 클릭

## ✅ CORS 설정 확인 체크리스트

설정 후 확인할 사항:

- [ ] `"OPTIONS"` 메서드가 포함되어 있음
- [ ] `"http://localhost:3000"`이 origin에 포함되어 있음
- [ ] 모든 필수 헤더가 포함되어 있음
- [ ] 설정이 저장되었는지 확인
- [ ] 1-2분 대기 (설정 적용 시간)

## 🧪 테스트 방법

### 1. 브라우저 완전히 재시작

1. **모든 브라우저 창 닫기**
2. **브라우저 다시 열기**
3. **localhost:3000 접속**

### 2. 시크릿 모드에서 테스트

1. **Ctrl + Shift + N** (시크릿 모드)
2. **localhost:3000 접속**
3. **로그인**
4. **이미지 업로드 시도**

### 3. Network 탭에서 확인

1. **F12** → **Network 탭**
2. **이미지 업로드 시도**
3. **요청 상태 확인:**
   - **OPTIONS 요청**이 **200 OK**인지 확인
   - **POST 요청**이 **200 OK**인지 확인

## 🚨 여전히 안 되면

### 확인할 사항:

1. **CORS 설정이 정확히 저장되었는지**
   - Google Cloud Console에서 다시 확인
   - JSON 형식이 올바른지 확인

2. **OPTIONS 메서드 확인**
   - CORS 설정에서 `"OPTIONS"`가 있는지 반드시 확인
   - 이게 없으면 preflight 요청이 실패합니다

3. **브라우저 캐시**
   - Ctrl + Shift + Delete
   - 캐시 완전히 삭제
   - 또는 시크릿 모드 사용

4. **Firebase Storage Rules 확인**
   - Firebase Console → Storage → Rules
   - 올바른 규칙이 설정되어 있는지 확인

## 📝 참고

- CORS 설정 변경은 **즉시 적용**되지만, 최대 1-2분 걸릴 수 있습니다
- **OPTIONS 메서드**는 preflight 요청에 필수입니다
- `localhost:3000`이 반드시 origin에 포함되어야 합니다

## 💡 빠른 해결

가장 빠른 방법:

1. Google Cloud Console 접속
2. Cloud Storage → Buckets → [Bucket 선택]
3. Configuration → CORS → Edit
4. 기존 내용 삭제
5. 프로젝트의 `cors.json` 파일 내용 복사
6. 붙여넣기
7. **"OPTIONS"가 있는지 확인**
8. Save
9. 1-2분 대기
10. 브라우저 완전히 재시작
11. 다시 테스트




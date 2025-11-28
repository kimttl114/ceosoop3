# 🚨 CORS 에러 해결 - 지금 바로 적용하세요!

## 현재 상황
콘솔에 CORS 에러가 계속 나타나고 있습니다:
```
Response to preflight request doesn't pass access control check
```

## ⚡ 지금 바로 해야 할 것 (5분)

### 1단계: Google Cloud Console 열기
1. 새 탭에서 https://console.cloud.google.com 접속
2. Firebase 프로젝트와 같은 Google 계정으로 로그인

### 2단계: Storage Bucket 찾기
1. 왼쪽 메뉴 ☰ 클릭
2. **"Cloud Storage"** → **"Buckets"** 클릭
3. **`ceo-blaind.firebasestorage.app`** 찾아서 클릭

### 3단계: CORS 설정 변경
1. 상단 탭 **"Configuration"** 클릭
2. 아래로 스크롤
3. **"CORS"** 섹션 찾기
4. **"Edit CORS configuration"** 버튼 클릭

### 4단계: 아래 JSON 붙여넣기

**기존 내용을 모두 삭제하고** 아래 내용을 붙여넣으세요:

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

### 5단계: 저장
1. **"Save"** 버튼 클릭
2. 몇 초 대기 (설정 적용)

### 6단계: 테스트
1. **브라우저 완전히 닫기** (모든 탭 닫기)
2. **브라우저 다시 열기**
3. **localhost:3000 접속**
4. **이미지 업로드 다시 시도**

---

## ✅ 성공 확인

- ✅ Console 탭에 CORS 에러가 사라짐
- ✅ Network 탭에서 요청이 200 OK 상태
- ✅ 이미지가 성공적으로 업로드됨

---

## 📋 빠른 복사용

프로젝트의 `cors.json` 파일 내용을 복사해서 사용하세요!




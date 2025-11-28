# CORS 설정 - 구성 탭 가이드

## 현재 화면에서 해야 할 일

스크린샷을 보니 Google Cloud Console의 Storage 버킷 페이지에 있습니다!

### CORS 설정 위치

**현재 보이는 탭:**
- "객체" (Objects) 탭이 선택되어 있음

**CORS 설정은 여기에:**
- **"구성" (Configuration)** 탭 클릭!

### 단계별 가이드

#### Step 1: 구성 탭으로 이동

1. 버킷 이름 아래에 있는 탭 목록에서
2. **"구성" (Configuration)** 탭 클릭
3. (Objects, 구성, 권한, 보호 등의 탭이 있습니다)

#### Step 2: CORS 섹션 찾기

1. **구성** 탭에서 아래로 스크롤
2. **"CORS"** 섹션 찾기
3. **"Edit CORS configuration"** 또는 **"CORS 구성 편집"** 버튼 클릭

#### Step 3: CORS 설정 입력

기존 내용을 모두 삭제하고 아래 JSON 붙여넣기:

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

#### Step 4: 저장

1. **"저장" (Save)** 버튼 클릭
2. 저장 성공 메시지 확인
3. **1-2분 대기** (설정 적용 시간)

---

## 📍 현재 화면에서

1. **"구성" (Configuration)** 탭 클릭 (Objects 탭 옆에 있습니다)
2. 아래로 스크롤
3. **"CORS"** 섹션 찾기
4. 편집 버튼 클릭
5. 위의 JSON 붙여넣기
6. 저장

---

## ⚠️ 중요 체크리스트

- [ ] "구성" (Configuration) 탭으로 이동
- [ ] CORS 섹션 찾기
- [ ] "OPTIONS" 메서드 포함 확인
- [ ] "http://localhost:3000" origin 포함 확인
- [ ] 저장 완료
- [ ] 1-2분 대기
- [ ] 브라우저 재시작

---

## 🔍 CORS 섹션이 안 보이면

1. **아래로 더 스크롤** - CORS는 구성 탭의 아래쪽에 있습니다
2. **"고급 설정"** 또는 **"Advanced Settings"** 섹션 확인
3. **브라우저 새로고침** 후 다시 확인

---

## 💡 참고

프로젝트의 `cors.json` 파일을 열어서 내용을 복사하면 됩니다!




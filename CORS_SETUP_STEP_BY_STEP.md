# CORS 설정 - 단계별 가이드 (버킷 목록 안 뜰 때)

## 🔍 현재 상황
- **환경 변수의 버킷**: `ceo-blaind.firebasestorage.app`
- **gsutil에서 찾은 버킷**: `gs://ceosoop/` (CORS 설정 완료)
- **문제**: 실제 사용 중인 버킷과 다를 수 있음

## ✅ 해결 방법

### 방법 1: Firebase Console에서 확인 후 Google Cloud Console로 이동 (가장 확실)

#### Step 1: Firebase Console 접속
1. 브라우저에서 열기:
   ```
   https://console.firebase.google.com/project/ceo-blaind/storage
   ```

2. **Storage 페이지가 열림**
   - 페이지 상단에 버킷 이름이 표시됨
   - 예: `ceo-blaind.firebasestorage.app`

#### Step 2: Google Cloud Console로 이동
1. **같은 브라우저 탭에서 URL 변경**:
   - 주소창에 다음 입력:
   ```
   https://console.cloud.google.com/storage/browser?project=ceo-blaind
   ```

2. **또는 새 탭에서**:
   - https://console.cloud.google.com 접속
   - 상단에서 프로젝트 선택: `ceo-blaind`
   - 왼쪽 메뉴: **Cloud Storage** → **Buckets**

#### Step 3: 버킷 찾기
버킷 목록이 안 보이면:
1. **검색창 사용**
   - 페이지 상단 검색창에 `firebasestorage` 입력
   - 또는 `ceo-blaind` 입력

2. **필터 사용**
   - 프로젝트 필터 확인
   - `ceo-blaind` 프로젝트가 선택되어 있는지 확인

#### Step 4: CORS 설정
1. 버킷 이름 클릭 (또는 검색 결과에서)
2. **Configuration** 탭 클릭
3. 아래로 스크롤하여 **CORS** 섹션 찾기
4. **Edit CORS configuration** 클릭
5. `cors.json` 파일 내용 붙여넣기
6. **Save** 클릭

---

### 방법 2: 직접 URL 접근 (가장 빠름)

다음 URL을 브라우저에서 직접 열기:

```
https://console.cloud.google.com/storage/browser/ceo-blaind.firebasestorage.app/configuration?project=ceo-blaind
```

또는:

```
https://console.cloud.google.com/storage/browser?project=ceo-blaind
```

---

### 방법 3: Firebase Console에서 Google Cloud Console 링크 사용

1. **Firebase Console → Storage**
   ```
   https://console.firebase.google.com/project/ceo-blaind/storage
   ```

2. **페이지 상단 오른쪽**
   - "Cloud Console에서 열기" 또는 유사한 버튼 찾기
   - (버튼이 있는 경우 자동으로 이동)

---

### 방법 4: 환경 변수 변경 (임시 해결책)

만약 `ceosoop` 버킷을 사용해도 된다면:

1. `.env.local` 파일 수정:
   ```
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ceosoop
   ```

2. 개발 서버 재시작

**⚠️ 주의**: 이 방법은 기존 업로드된 파일 경로가 바뀔 수 있으므로 권장하지 않습니다.

---

## 📋 CORS 설정 내용

다음 내용을 복사해서 붙여넣으세요:

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

## 🔍 버킷 목록이 안 보이는 이유

1. **프로젝트 권한 문제**
   - Storage Admin 권한이 없을 수 있음
   - 프로젝트 소유자에게 권한 요청

2. **프로젝트 선택 오류**
   - 잘못된 프로젝트가 선택되어 있을 수 있음
   - 상단 드롭다운에서 프로젝트 확인

3. **API 미활성화**
   - Cloud Storage JSON API가 활성화되지 않았을 수 있음
   - APIs & Services → Enabled APIs에서 확인

---

## ✅ 확인 및 테스트

CORS 설정 후:
1. **1-2분 대기** (설정 적용 시간)
2. **브라우저 완전히 재시작**
3. **파일 업로드 테스트**
4. **개발자 도구(F12) → Network 탭 확인**
   - OPTIONS 요청: 200 상태
   - POST 요청: 성공

---

## 🚨 여전히 안 되면

1. **Firebase Console에서 Storage 확인**
   - Storage가 활성화되어 있는지 확인
   - 버킷이 존재하는지 확인

2. **프로젝트 관리자에게 문의**
   - Storage Admin 권한 요청
   - 버킷 이름 확인

3. **모든 관련 버킷에 CORS 설정**
   - 가능한 모든 버킷 이름에 설정


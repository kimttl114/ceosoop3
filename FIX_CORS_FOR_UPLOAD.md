# 파일 업로드 CORS 오류 해결 (긴급)

## 🔴 현재 문제
- 파일 업로드 시 CORS 오류 발생
- 버킷: `ceo-blaind.firebasestorage.app`
- 오류: `Response to preflight request doesn't pass access control check`

## ✅ 해결 방법: Google Cloud Console에서 직접 설정

### Step 1: Google Cloud Console 접속
1. https://console.cloud.google.com 접속
2. 프로젝트 선택: `ceo-blaind` (또는 Firebase 프로젝트 이름)

### Step 2: Storage 버킷 찾기
1. 왼쪽 메뉴: **Cloud Storage** → **Buckets** 클릭
2. 버킷 목록에서 다음 중 하나를 찾으세요:
   - `ceo-blaind.firebasestorage.app`
   - `ceo-blaind.appspot.com`
   - `ceosoop` (이미 CORS 설정됨)
   - 또는 다른 이름

### Step 3: CORS 설정 적용
1. 버킷 이름 클릭
2. 상단 탭: **Configuration** (구성) 클릭
3. 아래로 스크롤하여 **CORS** 섹션 찾기
4. **Edit CORS configuration** 클릭
5. 다음 JSON을 붙여넣기:

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

6. **Save** (저장) 클릭
7. 1-2분 대기 (설정 적용 시간)

### Step 4: 브라우저 새로고침
1. 브라우저 완전히 종료 후 재시작
2. 또는 강제 새로고침: `Ctrl + Shift + R`
3. 파일 업로드 다시 시도

## 🔍 버킷 이름 확인 방법

### 방법 1: Firebase Console에서 확인
1. Firebase Console: https://console.firebase.google.com
2. 프로젝트 선택
3. 왼쪽 메뉴: **Storage** 클릭
4. 상단에 표시된 버킷 이름 확인

### 방법 2: 환경 변수 확인
`.env.local` 파일에서:
```
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
```
이 값이 실제 버킷 이름입니다.

### 방법 3: 코드에서 확인
브라우저 콘솔에서:
```javascript
console.log(firebase.app().options.storageBucket)
```

## ⚠️ 중요 사항

1. **모든 버킷에 CORS 설정 필요**
   - Firebase 프로젝트에 여러 버킷이 있을 수 있음
   - 각 버킷마다 CORS 설정 필요

2. **설정 적용 시간**
   - CORS 설정 변경 후 1-2분 소요
   - 즉시 반영되지 않을 수 있음

3. **브라우저 캐시**
   - 설정 후 브라우저를 완전히 재시작하는 것이 좋음

## 🚨 여전히 안 되면

1. **Firebase Storage Rules 확인**
   - Firebase Console → Storage → Rules
   - 업로드 권한이 있는지 확인

2. **네트워크 탭 확인**
   - 개발자 도구(F12) → Network 탭
   - OPTIONS 요청이 성공하는지 확인
   - 200 상태 코드여야 함

3. **환경 변수 확인**
   - `.env.local` 파일의 `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` 값 확인
   - 올바른 버킷 이름인지 확인


# Firebase Storage 업로드 디버깅 가이드

## 현재 상황 분석

네트워크 탭에서 확인할 수 있는 정보:
- ✅ Authorization 헤더에 JWT 토큰 포함됨 (인증 OK)
- ⚠️ "Provisional headers are shown" 메시지
- ⚠️ 요청이 완료되지 않았을 가능성

## "Provisional headers are shown" 의미

이 메시지는 다음을 의미할 수 있습니다:

1. **CORS 문제**: 브라우저가 요청을 차단
2. **요청이 아직 진행 중**: 업로드가 완료되지 않음
3. **네트워크 오류**: 연결 문제

## 확인 방법

### 1. Network 탭에서 확인

**요청 상태 확인:**
- **Pending (대기 중)**: 요청이 시작되었지만 응답을 받지 못함
- **Failed (실패)**: 요청이 실패함 (빨간색 표시)
- **CORS Error**: 콘솔에 CORS 에러 메시지 표시

**응답 확인:**
1. Network 탭에서 해당 요청 클릭
2. "Response" 탭 확인
3. "Preview" 탭 확인
4. 상태 코드 확인:
   - `200 OK`: 성공
   - `403 Forbidden`: 권한 없음
   - `404 Not Found`: 파일/경로 없음
   - `CORS Error`: CORS 설정 문제

### 2. Console 탭에서 확인

브라우저 콘솔(F12 → Console)에서:
- CORS 관련 에러 메시지
- Firebase Storage 에러
- 네트워크 에러

### 3. 일반적인 문제 해결

#### 문제 1: CORS 에러
**증상:**
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**해결:**
- Google Cloud Console에서 CORS 설정 확인
- `cors.json` 설정이 올바르게 적용되었는지 확인

#### 문제 2: 403 Forbidden
**증상:**
- 상태 코드: 403
- 응답: "Permission denied"

**해결:**
- Firebase Storage Security Rules 확인
- 사용자가 로그인되어 있는지 확인
- 인증 토큰이 유효한지 확인

#### 문제 3: 업로드 타임아웃
**증상:**
- 요청이 계속 Pending 상태
- 시간이 오래 걸림

**해결:**
- 파일 크기 확인 (10MB 이하 권장)
- 네트워크 연결 확인
- Firebase Storage 할당량 확인

## 단계별 디버깅

### Step 1: 요청 상태 확인
1. Network 탭 열기
2. Firebase Storage 요청 찾기
3. 상태 확인:
   - Pending → CORS 또는 네트워크 문제 가능
   - Failed → 에러 메시지 확인
   - Success → 업로드 성공!

### Step 2: 응답 확인
1. 요청 클릭
2. "Response" 탭 확인
3. 에러 메시지 읽기

### Step 3: 요청 헤더 확인
1. "Headers" 탭 확인
2. Authorization 헤더 존재 확인
3. Content-Type 확인

### Step 4: 콘솔 에러 확인
1. Console 탭 확인
2. 빨간색 에러 메시지 확인
3. 에러 코드 및 메시지 확인

## 테스트 방법

### 간단한 업로드 테스트
1. 작은 이미지 파일 선택 (1MB 이하)
2. 업로드 시도
3. Network 탭에서 요청 확인
4. 성공하면 큰 파일도 시도

### 인증 확인
브라우저 콘솔에서:
```javascript
// 현재 사용자 확인
import { getAuth } from 'firebase/auth'
const auth = getAuth()
console.log('User:', auth.currentUser)

// 인증 토큰 확인
if (auth.currentUser) {
  auth.currentUser.getIdToken().then(token => {
    console.log('Token exists:', !!token)
  })
}
```

## 예상되는 해결책

### 1. CORS 설정 확인 (가장 가능성 높음)
- Google Cloud Console 접속
- Storage → Buckets → Configuration → CORS
- `cors.json` 설정 적용 확인

### 2. Storage Rules 확인
- Firebase Console → Storage → Rules
- 규칙이 올바르게 설정되었는지 확인

### 3. 브라우저 캐시 삭제
- 시크릿 모드에서 테스트
- 또는 브라우저 캐시 삭제 후 재시도

## 도움이 되는 정보

### Network 탭에서 확인할 항목
- ✅ Request URL
- ✅ Status Code
- ✅ Response Headers
- ✅ Request Headers (Authorization 포함)
- ✅ Response Body (에러 메시지)

### Console 탭에서 확인할 항목
- ✅ CORS 에러
- ✅ Firebase Storage 에러
- ✅ 네트워크 에러
- ✅ 인증 에러

## 다음 단계

1. Network 탭에서 요청 상태 확인
2. Response 탭에서 에러 메시지 확인
3. Console 탭에서 에러 로그 확인
4. 위 정보를 바탕으로 문제 해결

---

**현재 요청 URL:**
```
https://firebasestorage.googleapis.com/v0/b/ceo-blaind.firebasestorage.app/o?name=posts%2FrlubHnLGjQOqPupamvitNFkGJ02%2Fimages%2F1764286952022_____.jpg
```

이 URL이 성공적으로 응답하는지 확인하세요!




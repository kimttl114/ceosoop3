# 🔍 안내방송 생성기 500 에러 진단 보고서

## 발견된 문제

### 에러 메시지
```
[VertexAI.ClientError]: got status: 404 Not Found
Publisher Model `projects/ceo-blaind/locations/us-central1/publishers/google/models/gemini-1.5-pro` 
was not found or your project does not have access to it.
```

### 현재 설정 상태
- ✅ 환경 변수 설정: 올바름
  - `GOOGLE_CLOUD_CREDENTIALS`: 유효한 JSON ✅
  - `GOOGLE_VERTEX_AI_PROJECT_ID`: `ceo-blaind` ✅
  - `GOOGLE_VERTEX_AI_LOCATION`: `us-central1` ✅
- ❌ Vertex AI API 접근: 실패 (404 Not Found)

## 가능한 원인

### 1. Vertex AI API가 활성화되지 않음 (가장 가능성 높음)
프로젝트 `ceo-blaind`에서 Vertex AI API가 활성화되지 않았을 수 있습니다.

**해결 방법:**
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 `ceo-blaind` 선택
3. "API 및 서비스" → "라이브러리" 메뉴
4. "Vertex AI API" 검색
5. "사용 설정" 클릭

### 2. 서비스 계정 권한 부족
서비스 계정 `vertex-express@ceo-blaind.iam.gserviceaccount.com`에 Vertex AI 사용 권한이 없을 수 있습니다.

**해결 방법:**
1. [Google Cloud Console](https://console.cloud.google.com/) → IAM 및 관리자
2. 서비스 계정 `vertex-express@ceo-blaind.iam.gserviceaccount.com` 찾기
3. 역할 편집:
   - "Vertex AI 사용자" 역할 추가
   - 또는 "Vertex AI 서비스 에이전트" 역할 추가

### 3. 모델 이름 문제
`gemini-1.5-pro`가 해당 리전에서 사용 불가능할 수 있습니다.

**해결 방법:**
- 코드에서 `gemini-1.5-flash`로 변경 (더 안정적이고 빠름)
- 또는 사용 가능한 모델 확인:
  - `gemini-1.5-flash`
  - `gemini-1.5-pro-latest`
  - `gemini-pro`

### 4. 프로젝트 청구 계정 미연결
Vertex AI는 유료 서비스이므로 청구 계정이 연결되어 있어야 합니다.

**해결 방법:**
1. Google Cloud Console → 청구
2. 청구 계정이 연결되어 있는지 확인
3. 연결되어 있지 않으면 청구 계정 연결

## 즉시 시도할 수 있는 해결 방법

### 방법 1: 더 안정적인 모델 사용 (권장)

코드가 이미 `gemini-1.5-flash`로 변경되었습니다. 개발 서버를 재시작해보세요.

### 방법 2: Google Cloud Console에서 확인

1. **Vertex AI API 활성화 확인:**
   - https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=ceo-blaind
   - "사용 설정" 버튼이 있으면 클릭

2. **서비스 계정 권한 확인:**
   - https://console.cloud.google.com/iam-admin/iam?project=ceo-blaind
   - `vertex-express@ceo-blaind.iam.gserviceaccount.com` 찾기
   - 역할에 "Vertex AI 사용자" 또는 "Vertex AI 서비스 에이전트" 있는지 확인

3. **청구 계정 확인:**
   - https://console.cloud.google.com/billing?project=ceo-blaind
   - 청구 계정이 연결되어 있는지 확인

## 다음 단계

1. ✅ 코드를 `gemini-1.5-flash`로 변경 (완료)
2. ⏳ 개발 서버 재시작 필요
3. ⏳ Google Cloud Console에서 Vertex AI API 활성화 확인
4. ⏳ 서비스 계정 권한 확인

## 테스트 방법

개발 서버 재시작 후:
```bash
node test-api-debug.js
```

성공하면:
- Status: 200
- 응답에 `script`와 `audioBase64` 포함

실패하면:
- Status: 500
- 구체적인 에러 메시지 확인




# 🔧 최종 문제 해결 가이드

## 📍 현재 상황

500 에러가 발생하고 있습니다. 다음 순서대로 확인하세요.

## 🚀 빠른 해결 체크리스트

### 1단계: 서버 로그 확인 ⭐ (가장 중요!)

**개발 서버 터미널에서 확인하세요:**

다음과 같은 로그를 찾아주세요:
```
[Vertex AI] 프로젝트: ceo-blaind, 리전: ...
[Vertex AI] 모델 시도: gemini-1.5-flash
[Vertex AI] 모델 gemini-1.5-flash 실패: ...
============================================================
generate-audio API 오류: {
  ...
}
```

**서버 콘솔의 전체 에러 로그를 복사해서 알려주세요!**

---

### 2단계: 자동 진단 스크립트 실행

터미널에서 실행:

```bash
# 환경 변수 확인
node check-env-keys.js

# API 직접 테스트 (서버 실행 중일 때)
node test-api-error.js
```

---

### 3단계: Vertex AI Studio 접근 테스트 ⭐

**링크**: https://console.cloud.google.com/vertex-ai/generative/language/create/text?project=ceo-blaind

**확인 사항:**
- [ ] 페이지 접속 가능?
- [ ] 모델 드롭다운 클릭 시 Gemini 모델이 보이나요?
  - `gemini-1.5-flash`
  - `gemini-1.5-pro`
  - `gemini-pro`

**결과:**
- ✅ **보이면**: 접근 가능 (코드 문제 가능)
- ❌ **안 보이면**: 프로젝트에서 Gemini 사용 불가 (아래 단계 필요)

---

### 4단계: Generative AI API 활성화

**링크**: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=ceo-blaind

1. 링크 클릭
2. **"사용 설정"** 또는 **"Enable"** 버튼이 보이면 클릭
3. 활성화 완료 대기 (1-2분)

---

### 5단계: 청구 계정 확인

**링크**: https://console.cloud.google.com/billing?project=ceo-blaind

- 청구 계정이 연결되어 있는지 확인
- 연결되어 있지 않으면 연결 필요

---

### 6단계: 리전 확인

현재 코드의 기본 리전: `us-central1`

`.env.local` 파일에 다음이 있는지 확인:
```env
GOOGLE_VERTEX_AI_LOCATION=us-central1
```

또는 `asia-northeast3`를 사용하려면:
```env
GOOGLE_VERTEX_AI_LOCATION=asia-northeast3
```

---

## 🔍 예상 원인별 해결 방법

### 원인 1: Generative AI API 미활성화 (가장 가능성 높음)

**증상:**
- Vertex AI Studio에서 모델이 안 보임
- 모든 모델에서 404 에러

**해결:**
1. https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=ceo-blaind 접속
2. "사용 설정" 클릭
3. 5-10분 대기
4. 다시 테스트

### 원인 2: 청구 계정 미연결

**증상:**
- API는 활성화되어 있지만 모델 접근 불가

**해결:**
1. https://console.cloud.google.com/billing?project=ceo-blaind 접속
2. 청구 계정 연결
3. 다시 테스트

### 원인 3: 리전 문제

**증상:**
- 특정 리전에서 모델 접근 불가

**해결:**
`.env.local`에 추가:
```env
GOOGLE_VERTEX_AI_LOCATION=us-central1
```

그 후 서버 재시작:
```bash
# Ctrl+C로 서버 중지 후
npm run dev
```

---

## 📝 확인해야 할 것들

### 환경 변수 확인

`.env.local` 파일에 다음이 있어야 합니다:

```env
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account",...}
GOOGLE_VERTEX_AI_PROJECT_ID=ceo-blaind
GOOGLE_VERTEX_AI_LOCATION=us-central1
```

**검증:**
```bash
node check-env-keys.js
```

### 서비스 계정 권한 확인

**링크**: https://console.cloud.google.com/iam-admin/iam?project=ceo-blaind

- 서비스 계정: `vertex-express@ceo-blaind.iam.gserviceaccount.com`
- 역할: **"Vertex AI 사용자"** ✅ (이미 할당됨)

---

## 🎯 다음 단계

1. **서버 콘솔 로그 확인** → 전체 에러 메시지 복사
2. **Vertex AI Studio 접근 테스트** → 모델이 보이는지 확인
3. **결과를 알려주세요!**

---

**가장 먼저 할 것**: 
1. 서버 콘솔의 에러 로그 확인
2. `node test-api-error.js` 실행
3. 결과를 알려주세요!



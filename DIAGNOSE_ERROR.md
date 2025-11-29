# 🔍 500 에러 진단 및 해결 가이드

## 현재 상황

스크린샷에서 확인된 에러:
- ❌ `POST http://localhost:3000/api/generate-audio 500 (Internal Server Error)`
- ❌ 에러 메시지: "안내방송 생성 중 오류가 발생했습니다. 환경 변수 설정 및 Google Cloud / Vertex AI 설정을 확인해주세요."

## 진단 단계

### 1단계: 서버 로그 확인 ⭐

**개발 서버 콘솔에서 다음 로그를 확인하세요:**

1. 서버 터미널 창 열기
2. `[Vertex AI]` 로그 확인
   - 어떤 모델을 시도하는지
   - 어떤 에러가 발생하는지
   - 상세 에러 메시지

**예상 로그:**
```
[Vertex AI] 프로젝트: ceo-blaind, 리전: us-central1
[Vertex AI] 모델 시도: gemini-1.5-flash
[Vertex AI] 모델 gemini-1.5-flash 실패: ...
[Vertex AI] 모델 시도: gemini-1.5-pro
...
============================================================
generate-audio API 오류: {
  "type": "MODEL_NOT_FOUND",
  "message": "...",
  ...
}
```

### 2단계: 환경 변수 확인

`.env.local` 파일에서 다음 변수들이 올바르게 설정되어 있는지 확인:

```bash
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account",...}
GOOGLE_VERTEX_AI_PROJECT_ID=ceo-blaind
GOOGLE_VERTEX_AI_LOCATION=us-central1
```

**확인 명령어:**
```bash
node check-env-keys.js
```

### 3단계: Vertex AI Studio에서 모델 접근 테스트 ⭐

**가장 중요한 확인 사항:**

링크: https://console.cloud.google.com/vertex-ai/generative/language/create/text?project=ceo-blaind

이 페이지에서:
- ✅ **모델 드롭다운을 클릭했을 때 Gemini 모델이 보이나요?**
  - `gemini-1.5-flash`
  - `gemini-1.5-pro`
  - `gemini-pro`

**결과에 따른 조치:**

| 상황 | 의미 | 조치 |
|------|------|------|
| ✅ 모델이 보임 | 접근 가능 (코드 문제 가능) | 코드/설정 재검토 |
| ❌ 모델이 안 보임 | 접근 불가 (API 설정 문제) | 아래 단계 진행 |

### 4단계: Generative AI API 활성화 확인

Vertex AI API와 Generative AI API는 **별개**입니다!

**확인 링크:**
https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=ceo-blaind

1. 링크 클릭
2. **"사용 설정"** 또는 **"Enable"** 버튼이 보이면 클릭
3. 활성화 완료 대기 (1-2분)

### 5단계: 청구 계정 확인

Gemini 모델은 유료 서비스입니다. 청구 계정이 필요합니다.

**확인 링크:**
https://console.cloud.google.com/billing?project=ceo-blaind

- 청구 계정이 연결되어 있는지 확인
- 연결되어 있지 않으면 연결 필요

## 해결 방법

### 방법 1: Generative AI API 활성화 (가장 가능성 높음)

1. https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=ceo-blaind 접속
2. **"사용 설정"** 클릭
3. 5-10분 대기
4. 다시 테스트

### 방법 2: Vertex AI Studio에서 직접 테스트

1. https://console.cloud.google.com/vertex-ai/generative/language/create/text?project=ceo-blaind 접속
2. 모델 선택 후 텍스트 생성 시도
3. 작동하면: 코드 문제 가능
4. 작동 안 하면: API 설정 문제

### 방법 3: 에러 로그 기반 해결

서버 콘솔에서 확인한 에러 타입에 따라:

#### `MODEL_NOT_FOUND` 에러
- **원인**: 프로젝트에서 Gemini 모델에 접근 불가
- **해결**: 
  1. Generative AI API 활성화
  2. 청구 계정 연결
  3. Vertex AI Studio에서 접근 가능한지 확인

#### `PERMISSION_DENIED` 에러
- **원인**: 서비스 계정 권한 부족
- **해결**: "Vertex AI 사용자" 역할 재확인

#### `AUTH_ERROR` 에러
- **원인**: 자격 증명 문제
- **해결**: `.env.local`의 `GOOGLE_CLOUD_CREDENTIALS` 재확인

## 즉시 할 일

1. **서버 콘솔 로그 확인** (가장 중요!)
   - 어떤 에러가 발생하는지 정확히 확인

2. **Vertex AI Studio 접근 테스트**
   - https://console.cloud.google.com/vertex-ai/generative/language/create/text?project=ceo-blaind
   - 모델이 보이는지 확인

3. **Generative AI API 활성화 확인**
   - https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=ceo-blaind
   - 활성화되어 있는지 확인

## 추가 도구

### 상세 에러 확인 스크립트

```bash
node test-vertex-ai-detailed.js
```

### API 직접 테스트

서버가 실행 중일 때:
```bash
node test-api-direct.js
```

---

**가장 중요한 것**: 서버 콘솔에서 실제 에러 메시지를 확인하세요!



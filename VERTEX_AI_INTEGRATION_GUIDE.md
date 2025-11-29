# Vertex AI 통합 가이드 (업데이트)

## ✅ 확인 사항

### 1. Text-to-Speech API 지원 상태
- **지원 중단되지 않음**: Google Cloud Text-to-Speech API는 계속 지원됩니다
- 공식 지원 중단 발표 없음
- Neural2 음성 (고품질 한국어) 사용 가능

### 2. Vertex AI 통합 상태

현재 구현:
- ✅ Vertex AI (Gemini)와 Text-to-Speech가 **같은 서비스 계정 JSON을 공유** 가능
- ✅ 하나의 자격 증명으로 모든 Google Cloud 서비스 사용 가능

## 🔧 통합된 인증 방식

### 단일 자격 증명 사용 (권장)

**하나의 서비스 계정 JSON으로 모든 서비스 사용:**

```env
# 최우선: 통합 자격 증명 (Vertex AI + TTS 공통)
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"your-project",...}

# 프로젝트 ID
GOOGLE_VERTEX_AI_PROJECT_ID=your-project-id
GOOGLE_VERTEX_AI_LOCATION=asia-northeast3
```

### 대안: 개별 자격 증명

```env
# Vertex AI용 (또는 GOOGLE_CLOUD_CREDENTIALS 재사용)
GOOGLE_VERTEX_AI_CREDENTIALS={"type":"service_account",...}

# Text-to-Speech용 (또는 GOOGLE_CLOUD_CREDENTIALS 재사용)
GOOGLE_CLOUD_TTS_CREDENTIALS={"type":"service_account",...}
```

## 📋 설정 우선순위

코드에서 자격 증명을 찾는 순서:

1. **`GOOGLE_CLOUD_CREDENTIALS`** (최우선 - 통합 자격 증명)
2. `GOOGLE_VERTEX_AI_CREDENTIALS`
3. `GOOGLE_CLOUD_TTS_CREDENTIALS`

프로젝트 ID 찾는 순서:

1. `GOOGLE_VERTEX_AI_PROJECT_ID`
2. `GOOGLE_CLOUD_PROJECT_ID`
3. 자격 증명 JSON 내부의 `project_id`

## 🎯 설정 방법 (Vercel)

### 방법 1: 통합 자격 증명 (권장 - 가장 간단)

1. Google Cloud Console에서 서비스 계정 생성
2. JSON 키 파일 다운로드
3. Vercel 환경 변수에 한 번만 추가:

```env
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"your-project",...}
GOOGLE_VERTEX_AI_PROJECT_ID=your-project-id
GOOGLE_VERTEX_AI_LOCATION=asia-northeast3
```

### 방법 2: 개별 자격 증명 (같은 JSON 재사용)

같은 서비스 계정 JSON을 두 번 복사:

```env
GOOGLE_VERTEX_AI_CREDENTIALS={"type":"service_account",...}
GOOGLE_CLOUD_TTS_CREDENTIALS={"type":"service_account",...}
GOOGLE_VERTEX_AI_PROJECT_ID=your-project-id
GOOGLE_VERTEX_AI_LOCATION=asia-northeast3
```

## 🔍 인증 방식 설명

### 서비스 계정 (Service Account) vs API Key

**현재 사용 방식: 서비스 계정 JSON**
- ✅ Google Cloud의 표준 인증 방식
- ✅ 여러 서비스에서 재사용 가능
- ✅ 세밀한 권한 관리 가능
- ✅ Vercel 환경에서 안전하게 사용 가능

**API Key 방식:**
- Vertex AI는 API Key를 지원하지 않음 (서비스 계정만 사용)
- 일부 Google Cloud API는 API Key 지원하지만, Vertex AI는 제외

## ✅ 완료 상태

### 이미 통합된 부분:
- ✅ Vertex AI와 Text-to-Speech가 같은 자격 증명 공유 가능
- ✅ 우선순위 기반 자격 증명 찾기
- ✅ 프로젝트 ID 자동 추출

### 개선 사항 (방금 적용):
- ✅ `GOOGLE_CLOUD_CREDENTIALS` 최우선 사용 (통합 자격 증명)
- ✅ 자격 증명 JSON의 `project_id` 자동 추출
- ✅ 더 명확한 오류 메시지

## 📝 코드 동작 방식

```typescript
// 1. 통합 자격 증명 가져오기
const { credentials, projectId, location } = await getGoogleCredentials()
// → GOOGLE_CLOUD_CREDENTIALS 우선 사용

// 2. Vertex AI 사용
const vertexAI = new VertexAI({ project: projectId, location })
// → 같은 credentials 사용

// 3. Text-to-Speech 사용
const ttsClient = new TextToSpeechClient({ credentials })
// → 같은 credentials 사용
```

## 🚀 다음 단계

1. Vercel 환경 변수에 `GOOGLE_CLOUD_CREDENTIALS` 추가 (또는 기존 변수 유지)
2. 서버 재시작
3. 테스트

## ❓ FAQ

**Q: API Key 방식은 사용 불가능한가요?**
A: Vertex AI는 서비스 계정만 지원합니다. API Key는 지원하지 않습니다.

**Q: Text-to-Speech API가 지원 중단되나요?**
A: 아니요. 계속 지원되고 있으며 공식 지원 중단 발표도 없습니다.

**Q: 하나의 자격 증명으로 충분한가요?**
A: 네. `GOOGLE_CLOUD_CREDENTIALS` 하나만 설정하면 Vertex AI와 TTS 모두 사용 가능합니다.


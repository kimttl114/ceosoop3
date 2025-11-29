# 🔧 Vertex AI Generative AI 활성화 가이드

## 🔍 발견된 문제

**404 Not Found** 에러가 계속 발생합니다:
```
Publisher Model `projects/ceo-blaind/locations/us-central1/publishers/google/models/gemini-1.5-flash` 
was not found or your project does not have access to it.
```

### 근본 원인:

Vertex AI API가 활성화되어 있어도, **Gemini 모델을 사용하려면 별도의 활성화가 필요할 수 있습니다**.

## ✅ 해결 방법

### 1단계: Generative AI API 활성화 확인

Vertex AI API와 Generative AI API는 다를 수 있습니다.

**확인 링크**: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=ceo-blaind

1. 위 링크를 클릭
2. **"사용 설정"** 또는 **"Enable"** 버튼이 있으면 클릭
3. 활성화 완료 대기 (1-2분)

### 2단계: Vertex AI API 상태 확인

**확인 링크**: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=ceo-blaind

- 이미 활성화되어 있다고 확인되었습니다 ✅

### 3단계: Vertex AI Studio에서 모델 접근 테스트

**Vertex AI Studio 링크**: https://console.cloud.google.com/vertex-ai/generative/language/create/text?project=ceo-blaind

1. 위 링크를 클릭
2. 모델 선택 드롭다운 확인
3. Gemini 모델이 보이는지 확인
   - ✅ 보이면: 모델 접근 가능 (코드 문제)
   - ❌ 안 보이면: 프로젝트에서 Gemini 모델 사용 불가 (추가 설정 필요)

### 4단계: 청구 계정 확인

Gemini 모델을 사용하려면 **청구 계정이 연결**되어 있어야 합니다.

**확인 링크**: https://console.cloud.google.com/billing?project=ceo-blaind

1. 링크를 클릭
2. 청구 계정이 연결되어 있는지 확인
   - ✅ 연결됨: 다음 단계 진행
   - ❌ 연결 안됨: 청구 계정 연결 필요

### 5단계: Quota/할당량 확인

**확인 링크**: https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas?project=ceo-blaind

1. 링크를 클릭
2. "Generate Content" 관련 할당량 확인
3. 할당량이 0이 아닌지 확인

## 🔍 추가 확인 사항

### 프로젝트 설정 확인

**프로젝트 설정 링크**: https://console.cloud.google.com/iam-admin/settings?project=ceo-blaind

- **Vertex AI API 활성화**: ✅ 확인됨
- **Generative AI API 활성화**: ❓ 확인 필요
- **청구 계정 연결**: ❓ 확인 필요
- **서비스 계정 권한**: ✅ "Vertex AI 사용자" 역할 부여됨

## 📝 체크리스트

- [ ] Generative AI API 활성화 확인
- [ ] Vertex AI Studio에서 Gemini 모델 접근 테스트
- [ ] 청구 계정 연결 확인
- [ ] 할당량(Quota) 확인
- [ ] 5-10분 대기 (API 활성화 반영 시간)
- [ ] `node test-model-access.js` 재실행

## 🚀 빠른 링크

- **Generative AI API**: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=ceo-blaind
- **Vertex AI Studio**: https://console.cloud.google.com/vertex-ai/generative/language/create/text?project=ceo-blaind
- **청구 계정**: https://console.cloud.google.com/billing?project=ceo-blaind
- **할당량**: https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas?project=ceo-blaind

---

**다음 단계**: 위 링크들을 확인하고, Generative AI API를 활성화한 후 다시 테스트하세요!




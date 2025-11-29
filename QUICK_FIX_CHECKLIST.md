# 🚨 500 에러 빠른 해결 체크리스트

## 📍 현재 상황
- ❌ API 호출 시 500 Internal Server Error 발생
- ❌ "안내방송 생성 중 오류가 발생했습니다" 메시지 표시

## ✅ 즉시 확인해야 할 사항

### 1️⃣ 서버 콘솔 로그 확인 (가장 중요!) ⭐

**개발 서버 터미널 창에서 확인:**

다음과 같은 로그가 나타나야 합니다:
```
[Vertex AI] 프로젝트: ceo-blaind, 리전: us-central1
[Vertex AI] 모델 시도: gemini-1.5-flash
[Vertex AI] 모델 gemini-1.5-flash 실패: ...
============================================================
generate-audio API 오류: { ... }
```

**서버 콘솔의 에러 메시지를 복사해서 알려주세요!**

---

### 2️⃣ Vertex AI Studio 접근 테스트 ⭐

**링크**: https://console.cloud.google.com/vertex-ai/generative/language/create/text?project=ceo-blaind

**체크:**
- [ ] 이 페이지에 접속 가능한가요?
- [ ] 모델 드롭다운을 클릭했을 때 Gemini 모델이 보이나요?
  - `gemini-1.5-flash`
  - `gemini-1.5-pro`
  - `gemini-pro`

**결과:**
- ✅ **보이면**: 접근 가능 (다른 문제 가능)
- ❌ **안 보이면**: 프로젝트에서 Gemini 사용 불가 (아래 단계 필요)

---

### 3️⃣ Generative AI API 활성화 확인

**링크**: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=ceo-blaind

**체크:**
- [ ] 이 페이지에 접속했을 때 "사용 설정" 또는 "Enable" 버튼이 보이나요?
- [ ] 또는 이미 "API 사용 설정됨"이라고 표시되나요?

**조치:**
- "사용 설정" 버튼이 보이면 → 클릭하여 활성화
- 이미 활성화되어 있으면 → 다음 단계로

---

### 4️⃣ 청구 계정 확인

**링크**: https://console.cloud.google.com/billing?project=ceo-blaind

**체크:**
- [ ] 청구 계정이 연결되어 있나요?
- [ ] "청구 계정 연결" 또는 "Link a billing account" 메시지가 보이나요?

**조치:**
- 청구 계정이 없으면 → 연결 필요 (Gemini는 유료 서비스)

---

## 🔧 자동 진단 도구 실행

터미널에서 다음 명령어를 실행하세요:

```bash
# 환경 변수 확인
node check-env-keys.js

# Vertex AI 상세 진단
node test-vertex-ai-detailed.js

# 모델 접근 테스트
node test-model-access.js
```

## 📊 예상 원인별 해결 방법

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

### 원인 3: 권한 문제

**증상:**
- 403 에러

**해결:**
- 이미 "Vertex AI 사용자" 역할이 할당되어 있음
- IAM 페이지에서 다시 확인: https://console.cloud.google.com/iam-admin/iam?project=ceo-blaind

## 🎯 다음 단계

1. **서버 콘솔 로그 확인** → 에러 메시지 복사
2. **Vertex AI Studio 접근 테스트** → 모델이 보이는지 확인
3. **결과를 알려주세요!**

---

**가장 먼저 할 것**: 서버 콘솔의 에러 로그를 확인하고 알려주세요!



# 🔍 최종 진단 보고서

## 발견된 핵심 문제

### 1. 인증 오류 (GoogleAuthError)
```
[VertexAI.GoogleAuthError]: Unable to authenticate your request
```

**현재 상태:**
- ✅ 환경 변수 설정: 완료
- ✅ 자격 증명 JSON: 유효함
- ❌ Vertex AI 클라이언트 인증: 실패

## 근본 원인

Vertex AI 클라이언트가 서비스 계정 자격 증명을 인식하지 못하고 있습니다.

### 가능한 원인들:

1. **Vertex AI API 미활성화** (가장 가능성 높음)
   - 프로젝트 `ceo-blaind`에서 Vertex AI API가 활성화되지 않음

2. **서비스 계정 권한 부족**
   - `vertex-express@ceo-blaind.iam.gserviceaccount.com`에 Vertex AI 사용 권한 없음

3. **청구 계정 미연결**
   - Vertex AI는 유료 서비스이므로 청구 계정 필요

## ✅ 해결 방법 (단계별)

### 1단계: Vertex AI API 활성화 (필수)

1. [Google Cloud Console - Vertex AI API](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=ceo-blaind) 접속
2. **"사용 설정"** 버튼 클릭
3. 활성화 완료까지 1-2분 대기

### 2단계: 서비스 계정 권한 확인

1. [IAM 및 관리자](https://console.cloud.google.com/iam-admin/iam?project=ceo-blaind) 접속
2. `vertex-express@ceo-blaind.iam.gserviceaccount.com` 검색
3. "역할 편집" 클릭
4. 다음 역할 중 하나 추가:
   - **"Vertex AI 사용자"** (Vertex AI User) - 권장
   - 또는 **"Vertex AI 서비스 에이전트"** (Vertex AI Service Agent)

### 3단계: 청구 계정 연결

1. [청구](https://console.cloud.google.com/billing?project=ceo-blaind) 접속
2. 청구 계정이 연결되어 있는지 확인
3. 연결되어 있지 않으면 청구 계정 생성/연결

### 4단계: Text-to-Speech API 활성화 (TTS 사용을 위해)

1. [Google Cloud Console - Text-to-Speech API](https://console.cloud.google.com/apis/library/texttospeech.googleapis.com?project=ceo-blaind) 접속
2. **"사용 설정"** 버튼 클릭

## 🔧 코드 수정 사항

### 적용된 개선사항:

1. ✅ 모델 Fallback 로직: `gemini-1.5-flash` → `gemini-1.5-pro` → `gemini-pro`
2. ✅ 상세한 로깅: 각 모델 시도 결과 기록
3. ✅ 임시 파일 기반 인증: `GOOGLE_APPLICATION_CREDENTIALS` 환경 변수 사용
4. ✅ 에러 메시지 개선: 구체적인 해결 방법 제시

## 📝 확인 체크리스트

- [ ] Vertex AI API 활성화됨
- [ ] 서비스 계정에 "Vertex AI 사용자" 역할 부여됨
- [ ] Text-to-Speech API 활성화됨
- [ ] 청구 계정 연결됨
- [ ] 개발 서버 재시작함

## 🚀 다음 단계

1. 위의 4단계를 모두 완료
2. 개발 서버 완전히 재시작: `npm run dev`
3. 브라우저에서 `/tools/announcement` 페이지 접속
4. 키워드 "재료소진" 입력 후 테스트

## 📚 참고 링크

- **Vertex AI API 활성화**: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=ceo-blaind
- **IAM 역할 관리**: https://console.cloud.google.com/iam-admin/iam?project=ceo-blaind
- **청구 계정**: https://console.cloud.google.com/billing?project=ceo-blaind
- **Text-to-Speech API**: https://console.cloud.google.com/apis/library/texttospeech.googleapis.com?project=ceo-blaind

---

**중요**: 위 4단계 중 **Vertex AI API 활성화**가 가장 중요합니다. 이것만 해도 문제가 해결될 가능성이 높습니다.




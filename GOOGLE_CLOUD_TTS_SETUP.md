# Google Cloud Text-to-Speech 설정 가이드

## 📋 단계별 설정 방법

### 1단계: Google Cloud Console 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 (또는 기존 프로젝트 선택)
3. 프로젝트 이름 입력 (예: "ceosoop-tts")
4. "만들기" 클릭

### 2단계: Text-to-Speech API 활성화

1. 좌측 메뉴에서 "API 및 서비스" → "라이브러리" 선택
2. 검색창에 "Text-to-Speech API" 입력
3. "Cloud Text-to-Speech API" 선택
4. "사용 설정" 클릭

### 3단계: 서비스 계정 생성 및 키 다운로드

1. 좌측 메뉴에서 "API 및 서비스" → "사용자 인증 정보" 선택
2. 상단 "+ 사용자 인증 정보 만들기" 클릭
3. "서비스 계정" 선택
4. 서비스 계정 이름 입력 (예: "tts-service")
5. "만들기" 클릭
6. 역할 선택: "Cloud Text-to-Speech API 사용자" 또는 "편집자"
7. "계속" → "완료" 클릭
8. 생성된 서비스 계정 클릭
9. "키" 탭 선택
10. "키 추가" → "JSON 만들기" 선택
11. JSON 키 파일이 자동으로 다운로드됨

### 4단계: 환경 변수 설정

#### 옵션 A: Vercel 환경 변수 (프로덕션)

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. "Settings" → "Environment Variables" 선택
4. 다음 추가:
   - **이름**: `GOOGLE_CLOUD_TTS_CREDENTIALS`
   - **값**: 다운로드한 JSON 파일의 전체 내용 복사 (한 줄로)

**중요**: JSON 파일의 모든 내용을 하나의 문자열로 복사해야 합니다.
예시:
```
{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

#### 옵션 B: 로컬 개발 (.env.local)

프로젝트 루트의 `.env.local` 파일에 추가:

```env
GOOGLE_CLOUD_TTS_CREDENTIALS={"type":"service_account","project_id":"your-project",...}
```

**주의**: JSON 내용을 한 줄로 작성하거나, 따옴표를 이스케이프 처리해야 합니다.

### 5단계: 테스트

1. 서버 재시작
2. 안내방송 생성기에서 테스트
3. 콘솔 로그 확인:
   ```
   안내방송 생성 시작 (Google Cloud TTS): ...
   ```

## 🔒 보안 주의사항

1. **절대 Git에 커밋하지 마세요**
   - `.env.local`은 `.gitignore`에 포함되어 있어야 함
   - JSON 키 파일도 Git에 업로드하지 마세요

2. **환경 변수 관리**
   - 프로덕션: Vercel 환경 변수 사용
   - 로컬 개발: `.env.local` 사용

## 💰 비용 정보

- **무료 할당량**: 월 0-4백만 자
- **초과 시**: 1백만 자당 $4-16 (음성 타입에 따라)
- [가격표 참고](https://cloud.google.com/text-to-speech/pricing)

## ❓ 문제 해결

### 오류: "GOOGLE_CLOUD_TTS_CREDENTIALS가 유효한 JSON이 아닙니다"
- JSON 파일 내용이 올바르게 복사되었는지 확인
- 따옴표 이스케이프 확인

### 오류: "API가 활성화되지 않았습니다"
- Google Cloud Console에서 Text-to-Speech API 활성화 확인

### 오류: "권한이 없습니다"
- 서비스 계정에 올바른 역할이 부여되었는지 확인
- "Cloud Text-to-Speech API 사용자" 역할 확인

## ✅ 설정 완료 체크리스트

- [ ] Google Cloud 프로젝트 생성
- [ ] Text-to-Speech API 활성화
- [ ] 서비스 계정 생성
- [ ] JSON 키 파일 다운로드
- [ ] 환경 변수 설정 (Vercel 또는 .env.local)
- [ ] 서버 재시작
- [ ] 테스트 성공

## 📞 추가 도움

- [Google Cloud TTS 문서](https://cloud.google.com/text-to-speech/docs)
- [API 음성 목록](https://cloud.google.com/text-to-speech/docs/voices)


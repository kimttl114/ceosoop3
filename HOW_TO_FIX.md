# .env.local 파일 수정 가이드

## 🔍 발견된 문제

현재 `.env.local` 파일의 8-20번째 줄에서:

```env
8:  GOOGLE_CLOUD_CREDENTIALS='{
9:    "type": "service_account",
10:   "project_id": "ceo-blaind",
...
20:  }'
```

**문제점:**
- ❌ 작은따옴표(`'`)로 시작
- ❌ JSON이 여러 줄로 나뉘어 있음
- ❌ 환경 변수는 한 줄로 작성되어야 함

## ✅ 올바른 형식

한 줄로 작성해야 합니다:

```env
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"YOUR_PROJECT_ID","private_key_id":"YOUR_PRIVATE_KEY_ID","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com","client_id":"YOUR_CLIENT_ID","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/YOUR_SERVICE_ACCOUNT"}
```

## 🔧 수정 방법

### 방법 1: 자동 수정 스크립트 (권장)

```bash
node fix-credentials.js
```

이 스크립트가:
1. 백업 파일 생성
2. JSON을 한 줄로 압축
3. `.env.local` 파일 수정

### 방법 2: 수동 수정

1. **8번째 줄부터 20번째 줄까지 삭제**

2. **다음 한 줄로 교체:**

```env
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"YOUR_PROJECT_ID","private_key_id":"YOUR_PRIVATE_KEY_ID","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com","client_id":"YOUR_CLIENT_ID","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/YOUR_SERVICE_ACCOUNT"}
```

**중요:** 
- ✅ 외부 따옴표 없음
- ✅ 한 줄로 작성
- ✅ 모든 JSON 내용 포함

## ✅ 검증

수정 후 확인:

```bash
node check-env-keys.js
```

다음과 같이 표시되면 성공:

```
✅ GOOGLE_CLOUD_CREDENTIALS: 설정됨 (유효한 JSON, project_id: ceo-blaind)
✅ GOOGLE_VERTEX_AI_PROJECT_ID: 설정됨 (값: ceo-blaind)
✅ GOOGLE_VERTEX_AI_LOCATION: 설정됨 (값: asia-northeast3)
✅ 모든 필수 환경 변수가 올바르게 설정되었습니다!
```

## 🚨 주의사항

- 수정 전 **백업** 권장
- JSON 내용을 **절대 변경하지 마세요** (압축만)
- 파일 저장 후 **개발 서버 재시작** 필요



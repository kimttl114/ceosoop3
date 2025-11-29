# .env.local 파일 수정 가이드

## 🔍 발견된 문제

현재 `.env.local` 파일의 `GOOGLE_CLOUD_CREDENTIALS` 설정에 문제가 있습니다:
- ❌ JSON 형식이 유효하지 않음
- ❌ 따옴표가 잘못 처리됨

## ✅ 올바른 형식

### 방법 1: 한 줄로 작성 (권장)

```env
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"ceo-blaind","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

**중요 사항:**
- ✅ JSON을 **한 줄**로 작성
- ✅ 따옴표는 **이스케이프하지 않음** (그대로 사용)
- ✅ 외부 따옴표 없음 (변수명=JSON 형태)

### 방법 2: 여러 줄로 작성 (환경 변수만 사용하는 경우)

일부 환경에서는 여러 줄이 필요할 수 있습니다:

```env
GOOGLE_CLOUD_CREDENTIALS='{"type":"service_account","project_id":"ceo-blaind",...}'
```

## ❌ 잘못된 형식 예시

```env
# 잘못됨: 외부 따옴표 + 이스케이프
GOOGLE_CLOUD_CREDENTIALS="{\"type\":\"service_account\",...}"

# 잘못됨: 여러 줄 + 따옴표 문제
GOOGLE_CLOUD_CREDENTIALS="
{
  "type": "service_account",
  ...
}
"

# 잘못됨: 작은따옴표 + 큰따옴표 혼용
GOOGLE_CLOUD_CREDENTIALS='{"type":"service_account",...}'
```

## 📝 수정 방법

1. Google Cloud Console에서 서비스 계정 JSON 키 파일 다운로드
2. JSON 파일 내용 전체를 복사
3. `.env.local` 파일에서 8-18줄 부분을 다음 형식으로 수정:

```env
# 8번째 줄부터
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"ceo-blaind","private_key_id":"실제값","private_key":"-----BEGIN PRIVATE KEY-----\n실제키값\n-----END PRIVATE KEY-----\n","client_email":"실제이메일@ceo-blaind.iam.gserviceaccount.com","client_id":"실제ID","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"실제URL"}
GOOGLE_VERTEX_AI_PROJECT_ID=ceo-blaind
GOOGLE_VERTEX_AI_LOCATION=asia-northeast3
```

4. 파일 저장 후 다음 명령어로 검증:

```bash
node check-env-keys.js
```

## 🔧 빠른 수정 스크립트

JSON 파일이 `google-credentials.json`으로 저장되어 있다면:

```bash
# Windows PowerShell
$json = Get-Content google-credentials.json -Raw | ConvertFrom-Json | ConvertTo-Json -Compress
Add-Content .env.local "GOOGLE_CLOUD_CREDENTIALS=$json"
```

또는 수동으로:
1. `google-credentials.json` 파일 열기
2. 전체 내용 복사 (Ctrl+A, Ctrl+C)
3. `.env.local` 파일에서 `GOOGLE_CLOUD_CREDENTIALS=` 뒤에 붙여넣기 (한 줄로)

## ✅ 확인

수정 후 검증:

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



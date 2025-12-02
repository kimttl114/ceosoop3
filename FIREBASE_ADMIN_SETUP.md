# Firebase Admin SDK 설정 가이드

관리자 페이지의 더미글 자동 생성 기능은 서버 사이드에서 Firebase Admin SDK를 사용합니다.

## 1. Firebase 서비스 계정 생성

### 1-1. Firebase Console 접속
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택

### 1-2. 서비스 계정 키 생성
1. 왼쪽 메뉴에서 **⚙️ 설정 > 프로젝트 설정** 클릭
2. 상단 탭에서 **서비스 계정** 클릭
3. **Firebase Admin SDK** 섹션에서 **Node.js** 선택
4. **새 비공개 키 생성** 버튼 클릭
5. JSON 파일 다운로드 (`your-project-xxxxx.json`)

## 2. 로컬 환경 변수 설정

다운로드한 JSON 파일을 열고 다음 환경 변수를 `.env.local`에 추가하세요:

```env
# Firebase Admin SDK (서버 사이드)
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 주의사항
- `FIREBASE_CLIENT_EMAIL`: JSON 파일의 `client_email` 값 그대로 복사
- `FIREBASE_PRIVATE_KEY`: JSON 파일의 `private_key` 값 그대로 복사
  - **따옴표 포함해서 복사**해야 합니다
  - `\n` (줄바꿈 문자)도 그대로 유지되어야 합니다

### 예시
```env
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@my-project-123456.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAA...\n-----END PRIVATE KEY-----\n"
```

## 3. Vercel 환경 변수 설정

### 3-1. Vercel 대시보드 접속
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** 탭 클릭
4. 왼쪽 메뉴에서 **Environment Variables** 클릭

### 3-2. 환경 변수 추가

#### FIREBASE_CLIENT_EMAIL
- **Name**: `FIREBASE_CLIENT_EMAIL`
- **Value**: JSON 파일의 `client_email` 값
- **Environment**: `Production`, `Preview`, `Development` 모두 체크

#### FIREBASE_PRIVATE_KEY
- **Name**: `FIREBASE_PRIVATE_KEY`
- **Value**: JSON 파일의 `private_key` 값 전체 (따옴표 포함, `\n` 그대로)
- **Environment**: `Production`, `Preview`, `Development` 모두 체크

### 주의사항
- Vercel에서도 `\n`을 그대로 입력하세요 (실제 줄바꿈으로 바꾸지 마세요)
- 따옴표(`"`)는 제외하고 입력해도 됩니다

## 4. 재배포

환경 변수를 추가한 후:
1. Vercel에서 자동으로 재배포되거나
2. `git push`를 하여 수동으로 재배포하세요

## 5. 테스트

1. 배포 완료 후 관리자 페이지 접속: `https://your-domain.vercel.app/admin`
2. "더미 글 자동 생성" 섹션에서 카테고리 선택
3. "더미 글 생성하기" 버튼 클릭
4. 성공 메시지 확인

## 문제 해결

### "Firebase가 초기화되지 않았습니다" 오류
- 환경 변수가 올바르게 설정되었는지 확인하세요
- `FIREBASE_PRIVATE_KEY`의 `\n`이 그대로 유지되었는지 확인하세요
- Vercel에서 환경 변수를 다시 배포한 후 재배포하세요

### "permission-denied" 오류
- Firebase 서비스 계정에 Firestore 권한이 있는지 확인하세요
- Firebase Console > Firestore > 규칙에서 서버 사이드 권한을 확인하세요

### 로컬에서는 작동하지만 Vercel에서 안 되는 경우
- Vercel 환경 변수를 다시 확인하세요
- Vercel 로그에서 오류 메시지를 확인하세요
- 환경 변수 변경 후 재배포했는지 확인하세요

## 보안 주의사항

⚠️ **절대로 다음 파일들을 Git에 커밋하지 마세요:**
- `*.json` (서비스 계정 키 파일)
- `.env.local` (환경 변수 파일)

`.gitignore`에 다음이 포함되어 있는지 확인하세요:
```
.env*.local
*.json
!package.json
!package-lock.json
!tsconfig.json
```

## 참고 자료

- [Firebase Admin SDK 문서](https://firebase.google.com/docs/admin/setup)
- [Vercel 환경 변수 문서](https://vercel.com/docs/concepts/projects/environment-variables)


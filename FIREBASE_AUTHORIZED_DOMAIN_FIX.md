# Firebase Authorized Domain 오류 해결 방법

## 🔴 문제
```
FirebaseError: Firebase: Error (auth/unauthorized-domain).
The current domain is not authorized for OAuth operations.
```

## ✅ 해결 방법

### 1. Firebase 콘솔 접속
1. https://console.firebase.google.com 접속
2. 프로젝트 선택 (`ceo-blaind` 또는 해당 프로젝트)

### 2. Authorized Domains에 도메인 추가
1. 왼쪽 메뉴에서 **Authentication** 클릭
2. 상단 탭에서 **Settings** 클릭
3. **Authorized domains** 섹션으로 스크롤
4. **Add domain** 버튼 클릭
5. 다음 도메인 추가:
   - `ceosoop33.vercel.app` (Vercel 배포 도메인)
   - `localhost` (이미 있을 수 있음)

### 3. 저장 및 확인
- 도메인 추가 후 자동으로 저장됨
- 도메인 목록에 `ceosoop33.vercel.app`이 표시되는지 확인

### 4. 테스트
1. 브라우저에서 페이지 새로고침
2. 구글 로그인 버튼 클릭
3. 팝업이 정상적으로 열리는지 확인

## 📝 추가 확인 사항

### Vercel 커스텀 도메인 사용 시
만약 커스텀 도메인을 사용한다면, 그 도메인도 추가해야 합니다:
- 예: `ceosoop.com` → Firebase Authorized domains에 추가

### 로컬 개발 환경
- `localhost`는 기본적으로 포함되어 있어야 합니다
- 없다면 추가해주세요

## ⚠️ 주의사항
- 도메인 추가 후 변경사항이 반영되는데 몇 분이 걸릴 수 있습니다
- 브라우저 캐시를 삭제하고 다시 시도해보세요
- Vercel에 여러 도메인이 있다면 모두 추가해야 합니다


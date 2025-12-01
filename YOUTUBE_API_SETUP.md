# YouTube Data API v3 설정 가이드

AI 음악 선곡 기능을 사용하기 위해 YouTube Data API v3 키를 설정하는 방법입니다.

## 1단계: Google Cloud Console 접속

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속합니다.
2. Google 계정으로 로그인합니다.

## 2단계: 프로젝트 생성 (또는 기존 프로젝트 선택)

1. 상단의 **프로젝트 선택** 드롭다운을 클릭합니다.
2. **새 프로젝트** 버튼을 클릭합니다.
3. 프로젝트 이름을 입력합니다 (예: `ceo-blind-music`).
4. **만들기** 버튼을 클릭합니다.
5. 프로젝트가 생성되면 생성된 프로젝트를 선택합니다.

## 3단계: YouTube Data API v3 활성화

1. 왼쪽 메뉴에서 **API 및 서비스** → **라이브러리**를 클릭합니다.
2. 검색창에 **"YouTube Data API v3"**를 입력합니다.
3. **YouTube Data API v3**를 클릭합니다.
4. **사용 설정** 버튼을 클릭합니다.
5. API가 활성화될 때까지 몇 초 기다립니다.

## 4단계: API 키 생성

1. 왼쪽 메뉴에서 **API 및 서비스** → **사용자 인증 정보**를 클릭합니다.
2. 상단의 **+ 사용자 인증 정보 만들기** 버튼을 클릭합니다.
3. **API 키**를 선택합니다.
4. API 키가 생성되면 **복사** 버튼을 클릭하여 키를 복사합니다.
   - ⚠️ **중요**: 이 키를 안전한 곳에 보관하세요. 나중에 다시 확인할 수 있지만 처음 생성 시에만 전체 키가 표시됩니다.

## 5단계: API 키 제한 설정 (권장)

보안을 위해 API 키에 제한을 설정하는 것을 권장합니다.

### HTTP 리퍼러(웹사이트) 제한 설정

1. 생성된 API 키 옆의 **연필 아이콘** (수정)을 클릭합니다.
2. **애플리케이션 제한사항** 섹션에서 **HTTP 리퍼러(웹사이트)**를 선택합니다.
3. **웹사이트 제한사항** 섹션에서 **항목 추가**를 클릭합니다.
4. 다음 URL을 추가합니다:
   ```
   http://localhost:3000/*
   https://your-domain.vercel.app/*
   ```
   (실제 배포된 도메인으로 변경하세요)
5. **저장** 버튼을 클릭합니다.

### API 제한 설정

1. **API 제한사항** 섹션에서 **키 제한**을 선택합니다.
2. **YouTube Data API v3**를 선택합니다.
3. **저장** 버튼을 클릭합니다.

## 6단계: 로컬 환경 변수 설정

1. 프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하거나 엽니다.
2. 다음 줄을 추가합니다:

```env
# YouTube Data API v3 키
YOUTUBE_API_KEY=여기에_복사한_API_키를_붙여넣으세요
```

**예시:**
```env
YOUTUBE_API_KEY=AIzaSyAbCdEf1234567890GhIjKlMnOpQrStUvWx
```

3. 파일을 저장합니다.

## 7단계: Vercel 환경 변수 설정 (배포 시)

배포된 환경에서도 YouTube API를 사용하려면 Vercel에도 환경 변수를 추가해야 합니다.

1. [Vercel Dashboard](https://vercel.com/dashboard)에 접속합니다.
2. 해당 프로젝트를 선택합니다.
3. **Settings** 탭을 클릭합니다.
4. 왼쪽 메뉴에서 **Environment Variables**를 클릭합니다.
5. **Add New** 버튼을 클릭합니다.
6. 다음을 입력합니다:
   - **Key**: `YOUTUBE_API_KEY`
   - **Value**: 생성한 API 키
   - **Environment**: Production, Preview, Development 모두 선택
7. **Save** 버튼을 클릭합니다.
8. 변경사항을 적용하려면 **Redeploy**를 실행합니다.

## 8단계: 개발 서버 재시작

환경 변수를 추가한 후에는 개발 서버를 재시작해야 합니다:

```bash
# 개발 서버 중지 (Ctrl + C)
# 다시 시작
npm run dev
```

## 9단계: 테스트

1. 브라우저에서 `http://localhost:3000/tools/music`로 이동합니다.
2. 날씨와 업종을 선택하고 **"AI로 음악 추천받기"** 버튼을 클릭합니다.
3. API 키가 제대로 설정되었다면 YouTube에서 음악을 검색하여 재생됩니다.
4. API 키가 없거나 잘못되었다면 Fallback 플레이리스트가 재생됩니다.

## 문제 해결

### API 키가 작동하지 않을 때

1. **API 키가 올바른지 확인**: `.env.local` 파일의 키가 올바르게 복사되었는지 확인하세요.
2. **YouTube Data API v3가 활성화되었는지 확인**: Google Cloud Console에서 API가 활성화되어 있는지 확인하세요.
3. **할당량 확인**: Google Cloud Console의 **할당량** 탭에서 일일 할당량을 확인하세요. (기본값: 10,000 units/일)
4. **서버 재시작**: 환경 변수를 추가한 후 개발 서버를 재시작했는지 확인하세요.

### 할당량 초과 오류

- YouTube Data API v3는 무료 할당량이 있습니다 (10,000 units/일).
- 할당량을 초과하면 Fallback 플레이리스트가 자동으로 재생됩니다.
- 할당량은 24시간마다 재설정됩니다.

### 참고 링크

- [YouTube Data API v3 문서](https://developers.google.com/youtube/v3)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API 키 사용 가이드](https://developers.google.com/youtube/v3/getting-started)

## 비용 정보

- YouTube Data API v3는 **무료 할당량**을 제공합니다 (10,000 units/일).
- 일일 할당량을 초과하면 추가 비용이 발생할 수 있습니다.
- 대부분의 경우 무료 할당량으로 충분합니다.


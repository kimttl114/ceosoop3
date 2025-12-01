# 자영업자 대나무숲 - 자영업자 익명 커뮤니티

React(Next.js)와 Tailwind CSS로 구현된 자영업자 전용 익명 커뮤니티 웹앱입니다.

## 설치 및 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하세요.

### 3. 빌드 (프로덕션)
```bash
npm run build
npm start
```

## 기술 스택

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Font**: Noto Sans KR
- **AI**: OpenAI GPT-4o Vision
- **Database**: Firebase Firestore

## 프로젝트 구조

```
├── app/
│   ├── layout.tsx           # 루트 레이아웃
│   ├── page.tsx             # 메인 페이지
│   ├── globals.css          # 전역 스타일
│   ├── auth/
│   │   └── verify/
│   │       └── page.tsx     # 사업자 인증 페이지
│   └── api/
│       └── verify/
│           └── route.ts     # 사업자 인증 API
├── lib/
│   └── firebase.ts          # Firebase 설정
├── package.json
├── tailwind.config.js
├── next.config.js
└── tsconfig.json
```

## 주요 기능

- ✅ Sticky 헤더 (로고, 알림, 검색, 탭바)
- ✅ 실시간 핫이슈 Carousel
- ✅ 카테고리 필터 (Chips)
- ✅ 게시글 리스트
- ✅ 글쓰기 FAB 버튼
- ✅ 모바일 퍼스트 디자인 (max-width: 430px)
- ✅ **사업자 인증 시스템**
  - 국세청 API를 통한 1차 검증
  - GPT-4o Vision을 통한 사업자등록증 이미지 분석
  - Firebase에 인증 정보 저장

## 디자인 컨셉

- **메인 배경**: #F3F4F6 (연한 회색)
- **헤더/포인트**: #1A2B4E (딥 네이비)
- **강조/뱃지**: #FFBF00 (앰버 골드)
- **폰트**: Noto Sans KR

## 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# ============================================
# 국세청 사업자 진위여부 확인 API 키
# ============================================
# 공공데이터포털(https://www.data.go.kr/)에서 
# "사업자등록정보 진위확인 및 휴폐업조회" API를 신청하여 발급받은 키를 아래에 입력하세요.
# 
# API 신청 링크: https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15081808
# 
# 사용 방법:
# 1. 공공데이터포털에 회원가입 및 로그인
# 2. 위 링크에서 API 신청
# 3. 승인 후 발급받은 서비스 키(Service Key)를 아래에 입력
# 4. 예시: NTS_API_KEY=your_service_key_here
NTS_API_KEY=여기에_국세청_API_키를_입력하세요

# OpenAI API 키
OPENAI_API_KEY=your_openai_api_key_here

# YouTube Data API v3 키 (AI 음악 선곡 기능용, 선택사항)
# YouTube API 키가 없으면 Fallback 플레이리스트가 재생됩니다.
# 설정 방법: YOUTUBE_API_SETUP.md 파일 참조
YOUTUBE_API_KEY=your_youtube_api_key_here

# Firebase 설정 (클라이언트)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (서버 사이드, 선택사항)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key
```

### API 키 발급 방법

1. **국세청 API 키**: [공공데이터포털](https://www.data.go.kr/)에서 발급
2. **OpenAI API 키**: [OpenAI Platform](https://platform.openai.com/)에서 발급
3. **YouTube Data API v3 키**: [YOUTUBE_API_SETUP.md](./YOUTUBE_API_SETUP.md) 파일 참조
4. **Firebase 설정**: [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성 후 설정

## 사업자 인증 기능

사업자 인증은 두 단계로 진행됩니다:

1. **1차 검증**: 국세청 API를 통해 입력된 사업자 정보의 진위를 확인합니다.
2. **2차 검증**: GPT-4o Vision을 사용하여 업로드된 사업자등록증 이미지에서 정보를 추출하고, 입력된 정보와 일치하는지 확인합니다.

인증이 완료되면 Firebase에 `isVerified: true`가 저장됩니다.

### 사용 방법

1. `/auth/verify` 페이지로 이동
2. 대표자 성명, 개업일자, 사업자등록번호 입력
3. 사업자등록증 사진 업로드
4. "인증하기" 버튼 클릭
5. 두 단계 검증 완료 후 인증 성공


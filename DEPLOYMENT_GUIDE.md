# 배포 가이드

## 🚀 배포 방법 선택

### 1. Vercel (추천) ⭐
- Next.js와 완벽 호환
- 자동 배포 및 CI/CD
- 무료 플랜 제공
- 환경 변수 관리 용이

### 2. Firebase Hosting
- Firebase 프로젝트와 통합
- 무료 플랜 제공
- Firebase 서비스와 함께 관리

### 3. Netlify
- 간단한 배포
- 무료 플랜 제공

---

## 📦 Vercel 배포 (추천)

### 방법 1: Vercel 웹사이트에서 배포

1. **Vercel 계정 생성**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **프로젝트 연결**
   - "Add New Project" 클릭
   - GitHub 저장소 선택
   - 프로젝트 import

3. **환경 변수 설정**
   - Project Settings → Environment Variables
   - 다음 변수 추가:
     ```
     OPENAI_API_KEY=your_openai_api_key
     NTS_API_KEY=your_nts_api_key
     ```

4. **빌드 설정**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

5. **배포**
   - "Deploy" 버튼 클릭
   - 자동으로 배포 시작

### 방법 2: Vercel CLI로 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

---

## 🔥 Firebase Hosting 배포

### 1. Firebase CLI 설치 및 로그인

```bash
npm install -g firebase-tools
firebase login
```

### 2. Firebase 프로젝트 초기화

```bash
firebase init hosting
```

선택 사항:
- ✅ Use an existing project (기존 Firebase 프로젝트 선택)
- Public directory: `out` (Next.js static export 사용 시)
- 또는 `.next` (SSR 사용 시)

### 3. Next.js 설정 (Static Export)

`next.config.js`에 추가:
```javascript
const nextConfig = {
  output: 'export', // 정적 사이트 생성
  // ... 기존 설정
}
```

### 4. 빌드 및 배포

```bash
npm run build
firebase deploy --only hosting
```

---

## 🌐 Netlify 배포

### 1. Netlify 계정 생성
- https://netlify.com 접속
- GitHub 계정으로 로그인

### 2. 프로젝트 배포
- "Add new site" → "Import an existing project"
- GitHub 저장소 선택
- 빌드 설정:
  - Build command: `npm run build`
  - Publish directory: `.next`

### 3. 환경 변수 설정
- Site settings → Environment variables
- 필요한 환경 변수 추가

---

## ⚙️ 배포 전 체크리스트

### ✅ 필수 확인 사항

1. **환경 변수 확인**
   - [ ] `.env.local` 파일에 모든 API 키가 있는지 확인
   - [ ] 배포 플랫폼에 환경 변수 설정 완료

2. **빌드 테스트**
   ```bash
   npm run build
   ```
   - [ ] 빌드 오류 없음
   - [ ] 경고 확인 및 수정

3. **의존성 확인**
   - [ ] `package.json`의 모든 의존성 설치 가능
   - [ ] 불필요한 패키지 제거

4. **Firebase 설정 확인**
   - [ ] Firebase 프로젝트 ID 확인
   - [ ] Firebase 규칙 설정 확인

5. **보안 확인**
   - [ ] API 키가 코드에 하드코딩되지 않음
   - [ ] `.env.local`이 `.gitignore`에 포함됨

---

## 🔐 환경 변수 설정

### Vercel 환경 변수 설정

1. Vercel 대시보드 → Project → Settings → Environment Variables

2. 다음 변수 추가:

```
OPENAI_API_KEY=sk-...
NTS_API_KEY=your_nts_api_key
```

### Firebase Hosting 환경 변수

Firebase Functions를 사용하는 경우:
```bash
firebase functions:config:set openai.api_key="sk-..."
```

또는 `.env` 파일 사용 (Firebase Functions)

---

## 📝 배포 후 확인 사항

1. **기본 기능 테스트**
   - [ ] 로그인 기능
   - [ ] 게시글 작성/조회
   - [ ] 댓글 기능
   - [ ] 이미지 업로드

2. **Firebase 연동 확인**
   - [ ] Firestore 데이터 저장/조회
   - [ ] Firebase Storage 이미지 업로드
   - [ ] Firebase Auth 로그인

3. **API 라우트 확인**
   - [ ] `/api/verify` 동작 확인
   - [ ] `/api/generate-avatar` 동작 확인
   - [ ] `/api/generate-document` 동작 확인

4. **성능 확인**
   - [ ] 페이지 로딩 속도
   - [ ] 이미지 최적화
   - [ ] 번들 크기

---

## 🐛 문제 해결

### 빌드 오류

```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 빌드 캐시 삭제
rm -rf .next
npm run build
```

### 환경 변수 오류

- 배포 플랫폼의 환경 변수 설정 확인
- 변수명 대소문자 확인
- 재배포 필요

### Firebase 연결 오류

- Firebase 프로젝트 ID 확인
- Firebase 규칙 확인
- CORS 설정 확인

---

## 🚀 빠른 배포 (Vercel)

가장 빠른 방법:

1. GitHub에 코드 푸시
2. https://vercel.com 접속
3. "Add New Project" → GitHub 저장소 선택
4. 환경 변수 설정
5. "Deploy" 클릭

완료! 🎉


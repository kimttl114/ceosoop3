# 빠른 배포 가이드

## 🚀 Vercel 배포 (가장 간단)

### 1단계: GitHub에 코드 푸시

```bash
# Git 초기화 (아직 안 했다면)
git init
git add .
git commit -m "배포 준비"

# GitHub 저장소 생성 후
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

### 2단계: Vercel 배포

1. **Vercel 접속**
   - https://vercel.com 접속
   - "Sign Up" 또는 "Log In" 클릭
   - GitHub 계정으로 로그인

2. **프로젝트 추가**
   - 대시보드에서 "Add New Project" 클릭
   - GitHub 저장소 선택
   - "Import" 클릭

3. **프로젝트 설정**
   - Framework Preset: **Next.js** (자동 감지됨)
   - Root Directory: `./` (기본값)
   - Build Command: `npm run build` (자동)
   - Output Directory: `.next` (자동)
   - Install Command: `npm install` (자동)

4. **환경 변수 설정**
   - "Environment Variables" 섹션 클릭
   - 다음 변수 추가:
     ```
     OPENAI_API_KEY = your_openai_api_key_here
     NTS_API_KEY = your_nts_api_key_here
     ```
   - 각 변수에 대해 Production, Preview, Development 모두 선택

5. **배포 시작**
   - "Deploy" 버튼 클릭
   - 자동으로 빌드 및 배포 시작 (약 2-3분 소요)

6. **배포 완료**
   - 배포가 완료되면 URL이 생성됨
   - 예: `https://your-project.vercel.app`

### 3단계: 커스텀 도메인 (선택사항)

1. Vercel 대시보드 → Project → Settings → Domains
2. 원하는 도메인 추가
3. DNS 설정 안내에 따라 도메인 설정

---

## 🔥 Firebase Hosting 배포

### 1단계: Firebase CLI 설치

```bash
npm install -g firebase-tools
firebase login
```

### 2단계: Firebase 프로젝트 초기화

```bash
firebase init hosting
```

선택 사항:
- ✅ Use an existing project
- Public directory: `.next` 또는 `out`
- Configure as a single-page app: No
- Set up automatic builds: No (또는 Yes)

### 3단계: 빌드 및 배포

```bash
npm run build
firebase deploy --only hosting
```

---

## ⚙️ 배포 전 확인사항

### 필수 체크리스트

- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 하드코딩된 API 키가 코드에 없는지 확인
- [ ] Firebase 프로젝트 ID가 올바른지 확인
- [ ] 모든 환경 변수가 배포 플랫폼에 설정되어 있는지 확인

### 환경 변수 목록

다음 환경 변수들을 배포 플랫폼에 설정해야 합니다:

```
OPENAI_API_KEY=sk-...
NTS_API_KEY=your_nts_api_key
```

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

- Vercel 대시보드에서 환경 변수 확인
- 변수명이 정확한지 확인 (대소문자 주의)
- 재배포 필요

### Firebase 연결 오류

- Firebase 프로젝트 ID 확인
- Firebase 콘솔에서 프로젝트 설정 확인

---

## 📱 배포 후 확인

1. **기본 기능 테스트**
   - 로그인/로그아웃
   - 게시글 작성/조회
   - 댓글 기능
   - 이미지 업로드

2. **API 테스트**
   - 사업자 인증
   - AI 아바타 생성
   - AI 문서 생성

3. **모바일 테스트**
   - 반응형 디자인 확인
   - 터치 이벤트 확인

---

## 🎉 완료!

배포가 완료되면 사용자들이 접속할 수 있습니다!

**추가 도움이 필요하시면:**
- Vercel 문서: https://vercel.com/docs
- Firebase 문서: https://firebase.google.com/docs/hosting


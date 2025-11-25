# 초보자를 위한 배포 가이드 (단계별)

## 🎯 목표
Vercel을 사용하여 웹사이트를 무료로 배포하기

---

## 📋 준비물
- [ ] GitHub 계정 (없으면 https://github.com 에서 가입)
- [ ] Vercel 계정 (GitHub로 가입 가능)
- [ ] 프로젝트 폴더

---

## 1단계: GitHub에 코드 업로드

### 1-1. GitHub 저장소 만들기

1. **브라우저에서 https://github.com 접속**
2. **로그인** (계정이 없으면 "Sign up" 클릭하여 가입)
3. **우측 상단의 "+" 버튼 클릭** → "New repository" 선택
4. **저장소 정보 입력:**
   - Repository name: `ceo-blind` (또는 원하는 이름)
   - Description: `자영업자 익명 커뮤니티` (선택사항)
   - Public 선택 (무료로 사용 가능)
   - **"Initialize this repository with a README" 체크 해제** (이미 파일이 있으므로)
5. **"Create repository" 버튼 클릭**

### 1-2. Git 설치 확인

**Windows에서 Git이 설치되어 있는지 확인:**

1. **파일 탐색기**에서 프로젝트 폴더 열기
2. **주소창에 `cmd` 입력 후 Enter** (명령 프롬프트 열림)
3. 다음 명령어 입력:
   ```bash
   git --version
   ```
   - **설치되어 있으면:** 버전 번호가 표시됨 (예: `git version 2.40.0`)
   - **설치되어 있지 않으면:** "git은 내부 또는 외부 명령..." 오류 메시지

**Git이 없으면:**
- https://git-scm.com/download/win 에서 다운로드
- 설치 시 기본 설정으로 진행 (Next 버튼만 계속 클릭)

### 1-3. 프로젝트를 GitHub에 업로드

**방법 A: 명령 프롬프트 사용 (추천)**

1. **프로젝트 폴더에서 명령 프롬프트 열기:**
   - 파일 탐색기에서 프로젝트 폴더 열기
   - 주소창에 `cmd` 입력 후 Enter

2. **다음 명령어를 순서대로 입력:**

   ```bash
   # Git 초기화
   git init
   
   # 모든 파일 추가
   git add .
   
   # 첫 번째 커밋
   git commit -m "Initial commit"
   
   # 브랜치 이름을 main으로 설정
   git branch -M main
   
   # GitHub 저장소 연결 (여기서 YOUR_USERNAME을 본인의 GitHub 사용자명으로 변경!)
   git remote add origin https://github.com/YOUR_USERNAME/ceo-blind.git
   
   # 코드 업로드
   git push -u origin main
   ```

3. **GitHub 로그인 요청:**
   - 브라우저가 자동으로 열리거나
   - 명령 프롬프트에 사용자명/비밀번호 입력 요청
   - **Personal Access Token 필요할 수 있음** (아래 참고)

**Personal Access Token 만들기 (필요한 경우):**

1. GitHub → 우측 상단 프로필 → "Settings"
2. 왼쪽 메뉴에서 "Developer settings"
3. "Personal access tokens" → "Tokens (classic)"
4. "Generate new token" → "Generate new token (classic)"
5. Note: `vercel-deploy` 입력
6. Expiration: `90 days` 선택
7. Scopes: `repo` 체크
8. "Generate token" 클릭
9. **토큰 복사** (다시 볼 수 없으므로 복사해두세요!)
10. 명령 프롬프트에서 비밀번호 입력할 때 이 토큰 사용

**방법 B: GitHub Desktop 사용 (더 쉬움)**

1. **GitHub Desktop 다운로드:**
   - https://desktop.github.com 에서 다운로드 및 설치

2. **GitHub Desktop 실행:**
   - "File" → "Add Local Repository"
   - 프로젝트 폴더 선택
   - "Publish repository" 클릭
   - 저장소 이름 입력 후 "Publish repository" 클릭

---

## 2단계: Vercel에서 배포

### 2-1. Vercel 가입

1. **브라우저에서 https://vercel.com 접속**
2. **"Sign Up" 클릭**
3. **"Continue with GitHub" 클릭** (GitHub 계정으로 로그인)
4. **권한 승인** (Vercel이 GitHub 저장소에 접근할 수 있도록 허용)

### 2-2. 프로젝트 배포

1. **Vercel 대시보드에서 "Add New Project" 클릭**
2. **GitHub 저장소 선택:**
   - 방금 만든 `ceo-blind` 저장소 찾기
   - "Import" 클릭

3. **프로젝트 설정:**
   - Framework Preset: **Next.js** (자동으로 감지됨)
   - Root Directory: `./` (기본값 유지)
   - Build Command: `npm run build` (자동)
   - Output Directory: `.next` (자동)
   - Install Command: `npm install` (자동)
   - **설정 변경 불필요, 그대로 두고 진행**

4. **환경 변수 설정 (중요!):**
   - "Environment Variables" 섹션 클릭
   - 다음 변수들을 추가:

   **변수 1:**
   - Name: `OPENAI_API_KEY`
   - Value: `여기에_OpenAI_API_키_입력` (sk-로 시작하는 키)
   - Environment: Production, Preview, Development 모두 체크
   - "Add" 클릭

   **변수 2:**
   - Name: `NTS_API_KEY`
   - Value: `여기에_국세청_API_키_입력`
   - Environment: Production, Preview, Development 모두 체크
   - "Add" 클릭

   **API 키 찾는 방법:**
   - OpenAI API 키: https://platform.openai.com/api-keys 에서 발급
   - 국세청 API 키: 공공데이터포털(https://www.data.go.kr/)에서 발급

5. **"Deploy" 버튼 클릭**
6. **배포 진행 상황 확인:**
   - 빌드 로그가 실시간으로 표시됨
   - 약 2-3분 소요

7. **배포 완료:**
   - "Congratulations!" 메시지 표시
   - 배포 URL 생성됨 (예: `https://ceo-blind.vercel.app`)

---

## 3단계: 배포 확인

### 3-1. 웹사이트 접속

1. **배포 완료 후 생성된 URL 클릭**
2. **또는 Vercel 대시보드에서 "Visit" 버튼 클릭**
3. **웹사이트가 정상적으로 열리는지 확인**

### 3-2. 기능 테스트

- [ ] 홈페이지 로딩 확인
- [ ] 로그인 기능 테스트
- [ ] 게시글 작성 테스트
- [ ] 이미지 업로드 테스트
- [ ] 사업자 인증 기능 테스트 (API 키가 올바르게 설정되었는지 확인)

---

## 4단계: 문제 해결

### 문제 1: 빌드 실패

**증상:** 배포 중 오류 발생

**해결:**
1. Vercel 대시보드의 "Deployments" 탭 클릭
2. 실패한 배포 클릭
3. "Build Logs" 확인
4. 오류 메시지 확인
5. 로컬에서 `npm run build` 실행하여 오류 재현

### 문제 2: 환경 변수 오류

**증상:** API 기능이 작동하지 않음

**해결:**
1. Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
2. 환경 변수가 올바르게 설정되었는지 확인
3. 변수명이 정확한지 확인 (대소문자 주의)
4. "Redeploy" 클릭하여 재배포

### 문제 3: 포트 오류

**증상:** "Port 3000 is already in use"

**해결:**
- 로컬 개발 서버를 중지 (Ctrl+C)
- 또는 다른 포트 사용: `npm run dev -- -p 3001`

---

## 5단계: 커스텀 도메인 (선택사항)

### 5-1. 도메인 추가

1. **Vercel 대시보드 → 프로젝트 → Settings → Domains**
2. **원하는 도메인 입력** (예: `myapp.com`)
3. **"Add" 클릭**
4. **DNS 설정 안내에 따라 도메인 설정**

### 5-2. DNS 설정

도메인 제공업체(예: 가비아, 후이즈)에서:
- A 레코드 또는 CNAME 레코드 추가
- Vercel이 제공하는 IP 주소 또는 도메인 사용

---

## ✅ 체크리스트

배포 전:
- [ ] GitHub 계정 생성
- [ ] Git 설치 확인
- [ ] 코드가 GitHub에 업로드됨
- [ ] Vercel 계정 생성
- [ ] 환경 변수 준비 (OPENAI_API_KEY, NTS_API_KEY)

배포 중:
- [ ] Vercel에서 프로젝트 import
- [ ] 환경 변수 설정
- [ ] Deploy 클릭
- [ ] 빌드 완료 대기

배포 후:
- [ ] 웹사이트 접속 확인
- [ ] 기능 테스트
- [ ] 오류 확인 및 수정

---

## 🎉 완료!

배포가 완료되면:
- ✅ 전 세계 어디서나 접속 가능
- ✅ 자동 HTTPS 적용
- ✅ 코드 업데이트 시 자동 재배포
- ✅ 무료 플랜으로 충분히 사용 가능

---

## 📞 도움이 필요하면

각 단계에서 막히면:
1. 오류 메시지를 복사해서 알려주세요
2. 어느 단계에서 막혔는지 알려주세요
3. 스크린샷을 보내주시면 더 정확히 도와드릴 수 있습니다

**지금 바로 시작하시겠습니까?**
1단계부터 차근차근 진행해보세요!


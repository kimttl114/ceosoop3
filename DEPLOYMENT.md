# 배포 가이드

## 🚀 배포 방법 (Vercel 추천)

### 1단계: GitHub에 코드 업로드

1. **GitHub에서 새 저장소 생성**
   - https://github.com/new 접속
   - 저장소 이름 입력
   - "Create repository" 클릭

2. **로컬에서 Git 초기화 및 푸시**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/your-repo-name.git
   git push -u origin main
   ```

### 2단계: Vercel에서 배포

1. **Vercel 접속**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **프로젝트 추가**
   - "Add New Project" 클릭
   - GitHub 저장소 선택
   - "Import" 클릭

3. **환경 변수 설정** ⚠️ 중요!
   - "Environment Variables" 섹션 클릭
   - 다음 변수 추가:
     ```
     OPENAI_API_KEY = your_openai_api_key_here
     NTS_API_KEY = your_nts_api_key_here
     ```
   - 각 변수에 대해 Production, Preview, Development 모두 선택

4. **배포 시작**
   - "Deploy" 버튼 클릭
   - 자동으로 빌드 및 배포 시작 (약 2-3분 소요)

5. **배포 완료**
   - 배포가 완료되면 URL이 생성됨
   - 예: `https://your-project.vercel.app`

---

## ✅ 배포 전 체크리스트

### 필수 확인 사항

- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 하드코딩된 API 키가 코드에 없는지 확인
- [ ] Firebase 프로젝트 ID가 올바른지 확인
- [ ] 로컬에서 `npm run build` 실행하여 빌드 오류 확인
- [ ] 모든 환경 변수가 배포 플랫폼에 설정되어 있는지 확인

### 환경 변수 목록

다음 환경 변수들을 배포 플랫폼에 설정해야 합니다:

```
OPENAI_API_KEY=sk-...
NTS_API_KEY=your_nts_api_key
```

---

## 📱 배포 후 확인

배포가 완료되면 다음을 확인하세요:

- [ ] 홈페이지 로딩 확인
- [ ] 로그인 기능 테스트
- [ ] 게시글 작성/조회 테스트
- [ ] 이미지 업로드 테스트
- [ ] 사업자 인증 기능 테스트
- [ ] AI 아바타 생성 테스트
- [ ] AI 문서 생성 테스트

---

## 🐛 문제 해결

### 빌드 오류
- Vercel 대시보드의 "Deployments" 탭에서 로그 확인
- 로컬에서 `npm run build` 실행하여 오류 확인

### 환경 변수 오류
- Vercel 대시보드에서 환경 변수 확인
- 변수명이 정확한지 확인 (대소문자 주의)
- 재배포 필요

### Firebase 연결 오류
- Firebase 프로젝트 ID 확인
- Firebase 콘솔에서 CORS 설정 확인

---

## 📚 추가 리소스

- Vercel 문서: https://vercel.com/docs
- Firebase 문서: https://firebase.google.com/docs/hosting


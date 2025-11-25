# 배포 체크리스트

## 배포 전 필수 확인 사항

### 1. 환경 변수 확인 ✅
- [ ] `.env.local` 파일에 모든 API 키가 있는지 확인
- [ ] 배포 플랫폼에 환경 변수 설정 완료
  - `OPENAI_API_KEY`
  - `NTS_API_KEY` (사업자 인증용)

### 2. 빌드 테스트 ✅
```bash
npm run build
```
- [ ] 빌드 오류 없음
- [ ] 경고 확인 및 수정
- [ ] TypeScript 오류 없음

### 3. 코드 검토 ✅
- [ ] 하드코딩된 API 키 제거
- [ ] 콘솔 로그 제거 (선택사항)
- [ ] 불필요한 파일 제거

### 4. Firebase 설정 ✅
- [ ] Firebase 프로젝트 ID 확인
- [ ] Firestore 보안 규칙 설정
- [ ] Storage 보안 규칙 설정
- [ ] Firebase Auth 설정 확인

### 5. 보안 확인 ✅
- [ ] `.env.local`이 `.gitignore`에 포함됨
- [ ] API 키가 코드에 노출되지 않음
- [ ] Firebase 규칙이 적절히 설정됨

### 6. 기능 테스트 ✅
- [ ] 로그인/로그아웃
- [ ] 게시글 작성/조회/삭제
- [ ] 댓글 작성
- [ ] 이미지 업로드
- [ ] 사업자 인증
- [ ] AI 아바타 생성
- [ ] AI 문서 생성

---

## 배포 후 확인 사항

### 1. 기본 기능 테스트 ✅
- [ ] 홈페이지 로딩
- [ ] 로그인 기능
- [ ] 게시글 목록 표시
- [ ] 게시글 작성
- [ ] 댓글 기능

### 2. Firebase 연동 확인 ✅
- [ ] Firestore 데이터 저장/조회
- [ ] Firebase Storage 이미지 업로드
- [ ] Firebase Auth 로그인

### 3. API 라우트 확인 ✅
- [ ] `/api/verify` (사업자 인증)
- [ ] `/api/generate-avatar` (AI 아바타)
- [ ] `/api/generate-document` (AI 문서)

### 4. 성능 확인 ✅
- [ ] 페이지 로딩 속도
- [ ] 이미지 최적화
- [ ] 모바일 반응형

---

## 빠른 배포 가이드

### Vercel 배포 (5분)

1. **GitHub에 코드 푸시**
   ```bash
   git add .
   git commit -m "배포 준비"
   git push origin main
   ```

2. **Vercel 접속**
   - https://vercel.com
   - GitHub로 로그인

3. **프로젝트 추가**
   - "Add New Project" 클릭
   - 저장소 선택
   - "Import" 클릭

4. **환경 변수 설정**
   - Project Settings → Environment Variables
   - 필요한 변수 추가

5. **배포**
   - "Deploy" 클릭
   - 완료! 🎉

---

## 문제 해결

### 빌드 오류
```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
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


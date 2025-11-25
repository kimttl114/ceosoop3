# 빠른 배포 시작 가이드 (5분)

## 🚀 가장 빠른 방법

### Step 1: GitHub Desktop 설치 (2분)

1. https://desktop.github.com 접속
2. "Download for Windows" 클릭
3. 설치 파일 실행
4. 기본 설정으로 설치 완료

### Step 2: GitHub에 코드 업로드 (1분)

1. **GitHub Desktop 실행**
2. **GitHub 계정으로 로그인** (없으면 가입)
3. **"File" → "Add Local Repository"**
4. **프로젝트 폴더 선택** (`C:\Users\user\Desktop\자영업자 블라인드`)
5. **왼쪽 하단 "Publish repository" 클릭**
6. **저장소 이름 입력:** `ceo-blind`
7. **"Publish repository" 클릭**

✅ 완료! GitHub에 코드가 업로드되었습니다.

### Step 3: Vercel 배포 (2분)

1. **https://vercel.com 접속**
2. **"Sign Up" → "Continue with GitHub"**
3. **"Add New Project" 클릭**
4. **`ceo-blind` 저장소 선택 → "Import"**
5. **환경 변수 추가:**
   - `OPENAI_API_KEY` = (본인의 OpenAI API 키)
   - `NTS_API_KEY` = (본인의 국세청 API 키)
6. **"Deploy" 클릭**

✅ 완료! 2-3분 후 웹사이트가 배포됩니다!

---

## 📝 환경 변수 찾는 방법

### OpenAI API 키
1. https://platform.openai.com/api-keys 접속
2. 로그인
3. "Create new secret key" 클릭
4. 키 복사 (sk-로 시작)

### 국세청 API 키
1. https://www.data.go.kr 접속
2. "사업자등록정보 진위확인" 검색
3. API 신청
4. 승인 후 서비스 키 복사

---

## 🎯 다음 단계

배포가 완료되면:
- 생성된 URL로 접속
- 모든 기능 테스트
- 문제가 있으면 Vercel 대시보드에서 로그 확인

**이제 시작하세요!** 🚀


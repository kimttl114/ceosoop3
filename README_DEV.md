# 개발 서버 실행 가이드

## 문제 해결

### 문제: 로컬 서버가 실행되지 않음

**원인:**
1. 잘못된 디렉토리에서 실행
2. 한글 경로 문제
3. node_modules 미설치

**해결 방법:**

### 방법 1: start.bat 사용 (추천)

1. 프로젝트 폴더에서 `start.bat` 파일을 더블클릭
2. 자동으로 개발 서버가 시작됩니다

### 방법 2: 수동 실행

1. **프로젝트 폴더로 이동**
   - 파일 탐색기에서 프로젝트 폴더 열기
   - 주소창에 `cmd` 입력 후 Enter
   - 또는 PowerShell에서:
     ```powershell
     cd "C:\Users\user\Desktop\자영업자 블라인드"
     ```

2. **의존성 설치 확인**
   ```bash
   npm install
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

4. **브라우저에서 접속**
   - http://localhost:3000

### 방법 3: VS Code 터미널 사용

1. VS Code에서 프로젝트 폴더 열기
2. 터미널 열기 (Ctrl + `)
3. 다음 명령어 실행:
   ```bash
   npm run dev
   ```

## 일반적인 오류

### "Couldn't find any `pages` or `app` directory"

**원인:** 잘못된 디렉토리에서 실행

**해결:**
- 프로젝트 루트 디렉토리에서 실행해야 합니다
- `app` 폴더가 있는 디렉토리인지 확인하세요

### "Missing script: dev"

**원인:** package.json이 없거나 손상됨

**해결:**
```bash
npm install
```

### 포트 3000이 이미 사용 중

**해결:**
```bash
# 다른 포트 사용
npm run dev -- -p 3001
```

## 개발 서버 중지

터미널에서 `Ctrl + C`를 누르세요.

## 추가 도움말

문제가 계속되면:
1. `.next` 폴더 삭제 후 재시도
2. `node_modules` 삭제 후 `npm install` 재실행
3. Node.js 버전 확인 (v18 이상 권장)


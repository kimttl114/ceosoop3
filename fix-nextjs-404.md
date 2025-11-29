# 🔧 Next.js 404 에러 해결 가이드

## 📊 발견된 문제

브라우저 콘솔에서 Next.js 정적 파일들이 404 에러로 로드되지 않고 있습니다:

```
GET http://localhost:3000/_next/static/css/app/layout.css?v=... 404
GET http://localhost:3000/_next/static/chunks/app-pages-internals.js 404
GET http://localhost:3000/_next/static/chunks/main-app.js 404
GET http://localhost:3000/_next/static/chunks/app/page.js 404
```

## 🔍 원인 분석

1. **개발 서버가 제대로 실행되지 않음**
   - VS Code 터미널이 비어있음
   - 서버 로그가 보이지 않음

2. **빌드 캐시 문제**
   - `.next` 폴더 손상
   - 캐시 파일 불일치

3. **포트 충돌**
   - 다른 프로세스가 3000 포트 사용 중

## ✅ 해결 방법

### 방법 1: 개발 서버 재시작 (가장 먼저 시도)

1. **현재 실행 중인 Node.js 프로세스 종료:**
   ```powershell
   # PowerShell에서 실행
   Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
   ```

2. **.next 폴더 삭제:**
   ```powershell
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   ```

3. **node_modules 캐시 정리 (선택사항):**
   ```powershell
   Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
   ```

4. **개발 서버 재시작:**
   ```powershell
   npm run dev
   ```

### 방법 2: 포트 변경해서 실행

3000 포트가 사용 중일 수 있습니다:

```powershell
# 포트 3001에서 실행
$env:PORT=3001; npm run dev
```

그리고 브라우저에서 `http://localhost:3001` 접속

### 방법 3: 완전 초기화

```powershell
# 1. 모든 Node.js 프로세스 종료
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# 2. 캐시 폴더 삭제
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue

# 3. 의존성 재설치 (필요시)
# npm install

# 4. 개발 서버 재시작
npm run dev
```

## 🔍 확인 사항

### 개발 서버가 제대로 실행되었는지 확인

터미널에서 다음과 같은 메시지가 보여야 합니다:

```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in 2.5s
```

### 브라우저 콘솔 확인

서버가 정상적으로 실행되면 404 에러가 사라져야 합니다.

### 포트 사용 확인

```powershell
netstat -ano | findstr :3000
```

다른 프로세스가 3000 포트를 사용 중이면 해당 프로세스를 종료하세요.

## 🚀 빠른 해결 명령어

한 번에 실행:

```powershell
# 모든 Node.js 프로세스 종료
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# 캐시 삭제
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 개발 서버 재시작
npm run dev
```

## 📝 참고

- Next.js 개발 서버는 `.next` 폴더에 빌드 결과를 저장합니다
- 이 폴더가 손상되면 404 에러가 발생할 수 있습니다
- 삭제 후 재시작하면 자동으로 다시 생성됩니다

---

**다음 단계**: 위 명령어를 실행한 후, 개발 서버가 정상적으로 시작되는지 확인하세요!


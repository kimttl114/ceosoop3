# 🚨 Next.js 404 에러 빠른 해결

## 문제

브라우저 콘솔에 다음과 같은 404 에러가 나타납니다:
- `GET http://localhost:3000/_next/static/css/app/layout.css 404`
- `GET http://localhost:3000/_next/static/chunks/... 404`

## 빠른 해결 방법

### 방법 1: 자동 스크립트 사용 (권장)

PowerShell에서 실행:

```powershell
.\restart-dev-server.ps1
```

### 방법 2: 수동 해결

1. **모든 Node.js 프로세스 종료:**
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
   ```

2. **.next 폴더 삭제:**
   ```powershell
   Remove-Item -Recurse -Force .next
   ```

3. **개발 서버 재시작:**
   ```powershell
   npm run dev
   ```

### 방법 3: 포트 변경

3000 포트가 사용 중이면 다른 포트 사용:

```powershell
$env:PORT=3001; npm run dev
```

그리고 브라우저에서 `http://localhost:3001` 접속

## 확인 사항

개발 서버가 정상적으로 시작되면 터미널에 다음이 보여야 합니다:

```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in X.Xs
```

## 여전히 문제가 있다면

1. 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
2. 시크릿 모드에서 테스트
3. 다른 브라우저에서 테스트

---

**다음 단계**: 위 방법 중 하나를 시도한 후, 404 에러가 사라졌는지 확인하세요!


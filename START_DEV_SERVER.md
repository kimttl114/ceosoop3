# 🚀 개발 서버 시작 가이드

## ✅ 준비 완료

1. ✅ `.next` 캐시 폴더 삭제 완료
2. ✅ 실행 중인 개발 서버 종료 완료

## 다음 단계

### 개발 서버 시작

**VS Code 터미널** 또는 **PowerShell**에서 실행:

```powershell
npm run dev
```

### 정상 실행 확인

개발 서버가 정상적으로 시작되면 다음과 같은 메시지가 표시됩니다:

```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in X.Xs
```

### 브라우저에서 확인

1. 브라우저를 열고 `http://localhost:3000` 접속
2. 개발자 도구 콘솔 열기 (F12)
3. 404 에러가 사라졌는지 확인

## 문제가 계속되면

### 1. 포트 변경

다른 포트에서 실행:

```powershell
$env:PORT=3001; npm run dev
```

그리고 `http://localhost:3001` 접속

### 2. 완전 초기화

```powershell
# 모든 Node.js 프로세스 종료
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# 캐시 삭제
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue

# 개발 서버 재시작
npm run dev
```

### 3. 브라우저 캐시 삭제

- Ctrl + Shift + Delete
- 또는 시크릿 모드에서 테스트

---

**다음**: `npm run dev` 실행 후 결과를 알려주세요!


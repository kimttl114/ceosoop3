# Next.js 정적 파일 404 오류 해결

## 🔴 문제 현상
- CSS 파일 (`layout.css`) 404 오류
- JavaScript 파일 (`main-app.js`, `app-pages-internals.js`) 404 오류
- 페이지가 "로딩 중..." 상태에서 멈춤

## ✅ 해결 방법

### Step 1: 개발 서버 종료
현재 실행 중인 개발 서버를 완전히 종료하세요:
1. 개발 서버를 실행한 터미널/창 찾기
2. `Ctrl + C`를 눌러 서버 종료
3. 또는 PowerShell에서:
   ```powershell
   Get-Process -Name node | Stop-Process -Force
   ```

### Step 2: 캐시 정리 (이미 완료됨)
✅ `.next` 폴더 삭제 완료

### Step 3: 개발 서버 재시작
프로젝트 폴더에서:
```powershell
npm run dev
```

### Step 4: 브라우저 새로고침
- 브라우저 캐시 강제 새로고침: `Ctrl + Shift + R` (Windows)
- 또는 개발자 도구(F12) → Network 탭 → "Disable cache" 체크 후 새로고침

## 🔧 추가 해결 방법

### 방법 1: 포트 변경
포트 3000이 사용 중이면 다른 포트 사용:
```powershell
npm run dev -- -p 3001
```

### 방법 2: 완전 정리 후 재시작
```powershell
# 1. 개발 서버 종료
# 2. 캐시 삭제
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# 3. 의존성 재설치 (필요시)
npm install

# 4. 개발 서버 시작
npm run dev
```

### 방법 3: 브라우저 캐시 완전 삭제
1. 개발자 도구(F12) 열기
2. Application 탭 → Clear storage
3. "Clear site data" 클릭
4. 페이지 새로고침

## 📋 확인 사항

서버 재시작 후 확인:
- ✅ 콘솔에 404 에러가 없어야 함
- ✅ CSS가 적용되어야 함
- ✅ 페이지가 정상적으로 렌더링되어야 함
- ✅ 네트워크 탭에서 모든 파일이 200 상태여야 함

## 🚨 여전히 문제가 있으면

1. **Node.js 버전 확인**: `node --version` (v18 이상 권장)
2. **포트 충돌 확인**: 다른 프로그램이 포트 3000을 사용 중인지 확인
3. **파일 권한 확인**: 프로젝트 폴더에 쓰기 권한이 있는지 확인
4. **로그 확인**: 터미널에 표시되는 에러 메시지 확인


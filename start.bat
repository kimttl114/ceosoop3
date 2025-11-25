@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ====================================
echo 자영업자 블라인드 개발 서버 시작
echo ====================================
echo.

echo 현재 디렉토리: %CD%
echo.

if not exist "package.json" (
    echo 오류: package.json을 찾을 수 없습니다.
    echo 올바른 프로젝트 디렉토리에서 실행해주세요.
    pause
    exit /b 1
)

if not exist "app" (
    echo 오류: app 디렉토리를 찾을 수 없습니다.
    echo 올바른 프로젝트 디렉토리에서 실행해주세요.
    pause
    exit /b 1
)

echo 의존성 확인 중...
if not exist "node_modules" (
    echo node_modules가 없습니다. 설치를 시작합니다...
    call npm install
    if errorlevel 1 (
        echo 오류: npm install 실패
        pause
        exit /b 1
    )
)

echo.
echo 개발 서버를 시작합니다...
echo 브라우저에서 http://localhost:3000 을 열어주세요.
echo 서버를 중지하려면 Ctrl+C를 누르세요.
echo.

call npm run dev

pause

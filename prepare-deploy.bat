@echo off
chcp 65001 >nul
echo ====================================
echo GitHub 업로드 준비 스크립트
echo ====================================
echo.

cd /d "%~dp0"

echo 현재 디렉토리: %CD%
echo.

if not exist "package.json" (
    echo [오류] package.json을 찾을 수 없습니다.
    echo 올바른 프로젝트 디렉토리에서 실행해주세요.
    pause
    exit /b 1
)

echo [1단계] Git 설치 확인 중...
git --version >nul 2>&1
if errorlevel 1 (
    echo [오류] Git이 설치되어 있지 않습니다.
    echo.
    echo Git 설치 방법:
    echo 1. https://git-scm.com/download/win 접속
    echo 2. 다운로드 후 설치
    echo 3. 설치 완료 후 이 스크립트를 다시 실행하세요.
    echo.
    pause
    exit /b 1
)

echo [확인] Git이 설치되어 있습니다.
echo.

echo [2단계] Git 초기화 중...
if exist ".git" (
    echo [알림] 이미 Git 저장소입니다.
) else (
    git init
    echo [완료] Git 초기화 완료
)
echo.

echo [3단계] .gitignore 확인 중...
if not exist ".gitignore" (
    echo [경고] .gitignore 파일이 없습니다.
) else (
    echo [확인] .gitignore 파일이 있습니다.
)
echo.

echo [4단계] 파일 추가 중...
git add .
echo [완료] 파일 추가 완료
echo.

echo [5단계] 커밋 중...
git commit -m "Initial commit for deployment" 2>nul
if errorlevel 1 (
    echo [알림] 이미 커밋된 파일이 있거나 변경사항이 없습니다.
) else (
    echo [완료] 커밋 완료
)
echo.

echo ====================================
echo 준비 완료!
echo ====================================
echo.
echo 다음 단계:
echo.
echo 1. GitHub에서 새 저장소를 만드세요:
echo    https://github.com/new
echo.
echo 2. 저장소 이름을 입력하고 "Create repository" 클릭
echo.
echo 3. 다음 명령어를 실행하세요 (YOUR_USERNAME을 본인의 사용자명으로 변경):
echo.
echo    git remote add origin https://github.com/YOUR_USERNAME/저장소이름.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 또는 GitHub Desktop을 사용하세요:
echo 1. GitHub Desktop 다운로드: https://desktop.github.com
echo 2. File -^> Add Local Repository
echo 3. 이 폴더 선택
echo 4. Publish repository 클릭
echo.
echo ====================================
pause


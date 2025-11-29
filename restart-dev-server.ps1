# Next.js 개발 서버 재시작 스크립트

Write-Host "🔄 Next.js 개발 서버 재시작 중..." -ForegroundColor Cyan
Write-Host ""

# 1. 실행 중인 Node.js 프로세스 확인
Write-Host "1️⃣ 실행 중인 Node.js 프로세스 확인..." -ForegroundColor Yellow
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
if ($nodeProcesses) {
    Write-Host "   발견된 Node.js 프로세스: $($nodeProcesses.Count)개" -ForegroundColor Yellow
    Write-Host "   ⚠️  개발 서버를 재시작하려면 이 프로세스들을 종료해야 합니다."
    Write-Host "   수동으로 종료하려면 Ctrl+C를 누르세요." -ForegroundColor Red
    Write-Host ""
    $continue = Read-Host "계속하시겠습니까? (y/n)"
    if ($continue -ne "y") {
        Write-Host "취소되었습니다." -ForegroundColor Red
        exit
    }
    
    Write-Host "   Node.js 프로세스 종료 중..." -ForegroundColor Yellow
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "   ✅ 완료" -ForegroundColor Green
} else {
    Write-Host "   ✅ 실행 중인 Node.js 프로세스 없음" -ForegroundColor Green
}

# 2. .next 폴더 삭제
Write-Host ""
Write-Host "2️⃣ .next 캐시 폴더 삭제 중..." -ForegroundColor Yellow
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
    Write-Host "   ✅ .next 폴더 삭제 완료" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  .next 폴더가 없습니다 (정상)" -ForegroundColor Gray
}

# 3. node_modules 캐시 삭제 (선택사항)
Write-Host ""
Write-Host "3️⃣ node_modules 캐시 확인..." -ForegroundColor Yellow
if (Test-Path "node_modules/.cache") {
    $deleteCache = Read-Host "   node_modules/.cache도 삭제하시겠습니까? (y/n)"
    if ($deleteCache -eq "y") {
        Remove-Item -Recurse -Force "node_modules/.cache" -ErrorAction SilentlyContinue
        Write-Host "   ✅ 캐시 삭제 완료" -ForegroundColor Green
    }
} else {
    Write-Host "   ℹ️  캐시 폴더가 없습니다 (정상)" -ForegroundColor Gray
}

# 4. 개발 서버 시작
Write-Host ""
Write-Host "4️⃣ 개발 서버 시작 중..." -ForegroundColor Yellow
Write-Host "   포트: 3000" -ForegroundColor Gray
Write-Host "   브라우저: http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# npm run dev 실행
npm run dev


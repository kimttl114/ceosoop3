# gsutil 설치 문제 해결

## 현재 상태
`gsutil --version` 명령어가 작동하지 않습니다.

## 가능한 원인과 해결

### 원인 1: 설치가 아직 완료되지 않음

**확인 사항:**
- Google Cloud SDK 설치 프로그램(`GoogleCloudSDKInstaller.exe`)을 실행했나요?
- 설치가 완료되었나요?

**해결:**
1. https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe 다운로드
2. 설치 프로그램 실행
3. 설치 마법사 진행
4. ✅ **"Add Cloud SDK to PATH"** 옵션 반드시 체크
5. 설치 완료까지 대기

---

### 원인 2: PowerShell을 재시작하지 않음

**확인 사항:**
- 설치 후 PowerShell을 재시작했나요?

**해결:**
1. 현재 PowerShell 창 **완전히 종료**
2. 새 PowerShell 창 열기
3. 프로젝트 폴더로 이동:
   ```powershell
   cd C:\Users\user\Desktop\ceosoop3
   ```
4. 다시 시도:
   ```powershell
   gsutil --version
   ```

---

### 원인 3: PATH에 추가되지 않음

**확인:**
```powershell
$env:PATH -split ';' | Select-String -Pattern "Cloud|google-cloud"
```

출력이 없다면 PATH에 추가되지 않은 것입니다.

**해결 방법 1: 환경 변수 수동 추가**
1. Windows 검색 → "환경 변수" 검색
2. "시스템 환경 변수 편집" 클릭
3. "환경 변수" 버튼 클릭
4. "시스템 변수" 섹션에서 "Path" 선택 → "편집"
5. "새로 만들기" 클릭
6. 다음 경로 추가 (설치 경로에 따라 다를 수 있음):
   ```
   C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin
   ```
   또는:
   ```
   %LOCALAPPDATA%\Google\Cloud SDK\google-cloud-sdk\bin
   ```
7. "확인" 클릭하여 저장
8. PowerShell 재시작

**해결 방법 2: 수동으로 gsutil 경로 찾기**

```powershell
# Program Files에서 검색
Get-ChildItem -Path "C:\Program Files*" -Filter "gsutil.cmd" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 FullName

# LocalAppData에서 검색
Get-ChildItem -Path "$env:LOCALAPPDATA" -Filter "gsutil.cmd" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 FullName
```

찾은 경로를 사용:
```powershell
C:\찾은\경로\gsutil.cmd --version
```

---

## 빠른 해결책: 콘솔 UI 사용

gsutil 설치에 문제가 있다면, **Google Cloud Console UI에서 직접 CORS 설정**할 수 있습니다:

1. https://console.cloud.google.com/storage/browser 접속
2. `ceo-blaind.firebasestorage.app` 버킷 클릭
3. **"구성" (Configuration)** 탭 클릭
4. **"CORS"** 섹션 찾기
5. **"Edit CORS configuration"** 클릭
6. `cors.json` 파일 내용 붙여넣기
7. 저장

자세한 가이드: `QUICK_CORS_SETUP.md` 참고

---

## 설치 확인 체크리스트

- [ ] Google Cloud SDK 설치 프로그램 다운로드 완료
- [ ] 설치 프로그램 실행
- [ ] "Add Cloud SDK to PATH" 옵션 체크
- [ ] 설치 완료
- [ ] PowerShell 완전히 종료
- [ ] 새 PowerShell 창 열기
- [ ] `gsutil --version` 실행 성공

---

## 다음 단계

설치가 완료되고 `gsutil --version`이 작동하면:

1. **인증:**
   ```powershell
   gcloud auth login
   ```

2. **프로젝트 설정:**
   ```powershell
   gcloud config set project ceo-blaind
   ```

3. **CORS 설정 적용:**
   ```powershell
   gsutil cors set cors.json gs://ceo-blaind.firebasestorage.app
   ```



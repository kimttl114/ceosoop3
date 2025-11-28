# gsutil 설치 및 CORS 설정 가이드

## Google Cloud SDK 설치 (Windows)

### Step 1: 다운로드

1. **Google Cloud SDK 설치 페이지**:
   - https://cloud.google.com/sdk/docs/install-sdk
   - 또는 직접 다운로드:
     - https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe

2. **"Windows 64-bit (x86_64)"** 클릭하여 다운로드

### Step 2: 설치

1. 다운로드한 `GoogleCloudSDKInstaller.exe` 실행
2. 설치 마법사 따라가기
3. ✅ **"Add Cloud SDK to PATH"** 옵션 반드시 체크
4. 설치 완료까지 대기

### Step 3: PowerShell 재시작

**중요**: 설치 후 PowerShell을 완전히 종료하고 다시 열어야 PATH가 적용됩니다!

### Step 4: 설치 확인

새 PowerShell에서:

```powershell
gsutil --version
```

출력 예시:
```
gsutil version: 5.xx
```

### Step 5: 인증

```powershell
gcloud init
```

또는:

```powershell
gcloud auth login
```

브라우저가 열리면:
1. Google 계정 선택 (ceo-blaind 프로젝트가 있는 계정)
2. 권한 승인

### Step 6: 프로젝트 설정

```powershell
gcloud config set project ceo-blaind
```

확인:

```powershell
gcloud config get-value project
```

출력: `ceo-blaind`

### Step 7: CORS 설정 적용

프로젝트 폴더에서:

```powershell
gsutil cors set cors.json gs://ceo-blaind.firebasestorage.app
```

성공 메시지:
```
Setting CORS on gs://ceo-blaind.firebasestorage.app/...
```

### Step 8: 설정 확인

```powershell
gsutil cors get gs://ceo-blaind.firebasestorage.app
```

출력으로 CORS 설정 내용 확인

---

## 문제 해결

### gsutil 명령어를 찾을 수 없음

1. **PowerShell 완전히 종료 후 재시작**
2. **PATH 확인**:
   ```powershell
   $env:PATH -split ';' | Select-String "Cloud SDK"
   ```
3. **수동 PATH 추가** (필요시):
   - 환경 변수 편집
   - PATH에 추가: `C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin`

### 인증 오류

```powershell
gcloud auth application-default login
```

### 프로젝트 설정 오류

```powershell
gcloud config list
gcloud config set project ceo-blaind
```

---

## 빠른 체크리스트

- [ ] Google Cloud SDK 설치
- [ ] PowerShell 재시작
- [ ] `gsutil --version` 확인
- [ ] `gcloud auth login` 실행
- [ ] `gcloud config set project ceo-blaind` 실행
- [ ] `gsutil cors set cors.json gs://ceo-blaind.firebasestorage.app` 실행
- [ ] `gsutil cors get gs://ceo-blaind.firebasestorage.app` 로 확인

---

## 참고

더 빠른 방법: **콘솔 UI에서 직접 설정** (설치 불필요)
- `QUICK_CORS_SETUP.md` 참고




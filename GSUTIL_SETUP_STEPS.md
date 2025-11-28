# gsutil 설정 단계별 가이드

## ✅ 현재 상태
- Google Cloud SDK 설치 완료
- gsutil 버전: 5.35
- 경로: `C:\Users\user\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin`

---

## 🚀 다음 단계

### Step 1: 인증 설정

전체 경로로 실행:
```powershell
& "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" auth login
```

또는 PATH 추가 후:
```powershell
gcloud auth login
```

**동작:**
- 브라우저가 자동으로 열립니다
- Google 계정 선택 (ceo-blaind 프로젝트가 있는 계정)
- 권한 승인
- 터미널에서 "You are now authenticated" 메시지 확인

---

### Step 2: 프로젝트 설정

```powershell
& "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" config set project ceo-blaind
```

확인:
```powershell
& "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" config get-value project
```

출력: `ceo-blaind` ✅

---

### Step 3: CORS 설정 적용

프로젝트 폴더에서:
```powershell
cd C:\Users\user\Desktop\ceosoop3
& "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd" cors set cors.json gs://ceo-blaind.firebasestorage.app
```

**성공 메시지:**
```
Setting CORS on gs://ceo-blaind.firebasestorage.app/...
```

---

### Step 4: 설정 확인

```powershell
& "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd" cors get gs://ceo-blaind.firebasestorage.app
```

설정된 CORS 내용이 출력되면 완료! ✅

---

## 💡 편의를 위해 PATH 추가 (선택사항)

PATH에 추가하면 전체 경로 없이 사용할 수 있습니다:

### 방법 1: 현재 세션에만 추가 (임시)

```powershell
$env:PATH += ";$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin"
```

이제 바로 사용 가능:
```powershell
gsutil --version
gcloud auth login
```

### 방법 2: 영구적으로 추가

1. Windows 검색 → "환경 변수" 검색
2. "시스템 환경 변수 편집" 클릭
3. "환경 변수" 버튼 클릭
4. "시스템 변수" 섹션에서 "Path" 선택 → "편집"
5. "새로 만들기" 클릭
6. 다음 경로 추가:
   ```
   %LOCALAPPDATA%\Google\Cloud SDK\google-cloud-sdk\bin
   ```
7. "확인" 클릭하여 저장
8. PowerShell 재시작

---

## 📋 빠른 체크리스트

- [x] Google Cloud SDK 설치 완료
- [x] gsutil 버전 확인 (5.35)
- [ ] `gcloud auth login` 실행
- [ ] `gcloud config set project ceo-blaind` 실행
- [ ] `gsutil cors set cors.json gs://ceo-blaind.firebasestorage.app` 실행
- [ ] `gsutil cors get` 로 확인

---

## 🔍 문제 해결

### 인증 오류

```powershell
& "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" auth application-default login
```

### 프로젝트 목록 확인

```powershell
& "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" projects list
```

### 현재 프로젝트 확인

```powershell
& "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" config get-value project
```


# Google Cloud SDK 설치 - 지금 바로 실행

## 🚀 Step 1: 다운로드

다운로드 링크가 브라우저에서 열립니다. 다운로드가 시작되면:

1. **다운로드된 파일**: `GoogleCloudSDKInstaller.exe`
2. 다운로드 폴더에서 파일 실행

---

## 📦 Step 2: 설치

설치 마법사에서:

1. **"Next"** 클릭
2. 설치 경로 확인 (기본값 사용 권장)
3. ✅ **"Add Cloud SDK to PATH"** 반드시 체크!
4. **"Next"** → **"Install"** 클릭
5. 설치 완료까지 대기 (1-2분 소요)

---

## ⚠️ Step 3: PowerShell 재시작 (중요!)

설치가 완료되면:

1. **현재 PowerShell 창 완전히 종료**
2. **새 PowerShell 창 열기**
3. 프로젝트 폴더로 이동:
   ```powershell
   cd C:\Users\user\Desktop\ceosoop3
   ```

---

## ✅ Step 4: 설치 확인

새 PowerShell에서:

```powershell
gsutil --version
```

**출력 예시**:
```
gsutil version: 5.xx
```

이게 보이면 설치 성공! ✅

---

## 🔐 Step 5: 인증

```powershell
gcloud auth login
```

브라우저가 열리면:
1. Google 계정 선택 (ceo-blaind 프로젝트가 있는 계정)
2. 권한 승인

---

## 🎯 Step 6: 프로젝트 설정

```powershell
gcloud config set project ceo-blaind
```

확인:
```powershell
gcloud config get-value project
```

출력: `ceo-blaind` ✅

---

## 🎉 Step 7: CORS 설정 적용!

프로젝트 폴더에서:

```powershell
gsutil cors set cors.json gs://ceo-blaind.firebasestorage.app
```

**성공 메시지**:
```
Setting CORS on gs://ceo-blaind.firebasestorage.app/...
```

---

## 🔍 Step 8: 설정 확인

```powershell
gsutil cors get gs://ceo-blaind.firebasestorage.app
```

설정된 CORS 내용이 출력되면 완료! ✅

---

## 💡 문제 해결

### gsutil 명령어를 찾을 수 없음

**PowerShell 재시작했나요?** 
- 설치 후 반드시 PowerShell을 완전히 종료하고 다시 열어야 합니다!

PATH 확인:
```powershell
$env:PATH -split ';' | Select-String "Cloud SDK"
```

### 인증 오류

```powershell
gcloud auth application-default login
```

---

## 📋 빠른 체크리스트

- [ ] Google Cloud SDK 다운로드 완료
- [ ] 설치 완료 (PATH 옵션 체크 확인)
- [ ] PowerShell 재시작
- [ ] `gsutil --version` 확인
- [ ] `gcloud auth login` 실행
- [ ] `gcloud config set project ceo-blaind` 실행
- [ ] `gsutil cors set cors.json gs://ceo-blaind.firebasestorage.app` 실행
- [ ] `gsutil cors get` 로 확인




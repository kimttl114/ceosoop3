# Storage 버킷 찾기 및 CORS 설정 방법

## 🔍 버킷 목록이 안 뜨는 경우

### 방법 1: Firebase Console에서 직접 설정 (가장 쉬움) ⭐

1. **Firebase Console 접속**
   - https://console.firebase.google.com
   - 프로젝트 선택 (ceo-blaind 또는 사용 중인 프로젝트)

2. **Storage 메뉴로 이동**
   - 왼쪽 메뉴에서 **"Storage"** 클릭
   - 이미 활성화되어 있다면 바로 접근 가능

3. **버킷 이름 확인**
   - Storage 페이지 상단에 버킷 이름이 표시됨
   - 예: `ceo-blaind.firebasestorage.app` 또는 `ceo-blaind.appspot.com`

4. **Rules 탭에서 보안 규칙 확인**
   - Storage 페이지에서 **"Rules"** 탭 클릭
   - 현재 보안 규칙 확인

**⚠️ 참고:** Firebase Console에서는 CORS를 직접 설정할 수 없습니다. CORS는 Google Cloud Console에서만 설정 가능합니다.

---

### 방법 2: 환경 변수에서 버킷 이름 확인

프로젝트 폴더의 `.env.local` 파일을 확인하세요:

```bash
# 파일 열기
code .env.local
```

또는 PowerShell에서:
```powershell
Get-Content .env.local | Select-String "STORAGE_BUCKET"
```

버킷 이름이 다음과 같이 설정되어 있을 것입니다:
```
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ceo-blaind.firebasestorage.app
```

---

### 방법 3: Google Cloud Console에서 프로젝트 확인

1. **프로젝트 선택 확인**
   - Google Cloud Console 상단에서 프로젝트 선택 드롭다운 클릭
   - 올바른 프로젝트가 선택되어 있는지 확인
   - 프로젝트 ID: `ceo-blaind` (또는 사용 중인 프로젝트 ID)

2. **권한 확인**
   - 왼쪽 상단 햄버거 메뉴 (☰) 클릭
   - **"IAM & Admin"** → **"IAM"** 클릭
   - 본인 계정이 **"Storage Admin"** 또는 **"Owner"** 권한을 가지고 있는지 확인

3. **API 활성화 확인**
   - 왼쪽 상단 햄버거 메뉴 → **"APIs & Services"** → **"Enabled APIs"**
   - **"Cloud Storage JSON API"**가 활성화되어 있는지 확인
   - 활성화되어 있지 않으면 검색해서 활성화

---

### 방법 4: 직접 URL로 버킷 접근

버킷 이름을 알고 있다면 직접 URL로 접근:

1. **Google Cloud Console Storage URL:**
   ```
   https://console.cloud.google.com/storage/browser?project=ceo-blaind
   ```

2. 또는 Firebase 프로젝트 ID를 알고 있다면:
   ```
   https://console.cloud.google.com/storage/browser?project=YOUR_PROJECT_ID
   ```

---

### 방법 5: gsutil로 버킷 목록 확인

PowerShell에서:
```powershell
gsutil ls
```

또는 특정 프로젝트의 버킷 목록:
```powershell
gsutil ls -p ceo-blaind
```

---

## ✅ 버킷을 찾은 후 CORS 설정

버킷 이름을 확인했다면:

### Firebase Console에서 확인한 경우:
- 버킷 이름을 복사
- Google Cloud Console로 이동
- Storage → Buckets → 해당 버킷 클릭
- Configuration 탭 → CORS 설정

### Google Cloud Console에서:
1. **Storage → Buckets** 메뉴
2. 버킷 이름 클릭
3. **Configuration** 탭
4. **CORS** 섹션 → **Edit CORS configuration**
5. `cors.json` 파일 내용 붙여넣기
6. **Save**

---

## 🚨 여전히 안 되는 경우

1. **프로젝트 권한 확인**
   - Google Cloud Console에서 프로젝트에 접근 권한이 있는지 확인

2. **Firebase 프로젝트 ID 확인**
   - Firebase Console → 프로젝트 설정 → 일반
   - 프로젝트 ID 확인

3. **다른 계정으로 로그인**
   - 다른 Google 계정이 프로젝트 소유자인 경우

4. **프로젝트가 활성화되어 있는지 확인**
   - Firebase Console에서 프로젝트 상태 확인

---

## 💡 빠른 확인 방법

브라우저 콘솔에서 직접 확인:
```javascript
// 개발자 도구(F12) → Console 탭에서 실행
console.log('Storage Bucket:', firebase.app().options.storageBucket)
```

또는 코드에서:
```typescript
// lib/firebase.ts 또는 브라우저 콘솔
console.log(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
```


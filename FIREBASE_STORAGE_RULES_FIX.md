# 🔧 Firebase Storage Rules 수정 가이드

## 📊 문제 원인

BGM 믹싱이 실패하는 가장 가능성 높은 원인: **Firebase Storage 접근 권한 문제**

---

## 🔧 해결 방법

### 1단계: Firebase Console 접속

**링크**: https://console.firebase.google.com/project/ceo-blaind/storage/rules

또는:
1. Firebase Console 접속: https://console.firebase.google.com/
2. 프로젝트 선택: `ceo-blaind`
3. 좌측 메뉴: **Storage** 클릭
4. 상단 탭: **Rules** 클릭

### 2단계: Storage Rules 확인 및 수정

**현재 Rules가 다음과 같거나 더 제한적일 수 있습니다:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;  // ← 문제! 인증 필요
    }
  }
}
```

**이것을 다음과 같이 수정하세요:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 공용 BGM 폴더 - 모든 사용자 읽기 가능 (인증 불필요)
    match /bgm/public/{allPaths=**} {
      allow read: if true;  // ← 공개 읽기
      allow write: if request.auth != null;
    }
    
    // 개인 BGM 폴더 - 본인만 읽기/쓰기
    match /bgm/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 기타 파일들 (이미지, 문서 등) - 인증 필요
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3단계: Rules 저장 및 게시

1. 위 Rules를 복사하여 붙여넣기
2. **"게시"** 버튼 클릭
3. 확인 메시지에서 **"게시"** 클릭

### 4단계: 테스트

1. 개발 서버 재시작 (필요시)
2. BGM 선택하여 테스트
3. 서버 콘솔에서 BGM 다운로드 성공 여부 확인

---

## 🔍 Rules 설명

### 공용 BGM (`/bgm/public/`)
- **읽기**: 모든 사용자 가능 (`allow read: if true`)
- **쓰기**: 로그인한 사용자만

### 개인 BGM (`/bgm/{userId}/`)
- **읽기/쓰기**: 본인만 가능 (`request.auth.uid == userId`)

---

## ✅ 확인 사항

Rules 수정 후:
1. **저장 및 게시** 완료했는지 확인
2. **BGM 파일 경로** 확인:
   - 공용: `bgm/public/파일명.mp3`
   - 개인: `bgm/{userId}/파일명.mp3`

---

## 🧪 테스트

Rules 수정 후:
1. BGM 선택
2. "AI로 방송 만들기" 클릭
3. 서버 콘솔에서 다음 확인:

**성공 시:**
```
[BGM 믹싱] 2단계: BGM 다운로드 중...
[BGM 믹싱] ✅ BGM 다운로드 완료: 123456 bytes
```

**실패 시:**
```
[BGM 믹싱] ❌ BGM 다운로드 실패: HTTP 403
```

---

**Firebase Storage Rules를 수정한 후 다시 테스트해보세요!**


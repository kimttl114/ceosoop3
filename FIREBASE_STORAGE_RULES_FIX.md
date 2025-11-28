# Firebase Storage 권한 오류 해결 (403 Forbidden)

## 🔴 현재 문제
- **에러 코드**: `storage/unauthorized`
- **상태 코드**: 403 Forbidden
- **메시지**: "User does not have permission to access 'posts/...'"

## ✅ 해결 방법: Firebase Storage Rules 설정

### Step 1: Firebase Console 접속
1. https://console.firebase.google.com 접속
2. 프로젝트 선택: `ceo-blaind`

### Step 2: Storage Rules로 이동
1. 왼쪽 메뉴: **Storage** 클릭
2. 상단 탭: **Rules** 클릭

### Step 3: Rules 적용
기존 규칙을 모두 삭제하고 다음 규칙을 붙여넣기:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 게시글 이미지/비디오 업로드
    match /posts/{userId}/{type}/{fileName} {
      // 인증된 사용자만 업로드 가능 (본인만)
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 104857600; // 100MB 제한
      // 모든 사용자 읽기 가능
      allow read: if true;
    }
    
    // 생성된 문서 저장
    match /generated_documents/{userId}/{fileName} {
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 52428800; // 50MB 제한
      allow read: if request.auth != null 
                  && request.auth.uid == userId;
    }
    
    // BGM 파일 (공용 및 개인)
    match /bgm/public/{fileName} {
      allow read: if true;
      // 로그인한 사용자만 업로드 가능
      allow write: if request.auth != null
                   && request.resource.size < 10485760; // 10MB 제한
    }
    
    match /bgm/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 10485760; // 10MB 제한
    }
    
    // 사용자 아바타
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5242880 // 5MB 제한
                   && request.resource.contentType.matches('image/.*');
    }
    
    // 사업자 인증 이미지 (민감 정보)
    match /verifications/{userId}/{fileName} {
      allow read: if false; // 읽기 불가 (보안)
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5242880 // 5MB 제한
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

### Step 4: 저장 및 게시
1. **Publish** (게시) 버튼 클릭
2. 확인 메시지에서 **확인** 클릭

---

## 📋 Rules 설명

### 게시글 미디어 (`/posts/{userId}/{type}/{fileName}`)
- **업로드**: 로그인한 사용자가 본인 폴더에만 업로드 가능 ✅
- **읽기**: 모든 사용자 가능
- **크기 제한**: 100MB

이 규칙이 없으면 업로드가 실패합니다!

---

## ⚠️ 중요 사항

1. **Rules 적용 시간**: 즉시 적용 (1분 이내)
2. **본인만 업로드**: `request.auth.uid == userId` 조건으로 본인만 가능
3. **인증 필요**: 로그인한 사용자만 업로드 가능

---

## ✅ 확인 방법

Rules 적용 후:
1. **1분 대기** (Rules 적용 시간)
2. **파일 업로드 다시 시도**
3. **개발자 도구(F12) → Console 탭**
   - `storage/unauthorized` 오류가 사라져야 함
   - 업로드가 성공해야 함

---

## 🚨 여전히 안 되면

1. **로그인 상태 확인**
   - 로그인되어 있는지 확인
   - 로그아웃 후 다시 로그인

2. **Rules 문법 확인**
   - Firebase Console → Storage → Rules
   - Rules에 오류가 없어야 함 (빨간색 표시 확인)

3. **사용자 ID 확인**
   - 업로드 경로의 `userId`와 로그인한 사용자 ID가 일치하는지 확인


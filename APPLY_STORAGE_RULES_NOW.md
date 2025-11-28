# 🚨 긴급: Firebase Storage 보안 규칙 적용 필요

## 현재 발생 중인 오류

콘솔에 다음 오류가 발생하고 있습니다:
- ❌ `storage/unauthorized` (403 Forbidden)
- ❌ `Firebase Storage: User does not have permission to access 'posts/{userId}/images/{fileName}'`

**원인:** Firebase Storage 보안 규칙이 적용되지 않아 파일 업로드가 차단되고 있습니다.

---

## ⚡ 빠른 해결 방법 (3단계)

### Step 1: Firebase Console 열기

1. 브라우저에서 다음 링크를 엽니다:
   ```
   https://console.firebase.google.com/project/ceo-blaind/storage/rules
   ```

2. 또는 수동으로:
   - https://console.firebase.google.com 접속
   - 프로젝트 선택: **ceo-blaind**
   - 왼쪽 메뉴: **Storage** 클릭
   - 상단 탭: **Rules** 클릭

### Step 2: Storage 보안 규칙 복사 & 붙여넣기

**기존 규칙을 모두 삭제하고** 다음 규칙을 붙여넣으세요:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 게시글 이미지/비디오 업로드
    match /posts/{userId}/{type}/{fileName} {
      // 로그인한 사용자만 업로드 가능 (본인 폴더에만)
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
    
    // 공용 BGM 파일
    match /bgm/public/{fileName} {
      allow read: if true;
      // 로그인한 사용자만 업로드 가능
      allow write: if request.auth != null
                   && request.resource.size < 10485760; // 10MB 제한
    }
    
    // 개인 BGM 파일
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

### Step 3: 규칙 발행

1. **"Publish" 버튼 클릭** (오른쪽 상단)
2. **확인 대화상자에서 "Publish" 클릭**
3. **규칙 적용 대기** (약 1-2분)

### Step 4: 테스트

1. **브라우저 새로고침** (F5 또는 Ctrl+R)
2. **글쓰기 모달에서 이미지 업로드 시도**
3. **콘솔에서 오류가 사라졌는지 확인**

---

## 🎯 핵심 규칙 (게시글 업로드용)

가장 중요한 규칙:
```javascript
match /posts/{userId}/{type}/{fileName} {
  allow write: if request.auth != null 
               && request.auth.uid == userId
               && request.resource.size < 104857600; // 100MB
  allow read: if true;
}
```

**경로 구조:**
- 이미지: `posts/{userId}/images/{fileName}`
- 비디오: `posts/{userId}/videos/{fileName}`

이 규칙이 없으면 파일 업로드가 실패합니다!

---

## ✅ 체크리스트

- [ ] Firebase Console 접속 완료
- [ ] Storage → Rules 탭 이동
- [ ] 기존 규칙 삭제 후 새 규칙 붙여넣기
- [ ] "Publish" 버튼 클릭
- [ ] 브라우저 새로고침
- [ ] 이미지 업로드 테스트
- [ ] 콘솔 오류 확인

---

## 🔗 직접 링크

**Firebase Storage Rules 설정 페이지:**
https://console.firebase.google.com/project/ceo-blaind/storage/rules

---

## ❓ 문제 해결

### 규칙이 적용되지 않으면?

1. **브라우저 캐시 삭제** (Ctrl+Shift+Delete)
2. **로그아웃 후 다시 로그인**
3. **잠시 대기 후 다시 시도** (규칙 적용까지 최대 2분 소요)
4. **규칙 문법 확인** (Firebase Console에서 규칙 검증)

### 여전히 오류가 발생하면?

1. **규칙이 올바르게 저장되었는지 확인**
2. **사용자 UID가 경로의 `{userId}`와 일치하는지 확인**
3. **파일 크기가 제한(100MB) 이하인지 확인**
4. **콘솔의 정확한 에러 메시지 확인**

---

## 📋 추가 참고 파일

- `STORAGE_RULES_FIXED.md` - 상세 규칙 설명
- `APPLY_FIRESTORE_RULES_NOW.md` - Firestore 규칙 적용 가이드


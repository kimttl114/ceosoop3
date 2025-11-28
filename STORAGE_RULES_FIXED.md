# Firebase Storage Rules - 올바른 버전

## 📋 Firebase Console → Storage → Rules 탭에 적용

기존 규칙을 모두 삭제하고 다음을 붙여넣으세요:

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

## 🎯 핵심 규칙 (게시글 업로드용)

가장 중요한 규칙:
```javascript
match /posts/{userId}/{type}/{fileName} {
  allow write: if request.auth != null 
               && request.auth.uid == userId
               && request.resource.size < 104857600;
  allow read: if true;
}
```

이 규칙이 없으면 파일 업로드가 실패합니다!


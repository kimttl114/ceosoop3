# Firebase Storage 보안 규칙

## 📋 업로드 권한 규칙

Firebase Console → Storage → Rules 탭에 다음 규칙을 설정하세요:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 게시글 이미지/비디오 업로드
    match /posts/{userId}/{type}/{fileName} {
      // 인증된 사용자만 업로드 가능 (본인만)
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 104857600; // 100MB 제한
      // 모든 사용자 읽기 가능
      allow read: if true;
    }
    
    // 생성된 문서 저장
    match /generated_documents/{userId}/{fileName} {
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 52428800; // 50MB 제한
      allow read: if request.auth != null && request.auth.uid == userId;
    }
    
    // BGM 파일 (공용 및 개인)
    match /bgm/{type}/{fileName} {
      // 공용 BGM
      match /public/{fileName} {
        allow read: if true;
        // 로그인한 사용자만 업로드 가능
        allow write: if request.auth != null
                     && request.resource.size < 10485760; // 10MB 제한
      }
      // 개인 BGM
      match /{userId}/{fileName} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.uid == userId
                     && request.resource.size < 10485760; // 10MB 제한
      }
    }
    
    // 사용자 아바타
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 5242880; // 5MB 제한
                   && request.resource.contentType.matches('image/.*');
    }
    
    // 사업자 인증 이미지 (민감 정보)
    match /verifications/{userId}/{fileName} {
      allow read: if false; // 읽기 불가 (보안)
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 5242880; // 5MB 제한
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 🎯 규칙 설명

### 1. 게시글 미디어 (`/posts/{userId}/{type}/{fileName}`)
- **업로드**: 로그인한 사용자가 본인 폴더에만 업로드 가능
- **읽기**: 모든 사용자 가능
- **크기 제한**: 100MB

### 2. 생성된 문서 (`/generated_documents/{userId}/{fileName}`)
- **업로드**: 로그인한 사용자가 본인 폴더에만 업로드 가능
- **읽기**: 본인만 가능
- **크기 제한**: 50MB

### 3. BGM 파일 (`/bgm/{type}/{fileName}`)
- **공용 BGM**: 모든 사용자 읽기 가능, 로그인한 사용자 업로드 가능
- **개인 BGM**: 본인만 읽기/업로드 가능
- **크기 제한**: 10MB

### 4. 사용자 아바타 (`/avatars/{userId}/{fileName}`)
- **읽기**: 모든 사용자 가능
- **업로드**: 본인만 가능
- **크기 제한**: 5MB
- **파일 형식**: 이미지만 허용

### 5. 사업자 인증 이미지 (`/verifications/{userId}/{fileName}`)
- **읽기**: 불가 (보안)
- **업로드**: 본인만 가능
- **크기 제한**: 5MB
- **파일 형식**: 이미지만 허용

## ⚠️ 중요 사항

1. **규칙 적용 시간**: 규칙 변경 후 즉시 적용 (1-2분 소요 가능)
2. **테스트**: Firebase Console → Storage → Rules → "Rules Playground"에서 테스트 가능
3. **크기 제한**: 각 경로별로 다른 크기 제한 적용

## 🔧 규칙 적용 방법

1. Firebase Console 접속: https://console.firebase.google.com
2. 프로젝트 선택
3. 왼쪽 메뉴: **Storage** 클릭
4. 상단 탭: **Rules** 클릭
5. 기존 규칙 삭제 후 위 규칙 붙여넣기
6. **Publish** 클릭

## ✅ 확인 사항

업로드가 안 될 때:
1. ✅ 로그인되어 있는지 확인
2. ✅ Storage Rules가 올바르게 설정되었는지 확인
3. ✅ 파일 크기가 제한을 초과하지 않는지 확인
4. ✅ 파일 형식이 허용되는지 확인


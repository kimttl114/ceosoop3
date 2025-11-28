# 🔐 Firebase 전체 보안 규칙 통합 가이드

이 문서에는 애플리케이션에 필요한 **모든 Firebase 보안 규칙**이 포함되어 있습니다.

---

## 📋 목차

1. [Firestore 보안 규칙](#1-firestore-보안-규칙)
2. [Firebase Storage 보안 규칙](#2-firebase-storage-보안-규칙)
3. [적용 방법](#3-적용-방법)
4. [체크리스트](#4-체크리스트)

---

## 1. Firestore 보안 규칙

### 📍 Firebase Console 위치
- **URL:** https://console.firebase.google.com/project/ceo-blaind/firestore/rules
- **경로:** Firebase Console → Firestore Database → Rules 탭

### 📝 전체 규칙

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ============================================
    // Helper Functions
    // ============================================
    
    // 사용자 인증 확인
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // 본인인지 확인
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // ============================================
    // 사용자 정보
    // ============================================
    match /users/{userId} {
      // 모든 사용자 읽기 가능
      allow read: if true;
      // 본인만 생성/수정 가능
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      allow delete: if false; // 사용자 삭제는 서버에서 처리
    }
    
    // ============================================
    // 게시글 (posts)
    // ============================================
    match /posts/{postId} {
      // 모든 사용자 읽기 가능
      allow read: if true;
      // 로그인한 모든 사용자 작성 가능
      allow create: if isAuthenticated();
      // 본인만 수정/삭제 가능
      allow update: if isAuthenticated() && resource.data.uid == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.uid == request.auth.uid;
      
      // 게시글 댓글
      match /comments/{commentId} {
        allow read: if true;
        allow create: if isAuthenticated();
        allow update: if isAuthenticated() && resource.data.uid == request.auth.uid;
        allow delete: if isAuthenticated() && resource.data.uid == request.auth.uid;
      }
    }
    
    // ============================================
    // 투표 (decision_polls)
    // ============================================
    match /decision_polls/{pollId} {
      // 모든 사용자 읽기 가능
      allow read: if true;
      // 로그인한 사용자만 작성 가능
      allow create: if isAuthenticated();
      // 작성자만 수정/삭제 가능
      allow update: if isAuthenticated() && resource.data.authorId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.authorId == request.auth.uid;
      
      // 투표 댓글
      match /comments/{commentId} {
        allow read: if true;
        allow create: if isAuthenticated();
        allow update: if isAuthenticated() && resource.data.uid == request.auth.uid;
        allow delete: if isAuthenticated() && resource.data.uid == request.auth.uid;
      }
      
      // 투표 응답 (votes 서브컬렉션)
      match /votes/{userId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() && isOwner(userId);
        allow update: if isAuthenticated() && isOwner(userId);
        allow delete: if isAuthenticated() && isOwner(userId);
      }
    }
    
    // ============================================
    // 메시지 (쪽지)
    // ============================================
    match /messages/{messageId} {
      // 발신자 또는 수신자만 읽기 가능
      allow read: if isAuthenticated() && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.receiverId == request.auth.uid);
      // 목록 조회를 위한 쿼리 허용
      allow list: if isAuthenticated();
      // 로그인한 사용자만 생성 가능
      allow create: if isAuthenticated();
      // 수신자만 수정 가능 (읽음 처리 등)
      allow update: if isAuthenticated() && resource.data.receiverId == request.auth.uid;
      // 발신자 또는 수신자만 삭제 가능
      allow delete: if isAuthenticated() && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.receiverId == request.auth.uid);
    }
    
    // ============================================
    // 출석체크 (user_checkin)
    // ============================================
    match /user_checkin/{userId} {
      allow read: if true;
      allow write: if isAuthenticated() && isOwner(userId);
    }
    
    // ============================================
    // 게임 데이터 (user_games)
    // ============================================
    match /user_games/{userId} {
      // 본인만 읽기/쓰기 가능
      allow read: if isAuthenticated() && isOwner(userId);
      allow write: if isAuthenticated() && isOwner(userId);
    }
    
    // ============================================
    // 랭킹 (집계 데이터)
    // ============================================
    match /rankings/{rankingId} {
      // 모든 사용자 읽기 가능
      allow read: if true;
      // 서버에서만 쓰기 가능
      allow write: if false;
    }
    
    // ============================================
    // 신고 (reports)
    // ============================================
    match /reports/{reportId} {
      // 로그인한 사용자만 읽기 가능
      allow read: if isAuthenticated();
      // 로그인한 사용자만 신고 가능
      allow create: if isAuthenticated();
      // 관리자 권한은 코드에서 체크
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // ============================================
    // 생성된 문서 (generated_documents)
    // ============================================
    match /generated_documents/{docId} {
      // 본인 문서만 읽기 가능
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      // 로그인한 사용자만 생성 가능
      allow create: if isAuthenticated();
      // 수정 불가 (재생성 필요)
      allow update: if false;
      // 본인 문서만 삭제 가능
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // ============================================
    // 사업자 인증 정보 (verifications)
    // ============================================
    match /verifications/{userId} {
      // 본인만 읽기 가능
      allow read: if isAuthenticated() && isOwner(userId);
      // API에서만 쓰기 가능 (서버)
      allow write: if false;
    }
    
    // ============================================
    // 포인트 상점 아이템 (shopItems)
    // ============================================
    match /shopItems/{itemId} {
      // 모든 사용자 읽기 가능
      allow read: if true;
      // 관리자만 쓰기 가능 (서버에서)
      allow write: if false;
    }
    
    // ============================================
    // 사용자 구매 내역 (purchases)
    // ============================================
    match /purchases/{purchaseId} {
      // 본인 구매 내역만 읽기 가능
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      // 로그인한 사용자만 구매 가능
      allow create: if isAuthenticated();
      // 수정/삭제 불가
      allow update: if false;
      allow delete: if false;
    }
  }
}
```

---

## 2. Firebase Storage 보안 규칙

### 📍 Firebase Console 위치
- **URL:** https://console.firebase.google.com/project/ceo-blaind/storage/rules
- **경로:** Firebase Console → Storage → Rules 탭

### 📝 전체 규칙

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // ============================================
    // 게시글 이미지/비디오 업로드
    // ============================================
    // 경로: posts/{userId}/images/{fileName}
    //      posts/{userId}/videos/{fileName}
    match /posts/{userId}/{type}/{fileName} {
      // 로그인한 사용자만 본인 폴더에 업로드 가능
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 104857600; // 100MB 제한
      // 모든 사용자 읽기 가능
      allow read: if true;
    }
    
    // ============================================
    // 생성된 문서 저장
    // ============================================
    // 경로: generated_documents/{userId}/{fileName}
    match /generated_documents/{userId}/{fileName} {
      // 본인 폴더에만 업로드 가능
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 52428800; // 50MB 제한
      // 본인 문서만 읽기 가능
      allow read: if request.auth != null 
                  && request.auth.uid == userId;
    }
    
    // ============================================
    // 공용 BGM 파일
    // ============================================
    // 경로: bgm/public/{fileName}
    match /bgm/public/{fileName} {
      // 모든 사용자 읽기 가능
      allow read: if true;
      // 로그인한 사용자만 업로드 가능
      allow write: if request.auth != null
                   && request.resource.size < 10485760; // 10MB 제한
    }
    
    // ============================================
    // 개인 BGM 파일
    // ============================================
    // 경로: bgm/{userId}/{fileName}
    match /bgm/{userId}/{fileName} {
      // 로그인한 사용자만 읽기 가능
      allow read: if request.auth != null;
      // 본인 폴더에만 업로드 가능
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 10485760; // 10MB 제한
    }
    
    // ============================================
    // 사용자 아바타 이미지
    // ============================================
    // 경로: avatars/{userId}/{fileName}
    match /avatars/{userId}/{fileName} {
      // 모든 사용자 읽기 가능
      allow read: if true;
      // 본인만 이미지 업로드 가능
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5242880 // 5MB 제한
                   && request.resource.contentType.matches('image/.*');
    }
    
    // ============================================
    // 사업자 인증 이미지 (민감 정보)
    // ============================================
    // 경로: verifications/{userId}/{fileName}
    match /verifications/{userId}/{fileName} {
      // 읽기 불가 (보안)
      allow read: if false;
      // 본인만 업로드 가능
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5242880 // 5MB 제한
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## 3. 적용 방법

### Step 1: Firestore 규칙 적용

1. **Firebase Console 열기**
   - https://console.firebase.google.com/project/ceo-blaind/firestore/rules

2. **기존 규칙 삭제**
   - Rules 탭에서 기존 규칙을 모두 선택 후 삭제

3. **새 규칙 붙여넣기**
   - 위의 [Firestore 보안 규칙](#1-firestore-보안-규칙) 섹션의 전체 규칙을 복사하여 붙여넣기

4. **규칙 발행**
   - 오른쪽 상단의 **"Publish"** 버튼 클릭
   - 확인 대화상자에서 **"Publish"** 클릭

### Step 2: Storage 규칙 적용

1. **Firebase Console 열기**
   - https://console.firebase.google.com/project/ceo-blaind/storage/rules

2. **기존 규칙 삭제**
   - Rules 탭에서 기존 규칙을 모두 선택 후 삭제

3. **새 규칙 붙여넣기**
   - 위의 [Firebase Storage 보안 규칙](#2-firebase-storage-보안-규칙) 섹션의 전체 규칙을 복사하여 붙여넣기

4. **규칙 발행**
   - 오른쪽 상단의 **"Publish"** 버튼 클릭
   - 확인 대화상자에서 **"Publish"** 클릭

### Step 3: 테스트

1. **브라우저 새로고침** (F5)
2. **콘솔 오류 확인** (F12)
3. **기능 테스트**
   - 글 작성 및 이미지 업로드
   - 댓글 작성
   - 투표 생성 및 참여
   - 메시지 전송

---

## 4. 체크리스트

### Firestore 규칙
- [ ] Firebase Console 접속 완료
- [ ] Firestore Database → Rules 탭 이동
- [ ] 기존 규칙 삭제
- [ ] 새 규칙 붙여넣기
- [ ] "Publish" 버튼 클릭
- [ ] 규칙 적용 대기 (1-2분)

### Storage 규칙
- [ ] Firebase Console 접속 완료
- [ ] Storage → Rules 탭 이동
- [ ] 기존 규칙 삭제
- [ ] 새 규칙 붙여넣기
- [ ] "Publish" 버튼 클릭
- [ ] 규칙 적용 대기 (1-2분)

### 테스트
- [ ] 브라우저 새로고침
- [ ] 콘솔 오류 확인
- [ ] 글 목록이 표시되는지 확인
- [ ] 이미지 업로드 테스트
- [ ] 댓글 작성 테스트

---

## 📊 규칙 요약

### Firestore 컬렉션 권한

| 컬렉션 | 읽기 | 쓰기 |
|--------|------|------|
| `users` | 모두 | 본인만 |
| `posts` | 모두 | 로그인 사용자 |
| `posts/{id}/comments` | 모두 | 로그인 사용자 |
| `decision_polls` | 모두 | 로그인 사용자 |
| `messages` | 발신자/수신자만 | 로그인 사용자 |
| `user_checkin` | 모두 | 본인만 |
| `user_games` | 본인만 | 본인만 |
| `generated_documents` | 본인만 | 로그인 사용자 |
| `verifications` | 본인만 | 서버만 |
| `shopItems` | 모두 | 서버만 |
| `purchases` | 본인만 | 로그인 사용자 |

### Storage 경로 권한

| 경로 | 읽기 | 쓰기 | 크기 제한 |
|------|------|------|----------|
| `posts/{userId}/images/` | 모두 | 본인만 | 100MB |
| `posts/{userId}/videos/` | 모두 | 본인만 | 100MB |
| `generated_documents/{userId}/` | 본인만 | 본인만 | 50MB |
| `bgm/public/` | 모두 | 로그인 사용자 | 10MB |
| `bgm/{userId}/` | 로그인 사용자 | 본인만 | 10MB |
| `avatars/{userId}/` | 모두 | 본인만 | 5MB |
| `verifications/{userId}/` | 불가 | 본인만 | 5MB |

---

## 🚨 주의사항

1. **규칙 적용 시간**: 규칙 적용 후 최대 2분까지 소요될 수 있습니다.
2. **문법 확인**: 규칙 붙여넣기 후 Firebase Console에서 문법 오류가 없는지 확인하세요.
3. **테스트**: 규칙 적용 후 반드시 모든 주요 기능을 테스트하세요.
4. **백업**: 기존 규칙을 변경하기 전에 복사해 두는 것을 권장합니다.

---

## 🔗 빠른 링크

- **Firestore Rules:** https://console.firebase.google.com/project/ceo-blaind/firestore/rules
- **Storage Rules:** https://console.firebase.google.com/project/ceo-blaind/storage/rules

---

## ❓ 문제 해결

### 규칙이 적용되지 않으면?

1. 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
2. 로그아웃 후 다시 로그인
3. 규칙 문법 확인 (Firebase Console에서 검증)
4. 잠시 대기 후 다시 시도 (최대 2분)

### 여전히 오류가 발생하면?

1. 콘솔의 정확한 오류 메시지 확인
2. 규칙이 올바르게 저장되었는지 확인
3. 사용자 인증 상태 확인
4. 파일 크기 제한 확인

---

**마지막 업데이트:** 2025-01-24


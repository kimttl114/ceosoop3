# Firestore 보안 규칙 수정 가이드

더미글 생성 시 "Missing or insufficient permissions" 오류가 발생하는 이유와 해결 방법입니다.

## 문제 원인

Firebase Admin SDK는 서버 사이드에서 실행되며, Firestore 보안 규칙을 우회할 수 있어야 합니다.
하지만 현재 Firestore 규칙이 너무 제한적이거나, Admin SDK 권한이 올바르게 설정되지 않았을 수 있습니다.

## 해결 방법

### 1. Firestore 보안 규칙 수정

Firebase Console에서 Firestore 보안 규칙을 다음과 같이 수정하세요:

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. **Firestore Database** 클릭
4. 상단 탭에서 **규칙** 클릭
5. 다음 규칙으로 수정:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // 사용자 컬렉션
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 게시글 컬렉션
    match /posts/{postId} {
      // 읽기: 모두 허용
      allow read: if true;
      
      // 쓰기: 로그인한 사용자 또는 서버(Admin SDK)
      allow create: if request.auth != null || request.auth == null;
      allow update: if request.auth != null && 
                    (request.auth.uid == resource.data.uid || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      allow delete: if request.auth != null && 
                    (request.auth.uid == resource.data.uid || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      
      // 댓글 서브컬렉션
      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null || request.auth == null;
        allow update, delete: if request.auth != null && 
                               (request.auth.uid == resource.data.uid || 
                                get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      }
    }
    
    // 쪽지 컬렉션
    match /messages/{messageId} {
      allow read: if request.auth != null && 
                  (request.auth.uid == resource.data.senderId || 
                   request.auth.uid == resource.data.receiverId);
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.senderId;
    }
    
    // 신고 컬렉션
    match /reports/{reportId} {
      allow read: if request.auth != null && 
                  get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // 공지사항 컬렉션
    match /notices/{noticeId} {
      allow read: if true;
      allow write: if request.auth != null && 
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // 마켓플레이스 컬렉션
    match /marketplace/{itemId} {
      allow read: if true;
      allow create: if request.auth != null || request.auth == null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // 기타 모든 컬렉션: 기본적으로 거부 (보안)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 2. 더 간단한 규칙 (개발/테스트용)

개발 환경에서만 사용할 수 있는 더 간단한 규칙:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // 읽기: 모두 허용
      allow read: if true;
      
      // 쓰기: 로그인한 사용자 또는 서버(request.auth == null)
      allow write: if request.auth != null || request.auth == null;
    }
  }
}
```

⚠️ **주의**: 이 규칙은 보안이 약하므로 개발/테스트 환경에서만 사용하세요!

### 3. 규칙 배포

1. 규칙 수정 후 **게시** 버튼 클릭
2. 배포 완료까지 1-2분 대기

## Firebase Admin SDK 권한 확인

Firebase Admin SDK는 Firestore 규칙을 우회합니다. 하지만 다음을 확인하세요:

1. **서비스 계정 권한**
   - Firebase Console > 프로젝트 설정 > 서비스 계정
   - 서비스 계정에 "Cloud Datastore User" 또는 "Firebase Admin" 역할이 있는지 확인

2. **환경 변수 확인**
   - `FIREBASE_CLIENT_EMAIL`: 올바른 서비스 계정 이메일
   - `FIREBASE_PRIVATE_KEY`: 올바른 비공개 키

## 인덱스 생성

콘솔에 "The query requires an index" 오류가 표시되면:

1. 오류 메시지의 링크 클릭
2. Firebase Console의 인덱스 생성 페이지로 이동
3. 자동으로 인덱스 생성
4. 인덱스 구축 완료까지 대기 (몇 분 소요)

또는 수동으로:

1. Firebase Console > Firestore Database > 색인
2. **복합 색인 추가** 클릭
3. 다음 설정:
   - 컬렉션: `posts`
   - 필드:
     - `category` (오름차순)
     - `timestamp` (내림차순)
4. **색인 만들기** 클릭

## 테스트

1. Firestore 규칙 수정 및 배포
2. 로컬 서버 재시작
3. http://localhost:3002/admin 접속
4. 더미글 생성 시도

## 문제 해결

### "Missing or insufficient permissions" 계속 발생
1. Firebase Console에서 규칙이 올바르게 배포되었는지 확인
2. 브라우저 캐시 삭제 후 재시도
3. 서버 재시작

### "The query requires an index" 계속 발생
1. 인덱스가 구축 중인지 확인 (Firebase Console > Firestore > 색인)
2. 인덱스 구축 완료까지 대기 (상태: "사용 설정됨")

### Firebase Admin SDK 초기화 실패
1. 환경 변수 확인
2. 터미널에서 디버깅 로그 확인
3. `FIREBASE_ADMIN_SETUP.md` 가이드 참조


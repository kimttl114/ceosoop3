# Firebase Rules 완벽 가이드 (Firestore + Storage)

## 📋 **목차**

1. [Firestore Rules (데이터베이스)](#firestore-rules)
2. [Storage Rules (파일 저장소)](#storage-rules)
3. [통합 적용 방법](#통합-적용-방법)
4. [테스트 방법](#테스트-방법)
5. [문제 해결](#문제-해결)

---

## 🔥 **Firestore Rules (데이터베이스)**

### **파일: `firestore.rules`**

### **주요 기능**

#### **1. 헬퍼 함수**
```javascript
isAuthenticated()     // 로그인 확인
isOwner(userId)       // 본인 확인
isAdmin()             // 관리자 확인
isAuthorOrAdmin()     // 작성자 또는 관리자
isAdminSDK()          // 서버 사이드 접근
```

#### **2. 컬렉션별 권한**

| 컬렉션 | 읽기 | 쓰기 | 비고 |
|--------|------|------|------|
| **users** | 모두 | 본인 | 사용자 정보 |
| **posts** | 모두 | 인증된 사용자 | 스트레스 해소 포함 |
| **comments** | 모두 | 인증된 사용자 | 루트 + 서브컬렉션 |
| **balance_votes** | 모두 | 인증된 사용자 | 밸런스 게임 투표 |
| **balance_comments** | 모두 | 인증된 사용자 | 밸런스 게임 댓글 |
| **decision_polls** | 모두 | 인증된 사용자 | 투표 시스템 |
| **messages** | 본인 | 본인 | 1:1 메시지 |
| **user_checkin** | 모두 | 본인 | 출석 체크 |
| **user_games** | 본인 | 본인 | 게임 데이터 |
| **rankings** | 모두 | 서버만 | 랭킹 시스템 |
| **reports** | 관리자 | 인증된 사용자 | 신고 시스템 |
| **generated_documents** | 인증된 사용자 | 인증된 사용자 | AI 생성 문서 |
| **verifications** | 본인 | 서버만 | 사업자 인증 |
| **shopItems** | 모두 | 서버만 | 상점 아이템 |
| **purchases** | 인증된 사용자 | 인증된 사용자 | 구매 내역 |
| **notices** | 모두 | 관리자 | 공지사항 |
| **marketplace** | 모두 | 인증된 사용자 | 중고장터 |

#### **3. 특별 규칙**

**스트레스 해소 포스팅:**
```javascript
match /posts/{postId} {
  // ✅ 단순화된 생성 규칙
  allow create: if isAuthenticated() || isAdminSDK();
  
  // ✅ 본인만 수정/삭제
  allow update, delete: if isAuthenticated() && 
                           (resource.data.userId == request.auth.uid || isAdmin());
}
```

**밸런스 게임:**
```javascript
match /balance_votes/{voteId} {
  allow read: if true;
  allow create, update, delete: if isAuthenticated() || isAdminSDK();
}
```

---

## 📦 **Storage Rules (파일 저장소)**

### **파일: `storage.rules`**

### **주요 기능**

#### **1. 헬퍼 함수**
```javascript
isAuthenticated()     // 로그인 확인
isOwner(userId)       // 본인 확인
isImageFile()         // 이미지 파일 확인
isVideoFile()         // 비디오 파일 확인
isAudioFile()         // 오디오 파일 확인
isAdminSDK()          // 서버 사이드 접근
```

#### **2. 저장소별 권한**

| 경로 | 읽기 | 쓰기 | 파일 타입 | 크기 제한 |
|------|------|------|-----------|-----------|
| **posts/{userId}/images/** | 모두 | 본인 | 이미지 | 100MB |
| **posts/{userId}/videos/** | 모두 | 본인 | 비디오 | 100MB |
| **generated_documents/{userId}/** | 본인 | 본인 | 모든 타입 | 50MB |
| **bgm/public/** | 모두 | 인증된 사용자 | 오디오 | 10MB |
| **bgm/{userId}/** | 인증된 사용자 | 본인 | 오디오 | 10MB |
| **avatars/{userId}/** | 모두 | 본인 | 이미지 | 5MB |
| **verifications/{userId}/** | 본인 | 본인 | 이미지 | 5MB |
| **marketplace/{userId}/** | 모두 | 본인 | 이미지 | 10MB |
| **notices/{noticeId}/** | 모두 | 서버만 | 모든 타입 | - |

#### **3. 특별 규칙**

**게시글 이미지:**
```javascript
match /posts/{userId}/images/{fileName} {
  allow write: if (isOwner(userId) && 
                   isImageFile() &&
                   request.resource.size < 104857600)  // 100MB
                   || isAdminSDK();
  allow read: if true;
}
```

**사업자 인증 (민감 정보):**
```javascript
match /verifications/{userId}/{fileName} {
  // ✅ 본인만 읽기 가능 (보안 강화)
  allow read: if isOwner(userId) || isAdminSDK();
  
  // ✅ 본인만 업로드, 이미지만, 5MB 제한
  allow write: if (isOwner(userId) && 
                   isImageFile() &&
                   request.resource.size < 5242880)
                   || isAdminSDK();
}
```

---

## 🚀 **통합 적용 방법**

### **Step 1: Firestore Rules 적용**

```
1. Firebase Console 접속
   https://console.firebase.google.com/

2. 프로젝트 선택

3. Firestore Database 클릭

4. 규칙 (Rules) 탭 클릭

5. firestore.rules 파일 내용 전체 복사

6. Firebase Console에 붙여넣기

7. "게시" (Publish) 버튼 클릭

8. 확인
```

### **Step 2: Storage Rules 적용**

```
1. Firebase Console (같은 프로젝트)

2. Storage 클릭

3. Rules 탭 클릭

4. storage.rules 파일 내용 전체 복사

5. Firebase Console에 붙여넣기

6. "게시" (Publish) 버튼 클릭

7. 확인
```

### **Step 3: 브라우저 캐시 클리어**

```
1. Ctrl + Shift + Delete

2. "캐시된 이미지 및 파일" 체크

3. "데이터 지우기" 클릭

4. 브라우저 새로고침 (F5)
```

---

## 🧪 **테스트 방법**

### **1. Firestore Rules 테스트**

#### **스트레스 해소 포스팅:**
```
1. /games/stress 접속
2. 로그인 확인
3. 하소연 작성 (10자 이상)
4. "날려버리기!" 클릭
5. 콘솔 확인:
   ✅ [스트레스 해소] 포스팅 성공!
6. 대나무숲에서 글 확인
```

#### **밸런스 게임:**
```
1. /games/balance 접속
2. 투표 선택
3. 결과 확인
4. 댓글 작성
5. 댓글 표시 확인
```

#### **중고장터:**
```
1. /marketplace 접속
2. 상품 등록
3. 본인 상품만 수정 가능한지 확인
4. 다른 사용자 상품 수정 불가 확인
```

### **2. Storage Rules 테스트**

#### **아바타 업로드:**
```javascript
// 테스트 코드
const storageRef = ref(storage, `avatars/${user.uid}/profile.jpg`);
await uploadBytes(storageRef, imageFile);

✅ 성공: 본인 폴더, 이미지 파일, 5MB 이하
❌ 실패: 다른 사용자 폴더 / 비이미지 파일 / 5MB 초과
```

#### **게시글 이미지:**
```javascript
const storageRef = ref(storage, `posts/${user.uid}/images/post1.png`);
await uploadBytes(storageRef, imageFile);

✅ 성공: 본인 폴더, 이미지 파일, 100MB 이하
❌ 실패: 다른 사용자 폴더 / 비이미지 파일 / 100MB 초과
```

#### **사업자 인증:**
```javascript
const storageRef = ref(storage, `verifications/${user.uid}/license.jpg`);
await uploadBytes(storageRef, imageFile);

✅ 업로드 성공: 본인만
✅ 읽기 성공: 본인만 (다른 사용자는 불가)
```

### **3. Firebase Console에서 직접 테스트**

#### **Firestore Rules 플레이그라운드:**
```
Firestore Database → 규칙 → 규칙 플레이그라운드

테스트 1: 스트레스 해소 포스팅
- 위치: /posts/testDoc123
- 작업: create
- 인증: Authenticated (UID: your-user-id)
- 데이터:
  {
    "category": "대나무숲",
    "title": "[스트레스 해소] 테스트",
    "content": "테스트 내용",
    "userId": "your-user-id",
    "createdAt": {"_seconds": 1234567890}
  }
- 실행 → ✅ "허용됨" 확인

테스트 2: 다른 사용자 글 수정
- 위치: /posts/existingPost
- 작업: update
- 인증: Authenticated (UID: your-user-id)
- 기존 데이터 userId: other-user-id
- 실행 → ❌ "거부됨" 확인 (정상!)
```

#### **Storage Rules 시뮬레이터:**
```
Storage → Rules → 시뮬레이터

테스트 1: 아바타 업로드
- 파일: avatars/your-user-id/profile.jpg
- 작업: write
- 인증: Authenticated (UID: your-user-id)
- 실행 → ✅ "허용됨" 확인

테스트 2: 다른 사용자 폴더 접근
- 파일: avatars/other-user-id/profile.jpg
- 작업: write
- 인증: Authenticated (UID: your-user-id)
- 실행 → ❌ "거부됨" 확인 (정상!)
```

---

## 🐛 **문제 해결**

### **문제 1: "Missing or insufficient permissions"**

#### **Firestore:**
```
원인: Rules가 업데이트되지 않음
해결:
1. Firebase Console에서 규칙 확인
2. firestore.rules 내용 다시 복사
3. 붙여넣기 후 "게시"
4. 브라우저 캐시 클리어
5. 재시도
```

#### **Storage:**
```
원인: 파일 타입 또는 크기 제한 초과
해결:
1. 파일 타입 확인 (이미지/비디오/오디오)
2. 파일 크기 확인
3. 경로 확인 (userId 일치)
4. 재시도
```

### **문제 2: "Unauthenticated"**

```
원인: 로그인되지 않음
해결:
1. 로그아웃
2. 캐시 클리어
3. 재로그인
4. 재시도
```

### **문제 3: 규칙이 적용되지 않음**

```
원인: 캐시 문제
해결:
1. Ctrl + Shift + Delete
2. "전체 기간" 선택
3. 모든 항목 체크
4. "데이터 지우기"
5. 브라우저 재시작
6. 재시도
```

### **문제 4: Admin SDK 오류**

```
원인: 서버 사이드 환경변수 미설정
해결:
1. .env.local 확인:
   FIREBASE_PROJECT_ID=...
   FIREBASE_CLIENT_EMAIL=...
   FIREBASE_PRIVATE_KEY=...
2. Vercel 환경변수 확인
3. 서버 재시작
```

---

## 📊 **규칙 비교표**

### **Firestore vs Storage**

| 항목 | Firestore | Storage |
|------|-----------|---------|
| 데이터 타입 | JSON 문서 | 파일 (이미지, 비디오 등) |
| 크기 제한 | 1MB/문서 | 5TB/파일 (실제는 규칙으로 제한) |
| 권한 단위 | 컬렉션/문서 | 경로/파일 |
| 실시간 | ✅ 지원 | ❌ 미지원 |
| 쿼리 | ✅ 강력 | ❌ 단순 |
| 보안 규칙 | 매우 세밀 | 경로 기반 |

---

## 🎯 **보안 체크리스트**

### **Firestore:**
- [ ] 모든 읽기 권한에 `if true` 또는 조건 확인
- [ ] 쓰기 권한에 `isAuthenticated()` 확인
- [ ] userId 필드 검증
- [ ] Admin SDK 접근 `isAdminSDK()` 분리
- [ ] 민감 정보는 본인만 읽기

### **Storage:**
- [ ] 파일 타입 검증 (`isImageFile()` 등)
- [ ] 파일 크기 제한
- [ ] 본인 폴더만 쓰기 가능
- [ ] 민감 파일은 본인만 읽기
- [ ] Admin SDK 접근 분리

---

## 🔒 **보안 강화 팁**

### **1. Rate Limiting (속도 제한)**

추후 Cloud Functions로 구현:
```javascript
// 예: 1분에 10개 포스팅 제한
// 1시간에 100개 파일 업로드 제한
```

### **2. 콘텐츠 필터링**

추후 확장:
```javascript
// 욕설 필터
// 스팸 감지
// 악의적 파일 차단
```

### **3. 로깅 & 모니터링**

```
Firebase Console → Firestore/Storage → 사용량
→ 비정상적인 활동 모니터링
```

---

## 📝 **파일 목록**

```
프로젝트 루트/
├── firestore.rules              ← Firestore Rules (복사해서 Firebase Console에 붙여넣기)
├── storage.rules                ← Storage Rules (복사해서 Firebase Console에 붙여넣기)
└── COMPLETE_FIREBASE_RULES_GUIDE.md  ← 이 문서
```

---

## ✅ **최종 체크리스트**

### **적용 전:**
- [ ] firestore.rules 파일 확인
- [ ] storage.rules 파일 확인
- [ ] 기존 규칙 백업

### **적용:**
- [ ] Firestore Rules 붙여넣기
- [ ] Firestore "게시" 클릭
- [ ] Storage Rules 붙여넣기
- [ ] Storage "게시" 클릭

### **적용 후:**
- [ ] 브라우저 캐시 클리어
- [ ] 스트레스 해소 테스트
- [ ] 밸런스 게임 테스트
- [ ] 파일 업로드 테스트
- [ ] 권한 오류 없는지 확인

---

## 🎉 **완료!**

두 규칙이 모두 적용되면:

```
✅ 스트레스 해소 포스팅 작동!
✅ 밸런스 게임 투표/댓글 작동!
✅ 파일 업로드 작동!
✅ 권한 제어 완벽!
✅ 보안 강화 완료!
```

---

## 📞 **추가 지원**

문제가 계속되면:

1. **콘솔 로그 전체 복사**
2. **Firebase Console 규칙 스크린샷**
3. **에러 메시지 전체 복사**

이 정보를 제공하시면 더 정확한 해결책을 드릴 수 있습니다!

---

**지금 바로 두 규칙을 Firebase Console에 적용하세요!** 🚀


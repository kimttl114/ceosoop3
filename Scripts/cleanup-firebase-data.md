# Firebase 데이터 정리 가이드

## ⚠️ 주의사항
이 작업은 **되돌릴 수 없습니다**. 프로덕션 환경에서는 반드시 백업을 먼저 진행하세요.

---

## 🎯 정리 대상

### 1. **users 컬렉션**
제거할 필드:
- `points` - 포인트
- `badges` - 뱃지 배열

### 2. **user_checkin 컬렉션**
전체 컬렉션 삭제:
- `consecutiveDays` - 연속 출석일
- `totalPoints` - 총 포인트
- `checkInHistory` - 출석 기록
- `lastCheckInDate` - 마지막 출석일
- `lastRouletteDate` - 룰렛 날짜
- `lastLotteryDate` - 복권 날짜

### 3. **user_games 컬렉션** (선택사항)
게임 점수는 유지, 포인트 관련 필드만 제거

---

## 📝 정리 방법

### 옵션 1: Firebase Console에서 수동 삭제 (추천)

#### Step 1: Firestore 콘솔 접속
1. https://console.firebase.google.com/
2. 프로젝트 선택
3. 좌측 메뉴 > Build > Firestore Database

#### Step 2: users 컬렉션 정리
1. `users` 컬렉션 선택
2. 각 문서 클릭
3. 필드 찾기:
   - `points` 필드 - 삭제 버튼 클릭
   - `badges` 필드 - 삭제 버튼 클릭
4. 모든 사용자 문서에 대해 반복

#### Step 3: user_checkin 컬렉션 삭제
1. `user_checkin` 컬렉션 선택
2. 상단 메뉴에서 "Delete collection" 클릭
3. 컬렉션 이름 입력 후 확인

---

### 옵션 2: Firebase CLI로 일괄 삭제

#### 필요 조건
```bash
npm install -g firebase-tools
firebase login
```

#### 스크립트 작성
`scripts/cleanup-firestore.js` 파일 생성:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function cleanupUsers() {
  console.log('Cleaning up users collection...');
  
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  const batch = db.batch();
  let count = 0;
  
  snapshot.forEach((doc) => {
    batch.update(doc.ref, {
      points: admin.firestore.FieldValue.delete(),
      badges: admin.firestore.FieldValue.delete()
    });
    count++;
  });
  
  await batch.commit();
  console.log(`✅ ${count} user documents updated`);
}

async function deleteCheckInCollection() {
  console.log('Deleting user_checkin collection...');
  
  const collectionRef = db.collection('user_checkin');
  const batchSize = 500;
  
  const query = collectionRef.limit(batchSize);
  
  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  console.log(`Deleted ${batchSize} documents`);
  
  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

async function main() {
  try {
    await cleanupUsers();
    await deleteCheckInCollection();
    console.log('🎉 Cleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
```

#### 실행
```bash
node scripts/cleanup-firestore.js
```

---

### 옵션 3: Cloud Functions로 정리 (프로덕션 환경)

```javascript
// functions/src/cleanup.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const cleanupUserData = functions.https.onCall(async (data, context) => {
  // 관리자 권한 확인
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const db = admin.firestore();
  
  // users 필드 제거
  const usersSnapshot = await db.collection('users').get();
  const usersBatch = db.batch();
  
  usersSnapshot.forEach((doc) => {
    usersBatch.update(doc.ref, {
      points: admin.firestore.FieldValue.delete(),
      badges: admin.firestore.FieldValue.delete()
    });
  });
  
  await usersBatch.commit();
  
  return { success: true, message: 'Cleanup completed' };
});
```

---

## ✅ 정리 후 확인사항

### 1. Firestore Rules 업데이트
`firestore.rules` 파일에서 `points`, `badges` 관련 규칙 제거:

```javascript
// 제거할 부분
match /users/{userId} {
  allow update: if request.auth.uid == userId && 
                 !request.resource.data.diff(resource.data).affectedKeys()
                   .hasAny(['points', 'badges']); // 이 부분 제거
}
```

### 2. 앱 테스트
- 로그인
- 프로필 확인
- 게임 플레이 (에러 없이 작동하는지 확인)

### 3. 콘솔에서 확인
```bash
# 브라우저 콘솔에서 확인
console.log('포인트 에러 없는지 확인');
```

---

## 🔄 롤백 (복원)

만약 문제가 생기면:

### 백업이 있는 경우
1. Firebase Console > Firestore > Import/Export
2. 백업 파일 임포트

### 백업이 없는 경우
- 데이터 복구 불가능
- 사용자에게 새로 가입 요청

---

## 📊 예상 소요 시간

| 사용자 수 | 예상 시간 |
|----------|----------|
| 100명    | 1분      |
| 1,000명  | 5분      |
| 10,000명 | 30분     |

---

## 🚀 완료 후

모든 포인트/레벨/뱃지 시스템이 제거되고, 깔끔한 커뮤니티 플랫폼이 됩니다!

---

**준비되셨나요?** 위 방법 중 하나를 선택해서 진행하세요! 🎉


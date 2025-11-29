# 🚨 BGM 믹싱 문제 즉시 해결 가이드

## 📊 확인된 문제

서버 콘솔 로그:
```
[BGM 믹싱] ⚠️  BGM 없이 음성만 반환합니다.
[API] BGM 믹싱 완료:
  finalBuffer 길이: 41472 bytes
  BGM 믹싱 여부: 아니오
```

**의미**: BGM 믹싱 과정에서 에러가 발생했지만, 그 전 단계 로그가 보이지 않습니다.

---

## 🔍 즉시 확인할 사항

### 1. 서버 콘솔을 위로 스크롤

**터미널/콘솔을 위로 스크롤하여 다음 로그를 찾으세요:**

#### A. API 요청 수신 로그
```
[API] 받은 요청 데이터:
  bgmUrl: https://...
```

#### B. BGM 믹싱 시작 로그
```
[BGM 믹싱] 시작: BGM URL=...
[BGM 믹싱] 1단계: ...
```

#### C. 에러 발생 로그
```
[BGM 믹싱] ❌ 전체 실패:
[BGM 믹싱] 에러 메시지: ...
```

---

## 🔧 예상 문제 및 해결

### 문제 1: Firebase Storage 접근 권한 (HTTP 403)

**가능성: ⭐⭐⭐ (가장 높음)**

**증상:**
```
[BGM 믹싱] 2단계: BGM 다운로드 중...
[BGM 믹싱] ❌ BGM 다운로드 실패: HTTP 403
```

**해결 방법:**

1. **Firebase Console 접속**
   - https://console.firebase.google.com/project/ceo-blaind/storage/rules

2. **Storage Rules 확인 및 수정:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 공용 BGM 폴더 - 모든 사용자 읽기 가능
    match /bgm/public/{allPaths=**} {
      allow read: if true;  // 공개 읽기
      allow write: if request.auth != null;
    }
    
    // 개인 BGM 폴더 - 본인만 읽기/쓰기
    match /bgm/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. **Rules 저장 후 테스트**

---

### 문제 2: BGM URL이 서버에 도달하지 않음

**가능성: ⭐⭐**

**증상:**
```
[API] 받은 요청 데이터:
  bgmUrl: (없음)
```

**해결 방법:**
- 브라우저 콘솔에서 API 요청 데이터 확인
- BGM URL이 올바르게 전달되는지 확인

---

### 문제 3: FFmpeg 실행 실패

**가능성: ⭐**

**증상:**
```
[BGM 믹싱] ❌ FFmpeg 에러 발생
```

**해결 방법:**
- FFmpeg 경로 확인
- 필터 구문 확인 (이미 단순화됨)

---

## 📝 즉시 할 일

1. **서버 콘솔을 위로 스크롤**하여 전체 로그 확인
2. **에러 메시지 찾기** (`[BGM 믹싱] ❌` 또는 `에러`)
3. **에러 내용을 복사**하여 공유
4. **Firebase Storage Rules 확인**

---

## 🔍 로그 찾기 팁

서버 콘솔에서 검색 (Ctrl+F 또는 Cmd+F):
- `[BGM 믹싱]` - 모든 BGM 관련 로그
- `에러` - 모든 에러 로그
- `HTTP 403` 또는 `HTTP 404` - HTTP 에러

---

**서버 콘솔을 스크롤하여 `[BGM 믹싱]` 관련 전체 로그와 에러 메시지를 찾아주세요!**

특히 다음을 찾아주세요:
1. `[API] 받은 요청 데이터:` 로그
2. `[BGM 믹싱] 시작:` 로그 (있다면)
3. `[BGM 믹싱] ❌` 에러 로그


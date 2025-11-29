# ✅ BGM 믹싱 진단 체크리스트

## 📊 현재 상태 확인

브라우저 콘솔에서 확인된 내용:
- ✅ `bgmValue`: 올바르게 설정됨
- ✅ `selectedBgm`: JSON 객체에 올바른 URL 포함
- ✅ `bgmUrl`: Firebase Storage URL 올바름
- ✅ API 요청 데이터: `bgmUrl`이 포함되어 전달됨

**결론**: 프론트엔드에서 BGM URL은 올바르게 전달되고 있습니다!

---

## 🔍 다음 확인 사항

### 서버 콘솔 로그 확인 ⭐⭐⭐ (가장 중요!)

**개발 서버 터미널에서 다음을 확인하세요:**

#### 1. API 요청 수신 확인

```
[API] 받은 요청 데이터:
  keyword: 브레이크타임
  mood: 정중하게
  bgmUrl: https://firebasestorage.googleapis.com/...
  bgmUrl 타입: string
  bgmUrl 길이: 250
```

**확인 사항:**
- ✅ `bgmUrl`이 서버에 도달했는지
- ✅ `bgmUrl` 타입이 `string`인지
- ✅ `bgmUrl` 길이가 0이 아닌지

#### 2. BGM 믹싱 시작 확인

```
[API] BGM 믹싱 시작 전:
  voiceBuffer 길이: 45678 bytes
  bgmUrl: https://...

[BGM 믹싱] 시작: BGM URL=https://...
```

**확인 사항:**
- ✅ `[BGM 믹싱]` 로그가 나타나는지
- ✅ BGM URL이 올바른지

#### 3. BGM 다운로드 확인

```
[BGM 믹싱] 2단계: BGM 다운로드 중...
[BGM 믹싱] ✅ BGM 다운로드 완료: 123456 bytes
```

**또는 에러 발생 시:**

```
[BGM 믹싱] ❌ BGM 다운로드 실패: HTTP 403
[BGM 믹싱] 응답 내용: Access denied...
```

**확인 사항:**
- ✅ BGM 다운로드가 성공하는지
- ❌ 에러 발생 시 HTTP 상태 코드

#### 4. FFmpeg 실행 확인

```
[BGM 믹싱] 4단계: 오디오 믹싱 시작...
[BGM 믹싱] FFmpeg 실행 시작
[BGM 믹싱] 진행률: 50%
[BGM 믹싱] ✅ FFmpeg 처리 완료
```

**또는 에러 발생 시:**

```
[BGM 믹싱] ❌ FFmpeg 에러 발생
[BGM 믹싱] 에러 메시지: ...
```

**확인 사항:**
- ✅ FFmpeg가 실행되는지
- ❌ FFmpeg 에러가 발생하는지

#### 5. 최종 결과 확인

```
[API] BGM 믹싱 완료:
  finalBuffer 길이: 567890 bytes
  BGM 믹싱 여부: 예
```

**확인 사항:**
- ✅ `finalBuffer 길이`가 `voiceBuffer 길이`보다 큰지
- ✅ "BGM 믹싱 여부: 예"인지

---

## 🔍 예상 문제 시나리오

### 시나리오 1: BGM 다운로드 실패 (HTTP 403/404)

**서버 콘솔:**
```
[BGM 믹싱] ❌ BGM 다운로드 실패: HTTP 403
```

**원인:**
- Firebase Storage 접근 권한 문제

**해결:**
1. Firebase Console → Storage → Rules 확인
2. BGM 폴더 공개 읽기 권한 확인

**Firebase Storage Rules 예시:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 공용 BGM - 모든 사용자 읽기 가능
    match /bgm/public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 개인 BGM - 본인만 읽기 가능
    match /bgm/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

### 시나리오 2: FFmpeg 실행 실패

**서버 콘솔:**
```
[BGM 믹싱] ❌ FFmpeg 에러 발생
[BGM 믹싱] 에러 메시지: Invalid argument
```

**원인:**
- FFmpeg 필터 구문 오류
- 오디오 형식 호환성 문제

**해결:**
- 필터 단순화 (이미 적용됨)
- 오디오 형식 변환 추가

---

### 시나리오 3: BGM 믹싱이 조용히 실패

**서버 콘솔:**
```
[BGM 믹싱] ⚠️  BGM 없이 음성만 반환합니다.
```

**원인:**
- 에러 발생 시 catch 블록에서 음성만 반환
- 사용자에게 알림이 없음

**확인:**
- 위에 에러 로그가 있는지 확인
- 에러 원인 파악

---

## 📝 즉시 확인할 사항

1. **서버 콘솔 로그 확인** ⭐⭐⭐
   - 개발 서버 터미널 열기
   - "AI로 방송 만들기" 버튼 클릭
   - `[API]`, `[BGM 믹싱]` 로그 확인

2. **로그 내용을 복사하여 공유**
   - 문제 파악 후 정확한 해결책 제시

---

**가장 중요한 것**: 서버 콘솔의 `[BGM 믹싱]` 로그를 확인하세요!

로그 내용을 알려주시면 정확한 원인을 파악하고 해결하겠습니다.


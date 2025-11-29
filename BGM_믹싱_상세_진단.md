# 🔍 BGM 믹싱 상세 진단

## 📊 현재 상황

- ✅ 페이지 로드: 정상
- ✅ 대본 생성: 성공
- ✅ 음성 생성: 성공 (오디오 플레이어 표시됨)
- ✅ BGM 선택: 완료 (`[내 BGM] cute-happy-kids-354678.mp3`)
- ❌ BGM 믹싱: **작동하지 않음**

---

## 🔍 문제 분석 체크리스트

### 1단계: BGM URL 전달 확인

**프론트엔드 (`SmartAudioGenerator.tsx`):**
```typescript
const selectedBgm = bgmOptions.find((b) => b.value === bgmValue)
const bgmUrl = selectedBgm?.url && selectedBgm.url.trim() !== '' ? selectedBgm.url : undefined
```

**확인 사항:**
- [ ] `selectedBgm`이 올바르게 찾아지는가?
- [ ] `selectedBgm.url`이 유효한 URL인가?
- [ ] API로 올바르게 전달되는가?

### 2단계: 서버 측 BGM 처리 확인

**서버 (`app/api/generate-audio/route.ts`):**
```typescript
const finalBuffer = await mixVoiceWithBgm(voiceBuffer, bgmUrl)
```

**확인 사항:**
- [ ] `bgmUrl`이 서버에 도달하는가?
- [ ] `mixVoiceWithBgm` 함수가 호출되는가?
- [ ] 로그에서 `[BGM 믹싱]` 메시지가 보이는가?

### 3단계: BGM 다운로드 확인

**확인 사항:**
- [ ] BGM 파일 다운로드 성공하는가?
- [ ] HTTP 상태 코드는 무엇인가?
- [ ] Firebase Storage 접근 권한 문제가 없는가?

### 4단계: FFmpeg 실행 확인

**확인 사항:**
- [ ] FFmpeg 경로가 올바른가?
- [ ] FFmpeg 필터가 올바르게 구성되는가?
- [ ] FFmpeg 실행 중 에러가 발생하는가?

---

## 🐛 가능한 원인들

### 원인 1: BGM URL이 전달되지 않음 ⚠️

**증상:**
- 서버 로그에 `[BGM 믹싱]` 메시지가 없음
- 또는 "BGM URL이 없어 음성만 반환합니다" 메시지

**원인:**
- 프론트엔드에서 `bgmUrl`이 `undefined`로 전달됨
- 또는 빈 문자열로 전달됨

**확인 방법:**
```javascript
// 프론트엔드 콘솔에서
console.log('BGM URL:', bgmUrl)
```

### 원인 2: BGM 다운로드 실패 ⚠️⚠️

**증상:**
- 서버 로그에 "BGM 다운로드 실패" 메시지
- HTTP 403, 404, 또는 CORS 에러

**원인:**
- Firebase Storage 접근 권한 문제
- CORS 설정 문제
- BGM URL이 만료됨

**확인 방법:**
- 서버 콘솔에서 `[BGM 믹싱] 2단계` 로그 확인

### 원인 3: FFmpeg 실행 실패 ⚠️⚠️⚠️

**증상:**
- 서버 로그에 "FFmpeg 에러" 메시지
- 또는 FFmpeg 타임아웃

**원인:**
- FFmpeg 경로 문제
- 필터 구문 오류
- 오디오 형식 호환성 문제

**확인 방법:**
- 서버 콘솔에서 `[BGM 믹싱] ❌ FFmpeg 에러` 확인

### 원인 4: 에러 발생 시 음성만 반환 ⚠️

**증상:**
- BGM 믹싱 실패 후 음성만 반환됨
- 서버 로그에 "BGM 없이 음성만 반환합니다" 메시지

**원인:**
- `mixVoiceWithBgm` 함수에서 에러 발생
- catch 블록에서 `voiceBuffer` 반환

**확인 방법:**
- 서버 콘솔에서 전체 에러 스택 확인

---

## 🛠️ 진단 방법

### 방법 1: 서버 콘솔 로그 확인 ⭐

**개발 서버 터미널에서 다음 로그 확인:**

```
[BGM 믹싱] 시작: BGM URL=...
[BGM 믹싱] 1단계: 음성 파일 저장 중...
[BGM 믹싱] 2단계: BGM 다운로드 중...
[BGM 믹싱] ✅ BGM 다운로드 완료: ...
[BGM 믹싱] 3단계: 음성 길이 확인 중...
[BGM 믹싱] 4단계: 오디오 믹싱 시작...
[BGM 믹싱] ✅ FFmpeg 처리 완료
[BGM 믹싱] ✅ 믹싱 완료: ...
```

**로그가 보이지 않으면:**
- BGM URL이 전달되지 않은 것
- `mixVoiceWithBgm` 함수가 호출되지 않은 것

### 방법 2: 브라우저 네트워크 탭 확인

**Network 탭에서:**
1. `/api/generate-audio` 요청 확인
2. Request Payload 확인:
   ```json
   {
     "keyword": "...",
     "mood": "...",
     "bgmUrl": "https://..." // 이게 있는지 확인!
   }
   ```
3. Response 확인:
   - 에러 메시지가 있는지 확인

### 방법 3: 서버 로그에서 에러 확인

**에러 발생 시 다음 메시지가 표시됨:**
```
[BGM 믹싱] ❌ BGM 다운로드 실패: HTTP 403
[BGM 믹싱] ❌ FFmpeg 에러: ...
[BGM 믹싱] ❌ 전체 실패: ...
[BGM 믹싱] ⚠️  BGM 없이 음성만 반환합니다.
```

---

## 🔧 해결 방법

### 해결책 1: BGM URL 검증 강화

**문제:** BGM URL이 전달되지 않음

**해결:**
1. 프론트엔드에서 BGM URL 확인
2. API 요청 전 로그 출력
3. 서버에서 BGM URL 수신 확인

### 해결책 2: Firebase Storage 접근 권한 확인

**문제:** BGM 다운로드 실패 (HTTP 403)

**해결:**
1. Firebase Storage 규칙 확인
2. BGM 파일이 공개 읽기 가능한지 확인
3. 인증 토큰이 필요한지 확인

### 해결책 3: FFmpeg 문제 해결

**문제:** FFmpeg 실행 실패

**해결:**
1. FFmpeg 경로 확인
2. 필터 구문 단순화
3. 오디오 형식 변환 추가

---

## 📝 다음 단계

1. **서버 콘솔 로그 확인** - 가장 중요!
2. **브라우저 네트워크 탭 확인**
3. **로그 내용 기반으로 해결책 적용**

---

**가장 먼저 할 것**: 개발 서버 콘솔에서 `[BGM 믹싱]` 로그를 확인하세요!


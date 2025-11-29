# 🔍 BGM 믹싱 실시간 진단 가이드

## 📊 디버깅 로그 추가 완료

프론트엔드와 백엔드에 상세한 디버깅 로그를 추가했습니다.

---

## 🧪 테스트 방법

### 1단계: 개발 서버 재시작

```bash
npm run dev
```

### 2단계: 브라우저 콘솔 확인

1. 브라우저 개발자 도구 → Console 탭 열기
2. "AI로 방송 만들기" 버튼 클릭
3. 다음 로그 확인:

```
[BGM 디버깅] bgmValue: private_cute-happy-kids-354678.mp3
[BGM 디버깅] selectedBgm: {label: "[내 BGM] cute-happy-kids-354678.mp3", value: "...", url: "https://..."}
[BGM 디버깅] bgmUrl: https://firebasestorage.googleapis.com/...
[BGM 디버깅] API 요청 데이터: {keyword: "...", mood: "...", bgmUrl: "https://..."}
```

**확인 사항:**
- ✅ `bgmUrl`이 `undefined`가 아닌지 확인
- ✅ `bgmUrl`이 유효한 URL인지 확인
- ✅ API 요청 데이터에 `bgmUrl`이 포함되는지 확인

### 3단계: 서버 콘솔 확인

개발 서버 터미널에서 다음 로그 확인:

```
[API] 받은 요청 데이터:
  keyword: ...
  mood: ...
  bgmUrl: https://... (또는 (없음))
  bgmUrl 타입: string (또는 undefined)
  bgmUrl 길이: 150 (또는 0)

[OpenAI] 대본 생성 성공: "..."
[API] BGM 믹싱 시작 전:
  voiceBuffer 길이: 45678 bytes
  bgmUrl: https://...

[BGM 믹싱] 시작: BGM URL=https://...
[BGM 믹싱] 1단계: 음성 파일 저장 중...
[BGM 믹싱] ✅ 음성 파일 저장 완료: 45678 bytes
[BGM 믹싱] 2단계: BGM 다운로드 중...
...
```

**확인 사항:**
- ✅ `bgmUrl`이 서버에 도달하는지 확인
- ✅ `[BGM 믹싱]` 로그가 나타나는지 확인
- ✅ 어느 단계에서 실패하는지 확인

---

## 🔍 문제 진단 시나리오

### 시나리오 1: 프론트엔드에서 bgmUrl이 undefined

**브라우저 콘솔:**
```
[BGM 디버깅] bgmUrl: undefined
```

**원인:**
- `selectedBgm`이 찾아지지 않음
- `selectedBgm.url`이 빈 문자열

**해결:**
- `bgmOptions` 배열 확인
- BGM 파일 URL이 올바르게 설정되었는지 확인

### 시나리오 2: API 요청에 bgmUrl이 없음

**브라우저 콘솔:**
```
[BGM 디버깅] API 요청 데이터: {keyword: "...", mood: "..."}  // bgmUrl 없음!
```

**서버 콘솔:**
```
[API] 받은 요청 데이터:
  bgmUrl: (없음)
```

**원인:**
- `bgmUrl`이 `undefined`이므로 API 요청에서 제외됨

**해결:**
- 프론트엔드에서 `bgmUrl`이 올바르게 설정되었는지 확인

### 시나리오 3: 서버에서 BGM URL 수신했지만 믹싱 안됨

**서버 콘솔:**
```
[API] 받은 요청 데이터:
  bgmUrl: https://...
[BGM 믹싱] 시작: BGM URL=...
[BGM 믹싱] ❌ BGM 다운로드 실패: HTTP 403
```

**원인:**
- Firebase Storage 접근 권한 문제

**해결:**
- Firebase Storage Rules 확인
- BGM 파일 접근 권한 확인

### 시나리오 4: FFmpeg 실행 실패

**서버 콘솔:**
```
[BGM 믹싱] ✅ BGM 다운로드 완료: ...
[BGM 믹싱] 4단계: 오디오 믹싱 시작...
[BGM 믹싱] ❌ FFmpeg 에러: ...
```

**원인:**
- FFmpeg 필터 오류
- 오디오 형식 문제

**해결:**
- FFmpeg 필터 단순화 (이미 적용됨)
- 오디오 형식 확인

---

## 📝 로그 예시

### 정상 작동 시:

**브라우저 콘솔:**
```
[BGM 디버깅] bgmUrl: https://firebasestorage.googleapis.com/...
[BGM 디버깅] API 요청 데이터: {keyword: "...", mood: "...", bgmUrl: "https://..."}
```

**서버 콘솔:**
```
[API] 받은 요청 데이터:
  bgmUrl: https://firebasestorage.googleapis.com/...
  bgmUrl 타입: string
  bgmUrl 길이: 250

[API] BGM 믹싱 시작 전:
  bgmUrl: https://...

[BGM 믹싱] 시작: BGM URL=https://...
[BGM 믹싱] 1단계: 음성 파일 저장 중...
[BGM 믹싱] ✅ 음성 파일 저장 완료: 45678 bytes
[BGM 믹싱] 2단계: BGM 다운로드 중...
[BGM 믹싱] ✅ BGM 다운로드 완료: 123456 bytes
[BGM 믹싱] 3단계: 음성 길이 확인 중...
[BGM 믹싱] ✅ 음성 길이: 5.23초
[BGM 믹싱] 4단계: 오디오 믹싱 시작...
[BGM 믹싱] FFmpeg 실행 시작
[BGM 믹싱] 진행률: 50%
[BGM 믹싱] ✅ FFmpeg 처리 완료
[BGM 믹싱] ✅ 믹싱 완료: 567890 bytes

[API] BGM 믹싱 완료:
  finalBuffer 길이: 567890 bytes
  BGM 믹싱 여부: 예
```

---

## 🚀 다음 단계

1. **개발 서버 재시작**: `npm run dev`
2. **BGM 선택하여 테스트**
3. **브라우저 콘솔 확인** - `[BGM 디버깅]` 로그
4. **서버 콘솔 확인** - `[API]`, `[BGM 믹싱]` 로그
5. **로그 내용 공유** - 문제 파악 후 해결책 제시

---

**이제 디버깅 로그가 추가되었으니, 테스트 후 로그 내용을 알려주시면 정확한 문제를 파악하고 해결책을 제시하겠습니다!**


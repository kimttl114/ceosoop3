# ✅ BGM 믹싱 최종 해결 방안

## 🔧 적용된 개선 사항

### 1. 상세 디버깅 로그 추가 ✅

**프론트엔드 (`SmartAudioGenerator.tsx`):**
- `bgmValue`, `selectedBgm`, `bgmUrl` 로그 추가
- API 요청 데이터 로그 추가

**백엔드 (`app/api/generate-audio/route.ts`):**
- 받은 요청 데이터 상세 로그
- BGM 믹싱 전후 버퍼 크기 비교
- 단계별 상세 로그 (이미 적용됨)

### 2. FFmpeg 필터 단순화 ✅

**변경 전:** 한 줄에 모든 필터
```typescript
const filterComplex = `[0:a]aloop=loop=-1:size=2e+09,atrim=0:${targetDuration},volume=0.2,afade=t=out:st=${voiceDuration}:d=2[bgm];[1:a]volume=1.0[voice];[bgm][voice]amix=inputs=2:duration=first:dropout_transition=2[out]`
```

**변경 후:** 단계별로 명확하게 분리
```typescript
const filterComplex = [
  `[0:a]aloop=loop=-1:size=2e+09[loop]`,
  `[loop]atrim=0:${targetDuration}[trimmed]`,
  `[trimmed]volume=0.2[vol_bgm]`,
  `[vol_bgm]afade=t=out:st=${voiceDuration}:d=2[bgm]`,
  `[1:a]volume=1.0[voice]`,
  `[bgm][voice]amix=inputs=2:duration=first[out]`,
].join(';')
```

**장점:**
- 각 단계가 명확함
- 에러 발생 시 어느 단계에서 문제인지 파악 가능
- 호환성 개선

### 3. API 요청 데이터 구조화 ✅

**변경 전:**
```typescript
body: JSON.stringify({
  keyword: keyword.trim(),
  mood,
  ...(bgmUrl && { bgmUrl }),
})
```

**변경 후:**
```typescript
const requestBody = {
  keyword: keyword.trim(),
  mood,
}
if (bgmUrl) {
  requestBody.bgmUrl = bgmUrl
}
body: JSON.stringify(requestBody)
```

**장점:**
- 디버깅이 쉬움
- 로그 출력이 명확함

---

## 🧪 테스트 및 진단 방법

### 즉시 확인할 사항:

#### 1. 브라우저 콘솔 확인

"AI로 방송 만들기" 버튼 클릭 후:

```
[BGM 디버깅] bgmValue: private_cute-happy-kids-354678.mp3
[BGM 디버깅] selectedBgm: {label: "...", value: "...", url: "https://..."}
[BGM 디버깅] bgmUrl: https://firebasestorage.googleapis.com/...
[BGM 디버깅] API 요청 데이터: {keyword: "...", mood: "...", bgmUrl: "https://..."}
```

**확인 사항:**
- ✅ `bgmUrl`이 `undefined`가 아니어야 함
- ✅ `bgmUrl`이 유효한 URL이어야 함
- ✅ API 요청 데이터에 `bgmUrl`이 포함되어야 함

#### 2. 서버 콘솔 확인

개발 서버 터미널에서:

```
[API] 받은 요청 데이터:
  keyword: ...
  mood: ...
  bgmUrl: https://... (또는 (없음))
  bgmUrl 타입: string
  bgmUrl 길이: 250

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

#### 3. 최종 결과 확인

서버 콘솔에서:

```
[API] BGM 믹싱 완료:
  finalBuffer 길이: 567890 bytes
  BGM 믹싱 여부: 예
```

**확인 사항:**
- `finalBuffer 길이`가 `voiceBuffer 길이`보다 크면 BGM이 믹싱된 것
- 같거나 작으면 BGM이 믹싱되지 않은 것

---

## 🔍 예상 문제 및 해결

### 문제 1: BGM URL이 전달되지 않음

**증상:**
- 브라우저 콘솔: `bgmUrl: undefined`
- 서버 콘솔: `bgmUrl: (없음)`

**해결:**
- `bgmOptions` 배열 확인
- BGM 파일이 올바르게 로드되었는지 확인

### 문제 2: Firebase Storage 접근 실패

**증상:**
- 서버 콘솔: `BGM 다운로드 실패: HTTP 403`

**해결:**
- Firebase Console → Storage → Rules 확인
- BGM 파일이 공개 읽기 가능한지 확인

### 문제 3: FFmpeg 실행 실패

**증상:**
- 서버 콘솔: `FFmpeg 에러: ...`

**해결:**
- 필터를 더 단순화
- 오디오 형식 변환 추가

---

## 📝 다음 단계

1. **개발 서버 재시작**: `npm run dev`
2. **BGM 선택하여 테스트**
3. **브라우저 콘솔 로그 확인**
4. **서버 콘솔 로그 확인**
5. **로그 내용을 알려주시면 정확한 해결책 제시**

---

**디버깅 로그가 추가되었으니, 테스트 후 로그 내용을 공유해주시면 문제를 정확히 파악하고 해결하겠습니다!**


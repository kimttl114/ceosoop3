# 🔍 BGM 믹싱 세밀 분석

## 📊 현재 상황

- ✅ 음성 생성: 정상 작동
- ❌ BGM 믹싱: 작동하지 않음

---

## 🔍 코드 분석

### 1. BGM URL 전달 확인

**프론트엔드 (`SmartAudioGenerator.tsx`):**
```typescript
const bgmUrl = bgmValue === '' ? undefined : selectedBgm?.url
```

**문제 가능성:**
- `bgmValue`가 빈 문자열일 때 `undefined`로 전달 ✅
- `selectedBgm`이 없으면 `undefined` ✅
- 하지만 `bgmUrl`이 빈 문자열(`""`)일 수도 있음 ⚠️

### 2. 서버 측 BGM 처리 (`mixVoiceWithBgm`)

**현재 로직:**
```typescript
if (!bgmUrl) {
  return voiceBuffer  // BGM 없으면 그대로 반환
}
```

**문제 가능성:**
- `bgmUrl`이 빈 문자열(`""`)이면 통과함 ⚠️
- `undefined`만 체크하고 있음

### 3. BGM 다운로드

```typescript
const bgmRes = await fetch(bgmUrl)
if (!bgmRes.ok) {
  throw new Error(`BGM 파일을 불러올 수 없습니다. (HTTP ${bgmRes.status})`)
}
```

**문제 가능성:**
- Firebase Storage URL이 CORS 문제로 접근 불가할 수 있음
- 인증이 필요한 URL일 수 있음

### 4. FFmpeg 필터 로직

**현재 필터:**
```typescript
const filterComplex = [
  `[0:a]aloop=loop=-1:size=2e+09,atrim=0:${targetDuration},volume=0.2,afade=t=out:st=${voiceDuration}:d=2[bgm]`,
  `[1:a]volume=1.0[voice]`,
  `[bgm][voice]amix=inputs=2:duration=first:dropout_transition=2[out]`,
].join(';')
```

**입력 순서:**
```typescript
ffmpeg()
  .input(bgmPath)    // [0:a]
  .input(voicePath)  // [1:a]
```

**문제 가능성:**
1. `aloop` 필터가 제대로 작동하지 않을 수 있음
2. BGM 형식 문제 (MP3가 아닐 수 있음)
3. FFmpeg 경로 문제

### 5. 에러 핸들링

**현재:**
```typescript
.on('error', (err) => {
  reject(err)
})
```

**문제:**
- FFmpeg 에러가 제대로 전달되지 않을 수 있음
- 에러 로그가 부족함

---

## 🐛 발견된 문제점

### 문제 1: 빈 문자열 체크 누락 ⚠️

```typescript
if (!bgmUrl) {  // 빈 문자열("")은 통과함!
  return voiceBuffer
}
```

**해결:**
```typescript
if (!bgmUrl || bgmUrl.trim() === '') {
  return voiceBuffer
}
```

### 문제 2: FFmpeg 에러 로깅 부족 ⚠️

에러가 발생해도 로그가 부족해서 디버깅이 어려움

### 문제 3: BGM 다운로드 실패 처리 ⚠️

Firebase Storage URL 접근 시 CORS 또는 인증 문제

### 문제 4: FFmpeg 필터 복잡도 ⚠️

`aloop` 필터가 모든 형식에서 작동하지 않을 수 있음

---

## 🔧 개선 방안

### 1. BGM URL 검증 강화
### 2. FFmpeg 에러 로깅 추가
### 3. BGM 다운로드 에러 핸들링 개선
### 4. FFmpeg 필터 단순화 및 대안 제시
### 5. 단계별 로깅 추가


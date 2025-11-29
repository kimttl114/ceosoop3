# 🚨 Vercel FFmpeg 문제 최종 해결 방안

## 📊 문제 분석 결과

### 발견된 문제

1. ✅ **FFprobe 추정 성공**
   - 텍스트 길이로 오디오 길이 추정 성공
   - `[getAudioDuration] ✅ 텍스트 길이로 추정: 10.86초 (텍스트 길이: 38자)`

2. ❌ **FFmpeg 바이너리 없음**
   - `[FFmpeg] ❌ 모든 방법 실패: FFmpeg 경로를 찾을 수 없습니다.`
   - `[BGM 믹싱] ❌ FFmpeg 에러 발생: Cannot find ffmpeg`

### 근본 원인

**Vercel 서버리스 환경 제약:**
- 큰 바이너리 파일(~140MB)이 배포에 포함되지 않음
- `ffmpeg-static`과 `ffprobe-static` 디렉토리가 배포에 없음
- `/var/task/node_modules/ffmpeg-static` 디렉토리가 존재하지 않음

---

## ✅ 적용된 해결책

### 1. 서버 사이드 개선 ✅

**오디오 길이 추정 (FFprobe Fallback):**
- ✅ 텍스트 길이로 오디오 길이 추정
- ✅ 버퍼 크기로 오디오 길이 추정
- ✅ FFprobe 실패 시 자동으로 fallback 사용

**BGM 믹싱 실패 처리:**
- ✅ FFmpeg 없을 때 BGM URL을 클라이언트에 전달
- ✅ 응답에 `bgmMixed` 플래그 추가
- ✅ 믹싱 실패 시 `bgmUrl` 제공

### 2. 클라이언트 사이드 개선 ✅

**BGM 별도 재생 지원:**
- ✅ 서버에서 BGM 믹싱 실패 시 BGM URL 받기
- ✅ 음성과 BGM을 별도 오디오 플레이어로 표시
- ✅ 사용자에게 명확한 안내 메시지 제공
- ✅ BGM 볼륨 자동 조절 (20%)

---

## 🎯 작동 방식

### 시나리오 1: FFmpeg 사용 가능 (로컬)

1. 서버에서 음성 생성
2. 서버에서 BGM과 믹싱
3. 클라이언트에 믹싱된 오디오 전달
4. 단일 오디오 플레이어로 재생

### 시나리오 2: FFmpeg 없음 (Vercel) ✅

1. 서버에서 음성 생성
2. 서버에서 BGM 믹싱 시도 → 실패
3. 클라이언트에 음성 + BGM URL 전달
4. 클라이언트에서 두 오디오 플레이어 표시
5. 사용자가 두 오디오를 동시에 재생

---

## 📝 코드 변경 사항

### 1. 서버 API 응답 (`app/api/generate-audio/route.ts`)

```typescript
return NextResponse.json({
  script,
  audioBase64,
  contentType: 'audio/mpeg',
  bgmMixed: boolean, // BGM 믹싱 성공 여부
  bgmUrl?: string,   // 믹싱 실패 시 클라이언트에서 사용할 BGM URL
})
```

### 2. 클라이언트 컴포넌트 (`components/SmartAudioGenerator.tsx`)

- BGM URL 상태 추가
- 두 개의 오디오 플레이어 표시
- 사용자 안내 메시지 추가
- BGM 다운로드 버튼 추가

---

## 🎉 결과

### 성공한 부분

1. ✅ 오디오 길이 추정 (FFprobe 없이)
2. ✅ BGM 믹싱 실패 시 우아한 처리
3. ✅ 클라이언트에서 BGM 재생 지원
4. ✅ 사용자 경험 개선

### 제한 사항

- ⚠️ Vercel에서 서버 사이드 BGM 믹싱 불가
- ⚠️ 클라이언트에서 두 오디오를 수동으로 재생해야 함

---

## 💡 향후 개선 방안

### 1. 클라이언트 사이드 Web Audio API 믹싱

- Web Audio API로 클라이언트에서 실제 믹싱
- 단일 오디오 파일로 출력
- 더 나은 사용자 경험

### 2. 외부 FFmpeg API 사용

- Cloudinary 오디오 변환 API
- AWS MediaConvert
- 별도 FFmpeg 서버

### 3. 별도 서버 사용

- Docker로 FFmpeg 서버 구축
- Vercel에서 외부 서버 호출

---

**현재 상태: Vercel 환경에서도 BGM과 음성을 함께 사용할 수 있습니다!**


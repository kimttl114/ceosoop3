# 안내방송 생성기 문제 분석 및 해결책

## 🔍 근본 원인 분석

### 문제 1: Vercel 서버리스 환경 제약사항

**현재 상황:**
- Vercel은 서버리스 함수(Serverless Functions) 환경입니다
- Python이 기본적으로 설치되어 있지 않습니다
- `child_process.execAsync`로 Python/gTTS 실행 시도 → **실패**

**증거:**
```typescript
// app/api/generate-announcement/route.ts:323-340
const pythonCmd = process.platform === 'win32' ? 'py' : 'python'
try {
  await execAsync(`${pythonCmd} --version`, { timeout: 5000 })
} catch (error) {
  // Python이 없으면 실패
  return NextResponse.json({ error: 'Python 오류' }, { status: 500 })
}
```

**결과:**
- 로컬 개발: 작동 가능 (로컬에 Python 설치되어 있을 경우)
- Vercel 배포: **실패** (Python 미설치)

### 문제 2: Web Speech API의 근본적 한계

**현재 폴백 방식:**
- 서버 API 실패 → 클라이언트 Web Speech API 사용
- `SpeechSynthesis`는 브라우저에서 음성을 재생만 가능
- **실제 오디오 파일을 생성할 수 없음**
- 빈 AudioBuffer 생성 → BGM 믹싱 불가

**증거:**
```typescript
// app/tools/announcement/page.tsx:303-314
const buffer = audioContext.createBuffer(numChannels, totalSamples, sampleRate)
// 빈 버퍼 생성 (실제 음성 데이터 없음)
```

## ✅ 해결책

### 추천: Google Cloud Text-to-Speech API 사용

**장점:**
1. ✅ Vercel 서버리스 환경에서 완벽 작동
2. ✅ 실제 오디오 파일(MP3/WAV) 생성
3. ✅ 한국어 완벽 지원 (다양한 음색)
4. ✅ 무료 할당량: 월 0-4백만 자
5. ✅ 안정적이고 빠름

**단점:**
- API 키 설정 필요
- 사용량에 따라 비용 발생 (무료 할당량 초과 시)

### 대안: OpenAI TTS API

**장점:**
1. ✅ 이미 OpenAI API 키 사용 중
2. ✅ 간단한 통합
3. ✅ 한국어 지원

**단점:**
- 비용이 더 높을 수 있음
- 음색 선택 제한적

## 🚀 구현 계획

### 1단계: Google Cloud TTS API 통합

1. `@google-cloud/text-to-speech` 패키지 설치
2. 서버 API 수정 (`app/api/generate-announcement/route.ts`)
3. 환경 변수 추가 (`GOOGLE_CLOUD_TTS_API_KEY`)

### 2단계: 클라이언트 로직 개선

1. 서버 API 우선 사용 (이미 구현됨)
2. 오류 처리 개선
3. 로딩 상태 개선

### 3단계: 테스트 및 배포

1. 로컬 테스트
2. Vercel 배포 테스트
3. 모바일 테스트

## 📝 코드 변경 예시

### Before (Python/gTTS - 작동 안 함)
```typescript
// Vercel에서 실패
const pythonCmd = 'python'
await execAsync(`${pythonCmd} --version`)
// Python이 없어서 실패
```

### After (Google Cloud TTS - 작동함)
```typescript
import { TextToSpeechClient } from '@google-cloud/text-to-speech'

const client = new TextToSpeechClient({
  keyFilename: process.env.GOOGLE_CLOUD_TTS_KEY_FILE
  // 또는
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_TTS_CREDENTIALS)
})

const [response] = await client.synthesizeSpeech({
  input: { text },
  voice: { languageCode: 'ko-KR', ssmlGender: 'FEMALE' },
  audioConfig: { audioEncoding: 'MP3' }
})

return new NextResponse(response.audioContent, {
  headers: { 'Content-Type': 'audio/mpeg' }
})
```

## 🔧 즉시 적용 가능한 임시 해결책

현재 상태에서 가능한 개선:

1. **사용자 안내 개선**
   - 서버 API 실패 시 더 명확한 메시지
   - Python 설치가 불가능하다는 안내

2. **클라이언트 폴백 개선**
   - Web Speech API로 실제 재생은 가능
   - 다만 파일 저장/BGM 믹싱은 제한적

## 📊 예상 결과

### Google Cloud TTS 적용 후:
- ✅ 서버 API 정상 작동
- ✅ 실제 음성 파일 생성
- ✅ BGM과 완벽하게 믹싱
- ✅ 모든 디바이스에서 작동
- ✅ 빠른 응답 시간

## 🎯 다음 단계

1. Google Cloud TTS API 키 발급
2. 서버 API 코드 수정
3. 테스트 및 배포




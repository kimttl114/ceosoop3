# 해결책 구현 가이드

## 🎯 최종 해결책: Google Cloud Text-to-Speech API

### 1단계: Google Cloud TTS API 설정

#### 1.1 API 키 발급
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 기존 프로젝트 선택
3. "Text-to-Speech API" 활성화
4. 서비스 계정 생성 및 키 다운로드 (JSON 파일)

#### 1.2 환경 변수 설정
`.env.local` 파일에 추가:
```env
# Google Cloud TTS API
GOOGLE_CLOUD_TTS_CREDENTIALS={"type":"service_account","project_id":"your-project",...}
# 또는 키 파일 경로 (로컬 개발용)
GOOGLE_CLOUD_TTS_KEY_FILE=./path/to/service-account-key.json
```

### 2단계: 패키지 설치

```bash
npm install @google-cloud/text-to-speech
```

### 3단계: 서버 API 수정

`app/api/generate-announcement/route.ts`를 Google Cloud TTS로 전환합니다.

**주요 변경사항:**
- Python/gTTS 코드 제거
- Google Cloud TTS 클라이언트 추가
- 한국어 음성 선택 로직 개선

### 4단계: 구현 코드

Google Cloud TTS로 전환된 코드는 다음과 같습니다:

```typescript
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { NextRequest, NextResponse } from 'next/server'

const getTTSClient = () => {
  if (!process.env.GOOGLE_CLOUD_TTS_CREDENTIALS) {
    return null
  }
  
  try {
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_TTS_CREDENTIALS)
    return new TextToSpeechClient({ credentials })
  } catch {
    return null
  }
}

async function generateTTSWithGoogleCloud(
  text: string,
  voiceOptions?: {
    lang?: string
    gender?: 'male' | 'female' | 'neutral'
    slow?: boolean
  }
): Promise<Buffer> {
  const client = getTTSClient()
  if (!client) {
    throw new Error('Google Cloud TTS 설정이 필요합니다.')
  }

  const lang = voiceOptions?.lang || 'ko'
  const gender = voiceOptions?.gender || 'neutral'
  
  // 한국어 음성 선택
  let voiceName = 'ko-KR-Standard-A' // 기본 (여성)
  
  if (lang === 'ko') {
    if (gender === 'male') {
      voiceName = 'ko-KR-Standard-D' // 남성
    } else if (gender === 'female') {
      voiceName = 'ko-KR-Standard-A' // 여성
    }
  }

  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: lang === 'ko' ? 'ko-KR' : lang,
      name: voiceName,
      ssmlGender: gender === 'male' ? 'MALE' : gender === 'female' ? 'FEMALE' : 'NEUTRAL'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: voiceOptions?.slow ? 0.85 : 1.0,
    }
  })

  if (!response.audioContent) {
    throw new Error('음성 생성 실패')
  }

  return Buffer.from(response.audioContent as Uint8Array)
}
```

## 🚀 대안: OpenAI TTS API (더 간단)

이미 OpenAI API 키가 있다면 이것도 좋은 선택입니다.

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function generateTTSWithOpenAI(
  text: string,
  voiceOptions?: {
    gender?: 'male' | 'female' | 'neutral'
  }
): Promise<Buffer> {
  const voice = voiceOptions?.gender === 'male' ? 'alloy' : 'nova'
  
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: voice as any,
    input: text,
    language: 'ko',
  })

  const buffer = Buffer.from(await response.arrayBuffer())
  return buffer
}
```

## ✅ 권장사항

1. **Google Cloud TTS**: 더 많은 음성 선택, 무료 할당량
2. **OpenAI TTS**: 이미 키가 있다면 빠른 구현

둘 다 Vercel에서 완벽하게 작동합니다!




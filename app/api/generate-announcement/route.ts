import { NextRequest, NextResponse } from 'next/server'

// TTS 생성 함수 (다양한 API 지원)
async function generateTTS(
  text: string,
  voiceOptions?: {
    lang?: string
    slow?: boolean
    gender?: 'male' | 'female' | 'neutral'
  }
): Promise<Buffer> {
  const lang = voiceOptions?.lang || 'ko'
  
  // Google Cloud TTS 사용 (한국어 완벽 지원)
  if (process.env.GOOGLE_CLOUD_TTS_CREDENTIALS) {
    return generateTTSWithGoogleCloud(text, voiceOptions)
  }
  
  // OpenAI TTS 사용 (한국어 미지원, 영어만 가능)
  if (process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI TTS는 한국어를 지원하지 않습니다. Google Cloud TTS를 사용하세요.')
    if (lang === 'ko') {
      throw new Error('한국어는 Google Cloud TTS API를 사용해야 합니다. GOOGLE_CLOUD_TTS_CREDENTIALS 환경 변수를 설정해주세요.')
    }
    return generateTTSWithOpenAI(text, voiceOptions)
  }
  
  throw new Error('TTS API 키가 설정되지 않았습니다. OPENAI_API_KEY 또는 GOOGLE_CLOUD_TTS_CREDENTIALS를 설정해주세요.')
}

// Google Cloud TTS 생성 (추천 - 한국어 완벽 지원)
async function generateTTSWithGoogleCloud(
  text: string,
  voiceOptions?: {
    lang?: string
    slow?: boolean
    gender?: 'male' | 'female' | 'neutral'
  }
): Promise<Buffer> {
  try {
    // 동적 import (필요할 때만 로드)
    const { TextToSpeechClient } = await import('@google-cloud/text-to-speech')
    
    let credentials
    try {
      credentials = JSON.parse(process.env.GOOGLE_CLOUD_TTS_CREDENTIALS!)
    } catch {
      throw new Error('GOOGLE_CLOUD_TTS_CREDENTIALS가 유효한 JSON이 아닙니다.')
    }

    const client = new TextToSpeechClient({ credentials })

    const lang = voiceOptions?.lang || 'ko'
    const gender = voiceOptions?.gender || 'neutral'
    
    // 한국어 음성 선택
    let voiceName = 'ko-KR-Standard-A' // 기본 (여성)
    let languageCode = 'ko-KR'
    
    if (lang === 'ko') {
      if (gender === 'male') {
        voiceName = 'ko-KR-Standard-D' // 남성
      } else if (gender === 'female') {
        voiceName = 'ko-KR-Standard-A' // 여성
      }
      languageCode = 'ko-KR'
    } else if (lang === 'en') {
      voiceName = gender === 'male' ? 'en-US-Standard-D' : 'en-US-Standard-A'
      languageCode = 'en-US'
    } else {
      languageCode = lang
    }

    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode,
        name: voiceName,
        ssmlGender: gender === 'male' ? 'MALE' : gender === 'female' ? 'FEMALE' : 'NEUTRAL'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: voiceOptions?.slow ? 0.85 : 1.0,
      }
    })

    if (!response.audioContent) {
      throw new Error('음성 생성 실패: 응답에 오디오 데이터가 없습니다.')
    }

    return Buffer.from(response.audioContent as Uint8Array)
  } catch (error: any) {
    console.error('Google Cloud TTS 생성 오류:', error)
    throw new Error(`Google Cloud TTS 생성 실패: ${error.message || '알 수 없는 오류'}`)
  }
}

// OpenAI TTS 생성 (한국어 미지원)
async function generateTTSWithOpenAI(
  text: string,
  voiceOptions?: {
    lang?: string
    slow?: boolean
    gender?: 'male' | 'female' | 'neutral'
  }
): Promise<Buffer> {
  const { default: OpenAI } = await import('openai')
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const voiceMap: Record<string, string> = {
    'male': 'alloy',
    'female': 'nova',
    'neutral': 'nova'
  }
  
  const voice = voiceMap[voiceOptions?.gender || 'neutral'] || 'nova'
  const speed = voiceOptions?.slow ? 0.9 : 1.0

  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: voice as any,
    input: text,
    speed: speed,
  })

  return Buffer.from(await response.arrayBuffer())
}

// 오디오 믹싱 (클라이언트에서 처리하므로 서버에서는 TTS만 생성)
export async function POST(request: NextRequest) {
  try {
    const { text, bgmUrl, voiceOptions } = await request.json()

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: '텍스트가 필요합니다.' },
        { status: 400 }
      )
    }

    // TTS API 키 확인
    if (!process.env.GOOGLE_CLOUD_TTS_CREDENTIALS && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: 'TTS API 키 오류',
          message: 'TTS API 키가 설정되지 않았습니다.\n\n한국어를 사용하려면:\n- GOOGLE_CLOUD_TTS_CREDENTIALS 환경 변수를 설정해주세요\n\n영어만 사용한다면:\n- OPENAI_API_KEY 환경 변수를 설정해주세요\n\n자세한 설정 방법은 SOLUTION_IMPLEMENTATION.md를 참조하세요.',
          details: '한국어는 Google Cloud TTS를 권장합니다.'
        },
        { status: 500 }
      )
    }

    console.log('안내방송 생성 시작 (OpenAI TTS):', {
      text: text.substring(0, 50),
      hasBgm: !!bgmUrl,
      voiceOptions
    })

    try {
      // TTS 생성 (Google Cloud 또는 OpenAI)
      const voiceBuffer = await generateTTS(text, voiceOptions)
      
      console.log('안내방송 생성 완료:', {
        size: voiceBuffer.length,
        type: 'audio/mpeg'
      })

      // BGM은 클라이언트에서 처리하므로 Voice만 반환
      const headers: Record<string, string> = {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="announcement_${Date.now()}.mp3"`,
      }
      
      if (bgmUrl) {
        headers['x-bgm-status'] = 'client-side' // 클라이언트에서 BGM 믹싱
      }

      return new NextResponse(new Uint8Array(voiceBuffer), { headers })
    } catch (ttsError: any) {
      console.error('TTS 생성 실패:', ttsError)
      
      const errorMessage = ttsError.message || '알 수 없는 오류'
      
      // OpenAI API 관련 오류
      if (errorMessage.includes('OpenAI') || errorMessage.includes('API key')) {
        return NextResponse.json(
          {
            error: 'OpenAI API 오류',
            message: 'OpenAI TTS API 호출에 실패했습니다.\n\n가능한 원인:\n1. API 키가 올바르지 않습니다\n2. API 사용량 한도를 초과했습니다\n3. 네트워크 연결 문제\n\n해결 방법:\n- OpenAI API 키를 확인하세요\n- 잠시 후 다시 시도해주세요\n- 또는 Google Cloud TTS API를 사용하세요',
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          error: errorMessage,
          message: '음성 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('안내방송 생성 API 오류:', error)
    
    return NextResponse.json(
      {
        error: error.message || '알 수 없는 오류',
        message: '서버에서 오디오 처리를 할 수 없습니다. 문제가 계속되면 서버 관리자에게 문의하세요.',
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'

// TTS API - 실제 구현은 외부 TTS 서비스와 연동 필요
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '텍스트가 필요합니다.' },
        { status: 400 }
      )
    }

    // TODO: 실제 TTS 서비스 연동
    // 옵션 1: Google Cloud Text-to-Speech API
    // 옵션 2: Azure Cognitive Services
    // 옵션 3: AWS Polly
    // 옵션 4: gTTS를 사용하는 별도 Python 서버 호출

    // 현재는 에러 반환 (클라이언트에서 처리하도록)
    return NextResponse.json(
      { error: 'TTS 서비스가 준비되지 않았습니다. 브라우저 음성 합성을 사용하세요.' },
      { status: 501 }
    )
  } catch (error: any) {
    console.error('TTS API 오류:', error)
    return NextResponse.json(
      { error: error.message || 'TTS 생성 실패' },
      { status: 500 }
    )
  }
}




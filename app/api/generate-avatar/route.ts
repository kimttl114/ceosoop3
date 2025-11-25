import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { keywords } = await request.json()

    if (!keywords || !keywords.trim()) {
      return NextResponse.json(
        { error: '키워드를 입력해주세요.' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 프롬프트 생성: 키워드 + 고정 스타일
    const prompt = `${keywords}, cute minimalist 3d isometric icon, vibrant colors, plain white background, high quality render`

    // DALL-E 3 API 호출
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    })

    const imageUrl = response.data[0]?.url

    if (!imageUrl) {
      return NextResponse.json(
        { error: '이미지 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ imageUrl })
  } catch (error: any) {
    console.error('AI 아바타 생성 오류:', error)
    
    if (error?.status === 429) {
      return NextResponse.json(
        { error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: error?.message || '이미지 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { Food } from '@/lib/foodDatabase'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { food1, food2 } = await request.json()

    if (!food1 || !food2) {
      return NextResponse.json(
        { error: '두 음식 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    // AI를 통한 승부 판정 및 이유 생성
    const prompt = `
두 음식이 배틀그라운드에서 대결합니다!
어느 쪽이 이길지 결정하고, 재미있고 짧은 승리 이유를 한 줄로 설명하세요.

음식 1: ${food1.name} ${food1.emoji}
- 인기도: ${food1.stats.popularity}/100
- 맛: ${food1.stats.taste}/100
- 가격: ${food1.stats.price}/100
- 건강: ${food1.stats.health}/100

음식 2: ${food2.name} ${food2.emoji}
- 인기도: ${food2.stats.popularity}/100
- 맛: ${food2.stats.taste}/100
- 가격: ${food2.stats.price}/100
- 건강: ${food2.stats.health}/100

승부는 능력치를 기반으로 하되, 약간의 반전도 가능합니다.
승리 이유는 재미있고 창의적으로 작성해주세요 (15자 이내).

반드시 아래 JSON 형식으로만 답변하세요:
{
  "winner": "food1" or "food2",
  "reason": "재미있는 승리 이유"
}
`.trim()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 음식 배틀 심판입니다. 재미있고 창의적인 승부 판정을 내립니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 150,
    })

    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('AI 응답이 없습니다.')
    }

    // JSON 파싱
    const result = JSON.parse(aiResponse)

    return NextResponse.json({
      winner: result.winner,
      reason: result.reason,
    })
  } catch (error: any) {
    console.error('[Food Battle API] 오류:', error)
    
    // 폴백: 능력치 기반 간단한 승부 판정
    const { food1, food2 } = await request.json()
    
    const score1 = (
      food1.stats.popularity * 0.4 +
      food1.stats.taste * 0.3 +
      food1.stats.price * 0.2 +
      food1.stats.health * 0.1
    )
    
    const score2 = (
      food2.stats.popularity * 0.4 +
      food2.stats.taste * 0.3 +
      food2.stats.price * 0.2 +
      food2.stats.health * 0.1
    )
    
    const random1 = Math.random() * 30
    const random2 = Math.random() * 30
    
    const finalScore1 = score1 * 0.7 + random1
    const finalScore2 = score2 * 0.7 + random2
    
    const winner = finalScore1 > finalScore2 ? 'food1' : 'food2'
    const winnerFood = winner === 'food1' ? food1 : food2
    const loserFood = winner === 'food1' ? food2 : food1
    
    const reasons = [
      `${winnerFood.name}의 압도적 인기!`,
      `${loserFood.name}을 제압!`,
      `맛의 차이가 승부를 갈랐다!`,
      `${winnerFood.emoji} 완벽한 승리!`,
      `예상 외의 역전!`,
    ]
    
    return NextResponse.json({
      winner,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
    })
  }
}



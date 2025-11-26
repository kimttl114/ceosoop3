import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MarketingRequest {
  businessType: string;
  eventType: string;
  discount?: number;
  targetAudience: string;
  tone: string;
  platform: string;
  additionalInfo?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const body: MarketingRequest = await request.json();
    const { businessType, eventType, discount, targetAudience, tone, platform, additionalInfo } = body;

    // 입력 검증
    if (!businessType || !eventType || !targetAudience || !tone || !platform) {
      return NextResponse.json(
        { error: '필수 입력값이 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 톤앤매너 설명
    const toneDescriptions: Record<string, string> = {
      friendly: '친근하고 따뜻한 톤으로 작성해주세요. 이모지를 적절히 사용하고, 편안한 말투를 사용하세요.',
      professional: '전문적이고 신뢰감 있는 톤으로 작성해주세요. 정중하고 명확한 표현을 사용하세요.',
      fun: '재미있고 유쾌한 톤으로 작성해주세요. 밝고 활기찬 느낌을 주세요.',
      emotional: '감성적이고 따뜻한 톤으로 작성해주세요. 마음을 움직이는 표현을 사용하세요.',
      premium: '프리미엄하고 고급스러운 톤으로 작성해주세요. 세련되고 우아한 표현을 사용하세요.',
    };

    // 플랫폼별 특성
    const platformSpecs: Record<string, string> = {
      instagram: '인스타그램 게시물 형식으로 작성해주세요. 해시태그를 포함하고, 줄바꿈을 적절히 사용하세요.',
      facebook: '페이스북 게시물 형식으로 작성해주세요. 친근하고 소통하는 느낌을 주세요.',
      flyer: '전단지용 문구로 작성해주세요. 눈에 띄고 간결하게 작성하세요.',
      banner: '배너용 문구로 작성해주세요. 짧고 임팩트 있게 작성하세요.',
      kakao: '카카오톡 공지용 문구로 작성해주세요. 간결하고 명확하게 작성하세요.',
    };

    const toneDesc = toneDescriptions[tone] || toneDescriptions.friendly;
    const platformSpec = platformSpecs[platform] || platformSpecs.instagram;

    // 프롬프트 구성
    const prompt = `당신은 자영업자를 위한 전문 마케팅 문구 작성가입니다.

업종: ${businessType}
이벤트 유형: ${eventType}
${discount ? `할인율: ${discount}%` : ''}
타겟 고객: ${targetAudience}
톤앤매너: ${toneDesc}
플랫폼: ${platformSpec}
${additionalInfo ? `추가 정보: ${additionalInfo}` : ''}

위 정보를 바탕으로 마케팅 문구를 3가지 버전으로 작성해주세요.
각 버전은 서로 다른 스타일이어야 하며, 모두 매력적이고 효과적이어야 합니다.

다음 JSON 형식으로 응답해주세요:
{
  "versions": [
    {
      "title": "버전 1의 제목",
      "content": "마케팅 문구 내용",
      "hashtags": ["해시태그1", "해시태그2", "해시태그3"],
      "emoji": "이모지 추천"
    },
    {
      "title": "버전 2의 제목",
      "content": "마케팅 문구 내용",
      "hashtags": ["해시태그1", "해시태그2", "해시태그3"],
      "emoji": "이모지 추천"
    },
    {
      "title": "버전 3의 제목",
      "content": "마케팅 문구 내용",
      "hashtags": ["해시태그1", "해시태그2", "해시태그3"],
      "emoji": "이모지 추천"
    }
  ],
  "tips": "이 마케팅 문구를 더 효과적으로 사용하는 팁"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: '당신은 자영업자를 위한 전문 마케팅 문구 작성가입니다. 항상 유효한 JSON만 반환하세요.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('AI 응답을 받을 수 없습니다.');
    }

    const result = JSON.parse(content);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('마케팅 문구 생성 오류:', error);
    return NextResponse.json(
      { error: error.message || '마케팅 문구 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CustomerServiceRequest {
  situation: string;
  customerEmotion: string;
  channel: string;
  businessType: string;
  additionalContext?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const body: CustomerServiceRequest = await request.json();
    const { situation, customerEmotion, channel, businessType, additionalContext } = body;

    // 입력 검증
    if (!situation || !customerEmotion || !channel || !businessType) {
      return NextResponse.json(
        { error: '필수 입력값이 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 감정별 대응 전략
    const emotionStrategies: Record<string, string> = {
      angry: '화가 난 고객에게는 먼저 사과하고, 즉시 해결책을 제시해야 합니다. 공감과 빠른 조치가 중요합니다.',
      dissatisfied: '불만이 있는 고객에게는 문제를 인정하고, 구체적인 해결 방안을 제시해야 합니다.',
      questioning: '질문하는 고객에게는 명확하고 친절하게 답변해야 합니다. 추가 정보도 제공하면 좋습니다.',
      praising: '칭찬하는 고객에게는 감사 인사를 전하고, 계속 좋은 서비스를 제공하겠다는 의지를 표현해야 합니다.',
      neutral: '중립적인 고객에게는 친절하고 전문적으로 대응해야 합니다.',
    };

    // 채널별 특성
    const channelSpecs: Record<string, string> = {
      phone: '전화 통화는 즉각적인 대응이 중요합니다. 명확하고 친절한 말투를 사용하세요.',
      kakaotalk: '카카오톡은 간결하면서도 따뜻한 톤으로 작성하세요. 이모지를 적절히 사용할 수 있습니다.',
      review: '리뷰 답변은 공개적이므로 신중하게 작성해야 합니다. 문제 해결 의지를 보여주세요.',
      inperson: '직접 대면 시에는 표정과 몸짓도 중요합니다. 진심 어린 태도로 대응하세요.',
    };

    const strategy = emotionStrategies[customerEmotion] || emotionStrategies.neutral;
    const channelSpec = channelSpecs[channel] || channelSpecs.kakaotalk;

    const prompt = `당신은 자영업자를 위한 전문 고객 서비스 컨설턴트입니다.

상황: ${situation}
고객 감정: ${customerEmotion}
${strategy}
채널: ${channel}
${channelSpec}
업종: ${businessType}
${additionalContext ? `추가 맥락: ${additionalContext}` : ''}

위 상황에 맞는 고객 대응 문구를 5가지 버전으로 작성해주세요.
각 버전은 서로 다른 접근 방식이어야 하며, 모두 효과적이어야 합니다.

다음 JSON 형식으로 응답해주세요:
{
  "responses": [
    {
      "approach": "접근 방식 설명",
      "message": "고객 대응 문구",
      "keyPoints": ["핵심 포인트1", "핵심 포인트2"]
    },
    {
      "approach": "접근 방식 설명",
      "message": "고객 대응 문구",
      "keyPoints": ["핵심 포인트1", "핵심 포인트2"]
    },
    {
      "approach": "접근 방식 설명",
      "message": "고객 대응 문구",
      "keyPoints": ["핵심 포인트1", "핵심 포인트2"]
    },
    {
      "approach": "접근 방식 설명",
      "message": "고객 대응 문구",
      "keyPoints": ["핵심 포인트1", "핵심 포인트2"]
    },
    {
      "approach": "접근 방식 설명",
      "message": "고객 대응 문구",
      "keyPoints": ["핵심 포인트1", "핵심 포인트2"]
    }
  ],
  "checklist": ["대응 시 확인사항1", "대응 시 확인사항2", "대응 시 확인사항3"],
  "tips": "이 상황을 더 잘 대응하는 팁"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: '당신은 자영업자를 위한 전문 고객 서비스 컨설턴트입니다. 항상 유효한 JSON만 반환하세요.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
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
    console.error('고객 대응 가이드 생성 오류:', error);
    return NextResponse.json(
      { error: error.message || '고객 대응 가이드 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}


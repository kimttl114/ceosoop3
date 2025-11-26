import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PricingRequest {
  businessType: string;
  cost: number;
  targetMargin: number;
  competitorPrices?: number[];
  region: string;
  targetCustomer: string;
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

    const body: PricingRequest = await request.json();
    const { businessType, cost, targetMargin, competitorPrices, region, targetCustomer, additionalInfo } = body;

    // 입력 검증
    if (!businessType || !cost || !targetMargin || !region || !targetCustomer) {
      return NextResponse.json(
        { error: '필수 입력값이 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 기본 가격 계산
    const basePrice = cost / (1 - targetMargin / 100);
    const minPrice = cost * 1.1; // 최소 10% 마진
    const recommendedPrice = basePrice;
    const premiumPrice = basePrice * 1.2; // 프리미엄 20% 추가

    // 경쟁사 가격 분석
    let competitorAnalysis = '';
    if (competitorPrices && competitorPrices.length > 0) {
      const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
      const minCompetitorPrice = Math.min(...competitorPrices);
      const maxCompetitorPrice = Math.max(...competitorPrices);
      
      competitorAnalysis = `
경쟁사 가격 분석:
- 평균 가격: ${avgCompetitorPrice.toLocaleString()}원
- 최저 가격: ${minCompetitorPrice.toLocaleString()}원
- 최고 가격: ${maxCompetitorPrice.toLocaleString()}원
- 권장 가격(${recommendedPrice.toLocaleString()}원)은 경쟁사 평균 대비 ${recommendedPrice > avgCompetitorPrice ? '높음' : '낮음'}
`;
    }

    const prompt = `당신은 자영업자를 위한 전문 가격 전략 컨설턴트입니다.

업종: ${businessType}
원가: ${cost.toLocaleString()}원
목표 마진율: ${targetMargin}%
지역: ${region}
타겟 고객: ${targetCustomer}
${competitorAnalysis}
${additionalInfo ? `추가 정보: ${additionalInfo}` : ''}

계산된 가격:
- 최저 가격 (10% 마진): ${minPrice.toLocaleString()}원
- 권장 가격 (${targetMargin}% 마진): ${recommendedPrice.toLocaleString()}원
- 프리미엄 가격 (${targetMargin + 20}% 마진): ${premiumPrice.toLocaleString()}원

위 정보를 바탕으로 가격 전략을 분석하고 조언해주세요.

다음 JSON 형식으로 응답해주세요:
{
  "priceAnalysis": {
    "minPrice": ${minPrice},
    "recommendedPrice": ${recommendedPrice},
    "premiumPrice": ${premiumPrice},
    "priceExplanation": "각 가격대의 설명"
  },
  "competitiveness": {
    "analysis": "경쟁력 분석",
    "position": "시장 내 위치",
    "advantages": ["장점1", "장점2"],
    "risks": ["리스크1", "리스크2"]
  },
  "strategy": {
    "recommendation": "추천 가격 전략",
    "pricingModel": "가격 모델 제안",
    "promotionTips": ["프로모션 팁1", "프로모션 팁2"]
  },
  "targetCustomerAnalysis": {
    "priceSensitivity": "가격 민감도 분석",
    "valuePerception": "가치 인식 분석",
    "recommendations": ["고객별 추천1", "고객별 추천2"]
  },
  "tips": "가격 책정 시 주의사항 및 추가 팁"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: '당신은 자영업자를 위한 전문 가격 전략 컨설턴트입니다. 항상 유효한 JSON만 반환하세요.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('AI 응답을 받을 수 없습니다.');
    }

    const result = JSON.parse(content);

    // 계산된 가격 추가
    result.priceAnalysis.minPrice = minPrice;
    result.priceAnalysis.recommendedPrice = recommendedPrice;
    result.priceAnalysis.premiumPrice = premiumPrice;

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('가격 책정 조언 생성 오류:', error);
    return NextResponse.json(
      { error: error.message || '가격 책정 조언 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}


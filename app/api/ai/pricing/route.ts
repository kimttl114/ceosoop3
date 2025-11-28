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

    // 업종별 평균 마진율 (현실적인 기준)
    const industryMargins: Record<string, { min: number; avg: number; max: number }> = {
      '치킨집': { min: 15, avg: 25, max: 35 },
      '카페': { min: 20, avg: 30, max: 40 },
      '한식당': { min: 10, avg: 20, max: 30 },
      '중식당': { min: 15, avg: 25, max: 35 },
      '일식당': { min: 20, avg: 30, max: 40 },
      '양식당': { min: 15, avg: 25, max: 35 },
      '분식': { min: 20, avg: 30, max: 40 },
      '베이커리': { min: 25, avg: 35, max: 45 },
      '술집': { min: 30, avg: 40, max: 50 },
      '기타': { min: 15, avg: 25, max: 35 },
    };

    const industryMargin = industryMargins[businessType] || industryMargins['기타'];
    
    // 목표 마진율이 업종 평균 범위를 벗어나면 조정
    let adjustedMargin = targetMargin;
    if (targetMargin < industryMargin.min) {
      adjustedMargin = industryMargin.min;
    } else if (targetMargin > industryMargin.max) {
      adjustedMargin = industryMargin.max;
    }

    // 지역별 가격 조정 계수
    const regionMultipliers: Record<string, number> = {
      '서울': 1.15,
      '경기': 1.10,
      '부산': 1.05,
      '대구': 1.05,
      '인천': 1.05,
      '광주': 1.00,
      '대전': 1.00,
      '울산': 1.00,
      '강원': 0.95,
      '충북': 0.95,
      '충남': 0.95,
      '전북': 0.90,
      '전남': 0.90,
      '경북': 0.90,
      '경남': 0.90,
      '제주': 1.10,
    };
    const regionMultiplier = regionMultipliers[region] || 1.0;

    // 기본 가격 계산 (마진율 기반)
    const basePrice = cost / (1 - adjustedMargin / 100);
    const minPrice = cost * (1 + industryMargin.min / 100); // 업종 최소 마진
    const recommendedPrice = basePrice * regionMultiplier; // 지역 조정
    const premiumPrice = recommendedPrice * 1.15; // 프리미엄 15% 추가

    // 경쟁사 가격 분석 및 가격 조정
    let competitorAnalysis = '';
    let finalRecommendedPrice = recommendedPrice;
    
    if (competitorPrices && competitorPrices.length > 0) {
      const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
      const minCompetitorPrice = Math.min(...competitorPrices);
      const maxCompetitorPrice = Math.max(...competitorPrices);
      const medianCompetitorPrice = [...competitorPrices].sort((a, b) => a - b)[Math.floor(competitorPrices.length / 2)];
      
      // 경쟁사 가격을 고려한 현실적인 가격 조정
      // 경쟁사 평균의 90%~110% 범위 내로 조정
      if (recommendedPrice < avgCompetitorPrice * 0.9) {
        finalRecommendedPrice = avgCompetitorPrice * 0.9; // 너무 낮으면 올림
      } else if (recommendedPrice > avgCompetitorPrice * 1.1) {
        finalRecommendedPrice = avgCompetitorPrice * 1.1; // 너무 높으면 내림
      }
      
      competitorAnalysis = `
경쟁사 가격 분석:
- 평균 가격: ${avgCompetitorPrice.toLocaleString()}원
- 중간 가격: ${medianCompetitorPrice.toLocaleString()}원
- 최저 가격: ${minCompetitorPrice.toLocaleString()}원
- 최고 가격: ${maxCompetitorPrice.toLocaleString()}원
- 계산된 권장 가격: ${recommendedPrice.toLocaleString()}원
- 경쟁사 대비 조정된 권장 가격: ${finalRecommendedPrice.toLocaleString()}원
- 시장 내 위치: ${finalRecommendedPrice < avgCompetitorPrice ? '경쟁력 있음 (저가 전략)' : finalRecommendedPrice > avgCompetitorPrice ? '프리미엄 전략' : '시장 평균'}
`;
    } else {
      finalRecommendedPrice = recommendedPrice;
    }

    const prompt = `당신은 자영업자를 위한 전문 가격 전략 컨설턴트입니다. **반드시 현실적이고 실용적인 가격 조언을 제공해야 합니다.**

업종: ${businessType}
원가: ${cost.toLocaleString()}원
목표 마진율: ${targetMargin}% (업종 평균: ${industryMargin.avg}%, 범위: ${industryMargin.min}%~${industryMargin.max}%)
지역: ${region} (지역 가격 조정 계수: ${(regionMultiplier * 100).toFixed(0)}%)
타겟 고객: ${targetCustomer}
${competitorAnalysis}
${additionalInfo ? `추가 정보: ${additionalInfo}` : ''}

계산된 가격:
- 최저 가격 (${industryMargin.min}% 마진, 업종 최소 기준): ${Math.round(minPrice).toLocaleString()}원
- 권장 가격 (${adjustedMargin}% 마진, 지역 조정 반영): ${Math.round(finalRecommendedPrice).toLocaleString()}원
- 프리미엄 가격 (${Math.round(adjustedMargin * 1.15)}% 마진): ${Math.round(premiumPrice).toLocaleString()}원

**중요 지침:**
1. 위 계산된 가격이 업종 평균(${industryMargin.avg}%)과 지역(${region}) 기준으로 현실적인지 검토하세요.
2. 경쟁사 가격이 있다면, 그 범위 내에서 경쟁력 있는 가격을 제안하세요.
3. 타겟 고객(${targetCustomer})의 가격 민감도를 고려하여 현실적인 가격을 제안하세요.
4. 비현실적으로 높거나 낮은 가격은 조정하여 제안하세요.
5. 실제 자영업자가 적용 가능한 실용적인 가격 전략을 제안하세요.

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

    // 계산된 가격 추가 (반올림)
    result.priceAnalysis.minPrice = Math.round(minPrice);
    result.priceAnalysis.recommendedPrice = Math.round(finalRecommendedPrice);
    result.priceAnalysis.premiumPrice = Math.round(premiumPrice);
    
    // AI가 제안한 가격이 비현실적이면 조정
    if (result.priceAnalysis.recommendedPrice && 
        (result.priceAnalysis.recommendedPrice < minPrice || 
         result.priceAnalysis.recommendedPrice > premiumPrice * 1.5)) {
      // AI 제안이 범위를 벗어나면 계산된 가격 사용
      result.priceAnalysis.recommendedPrice = Math.round(finalRecommendedPrice);
    }

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




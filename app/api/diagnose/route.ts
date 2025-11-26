import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface DailyDiagnosisRequest {
  type: 'daily';
  revenue: number; // 만원 단위 (일 매출)
  netProfit: number; // 만원 단위 (일 순수익)
  hours: number; // 일 근무 시간
}

interface MonthlyDiagnosisRequest {
  type: 'monthly';
  monthlyRevenue: number; // 만원 단위 (월 매출)
  netProfit: number; // 만원 단위 (월 순수익)
  dailyHours: number; // 하루 근무 시간
  weeklyDays: number; // 주 근무 일수
}

type DiagnosisRequest = DailyDiagnosisRequest | MonthlyDiagnosisRequest;

const MINIMUM_WAGE = 9860; // 최저시급 (원)

function getRank(hourlyWage: number): { rank: string; rankTier: number } {
  if (hourlyWage >= 100000) {
    return { rank: '천상계', rankTier: 15 };
  } else if (hourlyWage >= 80000) {
    return { rank: '신', rankTier: 14 };
  } else if (hourlyWage >= 60000) {
    return { rank: '반신반인', rankTier: 13 };
  } else if (hourlyWage >= 50000) {
    return { rank: '초부자', rankTier: 12 };
  } else if (hourlyWage >= 40000) {
    return { rank: '대부호', rankTier: 11 };
  } else if (hourlyWage >= 35000) {
    return { rank: '부호', rankTier: 10 };
  } else if (hourlyWage >= 30000) {
    return { rank: '귀족', rankTier: 9 };
  } else if (hourlyWage >= 25000) {
    return { rank: '건물주', rankTier: 8 };
  } else if (hourlyWage >= 20000) {
    return { rank: '부자', rankTier: 7 };
  } else if (hourlyWage >= 15000) {
    return { rank: '중산층', rankTier: 6 };
  } else if (hourlyWage >= 12000) {
    return { rank: '서민', rankTier: 5 };
  } else if (hourlyWage >= 9860) {
    return { rank: '평민', rankTier: 4 };
  } else if (hourlyWage >= 8000) {
    return { rank: '노예입성', rankTier: 3 };
  } else if (hourlyWage >= 6000) {
    return { rank: '노예', rankTier: 2 };
  } else if (hourlyWage >= 4000) {
    return { rank: '하층민', rankTier: 1 };
  } else if (hourlyWage >= 3000) {
    return { rank: '거지', rankTier: 0 };
  } else if (hourlyWage >= 2000) {
    return { rank: '염전노예', rankTier: -1 };
  } else {
    return { rank: '지옥행', rankTier: -2 };
  }
}

export async function POST(request: NextRequest) {
  try {
    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const body: DiagnosisRequest = await request.json();
    
    let hourlyWage: number;
    let marginRate: number;
    let revenueInWon: number;
    let netProfitInWon: number;
    let revenueLabel: string;
    let periodLabel: string;

    // 하루 진단 처리
    if (body.type === 'daily') {
      const { revenue, netProfit, hours } = body;

      // 입력값 검증
      if (!revenue || !netProfit || !hours) {
        return NextResponse.json(
          { error: '모든 필드를 입력해주세요.' },
          { status: 400 }
        );
      }

      // 만원 단위를 원 단위로 변환
      revenueInWon = revenue * 10000;
      netProfitInWon = netProfit * 10000;

      // 시급 계산 (일 순수익 / 일 근무 시간)
      hourlyWage = hours > 0 
        ? Math.round(netProfitInWon / hours) 
        : 0;

      // 마진율 계산
      marginRate = revenueInWon > 0 
        ? (netProfitInWon / revenueInWon) * 100 
        : 0;

      revenueLabel = `${revenue}만원`;
      periodLabel = '하루';
    } 
    // 월 진단 처리
    else {
      const { monthlyRevenue, netProfit, dailyHours, weeklyDays } = body;

      // 입력값 검증
      if (!monthlyRevenue || !netProfit || !dailyHours || !weeklyDays) {
        return NextResponse.json(
          { error: '모든 필드를 입력해주세요.' },
          { status: 400 }
        );
      }

      // 만원 단위를 원 단위로 변환
      revenueInWon = monthlyRevenue * 10000;
      netProfitInWon = netProfit * 10000;

      // 시급 계산 (월 순수익 / 월 근무 시간)
      const monthlyWorkingHours = dailyHours * weeklyDays * 4.3;
      hourlyWage = monthlyWorkingHours > 0 
        ? Math.round(netProfitInWon / monthlyWorkingHours) 
        : 0;

      // 마진율 계산
      marginRate = revenueInWon > 0 
        ? (netProfitInWon / revenueInWon) * 100 
        : 0;

      revenueLabel = `${monthlyRevenue}만원`;
      periodLabel = '이번 달';
    }

    // 시급에 따른 등급 자동 결정
    const { rank, rankTier } = getRank(hourlyWage);

    // 폐업률 계산 (시급, 마진율, 등급 기반)
    function calculateClosureRate(hourlyWage: number, marginRate: number, rankTier: number): number {
      let rate = 0;
      
      // 시급 기반 (최저시급 대비)
      if (hourlyWage < MINIMUM_WAGE) {
        rate += 40; // 최저시급 미만
      } else if (hourlyWage < MINIMUM_WAGE * 1.2) {
        rate += 30; // 최저시급 120% 미만
      } else if (hourlyWage < MINIMUM_WAGE * 1.5) {
        rate += 20; // 최저시급 150% 미만
      } else if (hourlyWage < MINIMUM_WAGE * 2) {
        rate += 10; // 최저시급 200% 미만
      }
      
      // 마진율 기반
      if (marginRate < 5) {
        rate += 30; // 마진율 5% 미만
      } else if (marginRate < 10) {
        rate += 20; // 마진율 10% 미만
      } else if (marginRate < 20) {
        rate += 10; // 마진율 20% 미만
      }
      
      // 등급 기반
      if (rankTier <= 2) {
        rate += 30; // 노예급 이하
      } else if (rankTier <= 4) {
        rate += 20; // 평민급 이하
      } else if (rankTier <= 6) {
        rate += 10; // 중산층급 이하
      }
      
      // 최대 95% 제한, 최소 1%
      return Math.min(Math.max(rate, 1), 95);
    }

    const closureRate = calculateClosureRate(hourlyWage, marginRate, rankTier);

    // AI 분석 요청 (독설 및 해결책)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `너는 팩트 폭격을 날리는 자영업 컨설턴트야. 시급과 마진율을 분석해서 영수증에 찍힐 데이터를 JSON으로 줘.

현재 등급: ${rank} (시급 ${hourlyWage}원)
기간: ${periodLabel}

규칙:
1. 위에서 결정된 등급(${rank})을 그대로 사용해. 등급은 변경하지 마.

2. Toxic Comment: 정신 번쩍 들게 하는 짧은 독설 두세마디. 시급 ${hourlyWage}원과 등급 ${rank}를 고려해서 작성해. ${body.type === 'daily' ? '오늘 하루' : '이번 달'} 성과를 반영해.

3. Solution: 지금 당장 해야 할 행동 지침 3가지. 시급과 마진율을 고려해서 구체적으로 작성해.

반드시 다음 JSON 형식으로만 응답해:
{
  "toxicComment": "독설",
  "solutions": ["행동지침1", "행동지침2", "행동지침3"]
}`
        },
        {
          role: "user",
          content: `${periodLabel} 매출: ${revenueLabel}, 순수익: ${body.type === 'daily' ? body.netProfit : body.netProfit}만원, 시급: ${hourlyWage}원, 마진율: ${marginRate.toFixed(1)}%, 등급: ${rank}`
        }
      ],
      temperature: 0.9,
      response_format: { type: "json_object" }
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

    // 미래 예언 AI 요청
    const prophecyCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `너는 자영업자의 미래를 예언하는 신비로운 점술가야. 시급, 마진율, 등급, 폐업률을 바탕으로 현실적이고 구체적인 미래 예언을 해줘.

현재 상태:
- 시급: ${hourlyWage}원
- 마진율: ${marginRate.toFixed(1)}%
- 등급: ${rank}
- 예상 폐업률: ${closureRate}%
- 기간: ${periodLabel}

규칙:
1. 3개월, 6개월, 1년 후의 미래를 예언해줘
2. 현실적이고 구체적인 숫자와 상황을 제시해줘
3. 폐업률을 바탕으로 생존 가능성을 평가해줘
4. 매출, 시급, 등급의 변화 추이를 예측해줘
5. 위험 요소와 기회 요소를 모두 언급해줘
6. 유머러스하지만 현실적인 톤으로 작성해줘

반드시 다음 JSON 형식으로만 응답해:
{
  "threeMonths": "3개월 후 예언 (2-3문장)",
  "sixMonths": "6개월 후 예언 (2-3문장)",
  "oneYear": "1년 후 예언 (2-3문장)",
  "survivalChance": "생존 확률 설명 (1문장)",
  "warning": "경고 메시지 (1문장)",
  "opportunity": "기회 포인트 (1문장)"
}`
        },
        {
          role: "user",
          content: `현재 ${periodLabel} 기준 시급 ${hourlyWage}원, 마진율 ${marginRate.toFixed(1)}%, 등급 ${rank}, 폐업률 ${closureRate}%인 사장님의 미래를 예언해주세요.`
        }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const prophecyResponse = JSON.parse(prophecyCompletion.choices[0].message.content || '{}');

    return NextResponse.json({
      type: body.type,
      hourlyWage,
      marginRate: Number(marginRate.toFixed(2)),
      rank,
      rankTier,
      closureRate: Number(closureRate.toFixed(1)),
      toxicComment: aiResponse.toxicComment || '더 열심히 하세요.',
      solutions: aiResponse.solutions || ['계속 노력하세요.', '포기하지 마세요.', '화이팅!'],
      // 미래 예언
      prophecy: {
        threeMonths: prophecyResponse.threeMonths || '3개월 후 예측 불가',
        sixMonths: prophecyResponse.sixMonths || '6개월 후 예측 불가',
        oneYear: prophecyResponse.oneYear || '1년 후 예측 불가',
        survivalChance: prophecyResponse.survivalChance || '생존 가능성 분석 중',
        warning: prophecyResponse.warning || '위험 요소 확인 필요',
        opportunity: prophecyResponse.opportunity || '기회 포착 중',
      },
      // 하루 진단의 경우 추가 정보
      ...(body.type === 'daily' && {
        dailyRevenue: body.revenue,
        dailyNetProfit: body.netProfit,
        dailyHours: body.hours,
      }),
      // 월 진단의 경우 추가 정보
      ...(body.type === 'monthly' && {
        monthlyRevenue: body.monthlyRevenue,
        monthlyNetProfit: body.netProfit,
        dailyHours: body.dailyHours,
        weeklyDays: body.weeklyDays,
      }),
    });

  } catch (error) {
    console.error('Diagnosis error:', error);
    return NextResponse.json(
      { error: '진단 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

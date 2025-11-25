import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, WidthType } from 'docx'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 최저임금 (2025년 기준, 시간당)
const MINIMUM_WAGE_2025 = 10200

interface DocumentRequest {
  documentType: string
  userInput: string
  userInfo?: {
    businessName?: string
    businessNumber?: string
    representativeName?: string
    address?: string
  }
  additionalData?: Record<string, any>
  regenerateOnly?: boolean // 재생성 플래그
}

// 법적 요건 검증
function validateDocument(data: any, documentType: string): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  if (documentType === '근로계약서') {
    // 필수 항목 검증
    if (!data.workHours) {
      errors.push('근무시간은 필수 항목입니다.')
    }
    if (!data.contractPeriod && !data.startDate) {
      errors.push('계약기간 또는 시작일은 필수 항목입니다.')
    }

    // 최저임금 검증
    if (data.hourlyWage) {
      if (data.hourlyWage < MINIMUM_WAGE_2025) {
        errors.push(`시급이 최저임금(${MINIMUM_WAGE_2025.toLocaleString()}원)보다 낮습니다.`)
      } else if (data.hourlyWage < MINIMUM_WAGE_2025 * 1.1) {
        warnings.push(`시급이 최저임금에 근접합니다. 최저임금 이상을 권장합니다.`)
      }
    }

    // 주 근무시간 검증
    if (data.weeklyHours) {
      if (data.weeklyHours > 40) {
        warnings.push('주 40시간 초과 근무는 추가 합의가 필요합니다.')
      }
      if (data.weeklyHours > 52) {
        errors.push('주 52시간을 초과할 수 없습니다.')
      }
    }

    // 근무일 검증
    if (data.workDays && Array.isArray(data.workDays)) {
      if (data.workDays.length > 6) {
        warnings.push('주 6일 이상 근무는 휴일 근무에 대한 별도 합의가 필요합니다.')
      }
    }
  } else if (documentType === '영수증' || documentType === '세금계산서') {
    if (!data.amount || data.amount <= 0) {
      errors.push('거래 금액은 필수 항목입니다.')
    }
    if (data.amount && data.amount >= 30000 && !data.taxAmount) {
      warnings.push('3만원 이상 거래는 부가세가 포함될 수 있습니다.')
    }
  } else if (documentType === '임대차계약서') {
    if (!data.deposit && !data.monthlyRent) {
      errors.push('보증금 또는 월세는 필수 항목입니다.')
    }
    if (!data.contractPeriod) {
      errors.push('계약기간은 필수 항목입니다.')
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

// GPT-4o를 통한 의도 파악 및 정보 추출
async function analyzeUserInput(userInput: string, documentType?: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다.')
  }

  const prompt = `
사용자의 요청을 분석하여 다음 정보를 JSON 형식으로 반환하세요:

사용자 입력: "${userInput}"

먼저 사용자 요청에서 문서 유형을 자동으로 판단하세요 (근로계약서, 영수증, 임대차계약서, 급여명세서, 공급계약서, 세금계산서 등).

다음 JSON 형식으로 반환하세요:
{
  "documentType": "판단된 문서 유형 (예: 근로계약서, 영수증 등)",
  "extractedData": {
    "employeeName": "직원명 (있는 경우)",
    "hourlyWage": 시급 숫자 (있는 경우),
    "monthlyWage": 월급 숫자 (있는 경우),
    "workHours": "근무시간 (예: 14:00-22:00)",
    "workDays": ["월", "화", "수", "목", "금"],
    "contractPeriod": "계약기간 (예: 3개월, 1년)",
    "startDate": "시작일 (있는 경우)",
    "businessType": "업종 (있는 경우)",
    "amount": 금액 숫자 (있는 경우),
    "deposit": 보증금 숫자 (있는 경우),
    "monthlyRent": 월세 숫자 (있는 경우)
  },
  "missingFields": ["누락된 필수 항목들"],
  "suggestions": ["추가 정보 제안"]
}

반드시 유효한 JSON만 반환하세요. 다른 설명은 포함하지 마세요.
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: '당신은 사용자의 요청을 분석하여 구조화된 데이터를 추출하는 전문가입니다. 항상 유효한 JSON만 반환하세요.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('AI 응답을 받을 수 없습니다.')
    }

    return JSON.parse(content)
  } catch (error) {
    console.error('GPT-4o 분석 오류:', error)
    throw error
  }
}

// 문서 내용 생성
async function generateDocumentContent(
  documentType: string,
  extractedData: any,
  userInfo: any,
  additionalData: any
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다.')
  }

  const prompt = `
다음 정보를 바탕으로 한국 법률에 맞는 ${documentType}를 생성하세요.

[추출된 정보]
${JSON.stringify(extractedData, null, 2)}

[추가 정보]
${JSON.stringify(additionalData || {}, null, 2)}

${documentType === '근로계약서' ? `
[법적 요건 - 2025년 최신 기준]
- 최저임금법 준수 (2025년 기준: ${MINIMUM_WAGE_2025.toLocaleString()}원/시간)
- 근로기준법 (2025년 개정사항 반영) 필수 조항 포함
- 주 40시간 근무 원칙, 주 52시간 한도 준수
- 근무시간 및 휴게시간 명시 (4시간 근무 시 30분, 8시간 근무 시 1시간)
- 연차 유급휴가 규정 (1년 미만: 월 1일, 1년 이상: 15일)
- 퇴직금 규정 명시 (1년 이상 근무 시 평균임금 30일분)
- 최신 근로계약서 필수 기재사항 모두 포함
` : ''}

[일반 법적 요건 - 2025년 최신 기준]
- 모든 법률은 2025년 현재 시행 중인 최신 법령 기준
- 관련 법령의 최신 개정사항 반영
- 최신 판례 및 행정해석 반영

다음 형식으로 문서 내용을 생성하세요:
1. 문서 제목 (${documentType})
2. 계약 당사자 정보
3. 주요 조항들
4. 기타 사항
5. 서명란

실제 사용 가능한 전문적인 문서로 작성하세요. 법적 용어를 정확히 사용하세요.
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `당신은 한국 법률에 정통한 전문 문서 작성가입니다. ${documentType}를 작성할 때는 2025년 현재 시행 중인 최신 법률을 정확히 준수하며, 최신 개정사항과 판례를 반영한 실제 사용 가능한 전문적인 문서를 생성합니다. 항상 2025년 최신 법령 기준으로 작성하세요.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('문서 생성 오류:', error)
    throw error
  }
}

// DOCX 파일 생성
async function createDocxFile(content: string, documentType: string): Promise<Buffer> {
  // 내용을 문단으로 분리
  const paragraphs = content.split('\n\n').map((section) => {
    // 제목인지 확인 (숫자로 시작하거나 특정 패턴)
    if (section.match(/^\d+\./)) {
      return new Paragraph({
        text: section,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    }
    return new Paragraph({
      text: section,
      spacing: { after: 200 },
    })
  })

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: documentType,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          ...paragraphs,
          new Paragraph({
            text: '\n\n\n',
          }),
          new Paragraph({
            text: '서명란',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: '사업자 (인)',
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: '성명: _________________',
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: '근로자 (인)',
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: '성명: _________________',
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `작성일: ${new Date().toLocaleDateString('ko-KR')}`,
            alignment: AlignmentType.RIGHT,
          }),
        ],
      },
    ],
  })

  return await Packer.toBuffer(doc)
}

export async function POST(request: NextRequest) {
  try {
    const body: DocumentRequest = await request.json()
    const { documentType, userInput, userInfo = {}, additionalData = {}, regenerateOnly = false } = body

    if (!documentType || !userInput) {
      return NextResponse.json(
        { error: '문서 유형과 사용자 입력이 필요합니다.' },
        { status: 400 }
      )
    }

    // 재생성 모드: 입력 내용을 그대로 문서로 변환
    if (regenerateOnly) {
      // 문서 유형 자동 판단
      const analysis = await analyzeUserInput(userInput)
      const detectedType = analysis.documentType || documentType || '근로계약서'
      const finalType = documentType || detectedType
      
      const docxBuffer = await createDocxFile(userInput, finalType)
      const base64 = docxBuffer.toString('base64')
      
      return NextResponse.json({
        success: true,
        documentContent: userInput,
        documentBase64: base64,
        fileName: `${finalType}_${Date.now()}.docx`,
        documentType: finalType,
      })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 1. 사용자 입력 분석 (문서 유형 자동 판단)
    const analysis = await analyzeUserInput(userInput, documentType)
    const detectedDocumentType = analysis.documentType || documentType || '근로계약서'
    const extractedData = analysis.extractedData || {}
    const missingFields = analysis.missingFields || []
    
    // 문서 유형 업데이트
    const finalDocumentType = documentType || detectedDocumentType

    // 누락된 필드가 있어도 기본값으로 채워서 진행
    const finalData = { ...extractedData, ...additionalData }
    
    // 기본값 설정 (누락된 경우)
    if (finalDocumentType === '근로계약서') {
      if (!finalData.workHours) {
        finalData.workHours = '09:00-18:00'
      }
      if (!finalData.contractPeriod) {
        finalData.contractPeriod = '1년'
      }
      if (!finalData.workDays || !Array.isArray(finalData.workDays) || finalData.workDays.length === 0) {
        finalData.workDays = ['월', '화', '수', '목', '금']
      }
      if (!finalData.hourlyWage && !finalData.monthlyWage) {
        finalData.hourlyWage = MINIMUM_WAGE_2025
      }
    } else if (finalDocumentType === '영수증' || finalDocumentType === '세금계산서') {
      if (!finalData.amount) {
        finalData.amount = 0
      }
      if (!finalData.taxAmount) {
        finalData.taxAmount = Math.floor(finalData.amount / 11)
      }
    } else if (finalDocumentType === '임대차계약서') {
      if (!finalData.deposit && !finalData.monthlyRent) {
        finalData.monthlyRent = 0
      }
      if (!finalData.contractPeriod) {
        finalData.contractPeriod = '2년'
      }
    }

    // 2. 법적 요건 검증 (경고만 표시, 에러는 치명적인 경우만)
    const validation = validateDocument(finalData, finalDocumentType)
    
    // 치명적인 에러만 반환 (예: 최저임금 미만)
    const criticalErrors = validation.errors.filter((error) => 
      error.includes('최저임금') || error.includes('52시간')
    )
    
    if (criticalErrors.length > 0) {
      return NextResponse.json(
        {
          error: '법적 요건 검증 실패',
          errors: criticalErrors,
          warnings: validation.warnings || [],
          extractedData: finalData,
        },
        { status: 400 }
      )
    }

    // 3. 문서 내용 생성
    const documentContent = await generateDocumentContent(
      finalDocumentType,
      finalData,
      userInfo,
      additionalData
    )

    // 4. DOCX 파일 생성
    const docxBuffer = await createDocxFile(documentContent, finalDocumentType)

    // 5. Base64로 인코딩하여 반환
    const base64 = docxBuffer.toString('base64')

    return NextResponse.json({
      success: true,
      documentContent,
      documentBase64: base64,
      fileName: `${finalDocumentType}_${Date.now()}.docx`,
      documentType: finalDocumentType,
      extractedData: finalData,
      warnings: validation.warnings || [],
    })
  } catch (error: any) {
    console.error('문서 생성 오류:', error)

    if (error?.status === 429) {
      return NextResponse.json(
        { error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: error?.message || '문서 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}


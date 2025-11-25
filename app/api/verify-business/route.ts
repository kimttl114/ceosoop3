import { NextRequest, NextResponse } from 'next/server'

interface BusinessVerificationRequest {
  businessNumber: string // 사업자번호 (10자리)
  openingDate: string // 개업일자 (YYYYMMDD)
  representativeName: string // 대표자 성명
}

interface NTSBusiness {
  b_no: string
  start_dt: string
  p_nm: string
}

interface NTSResponse {
  status_code: string
  match_cnt: number
  request_cnt: number
  valid_cnt: number
  data: Array<{
    b_no: string
    valid: string // '01': 유효, '02': 휴업, '03': 폐업
    tax_type: string
    tax_type_cd: string
    end_dt: string
    utcc_yn: string
    tax_type_change_dt: string
    invoice_apply_dt: string
    rbf_tax_type: string
    rbf_tax_type_cd: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const body: BusinessVerificationRequest = await request.json()
    const { businessNumber, openingDate, representativeName } = body

    // 입력값 검증
    if (!businessNumber || !openingDate || !representativeName) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 사업자번호 형식 검증 (10자리 숫자)
    if (!/^\d{10}$/.test(businessNumber)) {
      return NextResponse.json(
        { error: '사업자번호는 10자리 숫자여야 합니다.' },
        { status: 400 }
      )
    }

    // 개업일자 형식 검증 (YYYYMMDD)
    if (!/^\d{8}$/.test(openingDate)) {
      return NextResponse.json(
        { error: '개업일자는 YYYYMMDD 형식(8자리 숫자)이어야 합니다.' },
        { status: 400 }
      )
    }

    // API 키 확인
    const apiKey = process.env.NTS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: '국세청 API 키가 설정되지 않았습니다. .env.local 파일에 NTS_API_KEY를 설정해주세요.' },
        { status: 500 }
      )
    }

    // 국세청 API 요청 데이터 구성
    const ntsRequest: { businesses: NTSBusiness[] } = {
      businesses: [
        {
          b_no: businessNumber,
          start_dt: openingDate,
          p_nm: representativeName,
        },
      ],
    }

    // 국세청 API 호출
    const ntsApiUrl = `https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=${encodeURIComponent(apiKey)}`
    
    const ntsResponse = await fetch(ntsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(ntsRequest),
    })

    if (!ntsResponse.ok) {
      const errorText = await ntsResponse.text()
      console.error('국세청 API 오류:', ntsResponse.status, errorText)
      return NextResponse.json(
        { error: '국세청 API 호출에 실패했습니다.', details: errorText },
        { status: ntsResponse.status }
      )
    }

    const ntsData: NTSResponse = await ntsResponse.json()

    // 응답 처리
    if (ntsData.status_code !== 'OK') {
      return NextResponse.json(
        { error: '국세청 API 응답 오류', status_code: ntsData.status_code },
        { status: 400 }
      )
    }

    // 검증 결과 확인
    if (ntsData.match_cnt === 0 || ntsData.data.length === 0) {
      return NextResponse.json({
        valid: false,
        message: '일치하는 사업자 정보를 찾을 수 없습니다.',
        data: ntsData,
      })
    }

    const businessData = ntsData.data[0]
    const isValid = businessData.valid === '01' // '01': 유효

    // 검증 결과 반환
    return NextResponse.json({
      valid: isValid,
      message: isValid
        ? '사업자 정보가 확인되었습니다.'
        : businessData.valid === '02'
        ? '휴업 상태의 사업자입니다.'
        : businessData.valid === '03'
        ? '폐업된 사업자입니다.'
        : '사업자 정보가 유효하지 않습니다.',
      data: {
        businessNumber: businessData.b_no,
        status: businessData.valid,
        taxType: businessData.tax_type,
        endDate: businessData.end_dt,
      },
      rawResponse: ntsData,
    })
  } catch (error) {
    console.error('사업자 인증 처리 오류:', error)
    return NextResponse.json(
      {
        error: '사업자 인증 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}

// GET 메서드로 API 키 설정 안내
export async function GET() {
  return NextResponse.json({
    message: '국세청 사업자 진위여부 확인 API',
    usage: {
      method: 'POST',
      endpoint: '/api/verify-business',
      body: {
        businessNumber: 'string (10자리 숫자)',
        openingDate: 'string (YYYYMMDD 형식)',
        representativeName: 'string (대표자 성명)',
      },
    },
    note: '.env.local 파일에 NTS_API_KEY를 설정해주세요.',
  })
}


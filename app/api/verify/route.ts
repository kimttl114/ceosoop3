import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Firebase Admin SDK 초기화 (선택사항 - 클라이언트 SDK 사용 시 주석 처리)
// import { initializeApp, getApps, cert } from 'firebase-admin/app'
// import { getFirestore } from 'firebase-admin/firestore'

// OpenAI 클라이언트 초기화 (API 키가 있을 때만)
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return null
  }
  return new OpenAI({
    apiKey: apiKey,
  })
}

// Firebase Admin 초기화 (서버 사이드에서 사용 시)
// const firebaseApp = getApps().length === 0
//   ? initializeApp({
//       credential: cert({
//         projectId: process.env.FIREBASE_PROJECT_ID,
//         clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//         privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//       }),
//     })
//   : getApps()[0]
// const db = getFirestore(firebaseApp)

interface VerifyRequest {
  representativeName: string
  openingDate: string
  businessNumber: string
  image: File
}

// 1차 검증: 국세청 API
async function verifyWithNTS(
  businessNumber: string,
  representativeName: string,
  openingDate: string
): Promise<{ valid: boolean; message?: string }> {
  try {
    const apiKey = process.env.NTS_API_KEY || 'a195e4f68dd430f43373638d5503d6d62061df8f372b6ff3fc129c74c013bad9'
    if (!apiKey) {
      console.error('NTS_API_KEY가 설정되지 않았습니다.')
      return { valid: false, message: 'API 키가 설정되지 않았습니다.' }
    }

    // 국세청 API 요청 형식에 맞게 수정
    const ntsRequest = {
      businesses: [
        {
          b_no: businessNumber,
          start_dt: openingDate,
          p_nm: representativeName,
        },
      ],
    }

    const response = await fetch(
      `https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ntsRequest),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        valid: false,
        message: errorData.message || '국세청 API 호출에 실패했습니다.',
      }
    }

    const data = await response.json()
    
    // 국세청 API 응답 구조 확인
    if (data.status_code !== 'OK') {
      return {
        valid: false,
        message: data.message || '국세청 API 호출에 실패했습니다.',
      }
    }

    // 검증 결과 확인
    if (data.match_cnt === 0 || !data.data || data.data.length === 0) {
      return {
        valid: false,
        message: '일치하는 사업자 정보를 찾을 수 없습니다.',
      }
    }

    const businessData = data.data[0]
    // valid: '01' = 유효, '02' = 휴업, '03' = 폐업
    if (businessData.valid === '01') {
      return { valid: true }
    } else if (businessData.valid === '02') {
      return {
        valid: false,
        message: '휴업 상태의 사업자입니다.',
      }
    } else if (businessData.valid === '03') {
      return {
        valid: false,
        message: '폐업된 사업자입니다.',
      }
    } else {
      return {
        valid: false,
        message: '사업자 정보가 유효하지 않습니다.',
      }
    }
  } catch (error) {
    console.error('국세청 API 호출 오류:', error)
    return {
      valid: false,
      message: '국세청 API 호출 중 오류가 발생했습니다.',
    }
  }
}

// 2차 검증: GPT-4o Vision으로 사업자등록증 이미지 분석
async function verifyWithGPT4Vision(
  imageBase64: string,
  expectedBusinessNumber: string,
  expectedRepresentativeName: string
): Promise<{ valid: boolean; extractedData?: any; message?: string }> {
  try {
    const openai = getOpenAIClient()
    if (!openai) {
      console.error('OPENAI_API_KEY가 설정되지 않았습니다.')
      // 개발 환경에서는 실제 API 호출 없이 통과 (실제 운영 시에는 제거)
      return { valid: true, message: '개발 모드: OpenAI API 키가 없어 검증을 건너뜁니다.' }
    }

    const prompt = `이 사업자등록증 이미지를 분석하여 다음 정보를 JSON 형식으로 반환해주세요:
- 등록번호 (businessNumber): 10자리 숫자
- 대표자 성명 (representativeName): 한글 이름

반드시 다음 JSON 형식으로만 응답하세요:
{
  "businessNumber": "1234567890",
  "representativeName": "홍길동"
}

이미지에서 읽을 수 없는 경우 "unreadable"을 반환하세요.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return {
        valid: false,
        message: '이미지 분석에 실패했습니다.',
      }
    }

    // JSON 추출 (마크다운 코드 블록 제거)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        valid: false,
        message: '이미지에서 정보를 읽을 수 없습니다.',
      }
    }

    let extractedData
    try {
      extractedData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      return {
        valid: false,
        message: '추출된 정보를 파싱할 수 없습니다.',
      }
    }

    // 추출된 정보와 입력된 정보 비교
    const businessNumberMatch =
      extractedData.businessNumber?.replace(/\D/g, '') === expectedBusinessNumber.replace(/\D/g, '')
    const nameMatch =
      extractedData.representativeName?.trim() === expectedRepresentativeName.trim()

    if (businessNumberMatch && nameMatch) {
      return {
        valid: true,
        extractedData,
      }
    } else {
      return {
        valid: false,
        extractedData,
        message: '사업자등록증의 정보가 입력하신 정보와 일치하지 않습니다.',
      }
    }
  } catch (error) {
    console.error('GPT-4 Vision API 호출 오류:', error)
    return {
      valid: false,
      message: '이미지 분석 중 오류가 발생했습니다.',
    }
  }
}

// Firebase에 인증 정보 업데이트
async function updateFirebaseUser(userId: string, verificationData: any) {
  try {
    // 클라이언트 SDK를 사용하는 경우, 여기서는 서버에서 직접 업데이트하지 않고
    // 클라이언트에서 업데이트하도록 응답만 반환
    // 실제 구현 시 Firebase Admin SDK를 사용하여 업데이트
    
    // 예시 코드 (Firebase Admin SDK 사용 시):
    // await db.collection('users').doc(userId).update({
    //   isVerified: true,
    //   verifiedAt: new Date(),
    //   businessInfo: {
    //     businessNumber: verificationData.businessNumber,
    //     representativeName: verificationData.representativeName,
    //     openingDate: verificationData.openingDate,
    //   },
    // })
    
    return { success: true }
  } catch (error) {
    console.error('Firebase 업데이트 오류:', error)
    return { success: false, error: 'Firebase 업데이트 실패' }
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const representativeName = formData.get('representativeName') as string
    const openingDate = formData.get('openingDate') as string
    const businessNumber = formData.get('businessNumber') as string
    const imageFile = formData.get('image') as File

    // 입력값 검증
    if (!representativeName || !openingDate || !businessNumber || !imageFile) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      )
    }

    if (businessNumber.length !== 10) {
      return NextResponse.json(
        { error: '사업자등록번호는 10자리여야 합니다.' },
        { status: 400 }
      )
    }

    if (openingDate.length !== 8) {
      return NextResponse.json(
        { error: '개업일자는 8자리여야 합니다. (YYYYMMDD)' },
        { status: 400 }
      )
    }

    // 이미지를 Base64로 변환
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = `data:${imageFile.type};base64,${buffer.toString('base64')}`

    // 1차 검증: 국세청 API
    const ntsResult = await verifyWithNTS(businessNumber, representativeName, openingDate)
    if (!ntsResult.valid) {
      return NextResponse.json(
        { error: ntsResult.message || '일치하지 않는 사업자 정보입니다.' },
        { status: 400 }
      )
    }

    // 2차 검증: GPT-4o Vision
    const visionResult = await verifyWithGPT4Vision(
      base64Image,
      businessNumber,
      representativeName
    )
    if (!visionResult.valid) {
      return NextResponse.json(
        {
          error: visionResult.message || '사업자등록증 검증에 실패했습니다.',
          extractedData: visionResult.extractedData,
        },
        { status: 400 }
      )
    }

    // 인증 성공 - 클라이언트에서 Firebase에 저장하도록 데이터 반환
    return NextResponse.json({
      success: true,
      message: '인증이 완료되었습니다.',
      data: {
        businessNumber,
        representativeName,
        openingDate,
        verifiedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('인증 처리 오류:', error)
    return NextResponse.json(
      { error: '인증 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}


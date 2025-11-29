/**
 * 실제 API 에러 확인 - 서버 로그와 함께 상세 분석
 */

async function testAPIWithDetailedError() {
  console.log('🔍 API 에러 상세 분석')
  console.log('='.repeat(60))
  console.log('\n⚠️  이 스크립트를 실행하기 전에:')
  console.log('   1. 개발 서버가 실행 중이어야 합니다 (npm run dev)')
  console.log('   2. 서버 터미널을 별도로 열어두어 에러 로그를 확인하세요')
  console.log('\n' + '='.repeat(60) + '\n')
  
  try {
    console.log('📡 API 요청 전송 중...')
    console.log('요청 데이터:', JSON.stringify({
      keyword: '재료소진',
      mood: '정중하게',
      bgmUrl: undefined,
    }, null, 2))
    
    const response = await fetch('http://localhost:3000/api/generate-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword: '재료소진',
        mood: '정중하게',
        bgmUrl: undefined,
      }),
    })
    
    console.log(`\n📊 응답 상태: ${response.status} ${response.statusText}`)
    console.log(`응답 헤더:`, Object.fromEntries(response.headers.entries()))
    
    const data = await response.json()
    
    console.log('\n📦 응답 본문:')
    console.log(JSON.stringify(data, null, 2))
    
    if (!response.ok) {
      console.log('\n❌ 에러 발생!')
      console.log('\n🔍 에러 분석:')
      
      if (data.details) {
        console.log('상세 에러 정보:')
        console.log('  타입:', data.details.type || '알 수 없음')
        console.log('  메시지:', data.details.message)
        if (data.details.suggestion) {
          console.log('\n💡 해결 방법:')
          console.log('  ', data.details.suggestion)
        }
      }
      
      if (data.error) {
        console.log('\n에러 메시지:', data.error)
      }
      
      // 에러 타입별 추가 정보
      if (data.error?.includes('404') || data.error?.includes('was not found')) {
        console.log('\n🚨 404 에러 감지:')
        console.log('   → 모델에 접근할 수 없습니다.')
        console.log('   → 해결 방법:')
        console.log('     1. Vertex AI Studio 접근 테스트:')
        console.log('        https://console.cloud.google.com/vertex-ai/generative/language/create/text?project=ceo-blaind')
        console.log('     2. Generative AI API 활성화:')
        console.log('        https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=ceo-blaind')
        console.log('     3. 청구 계정 연결 확인:')
        console.log('        https://console.cloud.google.com/billing?project=ceo-blaind')
      }
      
      if (data.error?.includes('403') || data.error?.includes('Permission')) {
        console.log('\n🚨 403 에러 감지:')
        console.log('   → 권한이 없습니다.')
        console.log('   → 해결 방법:')
        console.log('     1. IAM 페이지에서 "Vertex AI 사용자" 역할 확인:')
        console.log('        https://console.cloud.google.com/iam-admin/iam?project=ceo-blaind')
        console.log('     2. 서비스 계정: vertex-express@ceo-blaind.iam.gserviceaccount.com')
      }
      
      if (data.error?.includes('401') || data.error?.includes('Unauthorized')) {
        console.log('\n🚨 401 에러 감지:')
        console.log('   → 인증 실패입니다.')
        console.log('   → 해결 방법:')
        console.log('     1. .env.local 파일의 GOOGLE_CLOUD_CREDENTIALS 확인')
        console.log('     2. node check-env-keys.js 실행하여 검증')
      }
    } else {
      console.log('\n✅ 성공!')
      console.log(`생성된 대본: ${data.script}`)
      console.log(`오디오 데이터 길이: ${data.audioBase64?.length} bytes`)
    }
    
  } catch (error) {
    console.error('\n❌ 예외 발생:', error.message)
    console.error('스택:', error.stack)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🚨 연결 거부됨:')
      console.log('   → 개발 서버가 실행되고 있지 않습니다.')
      console.log('   → 해결 방법: 다른 터미널에서 "npm run dev" 실행')
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('\n💡 서버 콘솔에서 다음 로그를 확인하세요:')
  console.log('   - [Vertex AI] 프로젝트: ...')
  console.log('   - [Vertex AI] 모델 시도: ...')
  console.log('   - generate-audio API 오류: ...')
}

// 서버 연결 확인
console.log('⏳ 서버 연결 확인 중...\n')

testAPIWithDetailedError()



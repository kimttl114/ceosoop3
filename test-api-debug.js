/**
 * API 엔드포인트 디버깅 테스트
 */

const http = require('http')

const postData = JSON.stringify({
  keyword: '재료소진',
  mood: '정중하게',
})

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/generate-audio',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
}

console.log('🔍 API 엔드포인트 테스트 시작...\n')

const req = http.request(options, (res) => {
  let data = ''

  console.log(`Status: ${res.statusCode}`)
  console.log(`Headers:`, res.headers)

  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    console.log('\n응답 본문:')
    try {
      const parsed = JSON.parse(data)
      console.log(JSON.stringify(parsed, null, 2))
      
      // 에러 메시지 상세 분석
      if (parsed.error) {
        console.log('\n📋 에러 분석:')
        console.log(`   에러 메시지: ${parsed.error}`)
        
        // 404 에러 체크
        if (parsed.error.includes('404') || parsed.error.includes('NOT_FOUND')) {
          console.log('\n   ⚠️  모델을 찾을 수 없음 (404)')
          console.log('   가능한 원인:')
          console.log('   1. Vertex AI 리전 설정 문제')
          console.log('   2. 프로젝트에 Vertex AI API 활성화 안됨')
          console.log('   3. 서비스 계정 권한 부족')
          console.log('   4. 모델 이름이 잘못됨')
        }
        
        // 인증 에러 체크
        if (parsed.error.includes('401') || parsed.error.includes('unauthorized') || parsed.error.includes('permission')) {
          console.log('\n   ⚠️  인증/권한 문제')
          console.log('   가능한 원인:')
          console.log('   1. 서비스 계정 키가 잘못됨')
          console.log('   2. 서비스 계정에 Vertex AI 사용자 역할이 없음')
        }
      }
    } catch (e) {
      console.log('   (JSON 파싱 실패)')
      console.log(data)
    }
  })
})

req.on('error', (e) => {
  console.error(`❌ 요청 실패: ${e.message}`)
  console.log('\n💡 해결 방법:')
  console.log('   1. 개발 서버가 실행 중인지 확인: npm run dev')
  console.log('   2. 서버가 localhost:3000에서 실행 중인지 확인')
})

req.write(postData)
req.end()




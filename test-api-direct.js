/**
 * API 엔드포인트 직접 테스트 - 실제 서버에서 발생하는 에러 확인
 */

async function testAPI() {
  console.log('🧪 API 엔드포인트 직접 테스트')
  console.log('='.repeat(60))
  
  try {
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
    
    console.log(`\n📡 응답 상태: ${response.status} ${response.statusText}`)
    
    const data = await response.json()
    
    console.log('\n📦 응답 데이터:')
    console.log(JSON.stringify(data, null, 2))
    
    if (!response.ok) {
      console.log('\n❌ 에러 발생!')
      if (data.details) {
        console.log('\n🔍 상세 에러 정보:')
        console.log(JSON.stringify(data.details, null, 2))
      }
    } else {
      console.log('\n✅ 성공!')
      console.log(`생성된 대본: ${data.script?.substring(0, 100)}...`)
      console.log(`오디오 데이터 길이: ${data.audioBase64?.length} bytes`)
    }
    
  } catch (error) {
    console.error('\n❌ 예외 발생:', error)
    console.error('스택:', error.stack)
  }
}

// 서버가 실행 중인지 확인
console.log('⏳ 서버 연결 확인 중...\n')

testAPI()



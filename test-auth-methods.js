/**
 * Vertex AI 인증 방법 테스트
 */

const fs = require('fs')
const path = require('path')
const { tmpdir } = require('os')

// .env.local 파일 읽기
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match && !match[1].startsWith('#')) {
      let key = match[1].trim()
      let value = match[2].trim()
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
  })
}

async function testMethod1() {
  console.log('\n🔍 방법 1: GOOGLE_APPLICATION_CREDENTIALS 환경 변수 사용')
  console.log('='.repeat(60))
  
  try {
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
    const keyPath = path.join(tmpdir(), `test-key-${Date.now()}.json`)
    fs.writeFileSync(keyPath, JSON.stringify(credentials), 'utf8')
    
    const original = process.env.GOOGLE_APPLICATION_CREDENTIALS
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath
    
    try {
      const { VertexAI } = require('@google-cloud/vertexai')
      const vertexAI = new VertexAI({
        project: credentials.project_id,
        location: 'us-central1',
      })
      
      const model = vertexAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      console.log('   ✅ VertexAI 클라이언트 생성 성공')
      console.log('   테스트 요청 전송...')
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: '안녕' }] }],
      })
      
      console.log('   ✅ 성공!')
      console.log('   응답:', result.response?.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50))
      return true
    } finally {
      if (original) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = original
      } else {
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS
      }
      fs.unlinkSync(keyPath)
    }
  } catch (error) {
    console.log('   ❌ 실패:', error.message)
    return false
  }
}

async function testMethod2() {
  console.log('\n🔍 방법 2: GoogleAuth 직접 사용')
  console.log('='.repeat(60))
  
  try {
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
    const { GoogleAuth } = require('google-auth-library')
    
    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    })
    
    console.log('   ✅ GoogleAuth 생성 성공')
    console.log('   Access Token 가져오기...')
    
    const client = await auth.getClient()
    const accessToken = await client.getAccessToken()
    
    console.log('   ✅ Access Token 획득 성공')
    console.log('   Token:', accessToken.token?.substring(0, 30) + '...')
    
    return true
  } catch (error) {
    console.log('   ❌ 실패:', error.message)
    if (error.stack) {
      console.log('   Stack:', error.stack.split('\n').slice(0, 5).join('\n'))
    }
    return false
  }
}

async function testMethod3() {
  console.log('\n🔍 방법 3: VertexAI with googleAuthOptions')
  console.log('='.repeat(60))
  
  try {
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
    const { VertexAI } = require('@google-cloud/vertexai')
    const { GoogleAuth } = require('google-auth-library')
    
    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    })
    
    const vertexAI = new VertexAI({
      project: credentials.project_id,
      location: 'us-central1',
      googleAuthOptions: {
        authClient: auth,
      },
    })
    
    console.log('   ✅ VertexAI 클라이언트 생성 성공')
    
    const model = vertexAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    console.log('   ✅ 모델 객체 생성 성공')
    console.log('   테스트 요청 전송...')
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: '안녕' }] }],
    })
    
    console.log('   ✅ 성공!')
    console.log('   응답:', result.response?.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50))
    return true
  } catch (error) {
    console.log('   ❌ 실패:', error.message)
    if (error.stack) {
      console.log('   Stack:', error.stack.split('\n').slice(0, 5).join('\n'))
    }
    return false
  }
}

async function runAllTests() {
  console.log('🔍 Vertex AI 인증 방법 테스트')
  console.log('='.repeat(60))
  
  const results = []
  
  results.push(await testMethod1())
  results.push(await testMethod2())
  results.push(await testMethod3())
  
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 테스트 결과:')
  console.log(`   방법 1 (환경 변수): ${results[0] ? '✅ 성공' : '❌ 실패'}`)
  console.log(`   방법 2 (GoogleAuth): ${results[1] ? '✅ 성공' : '❌ 실패'}`)
  console.log(`   방법 3 (googleAuthOptions): ${results[2] ? '✅ 성공' : '❌ 실패'}`)
  
  if (results.includes(true)) {
    console.log('\n✅ 작동하는 방법을 찾았습니다!')
    const workingMethod = results.findIndex(r => r) + 1
    console.log(`   권장: 방법 ${workingMethod}`)
  } else {
    console.log('\n❌ 모든 방법 실패')
    console.log('   Google Cloud Console 설정을 확인하세요:')
    console.log('   1. Vertex AI API 활성화')
    console.log('   2. 서비스 계정 권한 확인')
    console.log('   3. 청구 계정 연결 확인')
  }
}

runAllTests().catch(console.error)




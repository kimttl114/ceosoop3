/**
 * Vertex AI 상세 진단 - API 활성화, 권한, 모델 접근 확인
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

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

async function getAccessToken() {
  const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
  const { GoogleAuth } = require('google-auth-library')
  
  const auth = new GoogleAuth({
    credentials: credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  
  const client = await auth.getClient()
  const accessToken = await client.getAccessToken()
  return accessToken.token
}

async function testVertexAIDirectAPI(accessToken, projectId, location, modelName) {
  return new Promise((resolve, reject) => {
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:predict`
    
    const postData = JSON.stringify({
      instances: [{
        contents: [{
          role: 'user',
          parts: [{ text: '안녕' }]
        }]
      }]
    })
    
    const options = {
      hostname: `${location}-aiplatform.googleapis.com`,
      path: `/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:predict`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }
    
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (res.statusCode === 200) {
            resolve({ success: true, data: parsed })
          } else {
            resolve({ 
              success: false, 
              statusCode: res.statusCode,
              error: parsed.error || parsed
            })
          }
        } catch (e) {
          resolve({ 
            success: false, 
            statusCode: res.statusCode,
            error: { message: data }
          })
        }
      })
    })
    
    req.on('error', (e) => {
      reject(e)
    })
    
    req.write(postData)
    req.end()
  })
}

async function testWithGenerateContent() {
  console.log('\n🔍 방법 4: generateContent API 직접 사용')
  console.log('='.repeat(60))
  
  try {
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
    const projectId = process.env.GOOGLE_VERTEX_AI_PROJECT_ID || credentials.project_id
    const location = process.env.GOOGLE_VERTEX_AI_LOCATION || 'us-central1'
    
    console.log(`   프로젝트: ${projectId}`)
    console.log(`   리전: ${location}`)
    
    const accessToken = await getAccessToken()
    console.log(`   ✅ Access Token 획득: ${accessToken.substring(0, 30)}...`)
    
    // 올바른 Vertex AI Generate Content API 엔드포인트 사용
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-1.5-flash:generateContent`
    
    const postData = JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: '안녕하세요' }]
      }]
    })
    
    console.log(`   API 엔드포인트: ${url}`)
    console.log(`   요청 전송...`)
    
    const result = await new Promise((resolve, reject) => {
      const urlObj = new URL(url)
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }
      
      const req = https.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          })
        })
      })
      
      req.on('error', reject)
      req.write(postData)
      req.end()
    })
    
    console.log(`   응답 상태: ${result.statusCode}`)
    
    if (result.statusCode === 200) {
      const parsed = JSON.parse(result.body)
      const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
      console.log(`   ✅ 성공!`)
      console.log(`   응답: ${text?.substring(0, 100)}`)
      return true
    } else {
      const error = JSON.parse(result.body)
      console.log(`   ❌ 실패:`)
      console.log(`   상태 코드: ${result.statusCode}`)
      console.log(`   에러:`, JSON.stringify(error, null, 2))
      
      if (error.error) {
        const err = error.error
        if (err.code === 404) {
          console.log(`\n   💡 404 에러 분석:`)
          console.log(`      - 모델을 찾을 수 없음: ${err.message}`)
          console.log(`      - 가능한 원인:`)
          console.log(`        1. Vertex AI API 미활성화`)
          console.log(`        2. 서비스 계정에 Vertex AI 사용 권한 없음`)
          console.log(`        3. 프로젝트에 Vertex AI 접근 권한 없음`)
          console.log(`        4. 모델 이름이 잘못됨 또는 해당 리전에서 사용 불가`)
        } else if (err.code === 403) {
          console.log(`\n   💡 403 에러 분석:`)
          console.log(`      - 권한 없음: ${err.message}`)
          console.log(`      - 가능한 원인:`)
          console.log(`        1. 서비스 계정에 "Vertex AI 사용자" 역할 없음`)
          console.log(`        2. 프로젝트에 Vertex AI API 사용 권한 없음`)
        } else if (err.code === 401) {
          console.log(`\n   💡 401 에러 분석:`)
          console.log(`      - 인증 실패: ${err.message}`)
          console.log(`      - Access Token이 유효하지 않거나 만료됨`)
        }
      }
      
      return false
    }
  } catch (error) {
    console.log(`   ❌ 예외 발생:`, error.message)
    if (error.stack) {
      console.log(`   Stack:`, error.stack.split('\n').slice(0, 3).join('\n'))
    }
    return false
  }
}

async function testListModels() {
  console.log('\n🔍 방법 5: 사용 가능한 모델 목록 확인')
  console.log('='.repeat(60))
  
  try {
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
    const projectId = process.env.GOOGLE_VERTEX_AI_PROJECT_ID || credentials.project_id
    const location = process.env.GOOGLE_VERTEX_AI_LOCATION || 'us-central1'
    
    const accessToken = await getAccessToken()
    
    // Vertex AI API를 통해 모델 목록 조회 시도
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/models`
    
    const result = await new Promise((resolve, reject) => {
      const urlObj = new URL(url)
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
      
      const req = https.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body: data
          })
        })
      })
      
      req.on('error', reject)
      req.end()
    })
    
    console.log(`   응답 상태: ${result.statusCode}`)
    
    if (result.statusCode === 200) {
      const parsed = JSON.parse(result.body)
      console.log(`   ✅ 성공!`)
      if (parsed.models && parsed.models.length > 0) {
        console.log(`   사용 가능한 모델:`, parsed.models.map((m) => m.displayName || m.name).join(', '))
      } else {
        console.log(`   모델 목록이 비어있습니다.`)
      }
      return true
    } else {
      const error = JSON.parse(result.body)
      console.log(`   ❌ 실패:`, error.error?.message || error.message)
      return false
    }
  } catch (error) {
    console.log(`   ❌ 예외 발생:`, error.message)
    return false
  }
}

async function runDetailedDiagnosis() {
  console.log('🔍 Vertex AI 상세 진단')
  console.log('='.repeat(60))
  
  const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
  const projectId = process.env.GOOGLE_VERTEX_AI_PROJECT_ID || credentials.project_id
  const location = process.env.GOOGLE_VERTEX_AI_LOCATION || 'us-central1'
  
  console.log(`\n📋 설정 정보:`)
  console.log(`   프로젝트 ID: ${projectId}`)
  console.log(`   리전: ${location}`)
  console.log(`   서비스 계정: ${credentials.client_email}`)
  
  // Access Token 테스트
  console.log(`\n🔑 Access Token 테스트...`)
  try {
    const token = await getAccessToken()
    console.log(`   ✅ Access Token 획득 성공`)
    console.log(`   Token: ${token.substring(0, 30)}...`)
  } catch (error) {
    console.log(`   ❌ Access Token 획득 실패: ${error.message}`)
    console.log(`\n   💡 자격 증명에 문제가 있습니다.`)
    return
  }
  
  // generateContent API 직접 테스트
  const apiResult = await testWithGenerateContent()
  
  // 모델 목록 확인
  await testListModels()
  
  console.log(`\n` + '='.repeat(60))
  console.log(`\n📊 진단 결과:`)
  if (apiResult) {
    console.log(`   ✅ Vertex AI API 접근 가능`)
  } else {
    console.log(`   ❌ Vertex AI API 접근 실패`)
    console.log(`\n💡 다음을 확인하세요:`)
    console.log(`   1. Vertex AI API 활성화:`)
    console.log(`      https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=${projectId}`)
    console.log(`   2. 서비스 계정 권한:`)
    console.log(`      https://console.cloud.google.com/iam-admin/iam?project=${projectId}`)
    console.log(`      → ${credentials.client_email}에 "Vertex AI 사용자" 역할 추가`)
  }
}

runDetailedDiagnosis().catch(console.error)


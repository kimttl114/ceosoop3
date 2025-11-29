/**
 * Vertex AI 모델 접근 테스트 - 올바른 모델 이름과 엔드포인트 확인
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

async function testModel(accessToken, projectId, location, modelName) {
  return new Promise((resolve, reject) => {
    // 여러 엔드포인트 패턴 시도
    const endpoints = [
      // 패턴 1: generateContent (REST API)
      `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:generateContent`,
      // 패턴 2: predict (예측 API)
      `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:predict`,
      // 패턴 3: generateContent (streaming)
      `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:streamGenerateContent`,
    ]
    
    const results = []
    let completed = 0
    
    endpoints.forEach((url, index) => {
      const urlObj = new URL(url)
      const postData = JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: '안녕' }]
        }]
      })
      
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
          completed++
          try {
            const parsed = JSON.parse(data)
            results[index] = {
              endpoint: urlObj.pathname,
              statusCode: res.statusCode,
              success: res.statusCode === 200,
              error: res.statusCode !== 200 ? (parsed.error || parsed) : null,
              response: res.statusCode === 200 ? parsed : null
            }
          } catch (e) {
            results[index] = {
              endpoint: urlObj.pathname,
              statusCode: res.statusCode,
              success: false,
              error: { message: data.substring(0, 200) }
            }
          }
          
          if (completed === endpoints.length) {
            resolve(results)
          }
        })
      })
      
      req.on('error', (e) => {
        completed++
        results[index] = {
          endpoint: urlObj.pathname,
          statusCode: 0,
          success: false,
          error: { message: e.message }
        }
        
        if (completed === endpoints.length) {
          resolve(results)
        }
      })
      
      req.write(postData)
      req.end()
    })
  })
}

async function testDifferentModelNames(accessToken, projectId, location) {
  console.log('\n🔍 다양한 모델 이름 테스트')
  console.log('='.repeat(60))
  
  const modelNames = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash-001',
    'gemini-1.5-pro-001',
  ]
  
  for (const modelName of modelNames) {
    console.log(`\n📌 모델: ${modelName}`)
    console.log('─'.repeat(60))
    
    try {
      const results = await testModel(accessToken, projectId, location, modelName)
      
      results.forEach((result, idx) => {
        const endpointType = idx === 0 ? 'generateContent' : idx === 1 ? 'predict' : 'streamGenerateContent'
        console.log(`   ${endpointType}: ${result.statusCode} ${result.success ? '✅' : '❌'}`)
        if (result.success) {
          const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50)
          console.log(`      응답: ${text}...`)
          return // 성공한 엔드포인트 찾으면 중단
        } else if (result.error) {
          const errorMsg = result.error.message || JSON.stringify(result.error).substring(0, 100)
          console.log(`      에러: ${errorMsg}`)
        }
      })
      
      // 성공한 결과가 있으면 다음 모델로
      if (results.some(r => r.success)) {
        console.log(`\n   ✅ 성공한 엔드포인트 발견!`)
        return modelName
      }
    } catch (error) {
      console.log(`   ❌ 예외: ${error.message}`)
    }
  }
  
  return null
}

async function checkAvailableModels(accessToken, projectId, location) {
  console.log('\n🔍 사용 가능한 Publisher 모델 확인')
  console.log('='.repeat(60))
  
  return new Promise((resolve) => {
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models`
    
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
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data)
            console.log(`   ✅ 성공 (${res.statusCode})`)
            
            if (parsed.models && parsed.models.length > 0) {
              console.log(`   사용 가능한 모델:`)
              parsed.models.forEach((model) => {
                console.log(`      - ${model.name || model.displayName || 'Unknown'}`)
              })
              resolve(parsed.models)
            } else {
              console.log(`   모델 목록이 비어있습니다.`)
              resolve([])
            }
          } else {
            const error = JSON.parse(data)
            console.log(`   ❌ 실패 (${res.statusCode})`)
            console.log(`   에러: ${error.error?.message || JSON.stringify(error).substring(0, 200)}`)
            resolve([])
          }
        } catch (e) {
          console.log(`   ❌ 파싱 실패: ${e.message}`)
          console.log(`   원본 응답: ${data.substring(0, 300)}`)
          resolve([])
        }
      })
    })
    
    req.on('error', (e) => {
      console.log(`   ❌ 요청 실패: ${e.message}`)
      resolve([])
    })
    
    req.end()
  })
}

async function runModelAccessTest() {
  console.log('🔍 Vertex AI 모델 접근 테스트')
  console.log('='.repeat(60))
  
  const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
  const projectId = process.env.GOOGLE_VERTEX_AI_PROJECT_ID || credentials.project_id
  const location = process.env.GOOGLE_VERTEX_AI_LOCATION || 'us-central1'
  
  console.log(`\n📋 설정:`)
  console.log(`   프로젝트: ${projectId}`)
  console.log(`   리전: ${location}`)
  
  console.log(`\n🔑 Access Token 획득...`)
  const accessToken = await getAccessToken()
  console.log(`   ✅ 성공`)
  
  // 사용 가능한 모델 목록 확인
  await checkAvailableModels(accessToken, projectId, location)
  
  // 다양한 모델 이름 시도
  const workingModel = await testDifferentModelNames(accessToken, projectId, location)
  
  console.log(`\n` + '='.repeat(60))
  if (workingModel) {
    console.log(`\n✅ 작동하는 모델 발견: ${workingModel}`)
    console.log(`\n💡 코드에서 이 모델 이름을 사용하세요:`)
    console.log(`   model: '${workingModel}'`)
  } else {
    console.log(`\n❌ 작동하는 모델을 찾지 못했습니다.`)
    console.log(`\n💡 다음을 확인하세요:`)
    console.log(`   1. Vertex AI API 활성화 상태`)
    console.log(`   2. 프로젝트에 Vertex AI Generative AI 접근 권한`)
    console.log(`   3. 청구 계정 연결 확인`)
    console.log(`   4. 리전 ${location}에서 Gemini 모델 사용 가능 여부`)
  }
}

runModelAccessTest().catch(console.error)




/**
 * Vertex AI 직접 테스트 (환경 변수 로드)
 */

// .env.local 파일 읽기
const fs = require('fs')
const path = require('path')

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match && !match[1].startsWith('#')) {
      let key = match[1].trim()
      let value = match[2].trim()
      // 따옴표 제거
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
  })
}

async function testVertexAI() {
  console.log('🔍 Vertex AI 직접 테스트\n')
  console.log('='.repeat(60))
  
  // 환경 변수 확인
  console.log('\n📋 환경 변수 확인:')
  console.log(`GOOGLE_CLOUD_CREDENTIALS: ${process.env.GOOGLE_CLOUD_CREDENTIALS ? '설정됨 (' + process.env.GOOGLE_CLOUD_CREDENTIALS.substring(0, 50) + '...)' : '미설정'}`)
  console.log(`GOOGLE_VERTEX_AI_PROJECT_ID: ${process.env.GOOGLE_VERTEX_AI_PROJECT_ID || '미설정'}`)
  console.log(`GOOGLE_VERTEX_AI_LOCATION: ${process.env.GOOGLE_VERTEX_AI_LOCATION || '미설정'}`)
  
  if (!process.env.GOOGLE_CLOUD_CREDENTIALS) {
    console.log('\n❌ GOOGLE_CLOUD_CREDENTIALS가 설정되지 않았습니다.')
    return
  }
  
  try {
    // 자격 증명 파싱
    let credentials
    try {
      credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
      console.log(`\n✅ 자격 증명 JSON 파싱 성공`)
      console.log(`   프로젝트 ID: ${credentials.project_id}`)
      console.log(`   클라이언트 이메일: ${credentials.client_email}`)
    } catch (e) {
      console.log(`\n❌ 자격 증명 JSON 파싱 실패: ${e.message}`)
      return
    }
    
    const projectId = process.env.GOOGLE_VERTEX_AI_PROJECT_ID || credentials.project_id
    const location = process.env.GOOGLE_VERTEX_AI_LOCATION || 'us-central1'
    
    console.log(`\n📝 Vertex AI 설정:`)
    console.log(`   프로젝트 ID: ${projectId}`)
    console.log(`   리전: ${location}`)
    
    // Vertex AI 클라이언트 생성
    console.log(`\n🔄 Vertex AI 클라이언트 초기화 중...`)
    const { VertexAI } = require('@google-cloud/vertexai')
    
    const vertexAI = new VertexAI({
      project: projectId,
      location: location,
    })
    
    // 여러 모델 시도
    const modelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
    
    for (const modelName of modelNames) {
      try {
        console.log(`\n🔄 모델 시도: ${modelName}`)
        const model = vertexAI.getGenerativeModel({
          model: modelName,
        })
        
        console.log(`   모델 객체 생성 성공, 테스트 요청 전송...`)
        
        const result = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [{ text: '안녕하세요. 간단히 인사만 해주세요.' }],
            },
          ],
        })
        
        const text = result.response?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || '')
          .join(' ')
          .trim() || ''
        
        if (text) {
          console.log(`\n✅ 성공! 모델: ${modelName}`)
          console.log(`   응답: ${text.substring(0, 100)}`)
          return
        } else {
          console.log(`   ⚠️  응답은 받았지만 텍스트가 비어있음`)
        }
      } catch (error) {
        console.log(`   ❌ 실패: ${error.message}`)
        if (error.message.includes('404')) {
          console.log(`      → 이 모델은 사용할 수 없습니다.`)
        } else if (error.message.includes('403') || error.message.includes('permission')) {
          console.log(`      → 권한 문제입니다. 서비스 계정 권한을 확인하세요.`)
        } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
          console.log(`      → 인증 문제입니다. 자격 증명을 확인하세요.`)
        }
        continue
      }
    }
    
    console.log(`\n❌ 모든 모델 시도 실패`)
    console.log(`\n💡 해결 방법:`)
    console.log(`   1. Google Cloud Console에서 Vertex AI API 활성화 확인`)
    console.log(`      https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=${projectId}`)
    console.log(`   2. 서비스 계정 권한 확인`)
    console.log(`      https://console.cloud.google.com/iam-admin/iam?project=${projectId}`)
    console.log(`   3. 청구 계정 연결 확인`)
    
  } catch (error) {
    console.error(`\n❌ 오류 발생:`, error.message)
    console.error(error.stack)
  }
}

testVertexAI().catch(console.error)




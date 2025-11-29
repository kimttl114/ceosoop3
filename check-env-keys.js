/**
 * 환경 변수 키 설정 검증 스크립트
 * 사용법: node check-env-keys.js
 */

// dotenv가 있으면 사용, 없으면 환경 변수 직접 확인
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {
  console.log('⚠️  dotenv 패키지가 없습니다. 환경 변수를 직접 확인합니다.\n')
  // .env.local 파일 직접 읽기
  try {
    const fs = require('fs')
    const path = require('path')
    const envPath = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8')
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          let value = match[2].trim()
          // 따옴표 제거 (있는 경우)
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
          }
          process.env[key] = value
        }
      })
    } else {
      console.log('❌ .env.local 파일을 찾을 수 없습니다.\n')
      process.exit(1)
    }
  } catch (err) {
    console.log('❌ .env.local 파일을 읽을 수 없습니다:', err.message, '\n')
    process.exit(1)
  }
}

console.log('🔍 Google Cloud 환경 변수 설정 확인\n')
console.log('='.repeat(60))

// 필요한 환경 변수 목록
const requiredVars = {
  // 통합 자격 증명 (최우선)
  'GOOGLE_CLOUD_CREDENTIALS': {
    priority: 1,
    description: '통합 자격 증명 (Vertex AI + TTS 공통 사용)',
    required: false, // GOOGLE_VERTEX_AI_CREDENTIALS 또는 GOOGLE_CLOUD_TTS_CREDENTIALS가 있으면 됨
  },
  
  // Vertex AI 관련
  'GOOGLE_VERTEX_AI_CREDENTIALS': {
    priority: 2,
    description: 'Vertex AI 자격 증명',
    required: false,
  },
  
  // TTS 관련
  'GOOGLE_CLOUD_TTS_CREDENTIALS': {
    priority: 3,
    description: 'Text-to-Speech 자격 증명',
    required: false,
  },
  
  // 프로젝트 ID
  'GOOGLE_VERTEX_AI_PROJECT_ID': {
    priority: 1,
    description: 'Vertex AI 프로젝트 ID',
    required: false, // credentials JSON에 project_id가 있으면 됨
  },
  
  'GOOGLE_CLOUD_PROJECT_ID': {
    priority: 2,
    description: 'Google Cloud 프로젝트 ID (대체)',
    required: false,
  },
  
  // Location
  'GOOGLE_VERTEX_AI_LOCATION': {
    priority: 1,
    description: 'Vertex AI 리전 (기본값: asia-northeast3)',
    required: false,
  },
}

// 검증 결과
let hasCredentials = false
let hasProjectId = false
let issues = []

console.log('\n📋 환경 변수 상태:\n')

Object.entries(requiredVars).forEach(([key, config]) => {
  const value = process.env[key]
  const isSet = !!value
  
  if (isSet) {
    // 자격 증명인 경우 JSON 유효성 검사
    if (key.includes('CREDENTIALS')) {
      try {
        const parsed = JSON.parse(value)
        if (parsed.type === 'service_account' && parsed.project_id) {
          console.log(`✅ ${key}: 설정됨 (유효한 JSON, project_id: ${parsed.project_id})`)
          hasCredentials = true
          
          // project_id가 credentials에 있으면 프로젝트 ID도 설정된 것으로 간주
          if (!hasProjectId && parsed.project_id) {
            hasProjectId = true
          }
        } else {
          console.log(`⚠️  ${key}: 설정됨 (JSON 형식은 맞지만 project_id가 없거나 유효하지 않음)`)
          issues.push(`${key}: JSON에 project_id가 없거나 유효하지 않습니다.`)
        }
      } catch (e) {
        console.log(`❌ ${key}: 설정됨 (유효하지 않은 JSON)`)
        issues.push(`${key}: 유효하지 않은 JSON 형식입니다. JSON.parse 오류: ${e.message}`)
      }
    } else if (key === 'GOOGLE_VERTEX_AI_PROJECT_ID' || key === 'GOOGLE_CLOUD_PROJECT_ID') {
      console.log(`✅ ${key}: 설정됨 (값: ${value})`)
      hasProjectId = true
    } else {
      console.log(`✅ ${key}: 설정됨 (값: ${value})`)
    }
  } else {
    if (key === 'GOOGLE_VERTEX_AI_LOCATION') {
      console.log(`⚪ ${key}: 미설정 (기본값: asia-northeast3 사용)`)
    } else {
      console.log(`❌ ${key}: 미설정`)
      if (config.required) {
        issues.push(`${key}: 필수 환경 변수가 설정되지 않았습니다.`)
      }
    }
  }
})

console.log('\n' + '='.repeat(60))
console.log('\n📊 종합 결과:\n')

// 최종 검증
if (!hasCredentials) {
  issues.push('❌ 자격 증명이 설정되지 않았습니다. GOOGLE_CLOUD_CREDENTIALS, GOOGLE_VERTEX_AI_CREDENTIALS, 또는 GOOGLE_CLOUD_TTS_CREDENTIALS 중 하나는 필수입니다.')
}

if (!hasProjectId) {
  issues.push('⚠️  프로젝트 ID가 명시적으로 설정되지 않았습니다. 자격 증명 JSON에 project_id가 포함되어 있는지 확인하거나, GOOGLE_VERTEX_AI_PROJECT_ID를 설정하세요.')
}

if (issues.length === 0) {
  console.log('✅ 모든 필수 환경 변수가 올바르게 설정되었습니다!')
  console.log('\n💡 권장 설정:')
  console.log('   - GOOGLE_CLOUD_CREDENTIALS 하나만 설정하면 Vertex AI와 TTS 모두 사용 가능합니다.')
  console.log('   - GOOGLE_VERTEX_AI_PROJECT_ID를 명시적으로 설정하는 것을 권장합니다.')
} else {
  console.log('❌ 다음 문제를 해결해주세요:\n')
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`)
  })
  
  console.log('\n📝 설정 가이드:')
  console.log('   1. GOOGLE_CLOUD_CREDENTIALS 설정 (권장):')
  console.log('      GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"your-project",...}')
  console.log('   ')
  console.log('   2. 또는 개별 설정:')
  console.log('      GOOGLE_VERTEX_AI_CREDENTIALS={"type":"service_account",...}')
  console.log('      GOOGLE_CLOUD_TTS_CREDENTIALS={"type":"service_account",...}')
  console.log('   ')
  console.log('   3. 프로젝트 ID 설정:')
  console.log('      GOOGLE_VERTEX_AI_PROJECT_ID=your-project-id')
  console.log('   ')
  console.log('   4. 리전 설정 (선택, 기본값: asia-northeast3):')
  console.log('      GOOGLE_VERTEX_AI_LOCATION=asia-northeast3')
}

console.log('\n' + '='.repeat(60))
console.log('\n📚 자세한 설정 방법:')
console.log('   - VERTEX_AI_INTEGRATION_GUIDE.md 참고')
console.log('   - GOOGLE_CLOUD_TTS_SETUP.md 참고\n')

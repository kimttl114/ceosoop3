/**
 * .env.local 파일의 GOOGLE_CLOUD_CREDENTIALS 상세 분석
 */

const fs = require('fs')
const path = require('path')

const envPath = path.join(process.cwd(), '.env.local')

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local 파일을 찾을 수 없습니다.')
  process.exit(1)
}

console.log('🔍 .env.local 파일 분석\n')
console.log('='.repeat(60))

const content = fs.readFileSync(envPath, 'utf8')
const lines = content.split('\n')

console.log('\n📋 8-18줄 내용:\n')

lines.slice(7, 18).forEach((line, index) => {
  const lineNum = index + 8
  if (line.trim().startsWith('GOOGLE_CLOUD_CREDENTIALS')) {
    console.log(`${lineNum}: ${line.substring(0, 100)}...`)
    
    // JSON 부분 추출 시도
    const match = line.match(/GOOGLE_CLOUD_CREDENTIALS=(.+)/)
    if (match) {
      const jsonPart = match[1]
      console.log(`\n   JSON 시작 부분: ${jsonPart.substring(0, 80)}...`)
      console.log(`   첫 문자: "${jsonPart[0]}"`)
      console.log(`   길이: ${jsonPart.length} 문자`)
      
      // 따옴표 확인
      if (jsonPart[0] === '"' || jsonPart[0] === "'") {
        console.log(`   ⚠️  외부 따옴표 발견: "${jsonPart[0]}"`)
      }
      if (jsonPart[0] === '{') {
        console.log(`   ✅ 올바른 시작: {`)
      }
    }
  } else if (line.trim()) {
    console.log(`${lineNum}: ${line}`)
  } else {
    console.log(`${lineNum}: (빈 줄)`)
  }
})

console.log('\n' + '='.repeat(60))

// GOOGLE_CLOUD_CREDENTIALS 라인 찾기
let credentialsLine = null
let credentialsStartLine = -1
let credentialsEndLine = -1

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('GOOGLE_CLOUD_CREDENTIALS')) {
    credentialsStartLine = i + 1
    
    // 여러 줄에 걸쳐 있는지 확인
    let fullValue = lines[i]
    let j = i + 1
    
    // 다음 줄들도 JSON의 일부인지 확인
    while (j < lines.length) {
      const nextLine = lines[j].trim()
      // JSON이 끝났는지 확인 (}로 끝나고 뒤에 다른 변수가 없음)
      if (nextLine && !nextLine.startsWith('#') && !nextLine.includes('=')) {
        // 아직 JSON이 계속되는 중
        fullValue += nextLine
        j++
      } else if (nextLine && nextLine.match(/^[A-Z_]+=/)) {
        // 다음 환경 변수 시작
        break
      } else {
        break
      }
    }
    
    credentialsEndLine = j
    credentialsLine = fullValue
    break
  }
}

if (credentialsLine) {
  console.log('\n📝 GOOGLE_CLOUD_CREDENTIALS 전체 내용 분석:\n')
  console.log(`시작 줄: ${credentialsStartLine}`)
  console.log(`끝 줄: ${credentialsEndLine}`)
  console.log(`\n전체 내용 (처음 200자):`)
  console.log(credentialsLine.substring(0, 200) + '...')
  
  // JSON 부분 추출
  const match = credentialsLine.match(/GOOGLE_CLOUD_CREDENTIALS=(.+)/s)
  if (match) {
    let jsonString = match[1].trim()
    
    // 외부 따옴표 제거
    if ((jsonString.startsWith('"') && jsonString.endsWith('"')) ||
        (jsonString.startsWith("'") && jsonString.endsWith("'"))) {
      console.log(`\n⚠️  외부 따옴표 감지됨 - 제거 중...`)
      jsonString = jsonString.slice(1, -1)
    }
    
    console.log(`\n처리된 JSON (처음 200자):`)
    console.log(jsonString.substring(0, 200) + '...')
    
    // JSON 파싱 시도
    try {
      const parsed = JSON.parse(jsonString)
      console.log(`\n✅ JSON 파싱 성공!`)
      console.log(`   type: ${parsed.type}`)
      console.log(`   project_id: ${parsed.project_id || '(없음)'}`)
      console.log(`   client_email: ${parsed.client_email ? parsed.client_email.substring(0, 40) + '...' : '(없음)'}`)
    } catch (e) {
      console.log(`\n❌ JSON 파싱 실패:`)
      console.log(`   오류: ${e.message}`)
      console.log(`   위치: ${e.message.match(/position (\d+)/)?.[1] || '알 수 없음'}`)
      
      // 문제가 있는 부분 찾기
      const errorPos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0')
      if (errorPos > 0 && errorPos < jsonString.length) {
        const start = Math.max(0, errorPos - 50)
        const end = Math.min(jsonString.length, errorPos + 50)
        console.log(`\n문제 부분 주변 (위치 ${errorPos}):`)
        console.log(`   ${jsonString.substring(start, end)}`)
        console.log(`   ${' '.repeat(errorPos - start)}^`)
      }
    }
  }
} else {
  console.log('\n❌ GOOGLE_CLOUD_CREDENTIALS를 찾을 수 없습니다.')
}

console.log('\n' + '='.repeat(60))
console.log('\n💡 수정 방법:')
console.log('   1. Google Cloud Console에서 서비스 계정 JSON 키 파일 다운로드')
console.log('   2. JSON 파일 내용을 한 줄로 복사')
console.log('   3. .env.local에서 GOOGLE_CLOUD_CREDENTIALS= 뒤에 붙여넣기')
console.log('   4. 외부 따옴표 없이, 한 줄로 작성')
console.log('\n   올바른 형식:')
console.log('   GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"...",...}')
console.log('\n')



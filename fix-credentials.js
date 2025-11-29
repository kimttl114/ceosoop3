/**
 * .env.local 파일의 GOOGLE_CLOUD_CREDENTIALS를 올바른 형식으로 변환
 */

const fs = require('fs')
const path = require('path')

const envPath = path.join(process.cwd(), '.env.local')

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local 파일을 찾을 수 없습니다.')
  process.exit(1)
}

console.log('🔧 GOOGLE_CLOUD_CREDENTIALS 형식 변환\n')
console.log('='.repeat(60))

const content = fs.readFileSync(envPath, 'utf8')
const lines = content.split('\n')

// GOOGLE_CLOUD_CREDENTIALS 시작과 끝 찾기
let startLine = -1
let endLine = -1
let jsonLines = []

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('GOOGLE_CLOUD_CREDENTIALS')) {
    startLine = i
    // JSON 추출
    let jsonPart = lines[i].replace(/GOOGLE_CLOUD_CREDENTIALS=/, '').trim()
    
    // 작은따옴표 제거
    if (jsonPart.startsWith("'") && jsonPart.endsWith("'")) {
      jsonPart = jsonPart.slice(1, -1)
    }
    
    // JSON 내용 수집
    if (jsonPart.startsWith('{')) {
      jsonLines.push(jsonPart)
    } else if (jsonPart === "'{" || jsonPart === "'") {
      // 다음 줄부터 시작
      for (let j = i + 1; j < lines.length; j++) {
        const line = lines[j].trim()
        // 닫는 따옴표와 중괄호 찾기
        if (line === "}'" || line === "'}") {
          endLine = j
          break
        } else if (line.endsWith("}'") || line.endsWith("'}")) {
          jsonLines.push(line.replace(/['}]+$/, ''))
          endLine = j
          break
        } else {
          jsonLines.push(line.replace(/,$/, '')) // 끝의 쉼표 제거
        }
      }
    }
    break
  }
}

if (startLine === -1) {
  console.log('❌ GOOGLE_CLOUD_CREDENTIALS를 찾을 수 없습니다.')
  process.exit(1)
}

// JSON 합치기 및 파싱
const jsonString = jsonLines.join('').replace(/^\s*['"]/, '').replace(/['"]\s*$/, '').trim()

console.log('\n📝 추출된 JSON (처음 100자):')
console.log(jsonString.substring(0, 100) + '...\n')

// JSON 유효성 검사
let parsed
try {
  parsed = JSON.parse(jsonString)
  console.log('✅ JSON 유효성 검증 성공!\n')
} catch (e) {
  console.log('❌ JSON 파싱 실패:', e.message)
  console.log('\n수동으로 수정해주세요.\n')
  process.exit(1)
}

// 한 줄로 압축
const compressedJson = JSON.stringify(parsed)

console.log('='.repeat(60))
console.log('\n✅ 올바른 형식:\n')
console.log(`GOOGLE_CLOUD_CREDENTIALS=${compressedJson}`)
console.log('\n' + '='.repeat(60))

// 백업 파일 생성
const backupPath = envPath + '.backup.' + Date.now()
fs.writeFileSync(backupPath, content, 'utf8')
console.log(`\n📦 백업 파일 생성: ${path.basename(backupPath)}`)

// 수정할 내용 생성
const newLines = [...lines]

// 기존 라인들 제거
if (endLine !== -1) {
  newLines.splice(startLine, endLine - startLine + 1, `GOOGLE_CLOUD_CREDENTIALS=${compressedJson}`)
} else {
  // 한 줄에 모두 있는 경우
  newLines[startLine] = `GOOGLE_CLOUD_CREDENTIALS=${compressedJson}`
}

// 파일 저장
const newContent = newLines.join('\n')
fs.writeFileSync(envPath, newContent, 'utf8')

console.log(`\n✅ .env.local 파일 수정 완료!`)
console.log(`   - ${endLine - startLine + 1}줄 → 1줄로 압축`)
console.log(`\n🔍 검증: node check-env-keys.js`)

console.log('\n')



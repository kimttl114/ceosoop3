/**
 * .env.local 파일의 GOOGLE_CLOUD_CREDENTIALS를 올바른 형식으로 변환 (개선 버전)
 */

const fs = require('fs')
const path = require('path')

const envPath = path.join(process.cwd(), '.env.local')

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local 파일을 찾을 수 없습니다.')
  process.exit(1)
}

console.log('🔧 GOOGLE_CLOUD_CREDENTIALS 형식 변환 (v2)\n')
console.log('='.repeat(60))

const content = fs.readFileSync(envPath, 'utf8')
const lines = content.split('\n')

// GOOGLE_CLOUD_CREDENTIALS 시작과 끝 찾기
let startLineIdx = -1
let endLineIdx = -1

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('GOOGLE_CLOUD_CREDENTIALS')) {
    startLineIdx = i
    
    // 끝 줄 찾기 (}' 또는 '}로 끝나는 줄)
    for (let j = i + 1; j < lines.length; j++) {
      const trimmed = lines[j].trim()
      if (trimmed === "}'" || trimmed === "'}" || trimmed.match(/^}'?\s*$/)) {
        endLineIdx = j
        break
      }
    }
    break
  }
}

if (startLineIdx === -1) {
  console.log('❌ GOOGLE_CLOUD_CREDENTIALS를 찾을 수 없습니다.')
  process.exit(1)
}

if (endLineIdx === -1) {
  console.log('❌ GOOGLE_CLOUD_CREDENTIALS의 끝을 찾을 수 없습니다.')
  process.exit(1)
}

console.log(`\n📋 발견된 범위: ${startLineIdx + 1}번째 줄 ~ ${endLineIdx + 1}번째 줄\n`)

// JSON 부분 추출
const firstLine = lines[startLineIdx]
let jsonStart = firstLine.indexOf("'{")


if (jsonStart === -1) {
  jsonStart = firstLine.indexOf('="')
  if (jsonStart !== -1) {
    jsonStart += 2
  }
}

if (jsonStart === -1) {
  jsonStart = firstLine.indexOf('=') + 1
}

// 첫 줄에서 '{ 부분 추출
let jsonParts = []
if (jsonStart >= 0) {
  let firstPart = firstLine.substring(jsonStart).trim()
  // 작은따옴표 제거
  if (firstPart.startsWith("'")) {
    firstPart = firstPart.substring(1)
  }
  if (firstPart.startsWith('"')) {
    firstPart = firstPart.substring(1)
  }
  if (firstPart.startsWith('{')) {
    jsonParts.push(firstPart)
  } else if (firstPart.startsWith("'{")) {
    jsonParts.push(firstPart.substring(1))
  }
}

// 중간 줄들 추가
for (let i = startLineIdx + 1; i < endLineIdx; i++) {
  let line = lines[i].trim()
  // 끝의 쉼표 제거하지 않음 (JSON 구조 유지)
  jsonParts.push(line)
}

// 마지막 줄 처리
const lastLine = lines[endLineIdx].trim()
// '}' 제거
let lastPart = lastLine.replace(/^['"]*/, '').replace(/['"]*$/, '').replace(/^\s*}/, '}').replace(/}\s*$/, '}')
if (lastPart && lastPart !== "}'" && lastPart !== "'}") {
  jsonParts.push(lastPart)
}

// JSON 합치기
let jsonString = jsonParts.join('').trim()

// 시작과 끝의 따옴표 제거
jsonString = jsonString.replace(/^['"]+/, '').replace(/['"]+$/, '')

console.log('📝 추출된 JSON (처음 150자):')
console.log(jsonString.substring(0, 150) + '...\n')
console.log('📝 추출된 JSON (마지막 100자):')
console.log('...' + jsonString.substring(Math.max(0, jsonString.length - 100)) + '\n')

// JSON 유효성 검사
let parsed
try {
  parsed = JSON.parse(jsonString)
  console.log('✅ JSON 유효성 검증 성공!\n')
  console.log(`   type: ${parsed.type}`)
  console.log(`   project_id: ${parsed.project_id || '(없음)'}`)
  console.log(`   client_email: ${parsed.client_email ? parsed.client_email.substring(0, 50) + '...' : '(없음)'}\n`)
} catch (e) {
  console.log('❌ JSON 파싱 실패:', e.message)
  console.log(`   위치: ${e.message.match(/position (\d+)/)?.[1] || '알 수 없음'}\n`)
  
  // 문제가 있는 부분 표시
  const errorPos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0')
  if (errorPos > 0 && errorPos < jsonString.length) {
    const start = Math.max(0, errorPos - 30)
    const end = Math.min(jsonString.length, errorPos + 30)
    console.log('   문제 부분:')
    console.log(`   ${jsonString.substring(start, end)}`)
    console.log(`   ${' '.repeat(errorPos - start)}^`)
  }
  
  console.log('\n❌ 자동 수정이 불가능합니다. 수동으로 수정해주세요.')
  console.log('   HOW_TO_FIX.md 파일을 참고하세요.\n')
  process.exit(1)
}

// 한 줄로 압축
const compressedJson = JSON.stringify(parsed)

console.log('='.repeat(60))
console.log('\n✅ 올바른 형식으로 변환 완료!\n')
console.log(`GOOGLE_CLOUD_CREDENTIALS=${compressedJson.substring(0, 100)}...`)
console.log(`\n(전체 길이: ${compressedJson.length} 문자)`)
console.log('\n' + '='.repeat(60))

// 백업 파일 생성
const backupPath = envPath + '.backup.' + Date.now()
fs.writeFileSync(backupPath, content, 'utf8')
console.log(`\n📦 백업 파일 생성: ${path.basename(backupPath)}`)

// 수정할 내용 생성
const newLines = [...lines]

// 기존 라인들 제거하고 새로운 한 줄 삽입
const linesToRemove = endLineIdx - startLineIdx + 1
newLines.splice(startLineIdx, linesToRemove, `GOOGLE_CLOUD_CREDENTIALS=${compressedJson}`)

// 파일 저장
const newContent = newLines.join('\n')
fs.writeFileSync(envPath, newContent, 'utf8')

console.log(`\n✅ .env.local 파일 수정 완료!`)
console.log(`   - ${linesToRemove}줄 → 1줄로 압축`)
console.log(`\n🔍 검증: node check-env-keys.js`)
console.log(`\n⚠️  개발 서버를 재시작하세요!\n`)




/**
 * BGM 믹싱 테스트 스크립트
 * 실제 BGM URL로 테스트하여 문제점 파악
 */

async function testBgmMixing() {
  console.log('🔍 BGM 믹싱 테스트')
  console.log('='.repeat(60))
  
  // 테스트용 BGM URL (Firebase Storage 또는 공개 URL)
  const testBgmUrl = process.argv[2] || ''
  
  if (!testBgmUrl) {
    console.log('❌ 사용법: node test-bgm-mixing.js <BGM_URL>')
    console.log('예시: node test-bgm-mixing.js https://firebasestorage.googleapis.com/...')
    return
  }
  
  console.log(`\n📥 BGM URL: ${testBgmUrl}`)
  
  try {
    // 1. BGM 다운로드 테스트
    console.log('\n1️⃣ BGM 다운로드 테스트...')
    const bgmRes = await fetch(testBgmUrl)
    console.log(`   상태 코드: ${bgmRes.status} ${bgmRes.statusText}`)
    console.log(`   Content-Type: ${bgmRes.headers.get('content-type')}`)
    console.log(`   Content-Length: ${bgmRes.headers.get('content-length')} bytes`)
    
    if (!bgmRes.ok) {
      console.log(`   ❌ 다운로드 실패: ${bgmRes.status}`)
      const text = await bgmRes.text()
      console.log(`   응답 내용: ${text.substring(0, 200)}`)
      return
    }
    
    const bgmArrayBuffer = await bgmRes.arrayBuffer()
    const bgmBuffer = Buffer.from(bgmArrayBuffer)
    console.log(`   ✅ 다운로드 성공: ${bgmBuffer.length} bytes`)
    
    // 2. 오디오 형식 확인
    console.log('\n2️⃣ 오디오 형식 확인...')
    const fs = require('fs')
    const path = require('path')
    const { tmpdir } = require('os')
    
    const bgmPath = path.join(tmpdir(), `test_bgm_${Date.now()}.mp3`)
    await fs.promises.writeFile(bgmPath, bgmBuffer)
    console.log(`   임시 파일 저장: ${bgmPath}`)
    
    // 3. FFmpeg로 메타데이터 확인
    const ffmpeg = require('fluent-ffmpeg')
    const ffmpegStatic = require('ffmpeg-static')
    
    const ffmpegPath = typeof ffmpegStatic === 'string' ? ffmpegStatic : ffmpegStatic || 'ffmpeg'
    if (ffmpegPath && ffmpegPath !== 'ffmpeg') {
      ffmpeg.setFfmpegPath(ffmpegPath)
      console.log(`   FFmpeg 경로: ${ffmpegPath}`)
    }
    
    await new Promise((resolve, reject) => {
      ffmpeg(bgmPath).ffprobe((err, metadata) => {
        if (err) {
          console.log(`   ❌ 메타데이터 확인 실패: ${err.message}`)
          reject(err)
          return
        }
        
        console.log(`   ✅ 오디오 정보:`)
        console.log(`      형식: ${metadata.format.format_name}`)
        console.log(`      길이: ${metadata.format.duration}초`)
        console.log(`      비트레이트: ${metadata.format.bit_rate} bps`)
        console.log(`      샘플레이트: ${metadata.streams[0]?.sample_rate} Hz`)
        console.log(`      채널: ${metadata.streams[0]?.channels}개`)
        resolve(metadata)
      })
    })
    
    // 4. 임시 파일 삭제
    await fs.promises.unlink(bgmPath)
    console.log(`   ✅ 임시 파일 삭제 완료`)
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ BGM 파일이 정상적으로 다운로드되고 분석되었습니다!')
    console.log('\n💡 다음 단계:')
    console.log('   1. 이 URL이 API에서 사용되는지 확인')
    console.log('   2. FFmpeg 믹싱 로직 테스트')
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message)
    console.error('스택:', error.stack)
  }
}

testBgmMixing()


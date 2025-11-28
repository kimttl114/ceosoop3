import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import { access } from 'fs/promises'
import * as path from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

// TTS 생성 (gTTS 사용)
async function generateTTS(
  text: string, 
  outputPath: string,
  voiceOptions?: {
    lang?: string
    slow?: boolean
    tld?: string
    gender?: 'male' | 'female' | 'neutral'
  }
): Promise<void> {
  try {
    let lang = voiceOptions?.lang || 'ko'
    const slow = voiceOptions?.slow || false
    let tld = voiceOptions?.tld || 'com'
    const gender = voiceOptions?.gender || 'neutral'
    
    // 성별과 언어에 따라 TLD 자동 설정
    // 한국어의 경우: 성별 설정이 있으면 TLD를 강제로 설정
    // 다른 언어는 사용자 선택 TLD 우선
    if (lang === 'ko') {
      // 한국어는 성별에 따라 TLD 강제 설정 (더 확실한 음색 차이)
      if (gender === 'female') {
        tld = 'co.kr' // 한국 도메인 (더 부드러운 여성 톤)
      } else if (gender === 'male') {
        tld = 'com' // 기본 도메인 (더 낮은 톤)
      } else {
        // neutral이거나 성별이 없으면 사용자 선택 또는 기본값
        tld = voiceOptions?.tld || 'com'
      }
    } else if (lang === 'en') {
      // 영어는 사용자 선택 또는 성별 기반 설정
      if (!voiceOptions?.tld || voiceOptions?.tld === 'com') {
        if (gender === 'female') {
          tld = 'co.uk' // 영국 (더 부드러운 톤)
        } else {
          tld = 'com' // 기본
        }
      } else {
        tld = voiceOptions.tld
      }
    } else {
      // 기타 언어는 사용자 선택 또는 기본값
      tld = voiceOptions?.tld || (lang === 'ja' ? 'co.jp' : 'com')
    }
    
    // 한국어 여성 음색을 위한 추가 확인
    if (lang === 'ko' && gender === 'female' && tld !== 'co.kr') {
      console.warn('⚠️ 한국어 여성 음색: TLD를 co.kr로 강제 설정')
      tld = 'co.kr'
    }
    
    // 로그에 사용된 설정 기록
    console.log('TTS 음성 설정:', {
      lang,
      slow,
      tld,
      gender,
      requestedTld: voiceOptions?.tld,
      finalTld: tld
    })
    
    // Python 스크립트로 gTTS 실행
    const pythonScript = `
from gtts import gTTS
import sys
import os

text = sys.argv[1]
output_path = sys.argv[2]
lang = sys.argv[3]
slow = sys.argv[4].lower() == 'true'
tld = sys.argv[5] if len(sys.argv) > 5 else 'com'

try:
    tts = gTTS(text=text, lang=lang, slow=slow, tld=tld)
    tts.save(output_path)
    
    # 파일이 생성되었는지 확인
    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        print("TTS generated successfully")
    else:
        print("ERROR: TTS file not created or empty", file=sys.stderr)
        sys.exit(1)
except Exception as e:
    print(f"ERROR: {str(e)}", file=sys.stderr)
    sys.exit(1)
`

    const scriptPath = path.join(tmpdir(), `tts_${Date.now()}.py`)
    await fs.writeFile(scriptPath, pythonScript)

    // Python 실행 (Windows에서는 'py' 사용 가능)
    const pythonCmd = process.platform === 'win32' ? 'py' : 'python'
    const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, '\\n')
    const command = `${pythonCmd} "${scriptPath}" "${escapedText}" "${outputPath}" "${lang}" "${slow}" "${tld}"`
    
    console.log('TTS 생성 시작:', { 
      text: text.substring(0, 50), 
      outputPath,
      lang,
      slow,
      tld,
      gender: voiceOptions?.gender || 'neutral',
      requestedTld: voiceOptions?.tld || 'auto'
    })
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 10, // 10MB
    })

    console.log('TTS 생성 완료:', { stdout, stderr })

    // 임시 스크립트 파일 삭제
    await fs.unlink(scriptPath).catch(() => {})

    // 파일 존재 확인
    try {
      const stats = await fs.stat(outputPath)
      if (stats.size === 0) {
        throw new Error('생성된 TTS 파일이 비어있습니다.')
      }
    } catch (statError) {
      throw new Error(`TTS 파일 생성 실패: 파일을 찾을 수 없습니다.`)
    }

    // stderr에 에러 메시지가 있는지 확인
    const stderrStr: string = typeof stderr === 'string' ? stderr : (stderr ? String(stderr) : '')
    if (stderrStr && stderrStr.includes('ERROR:')) {
      throw new Error(`TTS 생성 실패: ${stderrStr}`)
    }
  } catch (error: any) {
    console.error('TTS 생성 오류 상세:', error)
    throw new Error(`TTS 생성 오류: ${error.message || error}`)
  }
}

// 오디오 믹싱 (FFmpeg 직접 사용)
async function mixAudio(
  voicePath: string,
  bgmPath: string,
  outputPath: string,
  ffmpegCmd: string
): Promise<void> {
  try {
    // Voice 길이 확인 (FFprobe 사용 - 더 안정적)
    let voiceDuration = 0
    
    // ffprobe가 있으면 사용, 없으면 FFmpeg로 시도
    const ffprobePath = ffmpegCmd.replace('ffmpeg.exe', 'ffprobe.exe')
    
    try {
      // ffprobe로 길이 확인 (더 정확함)
      const probeCmd = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voicePath}"`
      const { stdout: durationOutput } = await execAsync(probeCmd, {
        shell: true as any,
        maxBuffer: 1024 * 1024
      } as any)
      
      const durationOutputStr: string = typeof durationOutput === 'string' ? durationOutput : String(durationOutput)
      const duration = parseFloat(durationOutputStr.trim())
      if (!isNaN(duration) && duration > 0) {
        voiceDuration = duration
        console.log('Voice 길이 확인 (ffprobe):', voiceDuration.toFixed(2), '초')
      } else {
        throw new Error('ffprobe에서 유효한 길이를 얻지 못했습니다.')
      }
    } catch (probeError) {
      // ffprobe 실패 시 FFmpeg로 대체
      console.warn('ffprobe 실패, FFmpeg로 대체:', probeError)
      
      try {
        // FFmpeg로 정보 확인 (출력 파일 지정)
        const tempOutput = path.join(path.dirname(outputPath), `temp_${Date.now()}.mp3`)
        const durationCmd = `"${ffmpegCmd}" -i "${voicePath}" -f null "${tempOutput}" 2>&1`
        const { stderr: durationStderr } = await execAsync(durationCmd, {
          shell: true as any,
          maxBuffer: 1024 * 1024
        } as any)
        
        // 임시 파일 삭제
        await fs.unlink(tempOutput).catch(() => {})
        
        // Duration 파싱 (예: "Duration: 00:00:05.23")
        const durationStderrStr: string = typeof durationStderr === 'string' ? durationStderr : String(durationStderr)
        const durationMatch = durationStderrStr.match(/Duration: (\d+):(\d+):(\d+)\.(\d+)/)
        if (durationMatch) {
          const hours = parseInt(durationMatch[1])
          const minutes = parseInt(durationMatch[2])
          const seconds = parseInt(durationMatch[3])
          const centiseconds = parseInt(durationMatch[4])
          voiceDuration = hours * 3600 + minutes * 60 + seconds + centiseconds / 100
          console.log('Voice 길이 확인 (FFmpeg):', voiceDuration.toFixed(2), '초')
        } else {
          throw new Error('Duration을 파싱할 수 없습니다.')
        }
      } catch (ffmpegError) {
        console.warn('FFmpeg로도 길이 확인 실패, 기본값 사용:', ffmpegError)
        voiceDuration = 20 // 기본값 (20초)
      }
    }
    
    if (voiceDuration === 0) {
      console.warn('Voice 길이를 확인할 수 없어 기본값 20초를 사용합니다.')
      voiceDuration = 20
    }
    
    // Voice 길이 + 2초
    const targetDuration = voiceDuration + 2
    
    console.log('오디오 믹싱 파라미터:', {
      voiceDuration: voiceDuration.toFixed(2),
      targetDuration: targetDuration.toFixed(2),
      bgmPath,
      voicePath
    })
    
    // FFmpeg 명령어 구성 (단순하고 확실한 방식)
    // 1. BGM을 반복하고 길이 맞추기
    // 2. BGM 볼륨 -15dB로 조절 (약 0.178배)
    // 3. BGM에 페이드 아웃 적용 (마지막 2초)
    // 4. Voice와 BGM 믹싱
    
    // Windows 경로 처리를 위해 백슬래시를 슬래시로 변경
    const normalizePath = (p: string) => p.replace(/\\/g, '/')
    const bgmPathNorm = normalizePath(bgmPath)
    const voicePathNorm = normalizePath(voicePath)
    const outputPathNorm = normalizePath(outputPath)
    const ffmpegCmdNorm = normalizePath(ffmpegCmd)
    
    // 단순하고 확실한 필터 체인
    // BGM: 반복 -> 길이 맞추기 -> 볼륨 조절 (-15dB = 0.178배) -> 페이드 아웃
    // Voice: 그대로 사용
    // 두 개를 amix로 믹싱 (dropout_transition으로 부드럽게)
    
    // 필터를 더 명확하게 분리
    const filterComplex = `[0:a]aloop=loop=-1:size=2e+09[loop];[loop]atrim=0:${targetDuration.toFixed(3)}[trimmed];[trimmed]volume=0.178[quiet];[quiet]afade=t=out:st=${voiceDuration.toFixed(3)}:d=2[bgm];[1:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[out]`
    
    const ffmpegCommand = [
      `"${ffmpegCmdNorm}"`,
      `-y`,
      `-i "${bgmPathNorm}"`, // BGM 입력 (aloop 필터로 반복)
      `-i "${voicePathNorm}"`, // Voice 입력
      `-filter_complex "${filterComplex}"`,
      `-map "[out]"`,
      `-c:a libmp3lame`,
      `-b:a 192k`,
      `-ar 44100`,
      `"${outputPathNorm}"`
    ].join(' ')
    
    console.log('FFmpeg 믹싱 명령 실행')
    console.log('파라미터:', { 
      voiceDuration: voiceDuration.toFixed(2), 
      targetDuration: targetDuration.toFixed(2),
      bgmPath: bgmPathNorm,
      voicePath: voicePathNorm
    })
    
    console.log('FFmpeg 명령어:', ffmpegCommand.substring(0, 300))
    
    const { stdout, stderr } = await execAsync(ffmpegCommand, {
      timeout: 120000, // 2분
      maxBuffer: 1024 * 1024 * 50, // 50MB
      shell: true as any
    } as any)
    
    // FFmpeg는 stderr에 정보를 출력하므로 확인
    const stderrStr: string = typeof stderr === 'string' ? stderr : (stderr ? String(stderr) : '')
    if (stderrStr) {
      const lowerStderr = stderrStr.toLowerCase()
      // 실제 에러만 체크 (일반 정보 메시지 제외)
      if (lowerStderr.includes('error') && 
          !lowerStderr.includes('stream #') && 
          !lowerStderr.includes('output #') &&
          !lowerStderr.includes('duration:')) {
        console.error('FFmpeg 오류:', stderrStr.substring(0, 2000))
        throw new Error('FFmpeg 오디오 처리 중 오류 발생')
      }
      // 정상적인 정보 출력은 로그만 남기기
      console.log('FFmpeg 실행 완료 (stderr 정보):', stderrStr.split('\n').slice(0, 5).join(' | '))
    }
    
    // 출력 파일 확인
    try {
      const stats = await fs.stat(outputPath)
      if (stats.size === 0) {
        throw new Error('믹싱된 오디오 파일이 비어있습니다.')
      }
      console.log('오디오 믹싱 완료:', { size: stats.size, duration: targetDuration })
    } catch (statError) {
      throw new Error(`믹싱된 오디오 파일을 생성할 수 없습니다: ${statError}`)
    }
    
  } catch (error: any) {
    console.error('FFmpeg 믹싱 오류:', error)
    throw new Error(`오디오 믹싱 오류: ${error.message || error}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, bgmUrl, voiceOptions } = await request.json()

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: '텍스트가 필요합니다.' },
        { status: 400 }
      )
    }

    // Python 확인 (Windows에서는 'py' 사용 가능)
    const pythonCmd = process.platform === 'win32' ? 'py' : 'python'
    try {
      await execAsync(`${pythonCmd} --version`, { timeout: 5000 } as any)
    } catch (error: any) {
      const errorMsg = String(error?.message || error || '').toLowerCase()
      console.error('Python 확인 실패:', errorMsg)
      return NextResponse.json(
        {
          error: 'Python 오류',
          message: '서버에 Python이 설치되지 않았거나 실행할 수 없습니다.\n모바일에서는 서버 설정이 필요합니다.\n서버 관리자에게 문의하세요.',
          details: errorMsg.includes('python') || errorMsg.includes('py') 
            ? 'Python이 설치되지 않았거나 PATH에 등록되지 않았습니다.'
            : 'Python 실행 중 오류가 발생했습니다.'
        },
        { status: 500 }
      )
    }

    // Python 라이브러리 확인 (gTTS는 필수)
    try {
      await execAsync(`${pythonCmd} -c "import gtts"`, { timeout: 5000 } as any)
    } catch (error: any) {
      const errorMsg = String(error?.message || error || '').toLowerCase()
      console.error('gTTS 라이브러리 확인 실패:', errorMsg)
      return NextResponse.json(
        {
          error: 'gTTS 라이브러리 오류',
          message: '서버에 gTTS 라이브러리가 설치되지 않았습니다.\n모바일에서는 서버 설정이 필요합니다.\n서버 관리자에게 문의하세요.',
          details: `다음 명령어로 설치해주세요: ${pythonCmd} -m pip install gtts`,
        },
        { status: 500 }
      )
    }

    // FFmpeg 설치 확인 (BGM 믹싱에 필요)
    let ffmpegAvailable = false
    let ffmpegCmd = 'ffmpeg'
    if (bgmUrl) {
      // 프로젝트 폴더의 ffmpeg-bin에서 먼저 확인
      const projectFfmpegPath = path.join(process.cwd(), 'ffmpeg-bin', 'bin', 'ffmpeg.exe')
      try {
        await access(projectFfmpegPath)
        ffmpegCmd = projectFfmpegPath // 따옴표 없이 경로만 전달 (execAsync에서 처리)
        ffmpegAvailable = true
        console.log('FFmpeg 발견: 프로젝트 폴더', ffmpegCmd)
      } catch {
        // 프로젝트 폴더에 없으면 시스템 PATH에서 확인
        try {
          await execAsync('ffmpeg -version')
          ffmpegCmd = 'ffmpeg'
          ffmpegAvailable = true
          console.log('FFmpeg 발견: 시스템 PATH')
        } catch {
          console.warn('FFmpeg가 설치되지 않았습니다. BGM 없이 TTS만 생성됩니다.')
          ffmpegAvailable = false
          // FFmpeg가 없으면 BGM 없이 진행 (에러 반환하지 않음)
        }
      }
    }

    // 임시 파일 경로
    const voicePath = path.join(tmpdir(), `voice_${Date.now()}.mp3`)
    const outputPath = path.join(tmpdir(), `announcement_${Date.now()}.mp3`)
    
    // BGM 믹싱 성공 여부 추적 변수
    let bgmMixingSuccess = false

    try {
      console.log('안내방송 생성 시작:', { text: text.substring(0, 50), bgmUrl: !!bgmUrl, ffmpegAvailable })
      
      // 1. TTS 생성
      console.log('Step 1: TTS 생성 시작', { voiceOptions })
      await generateTTS(text, voicePath, voiceOptions)
      console.log('Step 1: TTS 생성 완료')

      // 2. BGM 다운로드 (있는 경우)
      let bgmPath: string | null = null
      if (bgmUrl && ffmpegAvailable) {
        console.log('Step 2: BGM 다운로드 시작')
        try {
          const bgmResponse = await fetch(bgmUrl)
          if (bgmResponse.ok) {
            const bgmBuffer = await bgmResponse.arrayBuffer()
            bgmPath = path.join(tmpdir(), `bgm_${Date.now()}.mp3`)
            await fs.writeFile(bgmPath, Buffer.from(bgmBuffer))
            console.log('Step 2: BGM 다운로드 완료:', bgmPath)
          } else {
            console.warn('BGM 다운로드 실패: HTTP', bgmResponse.status)
          }
        } catch (error) {
          console.warn('BGM 다운로드 실패:', error)
        }
      } else if (bgmUrl && !ffmpegAvailable) {
        console.warn('BGM이 선택되었지만 FFmpeg가 설치되지 않아 BGM 없이 생성됩니다.')
      }

      // 3. 오디오 믹싱 (BGM이 있고 FFmpeg가 있는 경우)
      let bgmMixingSuccess = false
      if (bgmPath && ffmpegAvailable) {
        console.log('Step 3: 오디오 믹싱 시작 (FFmpeg 사용)')
        console.log('믹싱 정보:', {
          voicePath: voicePath.substring(voicePath.lastIndexOf('\\') + 1),
          bgmPath: bgmPath.substring(bgmPath.lastIndexOf('\\') + 1),
          ffmpegCmd
        })
        try {
          await mixAudio(voicePath, bgmPath, outputPath, ffmpegCmd)
          
          // 믹싱된 파일 크기 확인
          try {
            const mixedStats = await fs.stat(outputPath)
            const voiceStats = await fs.stat(voicePath)
            console.log('믹싱 결과:', {
              voiceSize: voiceStats.size,
              mixedSize: mixedStats.size,
              ratio: (mixedStats.size / voiceStats.size).toFixed(2)
            })
            
            // 믹싱된 파일이 Voice보다 작으면 문제가 있을 수 있음
            if (mixedStats.size < voiceStats.size * 1.1) {
              console.warn('⚠️ 믹싱된 파일이 Voice만 있는 것과 비슷합니다. BGM이 제대로 믹싱되지 않았을 수 있습니다.')
              bgmMixingSuccess = false
            } else {
              bgmMixingSuccess = true
            }
          } catch (statError) {
            console.warn('파일 크기 확인 실패:', statError)
            bgmMixingSuccess = false
          }
          
          // BGM 임시 파일 삭제
          await fs.unlink(bgmPath).catch(() => {})
          if (bgmMixingSuccess) {
            console.log('Step 3: 오디오 믹싱 완료')
          } else {
            console.warn('Step 3: 오디오 믹싱 완료 (의심됨)')
          }
        } catch (mixError: any) {
          // BGM 믹싱 실패 시 Voice만 사용 (에러를 throw하지 않고 계속 진행)
          console.error('❌ BGM 믹싱 실패:', mixError.message)
          console.error('에러 스택:', mixError.stack)
          console.warn('⚠️ 서버에서 BGM 믹싱에 실패했습니다. Voice만 반환합니다. 클라이언트에서 재시도할 수 있습니다.')
          await fs.copyFile(voicePath, outputPath)
          await fs.unlink(bgmPath).catch(() => {})
          bgmMixingSuccess = false
        }
      } else {
        // BGM 없이 Voice만 사용
        if (!bgmPath) {
          console.log('Step 3: BGM 경로가 없어 Voice만 사용')
        } else if (!ffmpegAvailable) {
          console.log('Step 3: FFmpeg가 없어 Voice만 사용 (클라이언트에서 재시도 가능)')
        }
        await fs.copyFile(voicePath, outputPath)
        bgmMixingSuccess = false
      }

      // 4. 결과 파일 읽기
      console.log('Step 4: 결과 파일 읽기')
      const audioBuffer = await fs.readFile(outputPath)
      
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('생성된 오디오 파일이 비어있습니다.')
      }

      console.log('오디오 파일 크기:', audioBuffer.length, 'bytes')

      // 5. 임시 파일 정리
      await fs.unlink(voicePath).catch(() => {})
      await fs.unlink(outputPath).catch(() => {})

      // 6. 응답 반환
      console.log('안내방송 생성 완료')
      
      const headers: Record<string, string> = {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="announcement_${Date.now()}.mp3"`,
      }
      
      // BGM 상태 헤더 설정 (클라이언트에서 재시도 여부 결정)
      if (bgmUrl) {
        if (bgmMixingSuccess) {
          headers['x-bgm-status'] = 'success'
        } else {
          headers['x-bgm-status'] = 'failed' // 클라이언트에서 재시도 가능
        }
      }
      
      return new NextResponse(audioBuffer, { headers })
    } catch (error: any) {
      console.error('안내방송 생성 중 오류:', {
        error: error.message,
        stack: error.stack,
        voicePath,
        outputPath
      })
      
      // 임시 파일 정리
      await fs.unlink(voicePath).catch(() => {})
      await fs.unlink(outputPath).catch(() => {})

      throw error
    }
  } catch (error: any) {
    console.error('안내방송 생성 API 오류:', error)
    
    const errorMessage = error.message || '알 수 없는 오류'
    
    // Python 관련 오류 체크
    if (errorMessage.includes('Python') || errorMessage.includes('python') || errorMessage.includes('py :')) {
      return NextResponse.json(
        {
          error: 'Python 오류',
          message: '서버에 Python이 설치되지 않았거나 실행할 수 없습니다. 서버 관리자에게 문의하세요.',
        },
        { status: 500 }
      )
    }
    
    // gTTS 관련 오류 체크
    if (errorMessage.includes('gtts') || errorMessage.includes('gTTS') || errorMessage.includes('No module named')) {
      return NextResponse.json(
        {
          error: 'gTTS 라이브러리 오류',
          message: '서버에 gTTS 라이브러리가 설치되지 않았습니다. 서버 관리자에게 문의하세요.',
        },
        { status: 500 }
      )
    }
    
    // FFmpeg 관련 오류 체크 - BGM 없이도 작동하도록 경고만 표시
    if (errorMessage.includes('FFmpeg') || errorMessage.includes('ffmpeg')) {
      // BGM 믹싱 실패는 이미 Voice만 반환하도록 처리되므로, 이 에러는 발생하지 않아야 함
      // 만약 발생한다면 서버 설정 문제이므로 관리자에게 문의하도록 안내
      return NextResponse.json(
        {
          error: 'FFmpeg 오류',
          message: '서버 설정 오류가 발생했습니다. 목소리만 재생됩니다. BGM이 필요하면 서버 관리자에게 문의하세요.',
        },
        { status: 500 }
      )
    }

    // 네트워크 관련 오류
    if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ETIMEDOUT')) {
      return NextResponse.json(
        {
          error: '네트워크 오류',
          message: '서버 연결에 실패했습니다. 네트워크 연결을 확인하고 잠시 후 다시 시도해주세요.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: errorMessage,
        message: '서버에서 오디오 처리를 할 수 없습니다. 문제가 계속되면 서버 관리자에게 문의하세요.',
      },
      { status: 500 }
    )
  }
}

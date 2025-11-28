import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import { access } from 'fs/promises'
import * as path from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

// TTS 생성 (gTTS 사용)
async function generateTTS(text: string, outputPath: string): Promise<void> {
  try {
    // Python 스크립트로 gTTS 실행
    const pythonScript = `
from gtts import gTTS
import sys

text = sys.argv[1]
output_path = sys.argv[2]

tts = gTTS(text=text, lang='ko', slow=False)
tts.save(output_path)
print("TTS generated successfully")
`

    const scriptPath = path.join(tmpdir(), `tts_${Date.now()}.py`)
    await fs.writeFile(scriptPath, pythonScript)

    // Python 실행 (Windows에서는 'py' 사용 가능)
    const pythonCmd = process.platform === 'win32' ? 'py' : 'python'
    const command = `${pythonCmd} "${scriptPath}" "${text.replace(/"/g, '\\"')}" "${outputPath}"`
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 10, // 10MB
    })

    // 임시 스크립트 파일 삭제
    await fs.unlink(scriptPath).catch(() => {})

    if (stderr && !stderr.includes('TTS generated successfully')) {
      throw new Error(`TTS 생성 실패: ${stderr}`)
    }
  } catch (error: any) {
    throw new Error(`TTS 생성 오류: ${error.message}`)
  }
}

// 오디오 믹싱 (pydub 사용)
async function mixAudio(
  voicePath: string,
  bgmPath: string | null,
  outputPath: string
): Promise<void> {
  try {
    const pythonScript = `
from pydub import AudioSegment
from pydub.playback import play
import sys

voice_path = sys.argv[1]
bgm_path = sys.argv[2] if sys.argv[2] != "None" else None
output_path = sys.argv[3]

# Voice 로드
voice = AudioSegment.from_mp3(voice_path)
voice_duration = len(voice) / 1000.0  # 초 단위

# BGM 처리
if bgm_path:
    bgm = AudioSegment.from_mp3(bgm_path)
    bgm_duration = len(bgm) / 1000.0
    
    # BGM을 Voice 길이만큼 반복
    loops_needed = int((voice_duration + 2) / bgm_duration) + 1
    bgm_looped = bgm * loops_needed
    
    # Voice 길이 + 2초에서 자르기
    cut_length = (voice_duration + 2) * 1000
    bgm_cut = bgm_looped[:int(cut_length)]
    
    # 페이드 아웃 (마지막 2초)
    bgm_faded = bgm_cut.fade_out(2000)
    
    # 볼륨 조절 (Voice: 원본, BGM: -15dB)
    bgm_quiet = bgm_faded - 15
    
    # 믹싱 (BGM 위에 Voice 얹기)
    final_audio = bgm_quiet.overlay(voice)
else:
    final_audio = voice

# 내보내기
final_audio.export(output_path, format="mp3")
print("Audio mixed successfully")
`

    const scriptPath = path.join(tmpdir(), `mix_${Date.now()}.py`)
    await fs.writeFile(scriptPath, pythonScript)

    // Python 실행 (Windows에서는 'py' 사용 가능)
    const pythonCmd = process.platform === 'win32' ? 'py' : 'python'
    const bgmArg = bgmPath || 'None'
    const command = `${pythonCmd} "${scriptPath}" "${voicePath}" "${bgmArg}" "${outputPath}"`
    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000,
      maxBuffer: 1024 * 1024 * 50, // 50MB
    })

    // 임시 스크립트 파일 삭제
    await fs.unlink(scriptPath).catch(() => {})

    if (stderr && !stderr.includes('Audio mixed successfully')) {
      throw new Error(`오디오 믹싱 실패: ${stderr}`)
    }
  } catch (error: any) {
    throw new Error(`오디오 믹싱 오류: ${error.message}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, bgmUrl } = await request.json()

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: '텍스트가 필요합니다.' },
        { status: 400 }
      )
    }

    // Python 확인 (Windows에서는 'py' 사용 가능)
    const pythonCmd = process.platform === 'win32' ? 'py' : 'python'
    try {
      await execAsync(`${pythonCmd} --version`)
    } catch {
      return NextResponse.json(
        {
          error: 'Python이 설치되지 않았습니다.',
          message: 'Python 설치가 필요합니다.',
        },
        { status: 500 }
      )
    }

    // Python 라이브러리 확인
    try {
      await execAsync(`${pythonCmd} -c "import gtts"`)
      await execAsync(`${pythonCmd} -c "import pydub"`)
    } catch (error: any) {
      return NextResponse.json(
        {
          error: '필수 Python 라이브러리가 설치되지 않았습니다.',
          message: `다음 명령어로 설치해주세요: ${pythonCmd} -m pip install gtts pydub`,
        },
        { status: 500 }
      )
    }

    // FFmpeg 설치 확인 (오디오 믹싱에 필요)
    let ffmpegCmd = 'ffmpeg'
    if (bgmUrl) {
      // 프로젝트 폴더의 ffmpeg-bin에서 먼저 확인
      const projectFfmpegPath = path.join(process.cwd(), 'ffmpeg-bin', 'bin', 'ffmpeg.exe')
      try {
        await access(projectFfmpegPath)
        ffmpegCmd = `"${projectFfmpegPath}"`
      } catch {
        // 프로젝트 폴더에 없으면 시스템 PATH에서 확인
        try {
          await execAsync('ffmpeg -version')
          ffmpegCmd = 'ffmpeg'
        } catch {
          return NextResponse.json(
            {
              error: 'FFmpeg가 설치되지 않았습니다.',
              message: 'BGM 믹싱을 위해서는 FFmpeg 설치가 필요합니다. Windows용 FFmpeg를 다운로드하여 프로젝트 폴더의 ffmpeg-bin 폴더에 압축 해제하세요.',
              downloadUrl: 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip',
            },
            { status: 500 }
          )
        }
      }
    }

    // 임시 파일 경로
    const voicePath = path.join(tmpdir(), `voice_${Date.now()}.mp3`)
    const outputPath = path.join(tmpdir(), `announcement_${Date.now()}.mp3`)

    try {
      // 1. TTS 생성
      await generateTTS(text, voicePath)

      // 2. BGM 다운로드 (있는 경우)
      let bgmPath: string | null = null
      if (bgmUrl) {
        try {
          const bgmResponse = await fetch(bgmUrl)
          if (bgmResponse.ok) {
            const bgmBuffer = await bgmResponse.arrayBuffer()
            bgmPath = path.join(tmpdir(), `bgm_${Date.now()}.mp3`)
            await fs.writeFile(bgmPath, Buffer.from(bgmBuffer))
          }
        } catch (error) {
          console.warn('BGM 다운로드 실패:', error)
        }
      }

      // 3. 오디오 믹싱
      if (bgmPath) {
        await mixAudio(voicePath, bgmPath, outputPath)
        // BGM 임시 파일 삭제
        await fs.unlink(bgmPath).catch(() => {})
      } else {
        // BGM 없이 Voice만 사용
        await fs.copyFile(voicePath, outputPath)
      }

      // 4. 결과 파일 읽기
      const audioBuffer = await fs.readFile(outputPath)

      // 5. 임시 파일 정리
      await fs.unlink(voicePath).catch(() => {})
      await fs.unlink(outputPath).catch(() => {})

      // 6. 응답 반환
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="announcement_${Date.now()}.mp3"`,
        },
      })
    } catch (error: any) {
      // 임시 파일 정리
      await fs.unlink(voicePath).catch(() => {})
      await fs.unlink(outputPath).catch(() => {})

      throw error
    }
  } catch (error: any) {
    console.error('안내방송 생성 API 오류:', error)
    
    // FFmpeg 관련 오류 체크
    if (error.message?.includes('FFmpeg') || error.message?.includes('ffmpeg')) {
      return NextResponse.json(
        {
          error: 'FFmpeg 오류',
          message: 'FFmpeg가 설치되지 않았거나 경로가 설정되지 않았습니다.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: error.message || '안내방송 생성 실패',
        message: '서버에서 오디오 처리를 할 수 없습니다.',
      },
      { status: 500 }
    )
  }
}

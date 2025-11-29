import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'
import * as fs from 'fs/promises'
import * as path from 'path'
import { tmpdir } from 'os'

// ---- Types ----

interface GenerateAudioRequestBody {
  keyword: string
  mood: string
  bgmUrl?: string
}

interface VoiceOptions {
  lang?: string
  slow?: boolean
  gender?: 'male' | 'female' | 'neutral'
}

// ---- Helpers: OpenAI (대본 생성) ----

// OpenAI 클라이언트 초기화
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.')
  }
  return new OpenAI({
    apiKey: apiKey,
  })
}

async function generateScriptWithOpenAI(keyword: string, mood: string): Promise<string> {
  const openai = getOpenAIClient()

  console.log(`[OpenAI] 대본 생성 시작: keyword="${keyword}", mood="${mood}"`)

  const prompt = `매장에서 사용할 안내방송 멘트야.
상황: ${keyword}
톤: ${mood}

요구사항:
- 불필요한 미사여구 없이 방송 멘트만 작성
- 1~2문장으로만 작성
- 앞뒤 설명, 따옴표, 인사말(예: 안녕하세요)은 넣지 말 것
- 실제 안내방송에서 바로 읽을 수 있는 자연스러운 한국어 문장으로 작성`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // 빠르고 경제적인 모델 사용
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    })

    const text = completion.choices[0]?.message?.content?.trim() || ''

    if (!text) {
      throw new Error('OpenAI에서 유효한 대본을 생성하지 못했습니다.')
    }

    console.log(`[OpenAI] 대본 생성 성공: "${text}"`)
    return text
  } catch (error: any) {
    console.error('[OpenAI] 대본 생성 실패:', error.message)
    throw new Error(`대본 생성 중 오류가 발생했습니다: ${error.message}`)
  }
}

// ---- Helpers: Google Cloud (TTS용 자격 증명) ----

// 통합된 자격 증명 관리 (TTS 전용)
async function getGoogleCredentials(): Promise<{
  credentials: unknown
}> {
  // 1순위: GOOGLE_CLOUD_CREDENTIALS (통합 자격 증명)
  // 2순위: GOOGLE_VERTEX_AI_CREDENTIALS
  // 3순위: GOOGLE_CLOUD_TTS_CREDENTIALS
  const credentialsJson =
    process.env.GOOGLE_CLOUD_CREDENTIALS ||
    process.env.GOOGLE_VERTEX_AI_CREDENTIALS ||
    process.env.GOOGLE_CLOUD_TTS_CREDENTIALS

  if (!credentialsJson) {
    throw new Error(
      'Google Cloud 자격 증명이 설정되지 않았습니다.\n\n다음 중 하나를 설정해주세요:\n- GOOGLE_CLOUD_CREDENTIALS (권장)\n- GOOGLE_VERTEX_AI_CREDENTIALS\n- GOOGLE_CLOUD_TTS_CREDENTIALS'
    )
  }

  let credentials: unknown
  try {
    credentials = JSON.parse(credentialsJson)
  } catch {
    throw new Error('자격 증명 JSON이 올바르지 않습니다. JSON 형식을 확인해주세요.')
  }

  return { credentials }
}

// ---- Helpers: Google Cloud TTS ----

async function generateTTSWithGoogleCloud(text: string, options?: VoiceOptions): Promise<Buffer> {
  // 통합된 자격 증명 사용 (Vertex AI와 동일)
  const { credentials } = await getGoogleCredentials()

  // 동적 import (빌드 사이즈 최소화)
  const { TextToSpeechClient } = await import('@google-cloud/text-to-speech')

  const client = new TextToSpeechClient({ 
    credentials: credentials as { type: string; project_id?: string; [key: string]: unknown }
  })

  const lang = options?.lang || 'ko'
  const gender = options?.gender || 'neutral'

  let voiceName = 'ko-KR-Neural2-A'
  let languageCode = 'ko-KR'

  if (lang === 'ko') {
    if (gender === 'male') {
      voiceName = 'ko-KR-Neural2-D'
    } else if (gender === 'female') {
      voiceName = 'ko-KR-Neural2-A'
    }
    languageCode = 'ko-KR'
  } else if (lang === 'en') {
    voiceName = gender === 'male' ? 'en-US-Neural2-D' : 'en-US-Neural2-A'
    languageCode = 'en-US'
  } else {
    languageCode = lang
  }

  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode,
      name: voiceName,
      ssmlGender: gender === 'male' ? 'MALE' : gender === 'female' ? 'FEMALE' : 'NEUTRAL',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: options?.slow ? 0.9 : 1.0,
    },
  })

  if (!response.audioContent) {
    throw new Error('TTS 응답에 오디오 데이터가 없습니다.')
  }

  return Buffer.from(response.audioContent as Uint8Array)
}

// ---- Helpers: FFmpeg 믹싱 ----

// FFmpeg 경로 설정 (ffmpeg-static 패키지에서 자동으로 경로 제공)
// FFprobe와 동일하게 견고하게 처리
function getFfmpegPath(): string | null {
  try {
    console.log('[FFmpeg] 🔍 FFmpeg 경로 찾기 시작...')
    console.log('[FFmpeg] ffmpegStatic 타입:', typeof ffmpegStatic)
    
    let ffmpegPath: string | null = null
    const fsSync = require('fs')
    
    // 방법 1: ffmpeg-static 패키지에서 직접 경로 가져오기
    try {
      if (typeof ffmpegStatic === 'string') {
        ffmpegPath = ffmpegStatic
        console.log('[FFmpeg] 방법 1-1: FFmpeg가 문자열 타입입니다:', ffmpegPath)
      } else if (ffmpegStatic && typeof ffmpegStatic === 'object') {
        // 일반적인 경우: { path: "..." } 형식 또는 직접 경로
        ffmpegPath = (ffmpegStatic as any).path || (ffmpegStatic as any).default
        console.log('[FFmpeg] 방법 1-2: FFmpeg 객체에서 경로 추출:', ffmpegPath)
      }
      
      // 경로가 있고 파일이 존재하는지 확인
      if (ffmpegPath && fsSync.existsSync(ffmpegPath)) {
        console.log('[FFmpeg] ✅ 방법 1 성공: 경로 확인됨 -', ffmpegPath)
        return ffmpegPath
      } else if (ffmpegPath) {
        console.warn('[FFmpeg] ⚠️  방법 1 경로가 존재하지 않음:', ffmpegPath)
      }
    } catch (err1: any) {
      console.warn('[FFmpeg] 방법 1 실패:', err1.message)
    }
    
    // 방법 2: 직접 경로 구성 (node_modules 기준)
    try {
      // Vercel 빌드 시 process.cwd()가 잘못된 경로를 반환할 수 있으므로
      // 여러 가능한 경로를 시도
      const possibleRoots = [
        process.cwd(),
        process.cwd().replace(/\.next\/server.*$/, ''),
        process.cwd().replace(/app\/api\/generate-audio.*$/, ''),
        '/var/task', // Lambda 기본 경로
        '/vercel/path0', // Vercel 경로
      ]
      
      const platform = process.platform
      console.log('[FFmpeg] 플랫폼:', platform)
      console.log('[FFmpeg] process.cwd():', process.cwd())
      
      // 플랫폼별 경로 우선 (Linux 환경에서는 Linux 바이너리만 확인)
      const possiblePaths: string[] = []
      
      for (const root of possibleRoots) {
        if (platform === 'linux') {
          // Linux 환경에서는 Linux 바이너리만 확인
          possiblePaths.push(
            path.join(root, 'node_modules', 'ffmpeg-static', 'ffmpeg'),
            path.join(root, 'node_modules', 'ffmpeg-static', 'bin', 'linux', 'x64', 'ffmpeg'),
          )
        } else if (platform === 'win32') {
          possiblePaths.push(
            path.join(root, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
            path.join(root, 'node_modules', 'ffmpeg-static', 'bin', 'win32', 'x64', 'ffmpeg.exe'),
          )
        } else if (platform === 'darwin') {
          possiblePaths.push(
            path.join(root, 'node_modules', 'ffmpeg-static', 'bin', 'darwin', 'x64', 'ffmpeg'),
          )
        }
      }
      
      // 중복 제거
      const uniquePaths = Array.from(new Set(possiblePaths))
      
      console.log(`[FFmpeg] 방법 2: 확인할 경로 수: ${uniquePaths.length}`)
      for (const possiblePath of uniquePaths) {
        const exists = fsSync.existsSync(possiblePath)
        console.log(`[FFmpeg] 경로 확인: ${exists ? '✅' : '❌'} ${possiblePath}`)
        if (exists) {
          console.log('[FFmpeg] ✅ 방법 2 성공: 직접 경로 구성 -', possiblePath)
          return possiblePath
        }
      }
      
      // 디버깅: node_modules 디렉토리 존재 여부 확인
      console.warn('[FFmpeg] 방법 2: 직접 경로 구성 실패 - 상세 디버깅 시작')
      for (const root of possibleRoots) {
        const nodeModulesPath = path.join(root, 'node_modules')
        const exists = fsSync.existsSync(nodeModulesPath)
        console.log(`[FFmpeg] 디버깅: node_modules ${exists ? '✅ 존재' : '❌ 없음'} - ${nodeModulesPath}`)
        
        if (exists) {
          // ffmpeg-static 디렉토리 확인
          const ffmpegStaticDir = path.join(nodeModulesPath, 'ffmpeg-static')
          const ffmpegStaticExists = fsSync.existsSync(ffmpegStaticDir)
          console.log(`[FFmpeg] 디버깅: ffmpeg-static 디렉토리 ${ffmpegStaticExists ? '✅ 존재' : '❌ 없음'} - ${ffmpegStaticDir}`)
          
          if (ffmpegStaticExists) {
            // 디렉토리 내용 확인
            try {
              const files = fsSync.readdirSync(ffmpegStaticDir)
              console.log(`[FFmpeg] 디버깅: ffmpeg-static 디렉토리 내용 (최대 10개):`, files.slice(0, 10))
              
              // bin 디렉토리 확인
              const binDir = path.join(ffmpegStaticDir, 'bin')
              if (fsSync.existsSync(binDir)) {
                const binFiles = fsSync.readdirSync(binDir)
                console.log(`[FFmpeg] 디버깅: bin 디렉토리 내용:`, binFiles)
                
                // linux 디렉토리 확인
                const linuxDir = path.join(binDir, 'linux')
                if (fsSync.existsSync(linuxDir)) {
                  const linuxFiles = fsSync.readdirSync(linuxDir)
                  console.log(`[FFmpeg] 디버깅: linux 디렉토리 내용:`, linuxFiles)
                  
                  // x64 디렉토리 확인
                  const x64Dir = path.join(linuxDir, 'x64')
                  if (fsSync.existsSync(x64Dir)) {
                    const x64Files = fsSync.readdirSync(x64Dir)
                    console.log(`[FFmpeg] 디버깅: x64 디렉토리 내용:`, x64Files)
                  }
                }
              }
            } catch (err: any) {
              console.warn('[FFmpeg] 디버깅: 디렉토리 읽기 실패:', err.message)
            }
          }
        }
      }
    } catch (err2: any) {
      console.warn('[FFmpeg] 방법 2 실패:', err2.message)
      console.warn('[FFmpeg] 에러 스택:', err2.stack)
    }
    
    console.error('[FFmpeg] ❌ 모든 방법 실패: FFmpeg 경로를 찾을 수 없습니다.')
    return null
  } catch (error: any) {
    console.error('[FFmpeg] ❌ FFmpeg 경로 가져오기 전체 오류:', error.message)
    console.error('[FFmpeg] 에러 스택:', error.stack)
    return null
  }
}

// 초기 경로 설정
console.log('[FFmpeg] ========== FFmpeg 초기 설정 시작 ==========')
console.log('[FFmpeg] 환경 정보:')
console.log('  플랫폼:', process.platform)
console.log('  Vercel:', process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME ? '예' : '아니오')
console.log('  작업 디렉토리:', process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME ? '/tmp' : tmpdir())

const initialFfmpegPath = getFfmpegPath()
if (initialFfmpegPath) {
  ffmpeg.setFfmpegPath(initialFfmpegPath)
  console.log('[FFmpeg] ✅ FFmpeg 경로 설정 완료:', initialFfmpegPath)
  
  // Vercel/Lambda 환경에서 실행 권한 설정 시도
  const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME
  if (isVercel && initialFfmpegPath) {
    try {
      const fsSync = require('fs')
      fsSync.chmodSync(initialFfmpegPath, 0o755) // 실행 권한 부여
      console.log('[FFmpeg] ✅ 실행 권한 설정 완료 (Vercel)')
    } catch (chmodError: any) {
      console.warn('[FFmpeg] ⚠️  실행 권한 설정 실패 (무시 가능):', chmodError.message)
    }
  }
} else {
  console.error('[FFmpeg] ❌ FFmpeg 경로를 설정할 수 없습니다.')
  console.error('[FFmpeg] ffmpeg-static 패키지가 올바르게 설치되었는지 확인하세요.')
  console.error('[FFmpeg] 패키지 재설치: npm install ffmpeg-static')
}
console.log('[FFmpeg] ========== FFmpeg 초기 설정 완료 ==========')

// FFprobe 경로 설정 (ffprobe-static 패키지에서 자동으로 경로 제공)
// 경로를 함수로 만들어서 매번 최신 경로를 가져오도록 함
function getFfprobePath(): string | null {
  try {
    console.log('[FFmpeg] 🔍 FFprobe 경로 찾기 시작...')
    console.log('[FFmpeg] ffprobeStatic 타입:', typeof ffprobeStatic)
    
    let probePath: string | null = null
    const fsSync = require('fs')
    
    // 방법 1: ffprobe-static 패키지에서 직접 경로 가져오기
    try {
      if (typeof ffprobeStatic === 'string') {
        probePath = ffprobeStatic
        console.log('[FFmpeg] 방법 1-1: FFprobe가 문자열 타입입니다:', probePath)
      } else if (ffprobeStatic && typeof ffprobeStatic === 'object') {
        // 일반적인 경우: { path: "..." } 형식
        probePath = (ffprobeStatic as any).path
        console.log('[FFmpeg] 방법 1-2: FFprobe 객체에서 path 추출:', probePath)
        
        // path 속성이 없는 경우 다른 속성 확인
        if (!probePath) {
          const keys = Object.keys(ffprobeStatic)
          console.log('[FFmpeg] FFprobe 객체 키:', keys)
          
          // 모든 속성을 확인하여 경로 찾기
          for (const key of keys) {
            const value = (ffprobeStatic as any)[key]
            // Windows .exe와 Linux 바이너리 모두 확인
            if (typeof value === 'string' && value.includes('ffprobe') && (value.endsWith('.exe') || value.includes('bin'))) {
              probePath = value
              console.log('[FFmpeg] 방법 1-3: 키 "' + key + '"에서 경로 찾음:', probePath)
              break
            }
          }
        }
      }
      
      // 경로가 있고 파일이 존재하는지 확인
      if (probePath && fsSync.existsSync(probePath)) {
        console.log('[FFmpeg] ✅ 방법 1 성공: 경로 확인됨 -', probePath)
        return probePath
      } else if (probePath) {
        console.warn('[FFmpeg] ⚠️  방법 1 경로가 존재하지 않음:', probePath)
      }
    } catch (err1: any) {
      console.warn('[FFmpeg] 방법 1 실패:', err1.message)
    }
    
    // 방법 2: 직접 경로 구성 (node_modules 기준)
    try {
      // Vercel 빌드 시 process.cwd()가 잘못된 경로를 반환할 수 있으므로
      // 여러 가능한 루트 경로를 시도
      const possibleRoots = [
        process.cwd(),
        process.cwd().replace(/\.next\/server.*$/, ''),
        process.cwd().replace(/app\/api\/generate-audio.*$/, ''),
        '/var/task', // Lambda 기본 경로
        '/vercel/path0', // Vercel 경로
      ]
      
      const platform = process.platform
      console.log('[FFprobe] 플랫폼:', platform)
      console.log('[FFprobe] process.cwd():', process.cwd())
      
      // 플랫폼별 경로 우선 (Linux 환경에서는 Linux 바이너리만 확인)
      const possiblePaths: string[] = []
      
      for (const root of possibleRoots) {
        if (platform === 'linux') {
          // Linux 환경에서는 Linux 바이너리만 확인 (Windows 바이너리 제외)
          possiblePaths.push(
            path.join(root, 'node_modules', 'ffprobe-static', 'bin', 'linux', 'x64', 'ffprobe'),
          )
        } else if (platform === 'win32') {
          possiblePaths.push(
            path.join(root, 'node_modules', 'ffprobe-static', 'bin', 'win32', 'x64', 'ffprobe.exe'),
            path.join(root, 'node_modules', 'ffprobe-static', 'bin', 'win32', 'ia32', 'ffprobe.exe'),
          )
        } else if (platform === 'darwin') {
          possiblePaths.push(
            path.join(root, 'node_modules', 'ffprobe-static', 'bin', 'darwin', 'x64', 'ffprobe'),
          )
        }
      }
      
      // 중복 제거
      const uniquePaths = Array.from(new Set(possiblePaths))
      
      console.log(`[FFprobe] 방법 2: 확인할 경로 수: ${uniquePaths.length}`)
      for (const possiblePath of uniquePaths) {
        const exists = fsSync.existsSync(possiblePath)
        console.log(`[FFprobe] 경로 확인: ${exists ? '✅' : '❌'} ${possiblePath}`)
        if (exists) {
          console.log('[FFmpeg] ✅ 방법 2 성공: 직접 경로 구성 -', possiblePath)
          return possiblePath
        }
      }
      
      // 디버깅: node_modules 디렉토리 존재 여부 확인
      console.warn('[FFprobe] 방법 2: 직접 경로 구성 실패 - 상세 디버깅 시작')
      for (const root of possibleRoots) {
        const nodeModulesPath = path.join(root, 'node_modules')
        const exists = fsSync.existsSync(nodeModulesPath)
        console.log(`[FFprobe] 디버깅: node_modules ${exists ? '✅ 존재' : '❌ 없음'} - ${nodeModulesPath}`)
        
        if (exists) {
          // ffprobe-static 디렉토리 확인
          const ffprobeStaticDir = path.join(nodeModulesPath, 'ffprobe-static')
          const ffprobeStaticExists = fsSync.existsSync(ffprobeStaticDir)
          console.log(`[FFprobe] 디버깅: ffprobe-static 디렉토리 ${ffprobeStaticExists ? '✅ 존재' : '❌ 없음'} - ${ffprobeStaticDir}`)
          
          if (ffprobeStaticExists) {
            // 디렉토리 내용 확인
            try {
              const files = fsSync.readdirSync(ffprobeStaticDir)
              console.log(`[FFprobe] 디버깅: ffprobe-static 디렉토리 내용 (최대 10개):`, files.slice(0, 10))
              
              // bin 디렉토리 확인
              const binDir = path.join(ffprobeStaticDir, 'bin')
              if (fsSync.existsSync(binDir)) {
                const binFiles = fsSync.readdirSync(binDir)
                console.log(`[FFprobe] 디버깅: bin 디렉토리 내용:`, binFiles)
                
                // linux 디렉토리 확인
                const linuxDir = path.join(binDir, 'linux')
                if (fsSync.existsSync(linuxDir)) {
                  const linuxFiles = fsSync.readdirSync(linuxDir)
                  console.log(`[FFprobe] 디버깅: linux 디렉토리 내용:`, linuxFiles)
                  
                  // x64 디렉토리 확인
                  const x64Dir = path.join(linuxDir, 'x64')
                  if (fsSync.existsSync(x64Dir)) {
                    const x64Files = fsSync.readdirSync(x64Dir)
                    console.log(`[FFprobe] 디버깅: x64 디렉토리 내용:`, x64Files)
                  }
                }
              }
            } catch (err: any) {
              console.warn('[FFprobe] 디버깅: 디렉토리 읽기 실패:', err.message)
            }
          }
        }
      }
    } catch (err2: any) {
      console.warn('[FFmpeg] 방법 2 실패:', err2.message)
    }
    
    console.error('[FFmpeg] ❌ 모든 방법 실패: FFprobe 경로를 찾을 수 없습니다.')
    return null
  } catch (error: any) {
    console.error('[FFmpeg] ❌ FFprobe 경로 가져오기 전체 오류:', error.message)
    console.error('[FFmpeg] 에러 스택:', error.stack)
    return null
  }
}

// 초기 경로 설정
console.log('[FFmpeg] ========== FFprobe 초기 설정 시작 ==========')
const initialFfprobePath = getFfprobePath()
if (initialFfprobePath) {
  ffmpeg.setFfprobePath(initialFfprobePath)
  console.log('[FFmpeg] ✅ FFprobe 경로 설정 완료:', initialFfprobePath)
  
  // Vercel/Lambda 환경에서 실행 권한 설정 시도
  const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME
  if (isVercel && initialFfprobePath) {
    try {
      const fsSync = require('fs')
      fsSync.chmodSync(initialFfprobePath, 0o755) // 실행 권한 부여
      console.log('[FFmpeg] ✅ FFprobe 실행 권한 설정 완료 (Vercel)')
    } catch (chmodError: any) {
      console.warn('[FFmpeg] ⚠️  FFprobe 실행 권한 설정 실패 (무시 가능):', chmodError.message)
    }
  }
} else {
  console.error('[FFmpeg] ❌ FFprobe 경로를 설정할 수 없습니다.')
  console.error('[FFmpeg] ffprobe-static 패키지가 올바르게 설치되었는지 확인하세요.')
  console.error('[FFmpeg] 패키지 재설치: npm install ffprobe-static')
}
console.log('[FFmpeg] ========== FFprobe 초기 설정 완료 ==========')

/**
 * 텍스트 길이로 오디오 길이 추정 (FFprobe 없이)
 * 한국어 TTS는 대략 1초에 3-4자를 읽습니다
 */
function estimateAudioDurationFromText(textLength: number): number {
  // 한국어 TTS 속도: 대략 1초에 3.5자
  const charactersPerSecond = 3.5
  const estimatedDuration = textLength / charactersPerSecond
  // 최소 1초, 최대 60초
  return Math.max(1, Math.min(60, estimatedDuration))
}

/**
 * MP3 파일 버퍼에서 길이를 추정 (간단한 방법)
 */
function estimateAudioDurationFromBuffer(buffer: Buffer): number {
  // MP3 파일 크기로 대략 추정 (정확하지 않지만 대략적인 값)
  // 평균 비트레이트 128kbps 기준으로 추정
  const averageBitrate = 128000 // bits per second
  const fileSizeBits = buffer.length * 8
  const estimatedDuration = fileSizeBits / averageBitrate
  return Math.max(0.5, estimatedDuration)
}

async function getAudioDuration(filePath: string, fallbackTextLength?: number, fallbackBuffer?: Buffer): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    // 먼저 FFprobe를 시도
    // 매번 최신 경로를 가져와서 설정 (Next.js 빌드 환경에서 경로가 변경될 수 있음)
    const currentFfprobePath = getFfprobePath()
    if (currentFfprobePath) {
      ffmpeg.setFfprobePath(currentFfprobePath)
    }
    
    const command = ffmpeg(filePath)
    command.ffprobe((err, metadata) => {
      if (err) {
        console.error('[getAudioDuration] FFprobe 에러:', err.message)
        console.error('[getAudioDuration] 사용된 경로:', currentFfprobePath || '(기본값)')
        
        // FFprobe 실패 시 fallback 방법 시도
        console.log('[getAudioDuration] ⚠️  FFprobe 실패, 추정 방법 사용')
        
        // 방법 1: 텍스트 길이로 추정
        if (fallbackTextLength) {
          const estimatedDuration = estimateAudioDurationFromText(fallbackTextLength)
          console.log(`[getAudioDuration] ✅ 텍스트 길이로 추정: ${estimatedDuration.toFixed(2)}초 (텍스트 길이: ${fallbackTextLength}자)`)
          resolve(estimatedDuration)
          return
        }
        
        // 방법 2: 버퍼 크기로 추정
        if (fallbackBuffer) {
          const estimatedDuration = estimateAudioDurationFromBuffer(fallbackBuffer)
          console.log(`[getAudioDuration] ✅ 버퍼 크기로 추정: ${estimatedDuration.toFixed(2)}초 (버퍼 크기: ${fallbackBuffer.length} bytes)`)
          resolve(estimatedDuration)
          return
        }
        
        // Fallback 방법도 실패한 경우
        reject(new Error(`오디오 길이를 확인할 수 없습니다: ${err.message}`))
        return
      }
      const duration = metadata.format?.duration
      if (!duration || Number.isNaN(duration)) {
        // FFprobe는 성공했지만 duration이 없는 경우
        console.warn('[getAudioDuration] ⚠️  FFprobe 성공했지만 duration이 없음, 추정 방법 사용')
        
        if (fallbackTextLength) {
          const estimatedDuration = estimateAudioDurationFromText(fallbackTextLength)
          console.log(`[getAudioDuration] ✅ 텍스트 길이로 추정: ${estimatedDuration.toFixed(2)}초`)
          resolve(estimatedDuration)
          return
        }
        
        reject(new Error('오디오 길이를 확인할 수 없습니다.'))
        return
      }
      console.log(`[getAudioDuration] ✅ FFprobe로 확인: ${duration.toFixed(2)}초`)
      resolve(duration)
    })
  })
}

async function mixVoiceWithBgm(voiceBuffer: Buffer, bgmUrl?: string, script?: string): Promise<Buffer> {
  // BGM이 없거나 빈 문자열이면 그대로 반환
  if (!bgmUrl || typeof bgmUrl !== 'string' || bgmUrl.trim() === '') {
    console.log('[BGM 믹싱] BGM URL이 없어 음성만 반환합니다.')
    return voiceBuffer
  }

  // Lambda/Vercel 환경 감지 및 임시 디렉토리 설정
  const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV
  const workDir = isVercel ? '/tmp' : tmpdir()
  
  console.log('[BGM 믹싱] 환경 정보:')
  console.log('  플랫폼:', process.platform)
  console.log('  Vercel:', isVercel)
  console.log('  작업 디렉토리:', workDir)
  
  const timestamp = Date.now()
  const voicePath = path.join(workDir, `voice_${timestamp}.mp3`)
  const bgmPath = path.join(workDir, `bgm_${timestamp}.mp3`)
  const outputPath = path.join(workDir, `mixed_${timestamp}.mp3`)

  console.log(`[BGM 믹싱] 시작: BGM URL=${bgmUrl.substring(0, 100)}...`)

  try {
    // 1. Voice 저장
    console.log('[BGM 믹싱] 1단계: 음성 파일 저장 중...')
    await fs.writeFile(voicePath, voiceBuffer)
    console.log(`[BGM 믹싱] ✅ 음성 파일 저장 완료: ${voiceBuffer.length} bytes`)

    // 2. BGM 다운로드
    console.log(`[BGM 믹싱] 2단계: BGM 다운로드 중... (${bgmUrl})`)
    let bgmRes: Response
    try {
      bgmRes = await fetch(bgmUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AudioGenerator/1.0)',
        },
      })
    } catch (fetchError: any) {
      console.error('[BGM 믹싱] ❌ BGM 다운로드 fetch 실패:', fetchError.message)
      throw new Error(`BGM 파일을 다운로드할 수 없습니다: ${fetchError.message}`)
    }

    if (!bgmRes.ok) {
      const errorText = await bgmRes.text().catch(() => '응답 본문을 읽을 수 없습니다')
      console.error(`[BGM 믹싱] ❌ BGM 다운로드 실패: HTTP ${bgmRes.status}`)
      console.error(`[BGM 믹싱] 응답 내용: ${errorText.substring(0, 200)}`)
      throw new Error(
        `BGM 파일을 불러올 수 없습니다. (HTTP ${bgmRes.status} ${bgmRes.statusText})`
      )
    }

    const bgmArrayBuffer = await bgmRes.arrayBuffer()
    const bgmBuffer = Buffer.from(bgmArrayBuffer)
    await fs.writeFile(bgmPath, bgmBuffer)
    console.log(`[BGM 믹싱] ✅ BGM 다운로드 완료: ${bgmBuffer.length} bytes`)

    // 3. Voice 길이 확인
    console.log('[BGM 믹싱] 3단계: 음성 길이 확인 중...')
    let voiceDuration: number
    try {
      // FFprobe가 실패할 경우를 대비해 텍스트 길이와 버퍼를 fallback으로 전달
      const fallbackTextLength = script ? script.length : undefined
      voiceDuration = await getAudioDuration(voicePath, fallbackTextLength, voiceBuffer)
      console.log(`[BGM 믹싱] ✅ 음성 길이: ${voiceDuration.toFixed(2)}초`)
    } catch (durationError: any) {
      console.error('[BGM 믹싱] ❌ 음성 길이 확인 실패:', durationError.message)
      
      // Fallback: 텍스트 길이로 추정
      if (script) {
        voiceDuration = estimateAudioDurationFromText(script.length)
        console.log(`[BGM 믹싱] ⚠️  텍스트 길이로 추정 사용: ${voiceDuration.toFixed(2)}초 (텍스트: ${script.length}자)`)
      } else {
        // 마지막 fallback: 버퍼 크기로 추정
        voiceDuration = estimateAudioDurationFromBuffer(voiceBuffer)
        console.log(`[BGM 믹싱] ⚠️  버퍼 크기로 추정 사용: ${voiceDuration.toFixed(2)}초 (버퍼: ${voiceBuffer.length} bytes)`)
      }
      
      console.log(`[BGM 믹싱] ✅ 추정된 음성 길이: ${voiceDuration.toFixed(2)}초`)
    }

    const targetDuration = voiceDuration + 2 // 끝에 2초 여유
    console.log(`[BGM 믹싱] 목표 길이: ${targetDuration.toFixed(2)}초 (음성 ${voiceDuration.toFixed(2)}초 + 여유 2초)`)

    // 4. BGM 길이 확인 (선택사항)
    try {
      const bgmDuration = await getAudioDuration(bgmPath)
      console.log(`[BGM 믹싱] BGM 원본 길이: ${bgmDuration.toFixed(2)}초`)
    } catch {
      console.log('[BGM 믹싱] BGM 길이 확인 스킵 (필수 아님)')
    }

    // 5. FFmpeg 필터 구성
    console.log('[BGM 믹싱] 4단계: 오디오 믹싱 시작...')
    
    // 더 단순하고 안정적인 필터 구성
    // aloop가 일부 환경에서 문제를 일으킬 수 있으므로 단계별로 분리
    const filterComplex = [
      // BGM 처리: 반복 후 길이 맞추기 → 볼륨 조절 → 페이드아웃
      `[0:a]aloop=loop=-1:size=2e+09[loop]`,
      `[loop]atrim=0:${targetDuration.toFixed(3)}[trimmed]`,
      `[trimmed]volume=0.2[vol_bgm]`,
      `[vol_bgm]afade=t=out:st=${voiceDuration.toFixed(3)}:d=2[bgm]`,
      // Voice 처리
      `[1:a]volume=1.0[voice]`,
      // 믹싱
      `[bgm][voice]amix=inputs=2:duration=first[out]`,
    ].join(';')

    console.log(`[BGM 믹싱] FFmpeg 필터 구성 완료 (목표 길이: ${targetDuration.toFixed(2)}초)`)

    // 6. FFmpeg 실행
    // FFmpeg 실행 전에 경로를 다시 확인하고 설정
    const currentFfmpegPath = getFfmpegPath()
    if (currentFfmpegPath) {
      ffmpeg.setFfmpegPath(currentFfmpegPath)
      console.log('[BGM 믹싱] FFmpeg 실행 전 경로 재설정:', currentFfmpegPath)
    } else {
      console.warn('[BGM 믹싱] ⚠️  FFmpeg 경로를 찾을 수 없어 기본값 사용')
    }
    
    await new Promise<void>((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | null = null
      let ffmpegKilled = false

      const ffmpegProcess = ffmpeg()
        .input(bgmPath)
        .input(voicePath)
        .outputOptions([
          '-y', // 덮어쓰기
          '-filter_complex',
          filterComplex,
          '-map',
          '[out]',
          '-c:a',
          'libmp3lame',
          '-b:a',
          '192k',
          '-ac',
          '2', // 스테레오
          '-ar',
          '44100', // 샘플레이트
        ])
        .on('start', (commandLine) => {
          console.log('[BGM 믹싱] FFmpeg 실행 시작')
          console.log(`[BGM 믹싱] 명령어: ${commandLine.substring(0, 200)}...`)
          
          // 타임아웃 설정 (30초)
          timeoutId = setTimeout(() => {
            if (!ffmpegKilled) {
              console.error('[BGM 믹싱] ❌ 타임아웃: FFmpeg 처리가 30초 이상 걸렸습니다')
              ffmpegKilled = true
              // FFmpeg 프로세스 종료 시도
              if (ffmpegProcess && (ffmpegProcess as any).ffmpegProc) {
                try {
                  ;(ffmpegProcess as any).ffmpegProc.kill()
                } catch {}
              }
              reject(new Error('오디오 믹싱이 시간 초과되었습니다 (30초)'))
            }
          }, 30000)
        })
        .on('progress', (progress) => {
          if (progress.percent && !isNaN(progress.percent)) {
            console.log(`[BGM 믹싱] 진행률: ${Math.round(progress.percent)}%`)
          }
        })
        .on('error', (err: Error) => {
          if (timeoutId) clearTimeout(timeoutId)
          if (ffmpegKilled) return // 이미 타임아웃으로 처리됨
          
          console.error('[BGM 믹싱] ❌ FFmpeg 에러 발생')
          console.error('[BGM 믹싱] 에러 메시지:', err.message)
          
          // 더 상세한 에러 정보
          if (err.message.includes('No such file')) {
            console.error('[BGM 믹싱] 파일을 찾을 수 없습니다')
          } else if (err.message.includes('Invalid data')) {
            console.error('[BGM 믹싱] 잘못된 오디오 데이터 형식')
          } else if (err.message.includes('filter')) {
            console.error('[BGM 믹싱] 필터 처리 중 오류')
          }
          
          reject(new Error(`오디오 믹싱 중 오류가 발생했습니다: ${err.message}`))
        })
        .on('end', () => {
          if (timeoutId) clearTimeout(timeoutId)
          if (ffmpegKilled) return // 이미 타임아웃으로 처리됨
          
          console.log('[BGM 믹싱] ✅ FFmpeg 처리 완료')
          resolve()
        })
        .save(outputPath)
    })

    // 7. 결과 파일 읽기
    console.log('[BGM 믹싱] 5단계: 결과 파일 읽기 중...')
    const mixedBuffer = await fs.readFile(outputPath)
    console.log(`[BGM 믹싱] ✅ 믹싱 완료: ${mixedBuffer.length} bytes`)

    return mixedBuffer
  } catch (error: any) {
    console.error('='.repeat(60))
    console.error('[BGM 믹싱] ❌ 전체 실패!')
    console.error('[BGM 믹싱] 에러 타입:', error.constructor.name)
    console.error('[BGM 믹싱] 에러 메시지:', error.message)
    console.error('[BGM 믹싱] 에러 스택:', error.stack)
    console.error('[BGM 믹싱] 에러 전체:', error)
    console.error('='.repeat(60))
    
    // 에러 발생 시 음성만 반환 (BGM 없는 버전)
    console.log('[BGM 믹싱] ⚠️  BGM 없이 음성만 반환합니다.')
    return voiceBuffer
  } finally {
    // 임시 파일 정리
    console.log('[BGM 믹싱] 임시 파일 정리 중...')
    await Promise.all([
      fs.unlink(voicePath).catch(() => {}),
      fs.unlink(bgmPath).catch(() => {}),
      fs.unlink(outputPath).catch(() => {}),
    ])
    console.log('[BGM 믹싱] ✅ 임시 파일 정리 완료')
  }
}

// ---- API Route ----

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateAudioRequestBody
    const { keyword, mood, bgmUrl } = body

    // 디버깅: 요청 데이터 확인
    console.log('[API] 받은 요청 데이터:')
    console.log('  keyword:', keyword)
    console.log('  mood:', mood)
    console.log('  bgmUrl:', bgmUrl || '(없음)')
    console.log('  bgmUrl 타입:', typeof bgmUrl)
    console.log('  bgmUrl 길이:', bgmUrl?.length || 0)

    if (!keyword || !keyword.trim()) {
      return NextResponse.json({ error: 'keyword가 필요합니다.' }, { status: 400 })
    }

    const moodText = mood && mood.trim().length > 0 ? mood.trim() : '정중하게'

    // 1. OpenAI로 대본 생성
    const script = await generateScriptWithOpenAI(keyword.trim(), moodText)

    // 2. TTS 변환 (한국어 기본)
    const voiceBuffer = await generateTTSWithGoogleCloud(script, {
      lang: 'ko',
      gender: 'female',
      slow: false,
    })

    console.log('[API] BGM 믹싱 시작 전:')
    console.log('  voiceBuffer 길이:', voiceBuffer.length, 'bytes')
    console.log('  bgmUrl:', bgmUrl || 'undefined')

    // 3. BGM과 믹싱 (있을 경우)
    const finalBuffer = await mixVoiceWithBgm(voiceBuffer, bgmUrl, script)
    
    console.log('[API] BGM 믹싱 완료:')
    console.log('  finalBuffer 길이:', finalBuffer.length, 'bytes')
    console.log('  BGM 믹싱 여부:', finalBuffer.length !== voiceBuffer.length ? '예' : '아니오')

    // 4. Base64로 인코딩하여 대본과 함께 반환
    const audioBase64 = finalBuffer.toString('base64')

    return NextResponse.json({
      script,
      audioBase64,
      contentType: 'audio/mpeg',
    })
  } catch (error: unknown) {
    let errorMessage = '알 수 없는 오류'
    let errorDetails: any = {}
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 1000),
      }
      
      // OpenAI 관련 에러인지 확인
      if (error.message.includes('OPENAI_API_KEY')) {
        errorDetails.type = 'API_KEY_MISSING'
        errorDetails.suggestion = 'OPENAI_API_KEY 환경 변수가 설정되어 있는지 확인하세요.'
      } else if (error.message.includes('429') || error.message.includes('rate limit')) {
        errorDetails.type = 'RATE_LIMIT'
        errorDetails.suggestion = 'OpenAI API 사용량 한도에 도달했습니다. 잠시 후 다시 시도하세요.'
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorDetails.type = 'AUTH_ERROR'
        errorDetails.suggestion = 'OpenAI API 키가 유효한지 확인하세요.'
      } else if (error.message.includes('GOOGLE_CLOUD')) {
        errorDetails.type = 'TTS_AUTH_ERROR'
        errorDetails.suggestion = 'Google Cloud 자격 증명을 확인하세요. (TTS용)'
      }
    }
    
    console.error('='.repeat(60))
    console.error('generate-audio API 오류:', JSON.stringify(errorDetails, null, 2))
    console.error('원본 에러:', error)
    console.error('='.repeat(60))

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        message:
          '안내방송 생성 중 오류가 발생했습니다. 환경 변수 설정을 확인해주세요.',
      },
      { status: 500 }
    )
  }
}

export const maxDuration = 60



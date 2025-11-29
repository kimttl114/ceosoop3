import { NextRequest, NextResponse } from 'next/server'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
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

// ---- Helpers: Vertex AI (Gemini) ----

// 통합된 자격 증명 관리 (Vertex AI + TTS 공통 사용)
async function getGoogleCredentials(): Promise<{
  credentials: unknown
  projectId: string
  location: string
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
      'Google Cloud 자격 증명이 설정되지 않았습니다.\n\n다음 중 하나를 설정해주세요:\n- GOOGLE_CLOUD_CREDENTIALS (권장: Vertex AI + TTS 공통 사용)\n- GOOGLE_VERTEX_AI_CREDENTIALS\n- GOOGLE_CLOUD_TTS_CREDENTIALS'
    )
  }

  let credentials: unknown
  try {
    credentials = JSON.parse(credentialsJson)
  } catch {
    throw new Error('자격 증명 JSON이 올바르지 않습니다. JSON 형식을 확인해주세요.')
  }

  // 프로젝트 ID 추출
  const parsed = credentials as { project_id?: string }
  const projectId =
    process.env.GOOGLE_VERTEX_AI_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT_ID ||
    parsed.project_id

  if (!projectId) {
    throw new Error(
      'Google Cloud 프로젝트 ID를 찾을 수 없습니다.\n\n다음 중 하나를 설정해주세요:\n- GOOGLE_VERTEX_AI_PROJECT_ID (권장)\n- GOOGLE_CLOUD_PROJECT_ID\n또는 자격 증명 JSON에 project_id가 포함되어 있어야 합니다.'
    )
  }

  const location = process.env.GOOGLE_VERTEX_AI_LOCATION || 'asia-northeast3'

  return { credentials, projectId, location }
}

async function ensureVertexCredentialsFile(): Promise<{ projectId: string; location: string }> {
  const { credentials, projectId, location } = await getGoogleCredentials()

  // 임시 파일로 저장 (Vertex AI 클라이언트가 파일 경로를 요구하는 경우 대비)
  const keyPath = path.join(tmpdir(), `google-cloud-key-${Date.now()}.json`)
  await fs.writeFile(keyPath, JSON.stringify(credentials), 'utf8')

  // Vertex AI 클라이언트가 이 경로를 사용하도록 설정
  process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath

  return { projectId, location }
}

async function generateScriptWithGemini(keyword: string, mood: string): Promise<string> {
  const { projectId, location } = await ensureVertexCredentialsFile()

  // 동적 import (서버 사이드에서만 로드)
  const { VertexAI } = await import('@google-cloud/vertexai')

  const vertexAI = new VertexAI({
    project: projectId,
    location,
  })

  const model = vertexAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
  })

  const prompt = `매장에서 사용할 안내방송 멘트야.
상황: ${keyword}
톤: ${mood}

요구사항:
- 불필요한 미사여구 없이 방송 멘트만 작성
- 1~2문장으로만 작성
- 앞뒤 설명, 따옴표, 인사말(예: 안녕하세요)은 넣지 말 것
- 실제 안내방송에서 바로 읽을 수 있는 자연스러운 한국어 문장으로 작성`

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  })

  const candidates = result.response?.candidates
  const text =
    candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join(' ')
      .trim() || ''

  if (!text) {
    throw new Error('Vertex AI에서 유효한 대본을 생성하지 못했습니다.')
  }

  return text
}

// ---- Helpers: Google Cloud TTS ----

async function generateTTSWithGoogleCloud(text: string, options?: VoiceOptions): Promise<Buffer> {
  // 통합된 자격 증명 사용 (Vertex AI와 동일)
  const { credentials } = await getGoogleCredentials()

  // 동적 import (빌드 사이즈 최소화)
  const { TextToSpeechClient } = await import('@google-cloud/text-to-speech')

  const client = new TextToSpeechClient({ credentials })

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

ffmpeg.setFfmpegPath(typeof ffmpegStatic === 'string' ? ffmpegStatic : (ffmpegStatic as string | null) || undefined)

async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    ffmpeg(filePath).ffprobe((err, metadata) => {
      if (err) {
        reject(err)
        return
      }
      const duration = metadata.format?.duration
      if (!duration || Number.isNaN(duration)) {
        reject(new Error('오디오 길이를 확인할 수 없습니다.'))
        return
      }
      resolve(duration)
    })
  })
}

async function mixVoiceWithBgm(voiceBuffer: Buffer, bgmUrl?: string): Promise<Buffer> {
  // BGM이 없으면 그대로 반환
  if (!bgmUrl) {
    return voiceBuffer
  }

  const workDir = tmpdir()
  const voicePath = path.join(workDir, `voice_${Date.now()}.mp3`)
  const bgmPath = path.join(workDir, `bgm_${Date.now()}.mp3`)
  const outputPath = path.join(workDir, `mixed_${Date.now()}.mp3`)

  try {
    // Voice 저장
    await fs.writeFile(voicePath, voiceBuffer)

    // BGM 다운로드
    const bgmRes = await fetch(bgmUrl)
    if (!bgmRes.ok) {
      throw new Error(`BGM 파일을 불러올 수 없습니다. (HTTP ${bgmRes.status})`)
    }
    const bgmArrayBuffer = await bgmRes.arrayBuffer()
    await fs.writeFile(bgmPath, Buffer.from(bgmArrayBuffer))

    // Voice 길이 확인
    const voiceDuration = await getAudioDuration(voicePath)
    const targetDuration = voiceDuration + 2 // 끝에 2초 여유

    // FFmpeg 필터: BGM 볼륨 0.2, Voice 1.0, BGM 반복 + 페이드아웃
    const filterComplex = [
      // BGM: 반복 후 길이 맞추기, 볼륨 0.2, 마지막 2초 페이드 아웃
      `[0:a]aloop=loop=-1:size=2e+09,atrim=0:${targetDuration.toFixed(
        3
      )},volume=0.2,afade=t=out:st=${voiceDuration.toFixed(3)}:d=2[bgm]`,
      // Voice: 그대로 사용
      `[1:a]volume=1.0[voice]`,
      // 합성
      `[bgm][voice]amix=inputs=2:duration=first:dropout_transition=2[out]`,
    ].join(';')

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(bgmPath)
        .input(voicePath)
        .outputOptions([
          '-y',
          '-filter_complex',
          filterComplex,
          '-map',
          '[out]',
          '-c:a',
          'libmp3lame',
          '-b:a',
          '192k',
        ])
        .on('error', (err) => {
          reject(err)
        })
        .on('end', () => {
          resolve()
        })
        .save(outputPath)
    })

    const mixedBuffer = await fs.readFile(outputPath)
    return mixedBuffer
  } finally {
    // 임시 파일 정리
    await fs.unlink(voicePath).catch(() => {})
    await fs.unlink(bgmPath).catch(() => {})
    await fs.unlink(outputPath).catch(() => {})
  }
}

// ---- API Route ----

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateAudioRequestBody
    const { keyword, mood, bgmUrl } = body

    if (!keyword || !keyword.trim()) {
      return NextResponse.json({ error: 'keyword가 필요합니다.' }, { status: 400 })
    }

    const moodText = mood && mood.trim().length > 0 ? mood.trim() : '정중하게'

    // 1. Gemini로 대본 생성
    const script = await generateScriptWithGemini(keyword.trim(), moodText)

    // 2. TTS 변환 (한국어 기본)
    const voiceBuffer = await generateTTSWithGoogleCloud(script, {
      lang: 'ko',
      gender: 'female',
      slow: false,
    })

    // 3. BGM과 믹싱 (있을 경우)
    const finalBuffer = await mixVoiceWithBgm(voiceBuffer, bgmUrl)

    // 4. Base64로 인코딩하여 대본과 함께 반환
    const audioBase64 = finalBuffer.toString('base64')

    return NextResponse.json({
      script,
      audioBase64,
      contentType: 'audio/mpeg',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('generate-audio API 오류:', error)

    return NextResponse.json(
      {
        error: message,
        message:
          '안내방송 생성 중 오류가 발생했습니다. 환경 변수 설정 및 Google Cloud / Vertex AI 설정을 확인해주세요.',
      },
      { status: 500 }
    )
  }
}

export const maxDuration = 60



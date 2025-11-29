'use client'

import React, { useState } from 'react'

interface BgmOption {
  label: string
  value: string
  url: string
}

interface SmartAudioGeneratorProps {
  bgmOptions: BgmOption[]
}

interface GenerateAudioResponse {
  script: string
  audioBase64: string
  contentType: string
  bgmMixed?: boolean // 서버에서 BGM 믹싱 성공 여부
  bgmUrl?: string // BGM 믹싱 실패 시 클라이언트에서 사용할 BGM URL
}

function base64ToBlob(base64: string, contentType: string): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array<number>(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: contentType })
}

export const SmartAudioGenerator: React.FC<SmartAudioGeneratorProps> = ({ bgmOptions }) => {
  const [keyword, setKeyword] = useState<string>('')
  const [mood, setMood] = useState<'정중하게' | '유쾌하게' | '단호하게'>('정중하게')
  const [bgmValue, setBgmValue] = useState<string>(bgmOptions[0]?.value ?? '')

  const [script, setScript] = useState<string>('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [bgmUrl, setBgmUrl] = useState<string | null>(null) // BGM URL (클라이언트 재생용)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      setError('상황 키워드를 입력해주세요.')
      return
    }

    const selectedBgm = bgmOptions.find((b) => b.value === bgmValue)
    const bgmUrl = selectedBgm?.url && selectedBgm.url.trim() !== '' ? selectedBgm.url : undefined

    // 디버깅: BGM URL 확인
    console.log('[BGM 디버깅] bgmValue:', bgmValue)
    console.log('[BGM 디버깅] selectedBgm:', selectedBgm)
    console.log('[BGM 디버깅] bgmUrl:', bgmUrl)

    setIsLoading(true)
    setError(null)
    setScript('')
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }

    // 요청 데이터 준비
    const requestBody: {
      keyword: string
      mood: string
      bgmUrl?: string
    } = {
      keyword: keyword.trim(),
      mood,
    }
    
    if (bgmUrl) {
      requestBody.bgmUrl = bgmUrl
    }

    console.log('[BGM 디버깅] API 요청 데이터:', requestBody)

    try {
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { message?: string; error?: string }
        const msg = data.message || data.error || `오류가 발생했습니다. (HTTP ${response.status})`
        throw new Error(msg)
      }

      const data = (await response.json()) as GenerateAudioResponse

      if (!data.audioBase64 || !data.contentType) {
        throw new Error('서버에서 유효한 오디오 데이터를 받지 못했습니다.')
      }

      const blob = base64ToBlob(data.audioBase64, data.contentType)
      const url = URL.createObjectURL(blob)

      setScript(data.script)
      setAudioUrl(url)
      
      // BGM 믹싱이 실패한 경우 BGM URL 저장 (클라이언트에서 함께 재생)
      if (!data.bgmMixed && data.bgmUrl) {
        setBgmUrl(data.bgmUrl)
        console.log('[BGM] 서버에서 BGM 믹싱 실패, 클라이언트에서 함께 재생합니다.')
      } else {
        setBgmUrl(null)
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl bg-white shadow-sm border border-slate-100 p-4 sm:p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">AI 안내방송 올인원 생성기</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          상황 키워드만 입력하면 대본 작성부터 음성 생성, BGM 합성까지 한 번에 처리됩니다.
        </p>
      </div>

      <div className="space-y-4">
        {/* 상황 키워드 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">상황 키워드</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="예: 재료 소진, 브레이크 타임, 주차 단속 안내"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/80 focus:border-slate-900/80"
          />
        </div>

        {/* 분위기 선택 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">분위기</label>
          <div className="flex flex-wrap gap-2">
            {(['정중하게', '유쾌하게', '단호하게'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMood(option)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  mood === option
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* BGM 선택 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">BGM 선택</label>
          <select
            value={bgmValue}
            onChange={(e) => setBgmValue(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/80 focus:border-slate-900/80"
          >
            {bgmOptions.map((bgm) => (
              <option key={bgm.value} value={bgm.value}>
                {bgm.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 생성 버튼 */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center rounded-lg bg-slate-900 text-white text-sm font-semibold py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? '생성 중...' : 'AI로 방송 만들기'}
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="text-xs sm:text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 whitespace-pre-line">
          {error}
        </div>
      )}

      {/* 결과 표시 */}
      {(script || audioUrl) && (
        <div className="space-y-4 border-t border-slate-100 pt-4">
          {script && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-800">AI가 생성한 대본</h3>
              <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-sm text-slate-800 whitespace-pre-line">
                {script}
              </div>
            </div>
          )}

          {audioUrl && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-800">생성된 방송</h3>
              
              {/* BGM이 별도 재생 필요한 경우 안내 */}
              {bgmUrl && (
                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  💡 BGM은 별도로 재생됩니다. 음성과 함께 재생하려면 아래 두 플레이어를 동시에 시작하세요.
                </div>
              )}
              
              {/* 음성 오디오 */}
              <div className="space-y-1">
                <label className="text-xs text-slate-600">음성</label>
                <audio controls src={audioUrl} className="w-full" id="voice-audio">
                  브라우저가 오디오 태그를 지원하지 않습니다.
                </audio>
              </div>
              
              {/* BGM 오디오 (별도 재생용) */}
              {bgmUrl && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">BGM (볼륨: 20%)</label>
                  <audio 
                    controls 
                    src={bgmUrl} 
                    className="w-full" 
                    id="bgm-audio"
                    onLoadedMetadata={(e) => {
                      const audio = e.currentTarget
                      audio.volume = 0.2 // BGM 볼륨 20%
                    }}
                  >
                    브라우저가 오디오 태그를 지원하지 않습니다.
                  </audio>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <a
                  href={audioUrl}
                  download="announcement.mp3"
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-2 transition-colors flex-1"
                >
                  음성 MP3 다운로드
                </a>
                {bgmUrl && (
                  <a
                    href={bgmUrl}
                    download="bgm.mp3"
                    className="inline-flex items-center justify-center rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-2 transition-colors flex-1"
                  >
                    BGM 다운로드
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}



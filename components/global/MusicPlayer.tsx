'use client'

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useMusicStore } from '@/store/useMusicStore'
import { X, Play, Pause, Music, Loader2, Minimize2, Maximize2 } from 'lucide-react'

// ReactPlayer는 클라이언트 사이드에서만 동적 임포트
const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
  loading: () => null,
}) as any

// Wake Lock 타입 정의
interface WakeLockSentinel extends EventTarget {
  release(): Promise<void>
  released: boolean
  type: 'screen'
}

interface NavigatorWithWakeLock {
  wakeLock?: {
    request(type: 'screen'): Promise<WakeLockSentinel>
  }
}

// MusicPlayer 컴포넌트
export default function MusicPlayer() {
  const { videoId, title, isPlaying, isMinimized, togglePlay, close, minimize } = useMusicStore()

  const [mounted, setMounted] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [playerLoaded, setPlayerLoaded] = useState(false) // ReactPlayer 모듈 로드 여부
  const readyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    console.log('[MusicPlayer] 컴포넌트 마운트 시작')
    setMounted(true)
    // ReactPlayer 모듈이 로드되었는지 확인
    setTimeout(() => {
      console.log('[MusicPlayer] ReactPlayer 모듈 로드 대기 완료')
      setPlayerLoaded(true)
    }, 500)
  }, [])

  // videoId 변경 시 isReady 리셋 및 타임아웃 설정
  useEffect(() => {
    if (videoId) {
      console.log('[MusicPlayer] 🎵 새로운 음악 로드:', { videoId, title, isMinimized, isPlaying })
      setIsReady(false)
      
      // 기존 타임아웃 클리어
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current)
        readyTimeoutRef.current = null
      }

      // 플레이어 모듈이 로드되면 타임아웃 설정 (5초 후 강제로 준비 상태로)
      if (playerLoaded) {
        console.log('[MusicPlayer] 플레이어 초기화 시작, 타임아웃 5초 설정')
        readyTimeoutRef.current = setTimeout(() => {
          if (!isReady) {
            console.warn('[MusicPlayer] ⚠️ 타임아웃: 5초 후에도 플레이어가 준비되지 않음, 강제로 준비 상태로 전환', {
              videoId,
              isPlaying,
            })
            setIsReady(true)
            // 타임아웃 후에도 재생이 안 되면 강제로 재생 시도
            if (isPlaying) {
              console.log('[MusicPlayer] 타임아웃 후 재생 강제 시도')
              // 약간의 지연 후 재생 상태 확인 및 강제 재생
              setTimeout(() => {
                console.log('[MusicPlayer] 재생 상태 확인:', { isPlaying, isReady: true })
              }, 100)
            }
          }
        }, 5000)
      }
    }

    return () => {
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current)
        readyTimeoutRef.current = null
      }
    }
  }, [videoId, title, isMinimized, isPlaying, playerLoaded, isReady])

  // 플레이어 활성화 시 body에 padding-bottom 추가 (모바일 최적화)
  useEffect(() => {
    if (!mounted) return

    if (videoId && !isMinimized) {
      // 플레이어가 확장되었을 때: 영상 높이 + 컨트롤바 높이
      const playerHeight = window.innerWidth * 0.5625 + 48 // 16:9 비율 + 컨트롤바
      document.body.style.paddingBottom = `${playerHeight}px`
    } else if (videoId && isMinimized) {
      // 미니 플레이어일 때
      document.body.style.paddingBottom = '80px'
    } else {
      document.body.style.paddingBottom = ''
    }

    return () => {
      document.body.style.paddingBottom = ''
    }
  }, [videoId, isMinimized, mounted])

  // Hydration 이슈 방지 & 비디오 없으면 렌더링 안 함
  if (!mounted || !videoId) return null

  return (
    <div
      className={`fixed left-0 right-0 z-[100] transition-all duration-300 ${
        isMinimized
          ? 'bottom-16' // 최소화: BottomNav 위에 미니 플레이어
          : 'bottom-0' // 확장: 화면 하단에 영상 플레이어
      }`}
    >
      {/* 플레이어는 항상 렌더링하되, 확장 모드일 때만 보이게 함 */}
      {mounted && videoId && playerLoaded && (
        <>
          {/* 확장 모드: 보이는 플레이어 */}
          {!isMinimized && (
            <div className="w-full bg-black">
              {/* 플레이어 컨테이너 - 모바일 최적화 */}
              <div
                className="relative w-full"
                style={{
                  paddingBottom: '56.25%', // 16:9 비율
                  maxHeight: '60vh', // 모바일에서 최대 높이 제한
                }}
              >
                <div className="absolute inset-0">
                  <ReactPlayer
                    key={`${videoId}-${isReady}`}
                    url={`https://www.youtube.com/watch?v=${videoId}`}
                    playing={isPlaying && isReady}
                    controls={true} // 모바일에서는 컨트롤 표시
                    width="100%"
                    height="100%"
                    playsinline={true}
                    volume={1}
                    muted={true}
                    loop={false}
                    light={false}
                    stopOnUnmount={false}
                  config={{
                    youtube: {
                      playerVars: {
                        autoplay: 0, // autoplay를 비활성화 (브라우저 정책)
                        controls: 1, // 모바일에서 컨트롤 표시
                        rel: 0,
                        modestbranding: 1,
                        playsinline: 1,
                        enablejsapi: 1,
                        mute: 0,
                        origin: typeof window !== 'undefined' ? window.location.origin : '',
                      },
                    } as any,
                  }}
                  onReady={() => {
                    console.log('✅ Youtube Player Ready!', { videoId, title, isReady, isPlaying })
                    if (readyTimeoutRef.current) {
                      clearTimeout(readyTimeoutRef.current)
                      readyTimeoutRef.current = null
                    }
                    setIsReady(true)
                    console.log('[MusicPlayer] ✅ 준비 상태로 전환 완료')
                    // 준비되면 자동 재생 시도 (isPlaying이 true인 경우)
                    if (isPlaying) {
                      console.log('[MusicPlayer] 준비 완료, 자동 재생 시작')
                    }
                  }}
                  onStart={() => {
                    console.log('✅ Music Started Playing!', { videoId, isReady, isPlaying })
                    // onStart가 호출되면 플레이어가 준비된 것
                    if (!isReady) {
                      console.log('✅ 플레이어가 준비되었습니다 (onStart로 감지)')
                      if (readyTimeoutRef.current) {
                        clearTimeout(readyTimeoutRef.current)
                        readyTimeoutRef.current = null
                      }
                      setIsReady(true)
                    }
                  }}
                  onPlay={() => {
                    console.log('▶️ 재생 중', { videoId, isReady, isPlaying })
                    // onPlay가 호출되면 플레이어가 준비된 것
                    if (!isReady) {
                      console.log('✅ 플레이어가 준비되었습니다 (onPlay로 감지)')
                      setIsReady(true)
                    }
                  }}
                  onPause={() => {
                    console.log('⏸️ 일시정지', { videoId })
                  }}
                  onProgress={(state: any) => {
                    // onReady가 호출되지 않을 경우 대비 - 더 빠르게 감지
                    if (!isReady && (state.loadedSeconds > 0 || state.playedSeconds > 0)) {
                      console.log('📊 플레이어가 준비되었습니다 (onProgress로 감지):', {
                        loaded: Math.round(state.loadedSeconds) + '초',
                        played: Math.round(state.playedSeconds) + '초',
                        videoId,
                        isPlaying,
                      })
                      if (readyTimeoutRef.current) {
                        clearTimeout(readyTimeoutRef.current)
                        readyTimeoutRef.current = null
                      }
                      setIsReady(true)
                    }
                  }}
                  onError={(e: any) => {
                    const errorMessage = e?.message || ''
                    const errorName = e?.name || ''
                    const errorString = JSON.stringify(e, Object.getOwnPropertyNames(e))

                    if (
                      errorName === 'AbortError' ||
                      errorMessage.includes('AbortError') ||
                      errorMessage.includes('media was removed') ||
                      errorMessage.includes('removed from the document') ||
                      errorMessage.includes('play() request was interrupted')
                    ) {
                      console.log('ℹ️ 미디어 전환 중 (정상):', errorMessage)
                      // AbortError는 무시하되, 재생 시도는 계속
                      if (isPlaying && isReady) {
                        console.log('[MusicPlayer] AbortError 후 재생 재시도')
                      }
                      return
                    }

                    console.error('❌ Youtube Error:', {
                      error: e,
                      videoId,
                      errorName,
                      errorMessage,
                      errorString,
                    })
                    setIsReady(false)
                  }}
                    />
                  </div>
                  {(!playerLoaded || !isReady) && (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-20">
                      <div className="text-center text-white">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm">
                          {!playerLoaded
                            ? '플레이어 모듈 로딩 중...'
                            : '영상 준비 중... (YouTube API 로딩 중)'}
                        </p>
                        {playerLoaded && !isReady && (
                          <p className="text-xs text-gray-400 mt-2">
                            {videoId ? `Video ID: ${videoId}` : 'Video ID 없음'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 플레이어 헤더 (제목 및 컨트롤) */}
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-3 z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-white text-sm font-semibold truncate">{title}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          minimize()
                        }}
                        className="p-2 text-white hover:bg-white/20 rounded-full transition active:scale-95"
                        aria-label="최소화"
                      >
                        <Minimize2 size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          close()
                        }}
                        className="p-2 text-white hover:bg-red-500/50 rounded-full transition active:scale-95"
                        aria-label="닫기"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 플레이어 하단 컨트롤바 (추가 컨트롤) */}
                <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isReady) {
                          console.warn('⚠️ 플레이어가 아직 준비되지 않았습니다.', { isReady, playerLoaded, videoId })
                          return
                        }
                        togglePlay()
                      }}
                      disabled={!isReady}
                      className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 active:scale-95 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs truncate">
                        {isReady ? '재생 중' : `로딩 중... (${playerLoaded ? 'API 대기' : '모듈 로딩'})`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 미니 모드: 숨겨진 플레이어 (재생을 위해 필요) */}
            {isMinimized && (
              <div className="absolute opacity-0 pointer-events-none w-1 h-1 overflow-hidden" style={{ visibility: 'hidden' }}>
                  <ReactPlayer
                  key={`${videoId}-${isReady}`}
                  url={`https://www.youtube.com/watch?v=${videoId}`}
                  playing={isPlaying && isReady}
                  controls={false}
                  width="100%"
                  height="100%"
                  playsinline={true}
                  volume={1}
                  muted={true}
                  loop={false}
                  light={false}
                  stopOnUnmount={false}
                  config={{
                    youtube: {
                      playerVars: {
                        autoplay: 0,
                        controls: 0,
                        rel: 0,
                        modestbranding: 1,
                        playsinline: 1,
                        enablejsapi: 1,
                        mute: 0,
                        origin: typeof window !== 'undefined' ? window.location.origin : '',
                      },
                    } as any,
                  }}
                  onReady={() => {
                    console.log('✅ 미니 모드 Youtube Player Ready!', { videoId, title, isReady, isPlaying })
                    if (readyTimeoutRef.current) {
                      clearTimeout(readyTimeoutRef.current)
                      readyTimeoutRef.current = null
                    }
                    setIsReady(true)
                    console.log('[MusicPlayer] ✅ 미니 모드 준비 상태로 전환 완료')
                  }}
                  onStart={() => {
                    console.log('✅ 미니 모드 Music Started Playing!', { videoId, isReady, isPlaying })
                    if (!isReady) {
                      console.log('✅ 미니 모드가 준비되었습니다 (onStart로 감지)')
                      if (readyTimeoutRef.current) {
                        clearTimeout(readyTimeoutRef.current)
                        readyTimeoutRef.current = null
                      }
                      setIsReady(true)
                    }
                  }}
                  onPlay={() => {
                    console.log('▶️ 미니 모드 재생 중', { videoId, isReady, isPlaying })
                    if (!isReady) {
                      console.log('✅ 미니 모드가 준비되었습니다 (onPlay로 감지)')
                      if (readyTimeoutRef.current) {
                        clearTimeout(readyTimeoutRef.current)
                        readyTimeoutRef.current = null
                      }
                      setIsReady(true)
                    }
                  }}
                  onProgress={(state: any) => {
                    if (!isReady && (state.loadedSeconds > 0 || state.playedSeconds > 0)) {
                      console.log('📊 미니 모드가 준비되었습니다 (onProgress로 감지):', {
                        loaded: Math.round(state.loadedSeconds) + '초',
                        played: Math.round(state.playedSeconds) + '초',
                        videoId,
                      })
                      if (readyTimeoutRef.current) {
                        clearTimeout(readyTimeoutRef.current)
                        readyTimeoutRef.current = null
                      }
                      setIsReady(true)
                    }
                  }}
                  onError={(e: any) => {
                    const errorMessage = e?.message || ''
                    const errorName = e?.name || ''

                    if (
                      errorName === 'AbortError' ||
                      errorMessage.includes('AbortError') ||
                      errorMessage.includes('media was removed') ||
                      errorMessage.includes('removed from the document')
                    ) {
                      console.log('ℹ️ 미니 모드 미디어 전환 중 (정상):', errorMessage)
                      return
                    }

                    console.error('❌ 미니 모드 Youtube Error:', {
                      error: e,
                      videoId,
                      errorName,
                      errorMessage,
                    })
                  }}
                />
              </div>
            )}
          </>
      )}

      {/* 미니 플레이어 UI (isMinimized가 true일 때만 표시) */}
      {isMinimized && (
        <div className="mx-4 mb-20 md:mb-4 p-3 bg-white/95 backdrop-blur-md shadow-2xl border-t border-indigo-100 rounded-2xl flex items-center justify-between ring-1 ring-black/5">
          {/* 정보 영역 */}
          <div
            className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer"
            onClick={() => minimize()} // 클릭 시 확장
          >
            <div
              className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 ${
                isReady ? 'bg-gray-200 overflow-hidden' : 'bg-indigo-50'
              } ${isPlaying && isReady ? 'animate-pulse' : ''}`}
            >
              {isReady ? (
                <img
                  src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                  }}
                />
              ) : (
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              )}
            </div>
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-sm font-bold text-gray-800 truncate pr-2">
                {title || '음악 로딩 중...'}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {!playerLoaded
                  ? '플레이어 모듈 로딩 중...'
                  : isReady
                    ? 'AI DJ Playing 🎵 (탭하여 확대)'
                    : '유튜브 연결 중...'}
              </span>
            </div>
          </div>

          {/* 컨트롤러 */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (!isReady) {
                  console.warn('⚠️ 플레이어가 아직 준비되지 않았습니다.', { isReady, playerLoaded })
                  return
                }
                togglePlay()
              }}
              disabled={!isReady}
              className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                minimize() // 확장/축소 토글
              }}
              className="p-2 text-gray-400 hover:text-gray-600 transition active:scale-95"
              aria-label={isMinimized ? '확대' : '최소화'}
            >
              {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                close()
              }}
              className="p-2 text-gray-400 hover:text-red-500 transition active:scale-95"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

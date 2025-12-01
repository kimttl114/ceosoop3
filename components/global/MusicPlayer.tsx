'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useMusicStore } from '@/store/useMusicStore'
import { X, Play, Pause, Music, Loader2, Minimize2, Maximize2 } from 'lucide-react'

// ReactPlayer는 클라이언트 사이드에서만 동적 임포트
const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
  loading: () => null,
}) as any

// MusicPlayer 컴포넌트
export default function MusicPlayer() {
  const { videoId, title, isPlaying, isMinimized, togglePlay, close, minimize } = useMusicStore()

  const [mounted, setMounted] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [playerLoaded, setPlayerLoaded] = useState(false)
  const playerRef = useRef<any>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
    // ReactPlayer 모듈 로드 확인
    const timer = setTimeout(() => {
      setPlayerLoaded(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // videoId 변경 시 상태 리셋
  useEffect(() => {
    if (videoId) {
      console.log('[MusicPlayer] 🎵 새로운 음악 로드:', { videoId, title })
      setIsReady(false)
      retryCountRef.current = 0
      
      // 기존 체크 인터벌 클리어
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
    }
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
    }
  }, [videoId, title])

  // 플레이어 활성화 시 body에 padding-bottom 추가
  useEffect(() => {
    if (!mounted) return

    if (videoId && !isMinimized) {
      const playerHeight = window.innerWidth * 0.5625 + 48
      document.body.style.paddingBottom = `${playerHeight}px`
    } else if (videoId && isMinimized) {
      document.body.style.paddingBottom = '80px'
    } else {
      document.body.style.paddingBottom = ''
    }

    return () => {
      document.body.style.paddingBottom = ''
    }
  }, [videoId, isMinimized, mounted])

  // 플레이어 상태 확인 함수
  const checkPlayerReady = useCallback(() => {
    if (!playerRef.current || isReady) return
    
    try {
      const internalPlayer = playerRef.current.getInternalPlayer()
      if (internalPlayer && typeof internalPlayer.getPlayerState === 'function') {
        const state = internalPlayer.getPlayerState()
        if (state !== -1 && state !== undefined) {
          // 플레이어가 준비됨 (UNSTARTED = -1이 아니면 준비됨)
          console.log('✅ 플레이어가 준비되었습니다 (getPlayerState로 감지):', { state })
          setIsReady(true)
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current)
            checkIntervalRef.current = null
          }
        }
      }
    } catch (e) {
      // 플레이어가 아직 준비되지 않음
    }
  }, [isReady])

  // 플레이어 준비 상태 주기적 확인
  useEffect(() => {
    if (!playerRef.current || isReady || !videoId) return

    // 주기적으로 확인 (최대 2초)
    let attemptCount = 0
    checkIntervalRef.current = setInterval(() => {
      attemptCount++
      checkPlayerReady()
      
      if (attemptCount > 20) {
        // 2초 후에도 준비되지 않으면 강제로 준비 상태로
        console.warn('[MusicPlayer] ⚠️ 플레이어 준비 타임아웃, 강제로 준비 상태로 전환')
        setIsReady(true)
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current)
          checkIntervalRef.current = null
        }
      }
    }, 100)

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
    }
  }, [playerRef.current, isReady, videoId, checkPlayerReady])

  // Hydration 이슈 방지
  if (!mounted || !videoId) return null

  return (
    <div
      className={`fixed left-0 right-0 z-[100] transition-all duration-300 ${
        isMinimized ? 'bottom-16' : 'bottom-0'
      }`}
    >
      {mounted && videoId && playerLoaded && (
        <>
          {/* 확장 모드: 보이는 플레이어 */}
          {!isMinimized && (
            <div className="w-full bg-black">
              <div
                className="relative w-full"
                style={{
                  paddingBottom: '56.25%',
                  maxHeight: '60vh',
                }}
              >
                <div className="absolute inset-0">
                  <ReactPlayer
                    ref={(player: any) => {
                      playerRef.current = player
                      // ref가 설정되면 즉시 확인 시도
                      if (player) {
                        setTimeout(() => checkPlayerReady(), 100)
                      }
                    }}
                    key={videoId}
                    url={`https://www.youtube.com/watch?v=${videoId}`}
                    playing={isPlaying && isReady}
                    controls={true}
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
                          controls: 1,
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
                      console.log('✅ Youtube Player Ready!', { videoId, title })
                      setIsReady(true)
                      // onReady에서도 플레이어 ref 확인
                      if (playerRef.current) {
                        checkPlayerReady()
                      }
                    }}
                    onStart={() => {
                      console.log('✅ Music Started Playing!', { videoId })
                      if (!isReady) {
                        setIsReady(true)
                      }
                    }}
                    onPlay={() => {
                      console.log('▶️ 재생 중', { videoId })
                      if (!isReady) {
                        setIsReady(true)
                      }
                    }}
                    onPause={() => {
                      console.log('⏸️ 일시정지', { videoId })
                    }}
                    onProgress={(state: any) => {
                      if (!isReady && (state.loadedSeconds > 0 || state.playedSeconds > 0)) {
                        console.log('📊 플레이어가 준비되었습니다 (onProgress로 감지):', {
                          loaded: Math.round(state.loadedSeconds) + '초',
                          played: Math.round(state.playedSeconds) + '초',
                        })
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
                        errorMessage.includes('removed from the document') ||
                        errorMessage.includes('play() request was interrupted') ||
                        errorMessage.includes('interrupted by a call')
                      ) {
                        return
                      }

                      console.error('❌ Youtube Error:', {
                        error: e,
                        videoId,
                        errorName,
                        errorMessage,
                      })
                      
                      // 재시도 로직
                      if (retryCountRef.current < maxRetries) {
                        retryCountRef.current++
                        console.log(`[MusicPlayer] 재시도 ${retryCountRef.current}/${maxRetries}`)
                        setTimeout(() => {
                          setIsReady(false)
                        }, 1000)
                      }
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
                        <p className="text-xs text-gray-400 mt-2">Video ID: {videoId}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 플레이어 헤더 */}
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

              {/* 플레이어 하단 컨트롤바 */}
              <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isReady) {
                        console.warn('⚠️ 플레이어가 아직 준비되지 않았습니다.')
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

          {/* 미니 모드: 숨겨진 플레이어 */}
          {isMinimized && (
            <div className="absolute opacity-0 pointer-events-none w-1 h-1 overflow-hidden" style={{ visibility: 'hidden' }}>
              <ReactPlayer
                ref={(player: any) => {
                  playerRef.current = player
                  // ref가 설정되면 즉시 확인 시도
                  if (player) {
                    setTimeout(() => checkPlayerReady(), 100)
                  }
                }}
                key={videoId}
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
                  console.log('✅ 미니 모드 Youtube Player Ready!', { videoId })
                  setIsReady(true)
                  // onReady에서도 플레이어 ref 확인
                  if (playerRef.current) {
                    checkPlayerReady()
                  }
                }}
                onStart={() => {
                  console.log('✅ 미니 모드 Music Started Playing!', { videoId })
                  if (!isReady) {
                    setIsReady(true)
                  }
                }}
                onPlay={() => {
                  console.log('▶️ 미니 모드 재생 중', { videoId })
                  if (!isReady) {
                    setIsReady(true)
                  }
                }}
                onProgress={(state: any) => {
                  if (!isReady && (state.loadedSeconds > 0 || state.playedSeconds > 0)) {
                    console.log('📊 미니 모드가 준비되었습니다 (onProgress로 감지)')
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
                    errorMessage.includes('removed from the document') ||
                    errorMessage.includes('play() request was interrupted') ||
                    errorMessage.includes('interrupted by a call')
                  ) {
                    return
                  }

                  console.error('❌ 미니 모드 Youtube Error:', {
                    error: e,
                    videoId,
                    errorName,
                    errorMessage,
                  })
                  
                  if (retryCountRef.current < maxRetries) {
                    retryCountRef.current++
                    console.log(`[MusicPlayer] 미니 모드 재시도 ${retryCountRef.current}/${maxRetries}`)
                    setTimeout(() => {
                      setIsReady(false)
                    }, 1000)
                  }
                }}
              />
            </div>
          )}
        </>
      )}

      {/* 미니 플레이어 UI */}
      {isMinimized && (
        <div className="mx-4 mb-20 md:mb-4 p-3 bg-white/95 backdrop-blur-md shadow-2xl border-t border-indigo-100 rounded-2xl flex items-center justify-between ring-1 ring-black/5">
          <div
            className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer"
            onClick={() => minimize()}
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

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (!isReady) {
                  console.warn('⚠️ 플레이어가 아직 준비되지 않았습니다.')
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
                minimize()
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
              aria-label="닫기"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

MusicPlayer.displayName = 'MusicPlayer'

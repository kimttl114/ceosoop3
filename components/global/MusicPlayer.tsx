'use client'

import { useEffect, useState, useRef } from 'react'
import { useMusicStore } from '@/store/useMusicStore'
import { X, Play, Pause, Music, Loader2, Minimize2, Maximize2 } from 'lucide-react'

// YouTube IFrame API 타입 정의
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

// MusicPlayer 컴포넌트
export default function MusicPlayer() {
  const { videoId, title, isPlaying, isMinimized, togglePlay, close, minimize } = useMusicStore()

  const [mounted, setMounted] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [apiLoaded, setApiLoaded] = useState(false)
  const playerRef = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const miniPlayerContainerRef = useRef<HTMLDivElement>(null)
  const playerIdRef = useRef(`youtube-player-${Date.now()}`)
  const miniPlayerIdRef = useRef(`youtube-player-mini-${Date.now()}`)

  // YouTube IFrame API 로드
  useEffect(() => {
    setMounted(true)

    // 이미 로드되어 있는지 확인
    if (window.YT && window.YT.Player) {
      setApiLoaded(true)
      return
    }

    // API가 이미 로딩 중인지 확인
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      // API 로드 대기
      const checkApi = setInterval(() => {
        if (window.YT && window.YT.Player) {
          setApiLoaded(true)
          clearInterval(checkApi)
        }
      }, 100)

      return () => clearInterval(checkApi)
    }

    // YouTube IFrame API 스크립트 로드
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.async = true
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    // API 준비 콜백
    window.onYouTubeIframeAPIReady = () => {
      console.log('[MusicPlayer] ✅ YouTube IFrame API 로드 완료')
      setApiLoaded(true)
    }
  }, [])

  // 플레이어 초기화 (확장 모드)
  useEffect(() => {
    if (!apiLoaded || !videoId || !playerContainerRef.current || isMinimized) return

    console.log('[MusicPlayer] 🎵 플레이어 초기화 시작 (확장 모드):', { videoId, title })

    // 기존 플레이어 제거
    if (playerRef.current) {
      try {
        playerRef.current.destroy()
      } catch (e) {
        console.warn('[MusicPlayer] 기존 플레이어 제거 실패:', e)
      }
      playerRef.current = null
    }

    setIsReady(false)

    // 새 플레이어 생성
    try {
      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        videoId: videoId,
        width: '100%',
        height: '100%',
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
        events: {
          onReady: (event: any) => {
            console.log('✅ Youtube Player Ready! (확장 모드)', { videoId, title })
            setIsReady(true)
            // 자동 재생이 활성화되어 있으면 재생
            if (isPlaying) {
              event.target.playVideo()
            }
          },
          onStateChange: (event: any) => {
            const state = event.data
            if (state === 1) {
              console.log('▶️ 재생 중 (확장 모드)', { videoId })
            } else if (state === 2) {
              console.log('⏸️ 일시정지 (확장 모드)', { videoId })
            } else if (state === 0) {
              console.log('⏹️ 재생 종료 (확장 모드)', { videoId })
            }
          },
          onError: (event: any) => {
            const errorCode = event.data
            console.error('❌ Youtube Error (확장 모드):', { videoId, errorCode })
            if (errorCode === 100 || errorCode === 101 || errorCode === 150) {
              console.warn('[MusicPlayer] 비디오 재생 제한, 다른 비디오로 시도 필요')
            }
          },
        },
      })
    } catch (error) {
      console.error('[MusicPlayer] 플레이어 생성 실패:', error)
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (e) {
          console.warn('[MusicPlayer] 플레이어 정리 실패:', e)
        }
        playerRef.current = null
      }
    }
  }, [apiLoaded, videoId, title, isMinimized, isPlaying])

  // 플레이어 초기화 (미니 모드)
  useEffect(() => {
    if (!apiLoaded || !videoId || !miniPlayerContainerRef.current || !isMinimized) return

    console.log('[MusicPlayer] 🎵 플레이어 초기화 시작 (미니 모드):', { videoId, title })

    // 기존 플레이어 제거
    if (playerRef.current) {
      try {
        playerRef.current.destroy()
      } catch (e) {
        console.warn('[MusicPlayer] 기존 플레이어 제거 실패:', e)
      }
      playerRef.current = null
    }

    setIsReady(false)

    // 새 플레이어 생성 (미니 모드)
    try {
      playerRef.current = new window.YT.Player(miniPlayerContainerRef.current, {
        videoId: videoId,
        width: '100%',
        height: '100%',
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
        events: {
          onReady: (event: any) => {
            console.log('✅ Youtube Player Ready! (미니 모드)', { videoId, title })
            setIsReady(true)
            // 자동 재생이 활성화되어 있으면 재생
            if (isPlaying) {
              event.target.playVideo()
            }
          },
          onStateChange: (event: any) => {
            const state = event.data
            if (state === 1) {
              console.log('▶️ 재생 중 (미니 모드)', { videoId })
            } else if (state === 2) {
              console.log('⏸️ 일시정지 (미니 모드)', { videoId })
            }
          },
          onError: (event: any) => {
            const errorCode = event.data
            console.error('❌ Youtube Error (미니 모드):', { videoId, errorCode })
          },
        },
      })
    } catch (error) {
      console.error('[MusicPlayer] 미니 모드 플레이어 생성 실패:', error)
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (e) {
          console.warn('[MusicPlayer] 미니 모드 플레이어 정리 실패:', e)
        }
        playerRef.current = null
      }
    }
  }, [apiLoaded, videoId, title, isMinimized, isPlaying])

  // 재생/일시정지 제어
  useEffect(() => {
    if (!playerRef.current || !isReady) return

    try {
      const playerState = playerRef.current.getPlayerState()
      // YT.PlayerState.PLAYING = 1
      // YT.PlayerState.PAUSED = 2

      if (isPlaying && playerState !== 1) {
        playerRef.current.playVideo()
      } else if (!isPlaying && playerState === 1) {
        playerRef.current.pauseVideo()
      }
    } catch (error) {
      console.error('[MusicPlayer] 재생 제어 실패:', error)
    }
  }, [isPlaying, isReady])

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

  // Hydration 이슈 방지
  if (!mounted || !videoId) return null

  return (
    <div
      className={`fixed left-0 right-0 z-[100] transition-all duration-300 ${
        isMinimized ? 'bottom-16' : 'bottom-0'
      }`}
    >
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
              {!apiLoaded ? (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">YouTube API 로딩 중...</p>
                  </div>
                </div>
              ) : (
                <div
                  ref={playerContainerRef}
                  id={playerIdRef.current}
                  className="w-full h-full"
                />
              )}
            </div>

            {(!apiLoaded || !isReady) && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-20">
                <div className="text-center text-white">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">
                    {!apiLoaded
                      ? 'YouTube API 로딩 중...'
                      : '영상 준비 중... (YouTube API 로딩 중)'}
                  </p>
                  {apiLoaded && !isReady && (
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
                  {isReady ? '재생 중' : `로딩 중... (${apiLoaded ? 'API 대기' : 'API 로딩'})`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 미니 모드: 숨겨진 플레이어 */}
      {isMinimized && (
        <div className="absolute opacity-0 pointer-events-none w-1 h-1 overflow-hidden" style={{ visibility: 'hidden' }}>
          {apiLoaded && (
            <div
              ref={miniPlayerContainerRef}
              id={miniPlayerIdRef.current}
              className="w-full h-full"
            />
          )}
        </div>
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
                {!apiLoaded
                  ? 'YouTube API 로딩 중...'
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

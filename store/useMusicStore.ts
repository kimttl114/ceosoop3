import { create } from 'zustand'

interface MusicState {
  videoId: string | null
  title: string
  isPlaying: boolean
  isMinimized: boolean
}

interface MusicActions {
  playMusic: (videoId: string, title: string, autoPlay?: boolean) => void
  togglePlay: () => void
  minimize: () => void
  close: () => void
}

type MusicStore = MusicState & MusicActions

const initialState: MusicState = {
  videoId: null,
  title: '',
  isPlaying: false,
  isMinimized: true,
}

export const useMusicStore = create<MusicStore>((set) => ({
  ...initialState,

  playMusic: (videoId: string, title: string, autoPlay: boolean = false) => {
    console.log('[MusicStore] 🎵 음악 로드:', { videoId, title, autoPlay })
    set({
      videoId,
      title,
      isPlaying: autoPlay, // autoPlay가 true면 즉시 재생, false면 대기
      isMinimized: false, // 플레이어 열기
    })
  },

  togglePlay: () => {
    set((state) => ({
      isPlaying: !state.isPlaying,
    }))
  },

  minimize: () => {
    set((state) => ({
      isMinimized: !state.isMinimized,
    }))
  },

  close: () => {
    set({
      ...initialState,
    })
  },
}))


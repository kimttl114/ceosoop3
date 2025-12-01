'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Music, Loader2, Sun, Cloud, CloudRain, Snowflake, Coffee, ShoppingBag, Utensils, Play } from 'lucide-react'
import { useMusicStore } from '@/store/useMusicStore'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import BottomNav from '@/components/BottomNav'

const weatherOptions = [
  { value: 'sunny', label: '맑음', icon: Sun, color: 'text-yellow-500' },
  { value: 'cloudy', label: '흐림', icon: Cloud, color: 'text-gray-500' },
  { value: 'rainy', label: '비', icon: CloudRain, color: 'text-blue-500' },
  { value: 'snowy', label: '눈', icon: Snowflake, color: 'text-blue-200' },
]

const businessOptions = [
  { value: 'cafe', label: '카페', icon: Coffee, color: 'text-amber-700' },
  { value: 'restaurant', label: '음식점', icon: Utensils, color: 'text-orange-600' },
  { value: 'retail', label: '소매점', icon: ShoppingBag, color: 'text-purple-600' },
]

export default function MusicPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [selectedWeather, setSelectedWeather] = useState<string>('sunny')
  const [selectedBusiness, setSelectedBusiness] = useState<string>('cafe')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendedMusic, setRecommendedMusic] = useState<Array<{
    title: string
    videoId: string
    searchQuery?: string
    timestamp: number
  }>>([])
  const { playMusic } = useMusicStore()

  // 로그인 체크
  useEffect(() => {
    if (!auth) {
      setLoadingAuth(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.push('/login')
      }
      setLoadingAuth(false)
    })
    return () => unsubscribe()
  }, [router])

  // 로딩 중 표시
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    )
  }

  // 로그인하지 않은 경우 (리다이렉트 중)
  if (!user) {
    return null
  }

  const handleRecommend = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/music/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weather: selectedWeather,
          business: selectedBusiness,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || '음악 추천에 실패했습니다.')
      }

      const data = await response.json()
      
      if (!data.videoId || !data.title) {
        throw new Error('유효한 음악 정보를 받지 못했습니다.')
      }

      // 추천 플레이리스트 확인 및 전역 플레이어에 음악 전달
      const musicInfo = {
        title: data.title,
        videoId: data.videoId,
        searchQuery: data.searchQuery || 'N/A',
        timestamp: Date.now(),
      }
      
      console.log('🎵 추천된 음악:', musicInfo)
      
      // 플레이리스트에 추가
      setRecommendedMusic((prev) => [musicInfo, ...prev])
      
      // 전역 플레이어에 음악 전달 (자동 재생 안 함)
      playMusic(data.videoId, data.title, false)
    } catch (err: any) {
      setError(err.message || '음악 추천 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-purple-600 to-pink-600 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Music size={24} />
            <span>AI 음악 선곡</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* 안내 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Music size={20} className="text-purple-600" />
            <span>상황에 맞는 음악 추천</span>
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            날씨와 업종을 선택하면 AI가 최적의 배경음악을 추천해드립니다.
          </p>

          {/* 날씨 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">날씨</label>
            <div className="grid grid-cols-4 gap-2">
              {weatherOptions.map((weather) => {
                const Icon = weather.icon
                const isSelected = selectedWeather === weather.value
                return (
                  <button
                    key={weather.value}
                    onClick={() => setSelectedWeather(weather.value)}
                    className={`py-4 rounded-xl border-2 transition ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={24} className={`mx-auto mb-2 ${isSelected ? weather.color : 'text-gray-400'}`} />
                    <div className="text-xs font-medium">{weather.label}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 업종 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">업종</label>
            <div className="grid grid-cols-3 gap-2">
              {businessOptions.map((business) => {
                const Icon = business.icon
                const isSelected = selectedBusiness === business.value
                return (
                  <button
                    key={business.value}
                    onClick={() => setSelectedBusiness(business.value)}
                    className={`py-4 rounded-xl border-2 transition ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={24} className={`mx-auto mb-2 ${isSelected ? business.color : 'text-gray-400'}`} />
                    <div className="text-xs font-medium">{business.label}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* AI 선곡 버튼 */}
          <button
            onClick={handleRecommend}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>AI가 음악을 찾는 중...</span>
              </>
            ) : (
              <>
                <Music size={20} />
                <span>AI로 음악 추천받기</span>
              </>
            )}
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* 추천된 플레이리스트 */}
        {recommendedMusic.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Music size={20} className="text-purple-600" />
              <span>추천 플레이리스트 ({recommendedMusic.length})</span>
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {recommendedMusic.map((music, index) => (
                <div
                  key={`${music.videoId}-${music.timestamp}`}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                    <img
                      src={`https://img.youtube.com/vi/${music.videoId}/hqdefault.jpg`}
                      alt={music.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = `https://img.youtube.com/vi/${music.videoId}/mqdefault.jpg`
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{music.title}</p>
                    {music.searchQuery && music.searchQuery !== 'N/A' && (
                      <p className="text-xs text-gray-500 truncate">검색어: {music.searchQuery}</p>
                    )}
                  </div>
                  <button
                    onClick={() => playMusic(music.videoId, music.title, true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition flex items-center gap-2 flex-shrink-0"
                  >
                    <Play size={16} className="fill-current" />
                    <span>재생</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 사용 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-800 text-sm font-semibold mb-2">💡 사용 방법</p>
          <ul className="text-blue-700 text-xs space-y-1 ml-4 list-disc">
            <li>현재 날씨와 업종을 선택하세요</li>
            <li>"AI로 음악 추천받기" 버튼을 클릭하세요</li>
            <li>추천된 음악이 플레이리스트에 추가됩니다</li>
            <li>플레이리스트에서 원하는 음악의 재생 버튼을 클릭하세요</li>
            <li>플레이어는 페이지 이동 후에도 계속 재생됩니다</li>
          </ul>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}


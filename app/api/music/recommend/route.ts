import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 안전한 Fallback 플레이리스트 (저작권 없음)
const FALLBACK_PLAYLISTS = {
  cafe: 'jfKfPfyJRdk', // Lofi Girl - 24/7 Lofi Hip Hop Radio
  restaurant: 'jfKfPfyJRdk', // Lofi Girl
  retail: 'jfKfPfyJRdk', // Lofi Girl
  bakery: 'jfKfPfyJRdk', // Lofi Girl
  bar: 'jfKfPfyJRdk', // Lofi Girl
  salon: 'jfKfPfyJRdk', // Lofi Girl
  gym: 'jfKfPfyJRdk', // Lofi Girl
  bookstore: 'jfKfPfyJRdk', // Lofi Girl
  convenience: 'jfKfPfyJRdk', // Lofi Girl
  hospital: 'jfKfPfyJRdk', // Lofi Girl
  pharmacy: 'jfKfPfyJRdk', // Lofi Girl
  default: 'jfKfPfyJRdk', // Lofi Girl
}

interface MusicRecommendRequest {
  weather: string
  business: string
  genre: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MusicRecommendRequest
    const { weather, business, genre } = body

    if (!weather || !business || !genre) {
      return NextResponse.json(
        { error: '날씨, 업종, 장르를 모두 선택해주세요.' },
        { status: 400 }
      )
    }

    // OpenAI로 검색어 생성
    let searchQuery = ''
    
    try {
      const weatherLabels: Record<string, string> = {
        sunny: '맑음',
        cloudy: '흐림',
        rainy: '비',
        snowy: '눈',
      }

      const businessLabels: Record<string, string> = {
        cafe: '카페',
        restaurant: '음식점',
        retail: '소매점',
        bakery: '베이커리',
        bar: '술집/바',
        salon: '미용실',
        gym: '헬스장',
        bookstore: '서점',
        convenience: '편의점',
        hospital: '병원',
        pharmacy: '약국',
      }

      const genreLabels: Record<string, string> = {
        kpop: '가요 (K-POP)',
        pop: '팝 (Pop)',
        jazz: '재즈 (Jazz)',
        dance: '댄스 (Dance)',
        classical: '클래식 (Classical)',
        rock: '록 (Rock)',
      }

      const weatherLabel = weatherLabels[weather] || '맑음'
      const businessLabel = businessLabels[business] || '카페'
      const genreLabel = genreLabels[genre] || '가요'

      const prompt = `${businessLabel}에서 ${weatherLabel} 날씨에 어울리는 ${genreLabel} 장르의 저작권 없는 배경음악 플레이리스트를 찾기 위한 YouTube 검색어를 생성해주세요.

요구사항:
- 저작권이 없는 음악 (royalty-free, copyright-free)
- 1시간 이상 재생되는 긴 플레이리스트
- ${businessLabel} 분위기에 어울리는 음악
- ${weatherLabel} 날씨의 감성에 맞는 음악
- ${genreLabel} 장르의 음악
- 검색어만 간단하게 생성 (설명 없이 검색어만)

예시: "royalty free cafe music kpop 1 hour"
예시: "copyright free restaurant background music jazz"
예시: "no copyright coffee shop music pop acoustic"
예시: "royalty free dance music background 1 hour"`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      })

      searchQuery = completion.choices[0]?.message?.content?.trim() || ''
      
      // 따옴표 제거
      searchQuery = searchQuery.replace(/^["']|["']$/g, '')

      if (!searchQuery) {
        throw new Error('검색어 생성 실패')
      }
    } catch (error: any) {
      console.error('[AI 음악 추천] OpenAI 검색어 생성 실패:', error.message)
      // Fallback 검색어 사용
      const genreFallback = genre === 'kpop' ? 'kpop' : genre === 'pop' ? 'pop' : genre === 'jazz' ? 'jazz' : genre === 'dance' ? 'dance' : genre === 'classical' ? 'classical' : genre === 'rock' ? 'rock' : 'background'
      searchQuery = `royalty free ${business} ${genreFallback} music 1 hour`
    }

    // YouTube Data API로 검색
    const youtubeApiKey = process.env.YOUTUBE_API_KEY

    if (!youtubeApiKey) {
      console.warn('[AI 음악 추천] YouTube API 키가 없어 Fallback 사용')
      return NextResponse.json({
        videoId: FALLBACK_PLAYLISTS[business as keyof typeof FALLBACK_PLAYLISTS] || FALLBACK_PLAYLISTS.default,
        title: 'Lofi Hip Hop Radio - 24/7',
        searchQuery: 'Fallback (API 키 없음)',
      })
    }

    try {
      // YouTube Data API v3 검색
      const youtubeResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&videoDuration=long&maxResults=5&key=${youtubeApiKey}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      )

      if (!youtubeResponse.ok) {
        throw new Error(`YouTube API 에러: ${youtubeResponse.status}`)
      }

      const youtubeData = await youtubeResponse.json()

      if (!youtubeData.items || youtubeData.items.length === 0) {
        throw new Error('검색 결과가 없습니다')
      }

      // 첫 번째 결과 사용
      const firstVideo = youtubeData.items[0]
      const videoId = firstVideo.id.videoId
      const title = firstVideo.snippet.title

      return NextResponse.json({
        videoId,
        title,
        searchQuery,
      })
    } catch (youtubeError: any) {
      console.error('[AI 음악 추천] YouTube API 실패:', youtubeError.message)
      
      // Fallback 반환
      return NextResponse.json({
        videoId: FALLBACK_PLAYLISTS[business as keyof typeof FALLBACK_PLAYLISTS] || FALLBACK_PLAYLISTS.default,
        title: 'Lofi Hip Hop Radio - 24/7 (Fallback)',
        searchQuery: 'Fallback (YouTube API 실패)',
      })
    }
  } catch (error: any) {
    console.error('[AI 음악 추천] 전체 오류:', error)
    return NextResponse.json(
      { error: error.message || '음악 추천 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}


'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { collection, query, getDocs, orderBy, where, limit, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { Search, Filter, Plus, Heart, MapPin, Package, Store, Coffee, Sofa, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import MainLayout from '@/components/MainLayout'
import BottomNav from '@/components/BottomNav'

const categories = [
  { value: 'all', label: '전체', icon: Package },
  { value: 'restaurant', label: '음식점', icon: Store },
  { value: 'cafe', label: '카페', icon: Coffee },
  { value: 'furniture', label: '가구/인테리어', icon: Sofa },
  { value: 'other', label: '기타', icon: MoreHorizontal },
]

const conditions = {
  new: '새상품',
  used: '중고',
  damaged: '하자있음',
}

const tradeMethods = {
  direct: '직거래',
  delivery: '배송',
  negotiable: '협의',
}

interface MarketplaceItem {
  id: string
  title: string
  description: string
  category: string
  price: number
  condition: 'new' | 'used' | 'damaged'
  images: string[]
  sellerId: string
  sellerName: string
  sellerRegion: string
  tradeMethod: 'direct' | 'delivery' | 'negotiable'
  tradeRegion: string[]
  status: 'selling' | 'reserved' | 'sold'
  views: number
  likes: number
  createdAt: any
  updatedAt: any
}

export default function MarketplacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedCondition, setSelectedCondition] = useState('all')
  const [selectedTradeMethod, setSelectedTradeMethod] = useState('all')
  const [sortBy, setSortBy] = useState<'latest' | 'priceLow' | 'priceHigh' | 'popular'>('latest')
  const [showFilters, setShowFilters] = useState(false)
  const [userLikes, setUserLikes] = useState<string[]>([])

  useEffect(() => {
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  // 사용자 관심상품 불러오기
  useEffect(() => {
    if (!user || !db) return

    const loadUserLikes = async () => {
      try {
        const itemsSnapshot = await getDocs(collection(db, 'marketplace'))
        const likedItems: string[] = []
        
        for (const itemDoc of itemsSnapshot.docs) {
          let isLiked = false
          try {
            const likesQuery = query(
              collection(db, 'marketplace', itemDoc.id, 'likes'),
              where('userId', '==', user.uid)
            )
            const likesSnapshot = await getDocs(likesQuery)
            isLiked = !likesSnapshot.empty
          } catch (error) {
            // 인덱스가 없을 수 있으므로 전체 조회로 fallback
            const likesSnapshot = await getDocs(collection(db, 'marketplace', itemDoc.id, 'likes'))
            isLiked = likesSnapshot.docs.some(likeDoc => {
              const data = likeDoc.data()
              return data.userId === user.uid
            })
          }
          if (isLiked) {
            likedItems.push(itemDoc.id)
          }
        }
        setUserLikes(likedItems)
      } catch (error) {
        console.error('관심상품 불러오기 오류:', error)
      }
    }

    loadUserLikes()
  }, [user, db, items])

  // 상품 목록 불러오기
  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'marketplace'),
      where('status', '==', 'selling'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const itemsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MarketplaceItem[]
        setItems(itemsList)
        setLoading(false)
      },
      (error) => {
        console.error('상품 목록 불러오기 오류:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [db])

  // 필터링 및 정렬
  const filteredItems = items
    .filter((item) => {
      // 검색어 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !item.title.toLowerCase().includes(query) &&
          !item.description.toLowerCase().includes(query)
        ) {
          return false
        }
      }

      // 카테고리 필터
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false
      }

      // 지역 필터
      if (selectedRegion !== 'all') {
        if (!item.tradeRegion.includes(selectedRegion) && item.sellerRegion !== selectedRegion) {
          return false
        }
      }

      // 상태 필터
      if (selectedCondition !== 'all' && item.condition !== selectedCondition) {
        return false
      }

      // 거래방식 필터
      if (selectedTradeMethod !== 'all' && item.tradeMethod !== selectedTradeMethod) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priceLow':
          return a.price - b.price
        case 'priceHigh':
          return b.price - a.price
        case 'popular':
          return (b.likes + b.views) - (a.likes + a.views)
        case 'latest':
        default:
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
          return timeB.getTime() - timeA.getTime()
      }
    })

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR') + '원'
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '오늘'
    if (days === 1) return '어제'
    if (days < 7) return `${days}일 전`
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  return (
    <MainLayout>
      <div className="min-h-screen pb-24 bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold text-gray-900">중고장터</h1>
              {user && (
                <Link
                  href="/marketplace/create"
                  className="px-4 py-2 bg-[#1A2B4E] text-white rounded-lg text-sm font-medium hover:bg-[#1A2B4E]/90 transition flex items-center gap-2"
                >
                  <Plus size={18} />
                  <span>판매하기</span>
                </Link>
              )}
            </div>

            {/* 검색바 */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="상품명, 설명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E]"
              />
            </div>

            {/* 카테고리 탭 */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
                      selectedCategory === category.value
                        ? 'bg-[#1A2B4E] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{category.label}</span>
                  </button>
                )
              })}
            </div>

            {/* 필터 및 정렬 */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  showFilters
                    ? 'bg-[#1A2B4E] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter size={16} />
                <span>필터</span>
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2B4E]"
              >
                <option value="latest">최신순</option>
                <option value="priceLow">가격낮은순</option>
                <option value="priceHigh">가격높은순</option>
                <option value="popular">인기순</option>
              </select>
            </div>

            {/* 필터 패널 */}
            {showFilters && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">지역</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2B4E]"
                  >
                    <option value="all">전체</option>
                    <option value="서울">서울</option>
                    <option value="부산">부산</option>
                    <option value="대구">대구</option>
                    <option value="인천">인천</option>
                    <option value="광주">광주</option>
                    <option value="대전">대전</option>
                    <option value="울산">울산</option>
                    <option value="경기">경기</option>
                    <option value="강원">강원</option>
                    <option value="충북">충북</option>
                    <option value="충남">충남</option>
                    <option value="전북">전북</option>
                    <option value="전남">전남</option>
                    <option value="경북">경북</option>
                    <option value="경남">경남</option>
                    <option value="제주">제주</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">상태</label>
                  <div className="flex gap-2">
                    {Object.entries(conditions).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedCondition(selectedCondition === key ? 'all' : key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          selectedCondition === key
                            ? 'bg-[#1A2B4E] text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">거래방식</label>
                  <div className="flex gap-2">
                    {Object.entries(tradeMethods).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedTradeMethod(selectedTradeMethod === key ? 'all' : key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          selectedTradeMethod === key
                            ? 'bg-[#1A2B4E] text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 상품 목록 */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2B4E]"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="text-gray-300 mx-auto mb-4" size={48} />
              <p className="text-gray-500">등록된 상품이 없습니다.</p>
              {user && (
                <Link
                  href="/marketplace/create"
                  className="mt-4 inline-block px-6 py-2 bg-[#1A2B4E] text-white rounded-lg font-medium hover:bg-[#1A2B4E]/90 transition"
                >
                  첫 상품 등록하기
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const isLiked = userLikes.includes(item.id)
                return (
                  <Link
                    key={item.id}
                    href={`/marketplace/${item.id}`}
                    className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition border border-gray-200"
                  >
                    {/* 이미지 */}
                    <div className="relative aspect-square bg-gray-100">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package size={48} />
                        </div>
                      )}
                      {item.status === 'reserved' && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">
                          예약중
                        </div>
                      )}
                      {isLiked && (
                        <div className="absolute top-2 right-2">
                          <Heart className="text-red-500 fill-red-500" size={20} />
                        </div>
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-lg font-bold text-[#1A2B4E] mb-2">
                        {formatPrice(item.price)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin size={12} />
                        <span>{item.sellerRegion}</span>
                        <span>•</span>
                        <span>{conditions[item.condition]}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <span>{formatTime(item.createdAt)}</span>
                        <span>•</span>
                        <span>조회 {item.views || 0}</span>
                        {item.likes > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Heart size={12} />
                              {item.likes}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </MainLayout>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { collection, query, getDocs, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { Package, Heart, Plus, Eye, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'
import MainLayout from '@/components/MainLayout'
import BottomNav from '@/components/BottomNav'

interface MarketplaceItem {
  id: string
  title: string
  price: number
  images: string[]
  status: 'selling' | 'reserved' | 'sold'
  views: number
  likes: number
  createdAt: any
}

export default function MyMarketplacePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'selling' | 'reserved' | 'sold' | 'likes'>('selling')
  const [myItems, setMyItems] = useState<MarketplaceItem[]>([])
  const [likedItems, setLikedItems] = useState<MarketplaceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)
    })

    return () => unsubscribe()
  }, [router])

  // 내 상품 불러오기
  useEffect(() => {
    if (!user || !db) return

    const q = query(
      collection(db, 'marketplace'),
      where('sellerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MarketplaceItem[]
        setMyItems(items)
        setLoading(false)
      },
      (error) => {
        console.error('내 상품 불러오기 오류:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, db])

  // 관심상품 불러오기
  useEffect(() => {
    if (!user || !db) return

    const loadLikedItems = async () => {
      try {
        const itemsSnapshot = await getDocs(collection(db, 'marketplace'))
        const liked: MarketplaceItem[] = []

        for (const itemDoc of itemsSnapshot.docs) {
          let isLiked = false
          try {
            const likesQuery = query(
              collection(db, 'marketplace', itemDoc.id, 'likes'),
              where('userId', '==', user.uid)
            )
            const likesSnap = await getDocs(likesQuery)
            isLiked = !likesSnap.empty
          } catch (error) {
            // 인덱스가 없을 수 있으므로 전체 조회로 fallback
            const likesSnap = await getDocs(collection(db, 'marketplace', itemDoc.id, 'likes'))
            isLiked = likesSnap.docs.some(likeDoc => {
              const data = likeDoc.data()
              return data.userId === user.uid
            })
          }
          
          if (isLiked) {
            liked.push({
              id: itemDoc.id,
              ...itemDoc.data(),
            } as MarketplaceItem)
          }
        }

        setLikedItems(liked)
      } catch (error) {
        console.error('관심상품 불러오기 오류:', error)
      }
    }

    loadLikedItems()
  }, [user, db])

  const handleStatusChange = async (itemId: string, newStatus: 'selling' | 'reserved' | 'sold') => {
    if (!db) return

    try {
      await updateDoc(doc(db, 'marketplace', itemId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(newStatus === 'sold' && { soldAt: serverTimestamp() }),
      })
    } catch (error) {
      console.error('상태 변경 오류:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR') + '원'
  }

  const filteredItems =
    activeTab === 'likes'
      ? likedItems
      : myItems.filter((item) => {
          if (activeTab === 'selling') return item.status === 'selling'
          if (activeTab === 'reserved') return item.status === 'reserved'
          if (activeTab === 'sold') return item.status === 'sold'
          return false
        })

  return (
    <MainLayout>
      <div className="min-h-screen pb-24 bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">내 장터</h1>
              <Link
                href="/marketplace/create"
                className="px-4 py-2 bg-[#1A2B4E] text-white rounded-lg text-sm font-medium hover:bg-[#1A2B4E]/90 transition flex items-center gap-2"
              >
                <Plus size={18} />
                <span>판매하기</span>
              </Link>
            </div>

            {/* 탭 */}
            <div className="flex gap-2">
              {[
                { value: 'selling', label: '판매중', count: myItems.filter((i) => i.status === 'selling').length },
                { value: 'reserved', label: '예약중', count: myItems.filter((i) => i.status === 'reserved').length },
                { value: 'sold', label: '판매완료', count: myItems.filter((i) => i.status === 'sold').length },
                { value: 'likes', label: '관심상품', count: likedItems.length },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value as any)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                    activeTab === tab.value
                      ? 'bg-[#1A2B4E] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1 text-xs opacity-80">({tab.count})</span>
                  )}
                </button>
              ))}
            </div>
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
              <p className="text-gray-500 mb-4">
                {activeTab === 'likes'
                  ? '관심상품이 없습니다.'
                  : activeTab === 'selling'
                  ? '판매중인 상품이 없습니다.'
                  : activeTab === 'reserved'
                  ? '예약중인 상품이 없습니다.'
                  : '판매완료된 상품이 없습니다.'}
              </p>
              {activeTab !== 'likes' && (
                <Link
                  href="/marketplace/create"
                  className="inline-block px-6 py-2 bg-[#1A2B4E] text-white rounded-lg font-medium hover:bg-[#1A2B4E]/90 transition"
                >
                  상품 등록하기
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                  <Link href={`/marketplace/${item.id}`}>
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
                      {item.status === 'sold' && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">판매완료</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-3">
                    <Link href={`/marketplace/${item.id}`}>
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-lg font-bold text-[#1A2B4E] mb-2">
                        {formatPrice(item.price)}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <Eye size={12} />
                      <span>{item.views || 0}</span>
                      <span>•</span>
                      <Heart size={12} />
                      <span>{item.likes || 0}</span>
                    </div>
                    {activeTab === 'selling' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(item.id, 'reserved')}
                          className="flex-1 px-2 py-1 bg-orange-500 text-white rounded text-xs font-medium hover:bg-orange-600 transition"
                        >
                          예약중으로
                        </button>
                        <button
                          onClick={() => handleStatusChange(item.id, 'sold')}
                          className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition"
                        >
                          판매완료
                        </button>
                      </div>
                    )}
                    {activeTab === 'reserved' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(item.id, 'selling')}
                          className="flex-1 px-2 py-1 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 transition"
                        >
                          판매중으로
                        </button>
                        <button
                          onClick={() => handleStatusChange(item.id, 'sold')}
                          className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition"
                        >
                          판매완료
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </MainLayout>
  )
}


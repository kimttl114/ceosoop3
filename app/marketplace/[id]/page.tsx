'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, increment, collection, addDoc, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { ArrowLeft, Heart, MessageCircle, Flag, MapPin, Package, Store, Coffee, Sofa, MoreHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import MainLayout from '@/components/MainLayout'
import BottomNav from '@/components/BottomNav'
import MessageModal from '@/components/MessageModal'

const categories = {
  restaurant: { label: '음식점', icon: Store },
  cafe: { label: '카페', icon: Coffee },
  furniture: { label: '가구/인테리어', icon: Sofa },
  other: { label: '기타', icon: MoreHorizontal },
}

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
  contactMethod: 'message' | 'phone'
  phoneNumber?: string
  status: 'selling' | 'reserved' | 'sold'
  views: number
  likes: number
  createdAt: any
  updatedAt: any
}

export default function MarketplaceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const itemId = params.id as string
  
  const [user, setUser] = useState<any>(null)
  const [item, setItem] = useState<MarketplaceItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  // 상품 정보 불러오기
  useEffect(() => {
    if (!db || !itemId) return

    const loadItem = async () => {
      try {
        const itemRef = doc(db, 'marketplace', itemId)
        const itemSnap = await getDoc(itemRef)

        if (!itemSnap.exists()) {
          alert('상품을 찾을 수 없습니다.')
          router.push('/marketplace')
          return
        }

        const itemData = { id: itemSnap.id, ...itemSnap.data() } as MarketplaceItem
        setItem(itemData)

        // 조회수 증가
        if (itemData.status === 'selling') {
          await updateDoc(itemRef, {
            views: increment(1),
          })
        }

        // 관심상품 확인
        if (user) {
          const likesRef = doc(db, 'marketplace', itemId, 'likes', user.uid)
          const likesSnap = await getDoc(likesRef)
          setIsLiked(likesSnap.exists())
        }
      } catch (error) {
        console.error('상품 불러오기 오류:', error)
        alert('상품을 불러오는데 실패했습니다.')
        router.push('/marketplace')
      } finally {
        setLoading(false)
      }
    }

    loadItem()
  }, [db, itemId, user])

  const handleLike = async () => {
    if (!user || !item || !db) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }

    try {
      const itemRef = doc(db, 'marketplace', itemId)
      const likesQuery = query(
        collection(db, 'marketplace', itemId, 'likes'),
        where('userId', '==', user.uid)
      )
      const likesSnap = await getDocs(likesQuery)

      if (isLiked && !likesSnap.empty) {
        // 관심상품 해제
        for (const likeDoc of likesSnap.docs) {
          await deleteDoc(likeDoc.ref)
        }
        await updateDoc(itemRef, {
          likes: increment(-1),
        })
        setIsLiked(false)
        setItem({ ...item, likes: item.likes - 1 })
      } else if (!isLiked) {
        // 관심상품 등록
        await addDoc(collection(db, 'marketplace', itemId, 'likes'), {
          userId: user.uid,
          createdAt: serverTimestamp(),
        })
        await updateDoc(itemRef, {
          likes: increment(1),
        })
        setIsLiked(true)
        setItem({ ...item, likes: item.likes + 1 })
      }
    } catch (error) {
      console.error('관심상품 처리 오류:', error)
      alert('처리에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!user || !item || !db) return

    if (item.sellerId !== user.uid) {
      alert('본인이 등록한 상품만 삭제할 수 있습니다.')
      return
    }

    if (!confirm('정말 삭제하시겠습니까?')) return

    setIsDeleting(true)
    try {
      await updateDoc(doc(db, 'marketplace', itemId), {
        status: 'sold',
        updatedAt: serverTimestamp(),
      })
      alert('상품이 삭제되었습니다.')
      router.push('/marketplace')
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR') + '원'
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2B4E]"></div>
        </div>
      </MainLayout>
    )
  }

  if (!item) {
    return null
  }

  const categoryInfo = categories[item.category as keyof typeof categories] || categories.other
  const CategoryIcon = categoryInfo.icon

  return (
    <MainLayout>
      <div className="min-h-screen pb-24 bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className={`p-2 rounded-lg transition ${
                  isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <Heart className={isLiked ? 'fill-current' : ''} size={24} />
              </button>
              {user && user.uid === item.sellerId && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                >
                  <X size={24} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 이미지 갤러리 */}
        {item.images && item.images.length > 0 && (
          <div className="relative bg-gray-100">
            <div className="aspect-square max-w-2xl mx-auto relative overflow-hidden">
              <img
                src={item.images[currentImageIndex]}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              {item.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? item.images.length - 1 : prev - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === item.images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {item.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 상품 정보 */}
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* 제목 및 가격 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CategoryIcon size={20} className="text-gray-500" />
              <span className="text-sm text-gray-500">{categoryInfo.label}</span>
              {item.status === 'reserved' && (
                <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">
                  예약중
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h1>
            <p className="text-3xl font-bold text-[#1A2B4E]">{formatPrice(item.price)}</p>
          </div>

          {/* 상품 정보 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">상태</span>
              <span className="font-medium">{conditions[item.condition]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">거래방식</span>
              <span className="font-medium">{tradeMethods[item.tradeMethod]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">거래가능지역</span>
              <span className="font-medium">{item.tradeRegion.join(', ')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">등록일</span>
              <span className="font-medium">{formatTime(item.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">조회수</span>
              <span className="font-medium">{item.views || 0}</span>
            </div>
          </div>

          {/* 설명 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h2 className="font-bold text-gray-900 mb-3">상품 설명</h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{item.description}</p>
          </div>

          {/* 판매자 정보 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h2 className="font-bold text-gray-900 mb-3">판매자 정보</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#1A2B4E] flex items-center justify-center text-white font-bold">
                  {item.sellerName[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.sellerName}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin size={14} />
                    <span>{item.sellerRegion}</span>
                  </div>
                </div>
              </div>
              <Link
                href={`/marketplace/seller/${item.sellerId}`}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                판매자 상품보기
              </Link>
            </div>
          </div>

          {/* 하단 고정 버튼 */}
          {user && user.uid !== item.sellerId && item.status === 'selling' && (
            <div className="fixed bottom-20 left-0 right-0 max-w-2xl mx-auto px-4 pb-4 bg-white border-t border-gray-200 pt-4">
              <div className="flex gap-2">
                {item.contactMethod === 'phone' && item.phoneNumber ? (
                  <a
                    href={`tel:${item.phoneNumber}`}
                    className="flex-1 px-6 py-3 bg-[#1A2B4E] text-white rounded-lg font-bold text-center hover:bg-[#1A2B4E]/90 transition"
                  >
                    전화하기
                  </a>
                ) : (
                  <button
                    onClick={() => setIsMessageModalOpen(true)}
                    className="flex-1 px-6 py-3 bg-[#1A2B4E] text-white rounded-lg font-bold hover:bg-[#1A2B4E]/90 transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={20} />
                    <span>쪽지 보내기</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 쪽지 모달 */}
      {isMessageModalOpen && item && (
        <MessageModal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          receiverId={item.sellerId}
          receiverName={item.sellerName}
          postTitle={`[중고장터] ${item.title}`}
        />
      )}

      <BottomNav />
    </MainLayout>
  )
}


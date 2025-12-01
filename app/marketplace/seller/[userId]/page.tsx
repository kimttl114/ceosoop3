'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { collection, query, getDocs, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { ArrowLeft, Package, MapPin, Shield } from 'lucide-react'
import Link from 'next/link'
import MainLayout from '@/components/MainLayout'
import BottomNav from '@/components/BottomNav'
import VerificationBadge from '@/components/VerificationBadge'

interface MarketplaceItem {
  id: string
  title: string
  price: number
  images: string[]
  status: 'selling' | 'reserved' | 'sold'
  createdAt: any
}

interface SellerInfo {
  displayName?: string
  anonymousName?: string
  region?: string
  isVerified?: boolean
}

export default function SellerProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  const [user, setUser] = useState<any>(null)
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null)
  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!db || !userId) return

    const loadData = async () => {
      try {
        // 판매자 정보 불러오기
        const userRef = doc(db, 'users', userId)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          setSellerInfo(userSnap.data() as SellerInfo)
        }

        // 판매 상품 불러오기
        const q = query(
          collection(db, 'marketplace'),
          where('sellerId', '==', userId),
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
            console.error('상품 불러오기 오류:', error)
            setLoading(false)
          }
        )

        return () => unsubscribe()
      } catch (error) {
        console.error('데이터 불러오기 오류:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [db, userId])

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR') + '원'
  }

  const sellingItems = items.filter((item) => item.status === 'selling')

  return (
    <MainLayout>
      <div className="min-h-screen pb-24 bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">판매자 프로필</h1>
          </div>
        </div>

        {/* 판매자 정보 */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#1A2B4E] flex items-center justify-center text-white font-bold text-xl">
                {(sellerInfo?.anonymousName || sellerInfo?.displayName || 'U')[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {sellerInfo?.anonymousName || sellerInfo?.displayName || '판매자'}
                  </h2>
                  {sellerInfo?.isVerified && <VerificationBadge status="approved" />}
                </div>
                {sellerInfo?.region && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <MapPin size={14} />
                    <span>{sellerInfo.region}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 판매 상품 */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              판매 상품 ({sellingItems.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2B4E]"></div>
            </div>
          ) : sellingItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="text-gray-300 mx-auto mb-4" size={48} />
              <p className="text-gray-500">판매중인 상품이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sellingItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/marketplace/${item.id}`}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition border border-gray-200"
                >
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
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-lg font-bold text-[#1A2B4E]">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </MainLayout>
  )
}


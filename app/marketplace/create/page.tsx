'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db, storage } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { ArrowLeft, Upload, X, MapPin, Package, Store, Coffee, Sofa, MoreHorizontal } from 'lucide-react'
import MainLayout from '@/components/MainLayout'
import BottomNav from '@/components/BottomNav'

const categories = [
  { value: 'restaurant', label: '음식점', icon: Store },
  { value: 'cafe', label: '카페', icon: Coffee },
  { value: 'furniture', label: '가구/인테리어', icon: Sofa },
  { value: 'other', label: '기타', icon: MoreHorizontal },
]

const conditions = [
  { value: 'new', label: '새상품' },
  { value: 'used', label: '중고' },
  { value: 'damaged', label: '하자있음' },
]

const tradeMethods = [
  { value: 'direct', label: '직거래' },
  { value: 'delivery', label: '배송' },
  { value: 'negotiable', label: '협의' },
]

const regions = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
]

export default function CreateMarketplacePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userRegion, setUserRegion] = useState('')
  const [userName, setUserName] = useState('')
  
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('restaurant')
  const [price, setPrice] = useState('')
  const [condition, setCondition] = useState('used')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [tradeMethod, setTradeMethod] = useState('direct')
  const [tradeRegions, setTradeRegions] = useState<string[]>([])
  const [contactMethod, setContactMethod] = useState<'message' | 'phone'>('message')
  const [phoneNumber, setPhoneNumber] = useState('')
  
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!auth || !db) return

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)

      // 사용자 정보 불러오기
      try {
        const { doc, getDoc } = await import('firebase/firestore')
        const userRef = doc(db, 'users', currentUser.uid)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          const userData = userSnap.data()
          setUserRegion(userData.region || '')
          setUserName(userData.anonymousName || userData.displayName || '')
          if (userData.region) {
            setTradeRegions([userData.region])
          }
        }
      } catch (error) {
        console.error('사용자 정보 불러오기 오류:', error)
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files).slice(0, 10 - images.length)
    const newPreviews: string[] = []

    newFiles.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하여야 합니다.')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string)
          if (newPreviews.length === newFiles.length) {
            setImages((prev) => [...prev, ...newFiles])
            setImagePreviews((prev) => [...prev, ...newPreviews])
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 유효성 검사
    if (!title.trim() || title.length < 2 || title.length > 50) {
      setError('제목을 2-50자로 입력해주세요.')
      return
    }

    if (!price || isNaN(Number(price)) || Number(price) < 1) {
      setError('가격을 올바르게 입력해주세요.')
      return
    }

    if (!description.trim() || description.length < 20) {
      setError('상품 설명을 20자 이상 입력해주세요.')
      return
    }

    if (images.length === 0) {
      setError('최소 1장의 이미지를 업로드해주세요.')
      return
    }

    if (tradeRegions.length === 0) {
      setError('거래 가능 지역을 선택해주세요.')
      return
    }

    if (contactMethod === 'phone' && !phoneNumber.trim()) {
      setError('전화번호를 입력해주세요.')
      return
    }

    setUploading(true)

    try {
      // 이미지 업로드
      const imageUrls: string[] = []
      for (const image of images) {
        const imageRef = ref(storage, `marketplace/${user.uid}/${Date.now()}_${image.name}`)
        await uploadBytes(imageRef, image)
        const url = await getDownloadURL(imageRef)
        imageUrls.push(url)
      }

      // Firestore에 저장
      const itemData = {
        title: title.trim(),
        description: description.trim(),
        category,
        price: Number(price),
        condition,
        images: imageUrls,
        sellerId: user.uid,
        sellerName: userName,
        sellerRegion: userRegion,
        tradeMethod,
        tradeRegion: tradeRegions,
        contactMethod,
        phoneNumber: contactMethod === 'phone' ? phoneNumber.trim() : '',
        status: 'selling',
        views: 0,
        likes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await addDoc(collection(db, 'marketplace'), itemData)

      alert('상품이 등록되었습니다!')
      router.push('/marketplace')
    } catch (error: any) {
      console.error('상품 등록 오류:', error)
      setError('상품 등록에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen pb-24 bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">상품 등록</h1>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상품 이미지 <span className="text-red-500">*</span>
              <span className="text-gray-500 text-xs ml-2">(최소 1장, 최대 10장)</span>
            </label>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#1A2B4E] transition">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="text-center">
                    <Upload size={24} className="text-gray-400 mx-auto mb-1" />
                    <span className="text-xs text-gray-500">추가</span>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="상품명을 입력하세요"
              maxLength={50}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E]"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/50</p>
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                      category === cat.value
                        ? 'border-[#1A2B4E] bg-[#1A2B4E] text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-xs font-medium">{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 가격 및 상태 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                가격 (원) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태 <span className="text-red-500">*</span>
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E]"
                required
              >
                {conditions.map((cond) => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상품 설명 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상품의 상태, 구매 시기, 하자 여부 등을 자세히 설명해주세요"
              rows={6}
              minLength={20}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E] resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/최소 20자</p>
          </div>

          {/* 거래 방식 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              거래 방식 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {tradeMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setTradeMethod(method.value)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    tradeMethod === method.value
                      ? 'bg-[#1A2B4E] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* 거래 가능 지역 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              거래 가능 지역 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {regions.map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => {
                    if (tradeRegions.includes(region)) {
                      setTradeRegions(tradeRegions.filter((r) => r !== region))
                    } else {
                      setTradeRegions([...tradeRegions, region])
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    tradeRegions.includes(region)
                      ? 'bg-[#1A2B4E] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* 연락 방법 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              연락 방법 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setContactMethod('message')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  contactMethod === 'message'
                    ? 'bg-[#1A2B4E] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                쪽지
              </button>
              <button
                type="button"
                onClick={() => setContactMethod('phone')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  contactMethod === 'phone'
                    ? 'bg-[#1A2B4E] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전화번호
              </button>
            </div>
            {contactMethod === 'phone' && (
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="010-1234-5678"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E]"
                required={contactMethod === 'phone'}
              />
            )}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* 제출 버튼 */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 -mb-6">
            <button
              type="submit"
              disabled={uploading}
              className="w-full px-6 py-3 bg-[#1A2B4E] text-white rounded-lg font-bold hover:bg-[#1A2B4E]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? '등록 중...' : '상품 등록하기'}
            </button>
          </div>
        </form>
      </div>

      <BottomNav />
    </MainLayout>
  )
}


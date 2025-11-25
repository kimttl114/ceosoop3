'use client'

import { useState, useEffect } from 'react'
import { Upload, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { saveVerificationData } from '@/lib/verification'

export default function VerifyPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    representativeName: '',
    openingDate: '',
    businessNumber: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState<'form' | 'verifying' | 'success'>('form')

  // 로그인 상태 확인
  useEffect(() => {
    if (!auth) return

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.push('/')
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 이미지 파일만 허용
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드 가능합니다.')
        return
      }
      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('파일 크기는 5MB 이하여야 합니다.')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const formatBusinessNumber = (value: string) => {
    // 숫자만 입력받고 10자리로 제한
    const numbers = value.replace(/\D/g, '').slice(0, 10)
    return numbers
  }

  const formatOpeningDate = (value: string) => {
    // 숫자만 입력받고 8자리로 제한 (YYYYMMDD)
    const numbers = value.replace(/\D/g, '').slice(0, 8)
    return numbers
  }

  const validateForm = () => {
    if (!formData.representativeName.trim()) {
      setError('대표자 성명을 입력해주세요.')
      return false
    }
    if (!formData.openingDate || formData.openingDate.length !== 8) {
      setError('개업일자를 올바르게 입력해주세요. (YYYYMMDD)')
      return false
    }
    if (!formData.businessNumber || formData.businessNumber.length !== 10) {
      setError('사업자등록번호를 올바르게 입력해주세요. (10자리)')
      return false
    }
    if (!imageFile) {
      setError('사업자등록증 사진을 업로드해주세요.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setStep('verifying')

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('representativeName', formData.representativeName)
      formDataToSend.append('openingDate', formData.openingDate)
      formDataToSend.append('businessNumber', formData.businessNumber)
      formDataToSend.append('image', imageFile!)

      const response = await fetch('/api/verify', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '인증에 실패했습니다.')
      }

      // Firebase에 인증 정보 저장
      if (!user?.uid) {
        throw new Error('로그인이 필요합니다.')
      }

      const saveResult = await saveVerificationData(user.uid, {
        businessNumber: formData.businessNumber,
        representativeName: formData.representativeName,
        openingDate: formData.openingDate,
      })

      if (!saveResult.success) {
        throw new Error(saveResult.error || '인증 정보 저장에 실패했습니다.')
      }

      setSuccess(true)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증 중 오류가 발생했습니다.')
      setStep('form')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-light-gray flex items-center justify-center p-4">
        <div className="max-w-[430px] w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={48} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-deep-navy mb-2">사장님 환영합니다!</h2>
          <p className="text-gray-600 mb-6">사업자 인증이 완료되었습니다.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-deep-navy text-white py-3 rounded-lg font-semibold hover:bg-deep-navy/90 transition"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-gray">
      <div className="max-w-[430px] mx-auto bg-white min-h-screen">
        {/* 헤더 */}
        <header className="sticky top-0 z-50 bg-deep-navy text-white shadow-md">
          <div className="flex items-center px-4 py-3">
            <button
              onClick={() => router.back()}
              className="mr-3 p-2 hover:bg-white/10 rounded-full transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">사업자 인증</h1>
          </div>
        </header>

        {/* 본문 */}
        <main className="p-4 pb-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-deep-navy mb-2">사업자 정보를 입력해주세요</h2>
            <p className="text-sm text-gray-600">
              정확한 정보 입력을 위해 사업자등록증을 준비해주세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 대표자 성명 */}
            <div>
              <label htmlFor="representativeName" className="block text-sm font-medium text-deep-navy mb-2">
                대표자 성명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="representativeName"
                name="representativeName"
                value={formData.representativeName}
                onChange={handleInputChange}
                placeholder="홍길동"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-navy focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            {/* 개업일자 */}
            <div>
              <label htmlFor="openingDate" className="block text-sm font-medium text-deep-navy mb-2">
                개업일자 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="openingDate"
                name="openingDate"
                value={formData.openingDate}
                onChange={(e) => {
                  const formatted = formatOpeningDate(e.target.value)
                  setFormData((prev) => ({ ...prev, openingDate: formatted }))
                }}
                placeholder="20240101"
                maxLength={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-navy focus:border-transparent"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">YYYYMMDD 형식으로 입력 (예: 20240101)</p>
            </div>

            {/* 사업자등록번호 */}
            <div>
              <label htmlFor="businessNumber" className="block text-sm font-medium text-deep-navy mb-2">
                사업자등록번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="businessNumber"
                name="businessNumber"
                value={formData.businessNumber}
                onChange={(e) => {
                  const formatted = formatBusinessNumber(e.target.value)
                  setFormData((prev) => ({ ...prev, businessNumber: formatted }))
                }}
                placeholder="1234567890"
                maxLength={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-navy focus:border-transparent"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">숫자 10자리 입력</p>
            </div>

            {/* 사업자등록증 사진 업로드 */}
            <div>
              <label className="block text-sm font-medium text-deep-navy mb-2">
                사업자등록증 사진 <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-deep-navy transition">
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isLoading}
                />
                <label
                  htmlFor="imageUpload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  {imagePreview ? (
                    <div className="mb-4">
                      <img
                        src={imagePreview}
                        alt="사업자등록증 미리보기"
                        className="max-w-full max-h-64 mx-auto rounded-lg border border-gray-300"
                      />
                    </div>
                  ) : (
                    <div className="mb-4">
                      <Upload className="text-gray-400 mx-auto mb-2" size={48} />
                      <p className="text-sm text-gray-600">사진을 업로드하세요</p>
                    </div>
                  )}
                  <span className="text-sm text-amber-gold font-medium">
                    {imageFile ? '다른 사진 선택' : '사진 선택'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">최대 5MB, JPG/PNG 형식</p>
                </label>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* 인증 단계 표시 */}
            {step === 'verifying' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="text-blue-600 animate-spin" size={20} />
                  <p className="text-sm font-medium text-blue-900">인증 진행 중...</p>
                </div>
                <div className="space-y-2 text-xs text-blue-700">
                  <p>1단계: 국세청 정보 확인 중...</p>
                  <p>2단계: 사업자등록증 검증 중...</p>
                </div>
              </div>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-deep-navy text-white py-4 rounded-lg font-semibold hover:bg-deep-navy/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>인증 중...</span>
                </>
              ) : (
                '인증하기'
              )}
            </button>
          </form>

          {/* 안내 사항 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-deep-navy mb-2">안내사항</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 입력하신 정보는 국세청 API를 통해 검증됩니다.</li>
              <li>• 업로드한 사업자등록증은 AI를 통해 자동으로 검증됩니다.</li>
              <li>• 인증 완료 후에는 정보 수정이 제한됩니다.</li>
              <li>• 개인정보는 안전하게 보호됩니다.</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  )
}


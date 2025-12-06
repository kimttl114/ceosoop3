'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Printer, Eye, EyeOff, Copy, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface WifiInfo {
  storeName: string
  ssid: string
  password: string
  encryption: 'WPA' | 'WEP' | 'nopass'
  message: string
}

type Template = 'blue' | 'green' | 'purple' | 'black'

const templates = {
  blue: {
    name: '심플 블루',
    emoji: '🔵',
    bg: 'from-blue-500 to-cyan-500',
    textColor: 'text-white',
    accentBg: 'bg-white/20',
  },
  green: {
    name: '카페 그린',
    emoji: '☕',
    bg: 'from-green-600 to-emerald-600',
    textColor: 'text-white',
    accentBg: 'bg-white/20',
  },
  purple: {
    name: '고급 퍼플',
    emoji: '💎',
    bg: 'from-purple-600 to-pink-600',
    textColor: 'text-white',
    accentBg: 'bg-white/20',
  },
  black: {
    name: '모던 블랙',
    emoji: '⚫',
    bg: 'from-gray-800 to-gray-900',
    textColor: 'text-white',
    accentBg: 'bg-white/10',
  },
}

export default function WifiQRPage() {
  const router = useRouter()
  const posterRef = useRef<HTMLDivElement>(null)
  
  const [step, setStep] = useState<1 | 2>(1)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template>('blue')
  
  const [wifiInfo, setWifiInfo] = useState<WifiInfo>({
    storeName: '',
    ssid: '',
    password: '',
    encryption: 'WPA',
    message: '편하게 쓰세요! 😊',
  })

  // 와이파이 QR 코드 생성 포맷
  const generateWifiQRString = () => {
    const { ssid, password, encryption } = wifiInfo
    
    if (encryption === 'nopass') {
      return `WIFI:T:nopass;S:${ssid};;`
    }
    
    return `WIFI:T:${encryption};S:${ssid};P:${password};;`
  }

  // PDF 다운로드
  const handleDownloadPDF = async () => {
    if (!posterRef.current) return

    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 3,
        backgroundColor: null,
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`${wifiInfo.storeName || '와이파이'}_QR포스터.pdf`)
      
      alert('PDF 다운로드 완료!')
    } catch (error) {
      console.error('PDF 생성 오류:', error)
      alert('PDF 생성 중 오류가 발생했습니다.')
    }
  }

  // PNG 이미지 다운로드
  const handleDownloadImage = async () => {
    if (!posterRef.current) return

    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 3,
        backgroundColor: null,
        logging: false,
      })

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${wifiInfo.storeName || '와이파이'}_QR포스터.png`
          link.click()
          URL.revokeObjectURL(url)
          alert('이미지 다운로드 완료!')
        }
      })
    } catch (error) {
      console.error('이미지 생성 오류:', error)
      alert('이미지 생성 중 오류가 발생했습니다.')
    }
  }

  // 프린트
  const handlePrint = () => {
    window.print()
  }

  // SSID 복사
  const handleCopySSID = () => {
    navigator.clipboard.writeText(wifiInfo.ssid)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 다음 단계로
  const handleNext = () => {
    if (!wifiInfo.storeName.trim()) {
      alert('매장명을 입력해주세요.')
      return
    }
    if (!wifiInfo.ssid.trim()) {
      alert('네트워크 이름(SSID)을 입력해주세요.')
      return
    }
    if (wifiInfo.encryption !== 'nopass' && !wifiInfo.password.trim()) {
      alert('비밀번호를 입력해주세요.')
      return
    }
    
    setStep(2)
  }

  const template = templates[selectedTemplate]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-24">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => step === 2 ? setStep(1) : router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">📶 매장 와이파이 QR 생성기</h1>
            <p className="text-xs text-gray-500">
              {step === 1 ? 'Step 1. 정보 입력' : 'Step 2. 디자인 선택 & 다운로드'}
            </p>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {step === 1 ? (
          // Step 1: 정보 입력
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <span>📝</span>
              <span>와이파이 정보 입력</span>
            </h2>

            <div className="space-y-6">
              {/* 매장명 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  🏪 매장명 *
                </label>
                <input
                  type="text"
                  value={wifiInfo.storeName}
                  onChange={(e) => setWifiInfo({ ...wifiInfo, storeName: e.target.value })}
                  placeholder="예: 카페 드 사장님"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900"
                  maxLength={30}
                />
              </div>

              {/* SSID */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  📶 네트워크 이름 (SSID) *
                </label>
                <input
                  type="text"
                  value={wifiInfo.ssid}
                  onChange={(e) => setWifiInfo({ ...wifiInfo, ssid: e.target.value })}
                  placeholder="예: CafeDeCEO_Guest"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 font-mono"
                  maxLength={32}
                />
                <p className="text-xs text-gray-500 mt-1">
                  ℹ️ 대소문자를 구분합니다. 공유기 설정에서 확인하세요.
                </p>
              </div>

              {/* 암호화 방식 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  🔒 암호화 방식 *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="encryption"
                      value="WPA"
                      checked={wifiInfo.encryption === 'WPA'}
                      onChange={(e) => setWifiInfo({ ...wifiInfo, encryption: e.target.value as 'WPA' })}
                      className="w-5 h-5"
                    />
                    <div>
                      <div className="font-bold text-gray-900">WPA/WPA2/WPA3</div>
                      <div className="text-xs text-gray-500">(추천) 가장 많이 사용하는 방식</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="encryption"
                      value="WEP"
                      checked={wifiInfo.encryption === 'WEP'}
                      onChange={(e) => setWifiInfo({ ...wifiInfo, encryption: e.target.value as 'WEP' })}
                      className="w-5 h-5"
                    />
                    <div>
                      <div className="font-bold text-gray-900">WEP</div>
                      <div className="text-xs text-gray-500">구형 공유기</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="encryption"
                      value="nopass"
                      checked={wifiInfo.encryption === 'nopass'}
                      onChange={(e) => setWifiInfo({ ...wifiInfo, encryption: e.target.value as 'nopass' })}
                      className="w-5 h-5"
                    />
                    <div>
                      <div className="font-bold text-gray-900">암호화 없음</div>
                      <div className="text-xs text-gray-500">비밀번호 없는 공개 와이파이</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 비밀번호 */}
              {wifiInfo.encryption !== 'nopass' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🔑 비밀번호 *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={wifiInfo.password}
                      onChange={(e) => setWifiInfo({ ...wifiInfo, password: e.target.value })}
                      placeholder="와이파이 비밀번호"
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 font-mono"
                      maxLength={63}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              )}

              {/* 추가 메시지 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  💬 추가 메시지 (선택사항)
                </label>
                <input
                  type="text"
                  value={wifiInfo.message}
                  onChange={(e) => setWifiInfo({ ...wifiInfo, message: e.target.value })}
                  placeholder="예: 편하게 쓰세요!"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900"
                  maxLength={50}
                />
              </div>

              {/* 다음 버튼 */}
              <button
                onClick={handleNext}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-lg font-black rounded-xl hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
              >
                다음 단계 →
              </button>
            </div>

            {/* 프로 팁 */}
            <div className="mt-8 bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>💡</span>
                <span>프로 팁</span>
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ SSID는 대소문자를 구분하니 정확히 입력하세요</li>
                <li>✅ 특수문자가 포함된 비밀번호도 가능합니다</li>
                <li>✅ 추가 메시지로 매장 분위기를 표현하세요</li>
                <li>✅ 월 1회 비밀번호를 바꾸면 보안이 강화됩니다</li>
              </ul>
            </div>
          </div>
        ) : (
          // Step 2: 템플릿 선택 & 미리보기
          <div className="space-y-6">
            {/* 템플릿 선택 */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 print:hidden">
              <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <span>🎨</span>
                <span>디자인 선택</span>
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(Object.keys(templates) as Template[]).map((key) => {
                  const t = templates[key]
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedTemplate(key)}
                      className={`p-6 rounded-2xl border-4 transition ${
                        selectedTemplate === key
                          ? 'border-blue-500 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-5xl mb-3">{t.emoji}</div>
                      <div className="font-bold text-gray-900">{t.name}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 미리보기 */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2 print:hidden">
                <span>👀</span>
                <span>미리보기</span>
              </h2>

              {/* A4 포스터 */}
              <div className="flex justify-center mb-6">
                <div
                  ref={posterRef}
                  className={`w-[210mm] h-[297mm] bg-gradient-to-br ${template.bg} ${template.textColor} p-12 flex flex-col items-center justify-center shadow-2xl`}
                  style={{ aspectRatio: '210/297' }}
                >
                  {/* 타이틀 */}
                  <div className="text-4xl font-black mb-4">
                    📶 Free Wi-Fi
                  </div>

                  {/* 매장명 */}
                  <div className="text-3xl font-bold mb-8">
                    {wifiInfo.storeName}
                  </div>

                  {/* QR 코드 */}
                  <div className="bg-white p-8 rounded-3xl shadow-2xl mb-8">
                    <QRCodeSVG
                      value={generateWifiQRString()}
                      size={280}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  {/* 안내 문구 */}
                  <div className={`${template.accentBg} backdrop-blur-sm rounded-2xl p-6 mb-8 text-center`}>
                    <div className="text-2xl font-bold mb-2">
                      📱 카메라로 찍으면
                    </div>
                    <div className="text-2xl font-bold">
                      자동으로 연결됩니다!
                    </div>
                  </div>

                  {/* 추가 메시지 */}
                  {wifiInfo.message && (
                    <div className="text-2xl font-bold mb-8">
                      {wifiInfo.message}
                    </div>
                  )}

                  {/* 구분선 */}
                  <div className="w-full h-1 bg-white/30 mb-6" />

                  {/* 세부 정보 */}
                  <div className="text-lg space-y-2 text-center font-mono">
                    <div className="flex items-center gap-2 justify-center">
                      <span className="font-bold">SSID:</span>
                      <span>{wifiInfo.ssid}</span>
                    </div>
                    {wifiInfo.encryption !== 'nopass' && (
                      <div className="flex items-center gap-2 justify-center">
                        <span className="font-bold">PW:</span>
                        <span>{wifiInfo.password}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 다운로드 버튼 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
                <button
                  onClick={handleDownloadPDF}
                  className="py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-pink-700 transition shadow-lg flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  <span>PDF 다운로드</span>
                </button>
                <button
                  onClick={handleDownloadImage}
                  className="py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition shadow-lg flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  <span>이미지 저장</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition shadow-lg flex items-center justify-center gap-2"
                >
                  <Printer size={20} />
                  <span>프린트</span>
                </button>
              </div>
            </div>

            {/* 사용 가이드 */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl shadow-2xl p-8 text-white print:hidden">
              <h3 className="text-2xl font-black mb-4 flex items-center gap-2">
                <span>📌</span>
                <span>사용 가이드</span>
              </h3>
              <div className="space-y-3 text-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">1️⃣</span>
                  <span><strong>다운로드</strong> - PDF 또는 이미지로 저장하세요</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">2️⃣</span>
                  <span><strong>프린트</strong> - A4 용지에 컬러로 출력하세요</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">3️⃣</span>
                  <span><strong>코팅</strong> - 오래 사용하려면 코팅하세요</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">4️⃣</span>
                  <span><strong>부착</strong> - 눈높이 (테이블, 카운터, 입구)에 붙이세요</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">5️⃣</span>
                  <span><strong>완료!</strong> - 이제 손님이 QR로 편하게 연결합니다!</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 프린트용 스타일 */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}


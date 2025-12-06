'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertTriangle, CheckCircle, ShieldAlert, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function IdCheckPage() {
  const router = useRouter()
  const [birthInput, setBirthInput] = useState('')
  const [result, setResult] = useState<'pass' | 'fail' | null>(null)
  const [age, setAge] = useState<number | null>(null)
  const [minBirthYear, setMinBirthYear] = useState('')
  const [minBirthDate, setMinBirthDate] = useState('')

  // 만 19세 계산
  useEffect(() => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1
    const currentDay = today.getDate()
    
    // 만 19세가 되려면: 현재년도 - 19년 이전에 태어나야 함
    const minYear = currentYear - 19
    const minDate = `${minYear}년 ${currentMonth}월 ${currentDay}일`
    const minYearOnly = `${minYear}`
    
    setMinBirthYear(minYearOnly)
    setMinBirthDate(minDate)
  }, [])

  // 생년월일 입력 처리 (YYMMDD 형식)
  const handleInputChange = (value: string) => {
    // 숫자만 입력 가능
    const numbers = value.replace(/[^0-9]/g, '')
    
    // 최대 6자리
    if (numbers.length <= 6) {
      setBirthInput(numbers)
      
      // 6자리 입력 완료시 자동 검증
      if (numbers.length === 6) {
        checkAge(numbers)
      } else {
        setResult(null)
        setAge(null)
      }
    }
  }

  // 나이 검증
  const checkAge = (birth: string) => {
    if (birth.length !== 6) return

    try {
      const year = parseInt(birth.substring(0, 2))
      const month = parseInt(birth.substring(2, 4))
      const day = parseInt(birth.substring(4, 6))

      // 월, 일 유효성 검사
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        alert('올바른 생년월일을 입력해주세요.')
        setBirthInput('')
        return
      }

      // 2000년대생 판단 (00-23은 2000년대, 24-99는 1900년대)
      const fullYear = year >= 0 && year <= 23 ? 2000 + year : 1900 + year

      const today = new Date()
      const birthDate = new Date(fullYear, month - 1, day)
      
      // 만 나이 계산
      let calculatedAge = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      const dayDiff = today.getDate() - birthDate.getDate()
      
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        calculatedAge--
      }

      setAge(calculatedAge)

      // 만 19세 이상인지 확인
      if (calculatedAge >= 19) {
        setResult('pass')
        // 성공 사운드 (옵션)
        playSuccessSound()
      } else {
        setResult('fail')
        // 경고 사운드
        playWarningSound()
      }
    } catch (error) {
      console.error('나이 계산 오류:', error)
      alert('올바른 생년월일을 입력해주세요.')
      setBirthInput('')
    }
  }

  // 경고음 재생 (미성년자)
  const playWarningSound = () => {
    const audio = new Audio('/sounds/warning.mp3')
    audio.play().catch(() => {
      // 사운드 파일이 없어도 계속 진행
      console.log('Warning sound not available')
    })
  }

  // 성공음 재생 (성인)
  const playSuccessSound = () => {
    const audio = new Audio('/sounds/success.mp3')
    audio.play().catch(() => {
      console.log('Success sound not available')
    })
  }

  // 초기화
  const handleReset = () => {
    setBirthInput('')
    setResult(null)
    setAge(null)
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      result === 'pass' ? 'bg-green-600' : 
      result === 'fail' ? 'bg-red-600' : 
      'bg-gradient-to-br from-blue-50 to-indigo-50'
    }`}>
      {/* 헤더 */}
      {!result && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">미성년자 출입 방어기</h1>
              <p className="text-xs text-gray-500">ID Pass Checker</p>
            </div>
          </div>
        </header>
      )}

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!result ? (
            // 입력 화면
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* 기준 안내 */}
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl p-8 mb-8 text-white shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldAlert size={40} />
                  <div>
                    <h2 className="text-2xl font-black">오늘 판매 가능 기준</h2>
                    <p className="text-sm opacity-90">현재 날짜 기준 자동 계산</p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-4">
                  <p className="text-5xl font-black text-center mb-2">
                    {minBirthYear}년생 이전
                  </p>
                  <p className="text-xl text-center opacity-90">
                    ({minBirthDate} 이전 출생자)
                  </p>
                </div>
                <p className="text-center text-lg font-bold">
                  ⚠️ 위 기준 이후 출생자는 절대 판매 금지!
                </p>
              </div>

              {/* 입력 영역 */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-black text-gray-900 mb-2">
                    생년월일 입력
                  </h3>
                  <p className="text-gray-600">
                    신분증의 생년월일 6자리를 입력하세요
                  </p>
                </div>

                {/* 입력 박스 */}
                <div className="mb-6">
                  <div className="flex justify-center gap-2 mb-2">
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-1">년</div>
                      <div className="w-16 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-4xl font-black text-gray-800 border-4 border-gray-300">
                        {birthInput[0] || '-'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-1">년</div>
                      <div className="w-16 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-4xl font-black text-gray-800 border-4 border-gray-300">
                        {birthInput[1] || '-'}
                      </div>
                    </div>
                    <div className="text-4xl font-black text-gray-400 flex items-end pb-2">/</div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-1">월</div>
                      <div className="w-16 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-4xl font-black text-gray-800 border-4 border-gray-300">
                        {birthInput[2] || '-'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-1">월</div>
                      <div className="w-16 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-4xl font-black text-gray-800 border-4 border-gray-300">
                        {birthInput[3] || '-'}
                      </div>
                    </div>
                    <div className="text-4xl font-black text-gray-400 flex items-end pb-2">/</div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-1">일</div>
                      <div className="w-16 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-4xl font-black text-gray-800 border-4 border-gray-300">
                        {birthInput[4] || '-'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-1">일</div>
                      <div className="w-16 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-4xl font-black text-gray-800 border-4 border-gray-300">
                        {birthInput[5] || '-'}
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-500">
                    예시: 2000년 1월 1일생 → 000101
                  </p>
                </div>

                {/* 숫자 키패드 */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleInputChange(birthInput + num)}
                      className="h-16 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-3xl font-black rounded-xl shadow-lg active:scale-95 transition"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={handleReset}
                    className="h-16 bg-gray-300 hover:bg-gray-400 text-gray-700 text-lg font-bold rounded-xl shadow-lg active:scale-95 transition"
                  >
                    초기화
                  </button>
                  <button
                    onClick={() => handleInputChange(birthInput + '0')}
                    className="h-16 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-3xl font-black rounded-xl shadow-lg active:scale-95 transition"
                  >
                    0
                  </button>
                  <button
                    onClick={() => handleInputChange(birthInput.slice(0, -1))}
                    className="h-16 bg-red-500 hover:bg-red-600 text-white text-lg font-bold rounded-xl shadow-lg active:scale-95 transition"
                  >
                    ←
                  </button>
                </div>

                {/* 직접 입력 */}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={birthInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="000101"
                  maxLength={6}
                  className="w-full px-6 py-4 text-2xl font-bold text-center border-4 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 신분증 검사 가이드 */}
              <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">📋 신분증 검사 체크리스트</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>✅ 주민등록증 뒷면에 빛을 비춰 <strong>홀로그램</strong> 확인</li>
                      <li>✅ 사진과 실물이 일치하는지 확인</li>
                      <li>✅ 훼손, 변조 흔적이 없는지 확인</li>
                      <li>✅ 신분증 유효기간 확인 (만료된 증명서는 무효)</li>
                      <li>⚠️ <strong>의심스러우면 절대 판매하지 마세요!</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            // 결과 화면
            <motion.div
              key="result"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="min-h-[80vh] flex flex-col items-center justify-center"
            >
              {result === 'pass' ? (
                // 판매 가능 (초록색)
                <div className="text-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  >
                    <CheckCircle size={200} className="text-white mx-auto mb-8" strokeWidth={3} />
                  </motion.div>
                  <h2 className="text-8xl font-black text-white mb-6 drop-shadow-2xl">
                    판매 가능
                  </h2>
                  <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 mb-8">
                    <p className="text-4xl font-bold text-white mb-2">만 {age}세</p>
                    <p className="text-2xl text-white/90">성인 인증 완료</p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-12 py-6 bg-white text-green-600 text-2xl font-black rounded-2xl shadow-2xl hover:bg-green-50 active:scale-95 transition"
                  >
                    다음 손님 확인하기
                  </button>
                </div>
              ) : (
                // 판매 금지 (빨간색)
                <div className="text-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, -10, 10, 0],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                    }}
                  >
                    <AlertTriangle size={200} className="text-white mx-auto mb-8" strokeWidth={3} />
                  </motion.div>
                  <motion.h2
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 0.3,
                      repeat: Infinity,
                    }}
                    className="text-8xl font-black text-white mb-6 drop-shadow-2xl"
                  >
                    판매 금지
                  </motion.h2>
                  <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 mb-4">
                    <p className="text-5xl font-bold text-white mb-2">삐 삐 삐</p>
                    <p className="text-3xl text-white mb-4">만 {age}세</p>
                    <p className="text-2xl text-white/90 font-bold">
                      ⚠️ 미성년자입니다 ⚠️
                    </p>
                  </div>
                  <div className="bg-yellow-500 rounded-2xl p-6 mb-8 max-w-2xl">
                    <p className="text-xl font-bold text-red-900">
                      🚨 절대 판매하지 마세요!<br />
                      영업정지 대상입니다!
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-12 py-6 bg-white text-red-600 text-2xl font-black rounded-2xl shadow-2xl hover:bg-red-50 active:scale-95 transition"
                  >
                    다음 손님 확인하기
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}


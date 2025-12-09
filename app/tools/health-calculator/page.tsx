'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  healthQuestions, 
  calculateHealthResult,
  industryAverages,
  type HealthQuestion,
  type HealthResult
} from '@/lib/healthQuestions'
import { ArrowLeft, ArrowRight, Share2, AlertTriangle, Heart, TrendingDown } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function HealthCalculatorPage() {
  const router = useRouter()
  const [step, setStep] = useState<'intro' | 'questions' | 'result'>('intro')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [age, setAge] = useState<number>(35)
  const [industry, setIndustry] = useState<string>('기타')
  const [result, setResult] = useState<HealthResult | null>(null)

  const currentQuestion = healthQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / healthQuestions.length) * 100

  const handleStart = () => {
    if (age < 20 || age > 80) {
      toast.error('나이를 20-80세 사이로 입력해주세요')
      return
    }
    setStep('questions')
  }

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers, score]
    setAnswers(newAnswers)

    if (currentQuestionIndex < healthQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // 결과 계산
      const totalScore = newAnswers.reduce((sum, score) => sum + score, 0)
      const calculatedResult = calculateHealthResult(totalScore, age)
      setResult(calculatedResult)
      setStep('result')
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setAnswers(answers.slice(0, -1))
    } else {
      setStep('intro')
    }
  }

  const handleRestart = () => {
    setStep('intro')
    setCurrentQuestionIndex(0)
    setAnswers([])
    setAge(35)
    setIndustry('기타')
    setResult(null)
  }

  const handleShare = () => {
    if (!result) return
    
    const text = `💀 사장님 건강 수명 계산기 결과\n\n신체 나이: ${result.bodyAge}\n레벨: ${result.title}\n\n당신도 테스트해보세요!`
    
    if (navigator.share) {
      navigator.share({
        title: '사장님 건강 수명 계산기',
        text: text,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text + '\n' + window.location.href)
      toast.success('링크가 복사되었습니다!')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white pb-24">
      {/* 헤더 */}
      <header className="bg-black/50 backdrop-blur-sm sticky top-0 z-30 border-b border-red-500/30">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => step === 'intro' ? router.push('/tools') : handleRestart()}
            className="p-2 hover:bg-white/10 rounded-full transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            💀 건강 수명 계산기
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* 인트로 */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 타이틀 */}
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="text-8xl"
                >
                  💀
                </motion.div>
                <h2 className="text-3xl font-black">이러다 죽어</h2>
                <p className="text-red-300 text-lg">
                  사장님 건강 수명 계산기
                </p>
                <p className="text-gray-400 text-sm">
                  "맨날 밤새우고 튀김 냄새 맡는데<br />
                  내 몸 괜찮을까?"
                </p>
              </div>

              {/* 입력 폼 */}
              <div className="bg-black/30 rounded-2xl p-6 border border-red-500/30 space-y-6">
                {/* 나이 입력 */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-red-300">
                    나이
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl font-bold focus:outline-none focus:border-red-500"
                    min="20"
                    max="80"
                  />
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    실제 나이를 입력하세요 (20-80세)
                  </p>
                </div>

                {/* 업종 선택 */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-red-300">
                    업종
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-red-500"
                  >
                    {Object.keys(industryAverages).map((ind) => (
                      <option key={ind} value={ind} className="bg-gray-900">
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 경고 */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-400 flex-shrink-0 mt-1" size={20} />
                  <div className="text-sm text-red-300">
                    <p className="font-bold mb-1">⚠️ 경고</p>
                    <p>이 테스트 결과는 참고용입니다.</p>
                    <p>실제 건강 상태는 전문의와 상담하세요.</p>
                  </div>
                </div>
              </div>

              {/* 시작 버튼 */}
              <motion.button
                onClick={handleStart}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-2xl font-black text-xl shadow-2xl shadow-red-500/50 transition-all"
              >
                💀 충격 받을 준비 됐나요?
              </motion.button>

              <p className="text-center text-xs text-gray-500">
                10개 질문 | 약 2분 소요
              </p>
            </motion.div>
          )}

          {/* 질문 */}
          {step === 'questions' && currentQuestion && (
            <motion.div
              key={`question-${currentQuestionIndex}`}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="space-y-6"
            >
              {/* 프로그레스 바 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    질문 {currentQuestionIndex + 1}/{healthQuestions.length}
                  </span>
                  <span className="text-red-400 font-bold">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-red-500 to-rose-500"
                  />
                </div>
              </div>

              {/* 카테고리 */}
              <div className="inline-flex items-center gap-2 bg-red-500/20 px-4 py-2 rounded-full">
                <span className="text-2xl">{currentQuestion.emoji}</span>
                <span className="text-sm font-bold text-red-300">
                  {currentQuestion.category}
                </span>
              </div>

              {/* 질문 */}
              <div className="bg-black/30 rounded-2xl p-6 border border-red-500/30">
                <h3 className="text-2xl font-bold mb-6 text-center">
                  {currentQuestion.question}
                </h3>

                {/* 선택지 */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleAnswer(option.score)}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full text-left p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 rounded-xl transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium group-hover:text-red-300 transition-colors">
                          {option.text}
                        </span>
                        {option.score >= 10 && (
                          <span className="text-red-500 text-xl">⚠️</span>
                        )}
                      </div>
                      {option.warning && (
                        <p className="text-xs text-gray-400 mt-1">
                          {option.warning}
                        </p>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* 이전 버튼 */}
              <button
                onClick={handlePrevious}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                <span className="text-sm">이전 질문</span>
              </button>
            </motion.div>
          )}

          {/* 결과 */}
          {step === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* 결과 카드 */}
              <div className={`bg-gradient-to-br ${result.color} rounded-3xl p-8 text-center shadow-2xl`}>
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: result.level === 'critical' ? [0, 10, -10, 0] : 0
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity 
                  }}
                  className="text-8xl mb-4"
                >
                  {result.emoji}
                </motion.div>
                <h2 className="text-3xl font-black mb-2">{result.title}</h2>
                <p className="text-white/80 mb-6">{result.description}</p>

                {/* 신체 나이 */}
                <div className="bg-black/20 rounded-2xl p-6 mb-4">
                  <p className="text-sm text-white/70 mb-2">당신의 신체 나이</p>
                  <p className="text-5xl font-black">{result.bodyAge}</p>
                  {result.level !== 'safe' && (
                    <p className="text-xs text-white/70 mt-2">
                      (실제 나이 + {parseInt(result.bodyAge) - age}세)
                    </p>
                  )}
                </div>

                {/* 총점 */}
                <div className="text-sm text-white/70">
                  총점: {answers.reduce((sum, score) => sum + score, 0)}점 / 120점
                </div>
              </div>

              {/* 위험 요인 */}
              <div className="bg-black/30 rounded-2xl p-6 border border-red-500/30">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <TrendingDown className="text-red-400" />
                  위험 요인
                </h3>
                <ul className="space-y-2">
                  {result.risks.map((risk, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-red-400 mt-1">•</span>
                      <span className="text-gray-300">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 해결책 */}
              <div className="bg-black/30 rounded-2xl p-6 border border-green-500/30">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Heart className="text-green-400" />
                  당장 해야 할 일
                </h3>
                <ul className="space-y-2">
                  {result.solutions.map((solution, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-green-400 mt-1">✓</span>
                      <span className="text-gray-300">{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 업종별 비교 */}
              <div className="bg-black/30 rounded-2xl p-6 border border-blue-500/30">
                <h3 className="font-bold text-lg mb-4">📊 업종별 평균 비교</h3>
                <div className="space-y-3">
                  {Object.entries(industryAverages).map(([ind, avg]) => {
                    const myScore = answers.reduce((sum, score) => sum + score, 0)
                    const isMyIndustry = ind === industry
                    
                    return (
                      <div key={ind} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className={isMyIndustry ? 'font-bold text-red-300' : 'text-gray-400'}>
                            {ind} {isMyIndustry && '(내 업종)'}
                          </span>
                          <span className="text-gray-400">{avg}점</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isMyIndustry ? 'bg-red-500' : 'bg-gray-600'}`}
                            style={{ width: `${(avg / 120) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-yellow-300">내 점수</span>
                      <span className="text-yellow-300">
                        {answers.reduce((sum, score) => sum + score, 0)}점
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-3">
                <button
                  onClick={handleShare}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Share2 size={20} />
                  결과 공유하기
                </button>
                <button
                  onClick={handleRestart}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-bold transition-all"
                >
                  다시 테스트하기
                </button>
                <button
                  onClick={() => router.push('/tools')}
                  className="w-full py-3 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  도구 목록으로
                </button>
              </div>

              {/* 면책 조항 */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-xs text-yellow-300 text-center">
                  ⚠️ 이 테스트는 재미와 경각심을 위한 것입니다.<br />
                  실제 건강 상태는 전문의와 상담하세요.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}


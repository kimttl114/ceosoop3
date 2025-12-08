'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { db, auth } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { ArrowLeft, Flame, Sparkles, Heart, Send } from 'lucide-react'
import { toast } from 'react-hot-toast'

// 스트레스 상황 템플릿
const stressTemplates = [
  { id: 1, icon: '👥', text: '알바가 갑자기 안 나온다고 30분 전에 문자...' },
  { id: 2, icon: '😤', text: '손님이 "왜 이렇게 늦어요?" 라며 화냄...' },
  { id: 3, icon: '💸', text: '이번 달도 적자... 언제까지 버틸 수 있을까...' },
  { id: 4, icon: '⭐', text: '악의적인 리뷰 때문에 평점이 떨어짐...' },
  { id: 5, icon: '🏦', text: '대출 이자가 너무 많아서 숨이 막힘...' },
  { id: 6, icon: '👨‍👩‍👧', text: '가족이 가게 접으라고 계속 압박...' },
  { id: 7, icon: '🔧', text: '기계가 고장났는데 수리비가 100만원...' },
  { id: 8, icon: '💔', text: '10년 단골이 옆 가게로 갈아탔다...' },
]

export default function StressReliefPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stressText, setStressText] = useState('')
  const [stressLevel, setStressLevel] = useState(100)
  const [isExploding, setIsExploding] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [postId, setPostId] = useState('')
  const [step, setStep] = useState<'write' | 'explode' | 'complete'>('write')

  // 사용자 인증 확인
  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // 텍스트 변경 시 스트레스 레벨 감소
  useEffect(() => {
    if (stressText.length === 0) {
      setStressLevel(100)
    } else {
      // 200자 작성 시 스트레스 20%까지 감소
      const reduction = Math.min(80, (stressText.length / 200) * 80)
      setStressLevel(100 - reduction)
    }
  }, [stressText])

  // 템플릿 선택
  const handleTemplateSelect = (template: string) => {
    setStressText(template)
  }

  // 스트레스 날리기!
  const handleExplode = async () => {
    if (!db) {
      toast.error('Firebase가 초기화되지 않았습니다')
      return
    }

    if (!user) {
      toast.error('로그인이 필요합니다')
      router.push('/login')
      return
    }

    if (!stressText.trim()) {
      toast.error('하소연을 작성해주세요')
      return
    }

    if (stressText.length < 10) {
      toast.error('최소 10자 이상 작성해주세요')
      return
    }

    try {
      setStep('explode')
      setIsExploding(true)

      // 1.5초 후 대나무숲에 자동 포스팅
      setTimeout(async () => {
        try {
          // 대나무숲에 포스팅
          const docRef = await addDoc(collection(db, 'posts'), {
            category: '대나무숲',
            title: `[스트레스 해소] ${stressText.substring(0, 30)}${stressText.length > 30 ? '...' : ''}`,
            content: stressText,
            userId: user.uid,
            userEmail: user.email,
            isAnonymous: true,
            anonymousName: `익명의 사장님`,
            stressRelief: true, // 특별 표시
            likes: 0,
            views: 0,
            createdAt: serverTimestamp(),
          })

          setPostId(docRef.id)
          setStep('complete')
          setIsComplete(true)
          toast.success('스트레스가 날아갔어요! 대나무숲에 올렸습니다! 🎉')
        } catch (error: any) {
          console.error('포스팅 오류:', error)
          toast.error('포스팅 중 오류가 발생했습니다: ' + error.message)
          setStep('write')
          setIsExploding(false)
        }
      }, 1500)
    } catch (error: any) {
      console.error('스트레스 해소 오류:', error)
      toast.error('오류가 발생했습니다: ' + error.message)
      setStep('write')
      setIsExploding(false)
    }
  }

  // 다시 하기
  const handleReset = () => {
    setStressText('')
    setStressLevel(100)
    setIsExploding(false)
    setIsComplete(false)
    setPostId('')
    setStep('write')
  }

  // 스트레스 레벨에 따른 이모지
  const getStressEmoji = (level: number) => {
    if (level > 80) return '😡'
    if (level > 60) return '😤'
    if (level > 40) return '😮‍💨'
    if (level > 20) return '😌'
    return '😊'
  }

  // 스트레스 레벨에 따른 메시지
  const getStressMessage = (level: number) => {
    if (level > 80) return '엄청 화나셨네요! 다 써버리세요!'
    if (level > 60) return '많이 답답하셨죠? 조금만 더 쓰세요!'
    if (level > 40) return '절반 왔어요! 계속 쓰세요!'
    if (level > 20) return '이제 좀 나아지시죠?'
    return '많이 후련해지셨어요! 이제 날려버릴까요?'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-8 px-4 relative overflow-hidden">
      {/* 배경 파티클 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-red-300 rounded-full opacity-20"
            animate={{
              x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
              y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            style={{
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/games')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>게임 목록</span>
          </button>
        </div>

        {/* 메인 컨텐츠 */}
        <AnimatePresence mode="wait">
          {step === 'write' && (
            <motion.div
              key="write"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8"
            >
              {/* 타이틀 */}
              <div className="text-center mb-6">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="text-6xl mb-4"
                >
                  💢
                </motion.div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600 mb-2">
                  스트레스 날려버리기
                </h1>
                <p className="text-gray-600">
                  하소연을 쓰고 날려버리세요! 대나무숲에 자동으로 올려드려요 🌿
                </p>
              </div>

              {/* 스트레스 게이지 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-700">스트레스 레벨</span>
                  <span className="text-2xl">{getStressEmoji(stressLevel)}</span>
                </div>
                <div className="h-8 bg-gray-200 rounded-full overflow-hidden relative">
                  <motion.div
                    className={`h-full rounded-full ${
                      stressLevel > 60
                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                        : stressLevel > 30
                        ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500'
                    }`}
                    initial={{ width: '100%' }}
                    animate={{ width: `${stressLevel}%` }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                    {Math.round(stressLevel)}%
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  {getStressMessage(stressLevel)}
                </p>
              </div>

              {/* 빠른 선택 템플릿 */}
              <div className="mb-6">
                <p className="text-sm font-bold text-gray-700 mb-3">빠른 선택 (클릭하면 자동 입력)</p>
                <div className="grid grid-cols-2 gap-2">
                  {stressTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.text)}
                      className="p-3 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 rounded-xl text-left transition-all text-sm border border-red-200"
                    >
                      <span className="text-xl mr-2">{template.icon}</span>
                      <span className="text-gray-700">{template.text.substring(0, 20)}...</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 하소연 입력 */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  오늘 무슨 일이 있었나요? (최소 10자)
                </label>
                <textarea
                  value={stressText}
                  onChange={(e) => setStressText(e.target.value)}
                  placeholder="여기에 다 쏟아내세요... 익명으로 대나무숲에 올라갑니다!"
                  className="w-full h-48 p-4 border-2 border-gray-300 rounded-xl resize-none focus:border-red-500 focus:outline-none text-gray-900"
                  maxLength={1000}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    {stressText.length}/1000자
                  </p>
                  <p className="text-xs text-gray-500">
                    글자수: {stressText.length}자 → 스트레스 -{Math.min(80, Math.round((stressText.length / 200) * 80))}%
                  </p>
                </div>
              </div>

              {/* 날려버리기 버튼 */}
              <motion.button
                onClick={handleExplode}
                disabled={stressText.length < 10}
                className={`w-full py-4 rounded-2xl font-black text-xl shadow-lg transition-all ${
                  stressText.length < 10
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 hover:shadow-xl'
                }`}
                whileHover={stressText.length >= 10 ? { scale: 1.05 } : {}}
                whileTap={stressText.length >= 10 ? { scale: 0.95 } : {}}
              >
                💣 날려버리기!
              </motion.button>

              {/* 안내 문구 */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-800 text-center">
                  ✨ 날려버리면 대나무숲에 <strong>익명</strong>으로 자동 포스팅돼요!<br />
                  다른 사장님들이 응원해줄 거예요 💪
                </p>
              </div>
            </motion.div>
          )}

          {step === 'explode' && (
            <motion.div
              key="explode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[600px]"
            >
              {/* 폭발 애니메이션 */}
              <div className="text-center">
                <motion.div
                  animate={{
                    scale: [1, 2, 3, 4],
                    rotate: [0, 90, 180, 360],
                    opacity: [1, 1, 0.5, 0],
                  }}
                  transition={{ duration: 1.5 }}
                  className="text-9xl"
                >
                  💥
                </motion.div>

                {/* 파티클 효과 */}
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-4xl"
                    initial={{
                      x: 0,
                      y: 0,
                      opacity: 1,
                    }}
                    animate={{
                      x: (Math.random() - 0.5) * 400,
                      y: (Math.random() - 0.5) * 400,
                      opacity: 0,
                      rotate: Math.random() * 360,
                    }}
                    transition={{
                      duration: 1.5,
                      delay: Math.random() * 0.3,
                    }}
                  >
                    {['💥', '✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 5)]}
                  </motion.div>
                ))}

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl font-bold text-red-600 mt-12"
                >
                  스트레스가 날아가고 있어요...
                </motion.p>
              </div>
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="text-8xl mb-6"
              >
                😊
              </motion.div>

              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-4">
                후련하시죠? 🎉
              </h2>

              <div className="mb-8 space-y-4">
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-green-800 font-bold mb-2">✅ 스트레스가 날아갔어요!</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-sm text-green-700">
                      <span className="line-through">😡 100%</span>
                      <span className="mx-2">→</span>
                      <span className="font-bold">😊 {Math.round(stressLevel)}%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-blue-800 font-bold mb-2">✅ 대나무숲에 올렸어요!</p>
                  <p className="text-sm text-blue-700">
                    다른 사장님들이 당신을 응원해줄 거예요 💪
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center justify-center gap-2 text-purple-800">
                    <Heart className="w-5 h-5" />
                    <p className="text-sm font-bold">혼자가 아니에요!</p>
                  </div>
                  <p className="text-xs text-purple-700 mt-1">
                    우리 모두 힘든 걸 함께 이겨내요
                  </p>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/?category=대나무숲')}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Send size={20} />
                  대나무숲 보러가기 (응원 받기)
                </button>

                <button
                  onClick={handleReset}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-bold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Flame size={20} />
                  한 번 더 날려버리기
                </button>

                <button
                  onClick={() => router.push('/games')}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"
                >
                  게임 목록으로
                </button>
              </div>

              {/* 통계 */}
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-red-600">{stressText.length}</div>
                  <div className="text-xs text-gray-600">글자수</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-orange-600">-{100 - Math.round(stressLevel)}%</div>
                  <div className="text-xs text-gray-600">스트레스 감소</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-green-600">100%</div>
                  <div className="text-xs text-gray-600">후련함</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}


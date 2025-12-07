'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  balanceQuestions, 
  categoryColors, 
  getRandomQuestions,
  type BalanceQuestion 
} from '@/lib/balanceQuestions'
import { db, auth } from '@/lib/firebase'
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { 
  Share2, 
  TrendingUp, 
  MessageCircle, 
  AlertCircle,
  Flame,
  ArrowLeft,
  Shuffle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function BalanceGamePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<BalanceQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [voted, setVoted] = useState(false)
  const [voteResults, setVoteResults] = useState<{ A: number; B: number }>({ A: 0, B: 0 })
  const [myChoice, setMyChoice] = useState<'A' | 'B' | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [gameMode, setGameMode] = useState<'random' | 'all'>('random')

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

  // 게임 초기화
  useEffect(() => {
    if (gameMode === 'random') {
      setQuestions(getRandomQuestions(10))
    } else {
      setQuestions(balanceQuestions)
    }
    setCurrentIndex(0)
    setVoted(false)
    setMyChoice(null)
  }, [gameMode])

  // 투표 결과 및 댓글 실시간 로드
  useEffect(() => {
    if (!db || questions.length === 0) return

    const currentQuestion = questions[currentIndex]
    if (!currentQuestion) return

    // 투표 결과 로드
    const voteDocRef = doc(db, 'balance_votes', `question_${currentQuestion.id}`)
    const unsubVotes = onSnapshot(
      voteDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setVoteResults({
            A: data.voteA || 0,
            B: data.voteB || 0
          })
        } else {
          setVoteResults({ A: 0, B: 0 })
        }
      },
      (error) => {
        console.error('투표 결과 로드 오류:', error)
      }
    )

    // 댓글 로드
    const commentsRef = collection(db, 'balance_comments')
    const q = query(
      commentsRef,
      orderBy('createdAt', 'desc'),
      limit(20)
    )
    
    const unsubComments = onSnapshot(
      q,
      (snapshot) => {
        const commentsList = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter((comment: any) => comment.questionId === currentQuestion.id)
        setComments(commentsList)
      },
      (error) => {
        console.error('댓글 로드 오류:', error)
      }
    )

    // 내 투표 확인
    if (user) {
      const userVoteRef = doc(db, 'user_balance_votes', `${user.uid}_${currentQuestion.id}`)
      getDoc(userVoteRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            setVoted(true)
            setMyChoice(docSnap.data().choice as 'A' | 'B')
          } else {
            setVoted(false)
            setMyChoice(null)
          }
        })
        .catch((error) => {
          console.error('사용자 투표 확인 오류:', error)
        })
    }

    return () => {
      unsubVotes()
      unsubComments()
    }
  }, [currentIndex, questions, user])

  // 투표 처리
  const handleVote = async (choice: 'A' | 'B') => {
    if (!db) {
      toast.error('Firebase가 초기화되지 않았습니다')
      return
    }

    if (!user) {
      toast.error('로그인이 필요합니다')
      router.push('/login')
      return
    }

    if (voted) {
      toast.error('이미 투표하셨습니다')
      return
    }

    try {
      const currentQuestion = questions[currentIndex]
      const voteDocRef = doc(db, 'balance_votes', `question_${currentQuestion.id}`)
      const userVoteRef = doc(db, 'user_balance_votes', `${user.uid}_${currentQuestion.id}`)

      // 투표 카운트 증가
      const voteDoc = await getDoc(voteDocRef)
      if (voteDoc.exists()) {
        await updateDoc(voteDocRef, {
          [choice === 'A' ? 'voteA' : 'voteB']: increment(1),
          updatedAt: serverTimestamp()
        })
      } else {
        await setDoc(voteDocRef, {
          questionId: currentQuestion.id,
          voteA: choice === 'A' ? 1 : 0,
          voteB: choice === 'B' ? 1 : 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }

      // 사용자 투표 기록
      await setDoc(userVoteRef, {
        userId: user.uid,
        questionId: currentQuestion.id,
        choice: choice,
        votedAt: serverTimestamp()
      })

      setVoted(true)
      setMyChoice(choice)
      toast.success('투표 완료!')
    } catch (error: any) {
      console.error('투표 오류:', error)
      toast.error('투표 중 오류가 발생했습니다: ' + error.message)
    }
  }

  // 댓글 작성
  const handleAddComment = async () => {
    if (!db) {
      toast.error('Firebase가 초기화되지 않았습니다')
      return
    }

    if (!user) {
      toast.error('로그인이 필요합니다')
      return
    }

    if (!commentText.trim()) {
      toast.error('댓글을 입력해주세요')
      return
    }

    if (!voted) {
      toast.error('투표 후 댓글을 작성할 수 있습니다')
      return
    }

    try {
      const currentQuestion = questions[currentIndex]
      await addDoc(collection(db, 'balance_comments'), {
        questionId: currentQuestion.id,
        userId: user.uid,
        userEmail: user.email || 'anonymous',
        choice: myChoice,
        comment: commentText,
        createdAt: serverTimestamp()
      })

      setCommentText('')
      toast.success('댓글이 작성되었습니다')
    } catch (error: any) {
      console.error('댓글 작성 오류:', error)
      toast.error('댓글 작성 중 오류가 발생했습니다: ' + error.message)
    }
  }

  // 다음 문제
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setVoted(false)
      setMyChoice(null)
      setShowComments(false)
    } else {
      toast.success('모든 문제를 완료했습니다! 🎉')
      router.push('/games')
    }
  }

  // 공유하기
  const handleShare = () => {
    const currentQuestion = questions[currentIndex]
    const shareText = `🎮 사장님 밸런스 게임\n\n${currentQuestion.question}\n\n🅰️ ${currentQuestion.optionA.text}\nVS\n🅱️ ${currentQuestion.optionB.text}\n\n당신의 선택은?`
    
    if (navigator.share) {
      navigator.share({
        title: '사장님 밸런스 게임',
        text: shareText,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(shareText + '\n\n' + window.location.href)
      toast.success('링크가 복사되었습니다!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">질문을 불러올 수 없습니다</p>
          <button
            onClick={() => router.push('/games')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            게임 목록으로
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const totalVotes = voteResults.A + voteResults.B
  const percentA = totalVotes > 0 ? Math.round((voteResults.A / totalVotes) * 100) : 0
  const percentB = totalVotes > 0 ? Math.round((voteResults.B / totalVotes) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/games')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">게임 목록</span>
          </button>
          
          <div className="text-center flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              ⚖️ 사장님 밸런스 게임
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {currentIndex + 1} / {questions.length}
            </p>
          </div>

          <button
            onClick={() => setGameMode(gameMode === 'random' ? 'all' : 'random')}
            className="flex items-center gap-1 px-3 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all text-sm"
          >
            <Shuffle size={16} />
            <span className="hidden sm:inline">{gameMode === 'random' ? '랜덤 10개' : '전체 50개'}</span>
          </button>
        </div>

        {/* 진행바 */}
        <div className="mb-6 bg-white rounded-full h-3 overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* 카테고리 & 자극 뱃지 */}
        <div className="mb-4 flex items-center gap-2 justify-center">
          <span className={`px-4 py-1 rounded-full text-white font-bold text-sm bg-gradient-to-r ${categoryColors[currentQuestion.category]}`}>
            {currentQuestion.category}
          </span>
          {currentQuestion.spicy && (
            <span className="px-3 py-1 rounded-full bg-red-500 text-white font-bold text-xs flex items-center gap-1 animate-pulse">
              <Flame size={14} />
              자극적
            </span>
          )}
        </div>

        {/* 질문 카드 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-6"
          >
            {/* 질문 */}
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-8 text-gray-900">
              {currentQuestion.question}
            </h2>

            {/* 선택지 A */}
            <button
              onClick={() => !voted && handleVote('A')}
              disabled={voted}
              className={`w-full p-6 mb-4 rounded-2xl transition-all transform hover:scale-105 ${
                voted
                  ? myChoice === 'A'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl scale-105'
                    : 'bg-gray-100 text-gray-600'
                  : 'bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-gray-900'
              } ${voted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-4 mb-2">
                <span className="text-4xl">{currentQuestion.optionA.emoji}</span>
                <div className="flex-1 text-left">
                  <div className="text-lg sm:text-xl font-bold mb-1">
                    🅰️ {currentQuestion.optionA.text}
                  </div>
                  <div className={`text-sm ${voted && myChoice !== 'A' ? 'text-gray-500' : voted ? 'text-white/90' : 'text-gray-600'}`}>
                    {currentQuestion.optionA.detail}
                  </div>
                </div>
              </div>
              
              {voted && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="mt-4"
                >
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-bold">{voteResults.A}표</span>
                    <span className="font-bold">{percentA}%</span>
                  </div>
                  <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentA}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </motion.div>
              )}
            </button>

            {/* VS */}
            <div className="text-center my-4 relative">
              <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              <span className="relative inline-block px-4 bg-white text-2xl font-black text-gray-400">
                VS
              </span>
            </div>

            {/* 선택지 B */}
            <button
              onClick={() => !voted && handleVote('B')}
              disabled={voted}
              className={`w-full p-6 rounded-2xl transition-all transform hover:scale-105 ${
                voted
                  ? myChoice === 'B'
                    ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-xl scale-105'
                    : 'bg-gray-100 text-gray-600'
                  : 'bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 text-gray-900'
              } ${voted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-4 mb-2">
                <span className="text-4xl">{currentQuestion.optionB.emoji}</span>
                <div className="flex-1 text-left">
                  <div className="text-lg sm:text-xl font-bold mb-1">
                    🅱️ {currentQuestion.optionB.text}
                  </div>
                  <div className={`text-sm ${voted && myChoice !== 'B' ? 'text-gray-500' : voted ? 'text-white/90' : 'text-gray-600'}`}>
                    {currentQuestion.optionB.detail}
                  </div>
                </div>
              </div>

              {voted && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="mt-4"
                >
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-bold">{voteResults.B}표</span>
                    <span className="font-bold">{percentB}%</span>
                  </div>
                  <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentB}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </motion.div>
              )}
            </button>

            {/* 통계 */}
            {voted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} />
                    <span>총 {totalVotes}명 참여</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle size={16} />
                    <span>{comments.length}개 댓글</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 액션 버튼 */}
            {voted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 flex gap-3"
              >
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  댓글 {showComments ? '닫기' : '보기'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 size={18} />
                  공유하기
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold transition-all"
                >
                  다음 문제 →
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 댓글 섹션 */}
        <AnimatePresence>
          {voted && showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-3xl shadow-xl p-6 overflow-hidden"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MessageCircle size={20} />
                댓글 ({comments.length})
              </h3>

              {/* 댓글 작성 */}
              <div className="mb-6">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="당신의 생각을 공유해주세요..."
                  className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none focus:border-purple-500 focus:outline-none"
                  rows={3}
                />
                <button
                  onClick={handleAddComment}
                  className="mt-2 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  댓글 작성
                </button>
              </div>

              {/* 댓글 목록 */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">첫 댓글을 작성해보세요!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          comment.choice === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {comment.choice === 'A' ? '🅰️' : '🅱️'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {comment.userEmail?.split('@')[0] || '익명'}
                        </span>
                      </div>
                      <p className="text-gray-800">{comment.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}


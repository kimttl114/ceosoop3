'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Brain } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

const quizzes = [
  {
    question: '자영업자가 부가가치세 신고를 해야 하는 기간은?',
    options: ['매월', '분기별', '연 1회', '신고 불필요'],
    correct: 1,
    explanation: '부가가치세는 분기별(3개월마다) 신고합니다.',
  },
  {
    question: '최저시급 2024년 기준은?',
    options: ['9,860원', '9,620원', '10,000원', '9,500원'],
    correct: 0,
    explanation: '2024년 최저시급은 시간당 9,860원입니다.',
  },
  {
    question: '사업자등록증 발급 후 몇 일 내에 사업을 시작해야 하나요?',
    options: ['즉시', '7일', '30일', '제한 없음'],
    correct: 3,
    explanation: '사업자등록증 발급 후 사업 시작 시기는 제한이 없습니다.',
  },
  {
    question: '소상공인 지원금 신청 시 필요한 서류는?',
    options: ['사업자등록증만', '사업자등록증 + 통장사본', '통장사본만', '신청 불가'],
    correct: 1,
    explanation: '사업자등록증과 통장사본이 필요합니다.',
  },
  {
    question: '부가가치세 면세사업자의 기준은?',
    options: ['연 매출 4,800만원 이하', '연 매출 1억원 이하', '연 매출 2억원 이하', '제한 없음'],
    correct: 0,
    explanation: '연 매출 4,800만원 이하는 부가가치세 면세입니다.',
  },
  {
    question: '근로자 고용 시 필수로 가입해야 하는 보험은?',
    options: ['건강보험만', '4대보험 모두', '고용보험만', '가입 불필요'],
    correct: 1,
    explanation: '건강보험, 국민연금, 고용보험, 산재보험 4대보험 모두 가입해야 합니다.',
  },
  {
    question: '사업장 임대차계약서 작성 시 가장 중요한 것은?',
    options: ['월세 금액', '보증금', '계약 기간', '모두 중요'],
    correct: 3,
    explanation: '모든 항목이 중요하며, 특히 명확한 계약서 작성이 필수입니다.',
  },
  {
    question: '원가율이 70%인 경우 마진율은?',
    options: ['30%', '70%', '100%', '계산 불가'],
    correct: 0,
    explanation: '마진율 = 100% - 원가율 = 100% - 70% = 30%',
  },
  {
    question: '부가가치세 계산 시 공급가액이 100만원이면 부가세는?',
    options: ['10만원', '11만원', '9만원', '계산 불가'],
    correct: 0,
    explanation: '부가가치세 = 공급가액 × 10% = 100만원 × 10% = 10만원',
  },
  {
    question: '사업자 대출 시 가장 유리한 조건은?',
    options: ['금리만 낮으면 됨', '금리 + 한도 + 기간 모두 고려', '한도만 높으면 됨', '대출 불가'],
    correct: 1,
    explanation: '금리, 한도, 기간을 모두 종합적으로 고려해야 합니다.',
  },
];

export default function QuizPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [playsLeft, setPlaysLeft] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shuffledQuizzes, setShuffledQuizzes] = useState<any[]>([]);

  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && db) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const gameRef = doc(db, 'user_games', currentUser.uid);
          const gameSnap = await getDoc(gameRef);
          
          if (gameSnap.exists()) {
            const data = gameSnap.data();
            if (data.lastQuizDate === today) {
              setPlaysLeft(Math.max(0, 3 - (data.todayQuizPlays || 0)));
            }
          }
        } catch (error) {
          console.error('Error loading game data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 퀴즈 셔플
  const shuffleQuizzes = () => {
    const shuffled = [...quizzes].sort(() => Math.random() - 0.5).slice(0, 10);
    setShuffledQuizzes(shuffled);
  };

  // 게임 시작
  const startGame = () => {
    shuffleQuizzes();
    setGameStarted(true);
    setGameOver(false);
    setCurrentQuiz(0);
    setScore(0);
    setCombo(0);
    setSelectedAnswer(null);
    setTimeLeft(30);
  };

  // 타이머
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, currentQuiz]);

  // 시간 초과
  const handleTimeOut = () => {
    setSelectedAnswer(-1); // -1은 시간 초과
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  // 답 선택
  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    const isCorrect = index === shuffledQuizzes[currentQuiz].correct;
    
    if (isCorrect) {
      setScore(prev => prev + 10);
      setCombo(prev => prev + 1);
    } else {
      setCombo(0);
    }
    
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  // 다음 문제
  const nextQuestion = () => {
    if (currentQuiz >= shuffledQuizzes.length - 1) {
      endGame();
    } else {
      setCurrentQuiz(prev => prev + 1);
      setSelectedAnswer(null);
      setTimeLeft(30);
    }
  };

  // 게임 종료
  const endGame = async () => {
    setGameOver(true);
    setGameStarted(false);
    
    const points = score * 2 + (combo > 0 ? combo * 5 : 0);
    
    if (user && db) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const gameRef = doc(db, 'user_games', user.uid);
        const gameSnap = await getDoc(gameRef);
        const todayPlays = gameSnap.exists() && gameSnap.data().lastQuizDate === today
          ? (gameSnap.data().todayQuizPlays || 0) + 1
          : 1;
        
        await setDoc(gameRef, {
          lastQuizDate: today,
          todayQuizPlays: todayPlays,
        }, { merge: true });
        
        setPlaysLeft(3 - todayPlays);
        
        // 포인트 지급
        if (points > 0) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          const currentPoints = userSnap.data()?.points || 0;
          await setDoc(userRef, {
            points: currentPoints + points,
          }, { merge: true });
        }
      } catch (error) {
        console.error('Error saving game:', error);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  const currentQuizData = shuffledQuizzes[currentQuiz];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 pb-24">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-violet-600 to-purple-600 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain size={24} />
            <span>비즈니스 퀴즈</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        {!gameStarted ? (
          <div className="bg-white rounded-2xl p-8 shadow-xl mb-6 text-center">
            <div className="text-6xl mb-4">❓</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">비즈니스 퀴즈</h2>
            <p className="text-gray-600 mb-6">
              자영업자에게 유용한 퀴즈를 풀어보세요!<br />
              정답을 맞추면 포인트를 받아요!
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-sm text-gray-600 mb-1">남은 플레이</div>
                <div className="text-xl font-bold text-violet-600">{playsLeft}회</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-sm text-gray-600 mb-1">문제 수</div>
                <div className="text-xl font-bold text-purple-600">10문제</div>
              </div>
            </div>
            <button
              onClick={startGame}
              disabled={playsLeft <= 0}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {playsLeft > 0 ? '퀴즈 시작' : '플레이 횟수 소진'}
            </button>
          </div>
        ) : (
          <>
            {/* 진행 상황 */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-lg text-center">
                <div className="text-sm text-gray-600 mb-1">점수</div>
                <div className="text-xl font-bold text-violet-600">{score}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg text-center">
                <div className="text-sm text-gray-600 mb-1">콤보</div>
                <div className="text-xl font-bold text-blue-600">{combo}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg text-center">
                <div className="text-sm text-gray-600 mb-1">시간</div>
                <div className="text-xl font-bold text-red-600">{timeLeft}초</div>
              </div>
            </div>

            {/* 문제 */}
            {currentQuizData && (
              <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
                <div className="text-sm text-gray-500 mb-2">
                  문제 {currentQuiz + 1} / {shuffledQuizzes.length}
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  {currentQuizData.question}
                </h2>
                
                <div className="space-y-3">
                  {currentQuizData.options.map((option: string, index: number) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === currentQuizData.correct;
                    const showResult = selectedAnswer !== null;
                    
                    let buttonClass = 'w-full p-4 rounded-xl font-medium text-left transition';
                    
                    if (showResult) {
                      if (isCorrect) {
                        buttonClass += ' bg-green-100 text-green-800 border-2 border-green-500';
                      } else if (isSelected && !isCorrect) {
                        buttonClass += ' bg-red-100 text-red-800 border-2 border-red-500';
                      } else {
                        buttonClass += ' bg-gray-100 text-gray-600';
                      }
                    } else {
                      buttonClass += ' bg-gray-50 hover:bg-gray-100 text-gray-800 border-2 border-transparent';
                    }
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswer(index)}
                        disabled={selectedAnswer !== null}
                        className={buttonClass}
                      >
                        {option}
                        {showResult && isCorrect && ' ✓'}
                        {showResult && isSelected && !isCorrect && ' ✗'}
                      </button>
                    );
                  })}
                </div>
                
                {selectedAnswer !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-blue-50 rounded-xl"
                  >
                    <p className="text-sm text-blue-800">
                      💡 {currentQuizData.explanation}
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* 게임 종료 */}
            {gameOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl p-8 shadow-xl text-white text-center mb-6"
              >
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-2">퀴즈 완료!</h2>
                <div className="text-xl mb-4">최종 점수: {score}</div>
                <div className="text-lg mb-6">
                  획득 포인트: {score * 2 + (combo > 0 ? combo * 5 : 0)}
                </div>
                <button
                  onClick={startGame}
                  className="bg-white text-violet-600 px-6 py-3 rounded-xl font-bold"
                >
                  다시 하기
                </button>
              </motion.div>
            )}
          </>
        )}

        {/* 안내 */}
        <div className="bg-white/80 rounded-xl p-4 shadow-lg">
          <p className="text-xs text-gray-600 text-center">
            💡 정답을 맞추면 10점, 연속 정답은 콤보 보너스!<br />
            시간 내에 답을 선택하세요! (점수 × 2 + 콤보 × 5 = 포인트)
          </p>
        </div>
      </main>
    </div>
  );
}






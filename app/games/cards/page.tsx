'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Layers } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export default function CardsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [deck, setDeck] = useState<number[]>([]);
  const [currentCard, setCurrentCard] = useState<number | null>(null);
  const [previousCard, setPreviousCard] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<'higher' | 'lower' | null>(null);
  const [score, setScore] = useState(0);
  const [playsLeft, setPlaysLeft] = useState(3);
  const [combo, setCombo] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

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
            if (data.lastCardsDate === today) {
              setPlaysLeft(Math.max(0, 3 - (data.todayCardsPlays || 0)));
              setScore(data.cardsBestScore || 0);
            }
          }
        } catch (error) {
          console.error('Error loading game data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 카드 덱 생성 (1-13, 4세트 = 52장)
  const createDeck = () => {
    const newDeck: number[] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 1; j <= 13; j++) {
        newDeck.push(j);
      }
    }
    // 셔플
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  };

  const startGame = () => {
    if (playsLeft <= 0) return;
    
    const newDeck = createDeck();
    setDeck(newDeck);
    const firstCard = newDeck[0];
    setCurrentCard(firstCard);
    setPreviousCard(null);
    setPrediction(null);
    setScore(0);
    setCombo(0);
  };

  const makePrediction = (pred: 'higher' | 'lower') => {
    if (!currentCard || prediction !== null || isFlipping) return;
    
    setPrediction(pred);
    setIsFlipping(true);
    
    setTimeout(() => {
      const nextCard = deck[score + 1];
      
      if (nextCard === undefined) {
        // 덱 소진
        endGame();
        return;
      }
      
      const isCorrect = 
        (pred === 'higher' && nextCard > currentCard) ||
        (pred === 'lower' && nextCard < currentCard) ||
        (nextCard === currentCard); // 같은 숫자는 정답으로 처리
      
      if (isCorrect) {
        setScore(prev => prev + 1);
        setCombo(prev => prev + 1);
        setPreviousCard(currentCard);
        setCurrentCard(nextCard);
        setPrediction(null);
      } else {
        endGame();
      }
      
      setIsFlipping(false);
    }, 1000);
  };

  const endGame = async () => {
    const points = score * 3 + (combo > 0 ? combo : 0);
    
    if (user && db) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const gameRef = doc(db, 'user_games', user.uid);
        const gameSnap = await getDoc(gameRef);
        const todayPlays = gameSnap.exists() && gameSnap.data().lastCardsDate === today
          ? (gameSnap.data().todayCardsPlays || 0) + 1
          : 1;
        const bestScore = gameSnap.exists() ? (gameSnap.data().cardsBestScore || 0) : 0;
        
        await setDoc(gameRef, {
          lastCardsDate: today,
          todayCardsPlays: todayPlays,
          cardsBestScore: Math.max(bestScore, score),
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

  const getCardDisplay = (value: number) => {
    if (value === 1) return 'A';
    if (value === 11) return 'J';
    if (value === 12) return 'Q';
    if (value === 13) return 'K';
    return value.toString();
  };

  const getCardSuit = (value: number) => {
    const suits = ['♠', '♥', '♦', '♣'];
    return suits[value % 4];
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-rose-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 pb-24">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-rose-600 to-pink-600 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers size={24} />
            <span>카드 뽑기</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* 점수 및 통계 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg text-center">
            <div className="text-sm text-gray-600 mb-1">점수</div>
            <div className="text-xl font-bold text-rose-600">{score}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg text-center">
            <div className="text-sm text-gray-600 mb-1">콤보</div>
            <div className="text-xl font-bold text-blue-600">{combo}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg text-center">
            <div className="text-sm text-gray-600 mb-1">남은 플레이</div>
            <div className="text-xl font-bold text-green-600">{playsLeft}회</div>
          </div>
        </div>

        {/* 카드 표시 */}
        {currentCard !== null ? (
          <div className="space-y-6 mb-6">
            {/* 이전 카드 */}
            {previousCard !== null && (
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">이전 카드</div>
                <div className="inline-block bg-white rounded-xl p-4 shadow-lg text-4xl">
                  {getCardDisplay(previousCard)} {getCardSuit(previousCard)}
                </div>
              </div>
            )}

            {/* 현재 카드 */}
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">현재 카드</div>
              <motion.div
                animate={isFlipping ? { rotateY: 180 } : { rotateY: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-block bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl p-8 shadow-xl text-white"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="text-6xl font-bold">
                  {getCardDisplay(currentCard)} {getCardSuit(currentCard)}
                </div>
              </motion.div>
            </div>

            {/* 예측 버튼 */}
            {prediction === null && !isFlipping && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => makePrediction('higher')}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition"
                >
                  ↑ 더 높음
                </button>
                <button
                  onClick={() => makePrediction('lower')}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition"
                >
                  ↓ 더 낮음
                </button>
              </div>
            )}

            {/* 예측 중 */}
            {isFlipping && (
              <div className="text-center text-gray-600">
                카드를 확인하는 중...
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-xl mb-6 text-center">
            <div className="text-6xl mb-4">🃏</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">카드 뽑기 게임</h2>
            <p className="text-gray-600 mb-6">
              다음 카드가 현재 카드보다 높을지 낮을지 예측하세요!<br />
              연속으로 맞추면 콤보 보너스가 있어요!
            </p>
            <button
              onClick={startGame}
              disabled={playsLeft <= 0}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {playsLeft > 0 ? '게임 시작' : '플레이 횟수 소진'}
            </button>
          </div>
        )}

        {/* 포인트로 추가 플레이 */}
        {playsLeft === 0 && currentCard === null && (
          <button
            onClick={async () => {
              if (!user || !db) return;
              try {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                const currentPoints = userSnap.data()?.points || 0;
                
                if (currentPoints < 5) {
                  alert('포인트가 부족합니다!');
                  return;
                }
                
                await setDoc(userRef, {
                  points: currentPoints - 5,
                }, { merge: true });
                
                setPlaysLeft(1);
              } catch (error) {
                console.error('Error using points:', error);
              }
            }}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition mb-4"
          >
            포인트 5개로 추가 플레이
          </button>
        )}

        {/* 안내 */}
        <div className="bg-white/80 rounded-xl p-4 shadow-lg">
          <p className="text-xs text-gray-600 text-center">
            💡 다음 카드가 현재 카드보다 높을지 낮을지 예측하세요!<br />
            연속으로 맞추면 콤보 보너스가 있어요! (점수 × 3 + 콤보 = 포인트)
          </p>
        </div>
      </main>
    </div>
  );
}


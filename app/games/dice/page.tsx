'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Dice6 } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

export default function DicePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [dice1, setDice1] = useState(1);
  const [dice2, setDice2] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<{ points: number; message: string } | null>(null);
  const [playsLeft, setPlaysLeft] = useState(10);
  const [combo, setCombo] = useState(0);
  const [totalWins, setTotalWins] = useState(0);

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
            if (data.lastDiceDate === today) {
              setPlaysLeft(Math.max(0, 10 - (data.todayDicePlays || 0)));
              setTotalWins(data.diceTotalWins || 0);
            }
          }
        } catch (error) {
          console.error('Error loading game data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const rollDice = async () => {
    if (playsLeft <= 0 || isRolling) return;
    
    setIsRolling(true);
    setResult(null);
    
    // 주사위 굴리기 애니메이션
    let rollCount = 0;
    const maxRolls = 20;
    
    const animateRoll = () => {
      setDice1(Math.floor(Math.random() * 6) + 1);
      setDice2(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      
      if (rollCount < maxRolls) {
        setTimeout(animateRoll, 50);
      } else {
        // 최종 결과
        const finalDice1 = Math.floor(Math.random() * 6) + 1;
        const finalDice2 = Math.floor(Math.random() * 6) + 1;
        setDice1(finalDice1);
        setDice2(finalDice2);
        setIsRolling(false);
        checkResult(finalDice1, finalDice2);
      }
    };
    
    animateRoll();
  };

  const checkResult = async (d1: number, d2: number) => {
    const sum = d1 + d2;
    let points = 0;
    let message = '';
    let isWin = false;
    
    // 특별 숫자 (7, 11) = 보너스
    if (sum === 7 || sum === 11) {
      points = 10;
      message = '🎉 보너스! 특별한 숫자예요!';
      isWin = true;
      setCombo(prev => prev + 1);
    } else if (sum === 2 || sum === 12) {
      // 최소/최대 = 보너스
      points = 15;
      message = '🌟 대박! 최고/최저 숫자예요!';
      isWin = true;
      setCombo(prev => prev + 1);
    } else if (d1 === d2) {
      // 더블 = 보너스
      points = 8;
      message = '✨ 더블! 같은 숫자예요!';
      isWin = true;
      setCombo(prev => prev + 1);
    } else {
      points = 5;
      message = '👍 승리!';
      isWin = true;
      setCombo(prev => prev + 1);
    }
    
    // 콤보 보너스
    if (combo > 0) {
      points += combo;
      message += ` (${combo}콤보!)`;
    }
    
    setResult({ points, message });
    
    if (isWin) {
      setTotalWins(prev => prev + 1);
    }
    
    // 기록 저장 및 포인트 지급
    if (user && db) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const gameRef = doc(db, 'user_games', user.uid);
        const gameSnap = await getDoc(gameRef);
        const todayPlays = gameSnap.exists() && gameSnap.data().lastDiceDate === today
          ? (gameSnap.data().todayDicePlays || 0) + 1
          : 1;
        const totalWinsCount = gameSnap.exists() ? (gameSnap.data().diceTotalWins || 0) : 0;
        
        await setDoc(gameRef, {
          lastDiceDate: today,
          todayDicePlays: todayPlays,
          diceTotalWins: totalWinsCount + (isWin ? 1 : 0),
        }, { merge: true });
        
        setPlaysLeft(10 - todayPlays);
        
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

  const getDiceEmoji = (value: number) => {
    const emojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return emojis[value - 1] || '⚀';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pb-24">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-green-600 to-emerald-600 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Dice6 size={24} />
            <span>주사위 대결</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* 주사위 표시 */}
        <div className="bg-white rounded-2xl p-8 shadow-xl mb-6">
          <div className="flex items-center justify-center gap-8 mb-6">
            <motion.div
              animate={isRolling ? {
                rotate: [0, 360, 0],
                scale: [1, 1.2, 1],
              } : {}}
              transition={{ duration: 0.3, repeat: isRolling ? Infinity : 0 }}
              className="text-8xl"
            >
              {getDiceEmoji(dice1)}
            </motion.div>
            <div className="text-4xl text-gray-400">+</div>
            <motion.div
              animate={isRolling ? {
                rotate: [0, -360, 0],
                scale: [1, 1.2, 1],
              } : {}}
              transition={{ duration: 0.3, repeat: isRolling ? Infinity : 0 }}
              className="text-8xl"
            >
              {getDiceEmoji(dice2)}
            </motion.div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">합계</div>
            <div className="text-4xl font-bold text-green-600">{dice1 + dice2}</div>
          </div>
        </div>

        {/* 결과 표시 */}
        {result && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 shadow-xl mb-6 text-white text-center"
          >
            <div className="text-2xl font-bold mb-2">{result.message}</div>
            {result.points > 0 && (
              <div className="text-xl">+{result.points} 포인트 획득!</div>
            )}
          </motion.div>
        )}

        {/* 굴리기 버튼 */}
        <button
          onClick={rollDice}
          disabled={playsLeft <= 0 || isRolling}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          {isRolling ? '굴리는 중...' : playsLeft > 0 ? '주사위 굴리기' : '플레이 횟수 소진'}
        </button>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg text-center">
            <div className="text-sm text-gray-600 mb-1">남은 플레이</div>
            <div className="text-xl font-bold text-green-600">{playsLeft}회</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg text-center">
            <div className="text-sm text-gray-600 mb-1">연속 콤보</div>
            <div className="text-xl font-bold text-blue-600">{combo}회</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg text-center">
            <div className="text-sm text-gray-600 mb-1">총 승리</div>
            <div className="text-xl font-bold text-purple-600">{totalWins}회</div>
          </div>
        </div>

        {/* 안내 */}
        <div className="bg-white/80 rounded-xl p-4 shadow-lg">
          <p className="text-xs text-gray-600 text-center">
            💡 합이 7, 11이면 보너스! 더블이나 2, 12도 특별 보너스예요!<br />
            하루 10회 무료로 플레이할 수 있어요!
          </p>
        </div>
      </main>
    </div>
  );
}


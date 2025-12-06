'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Ticket, Gift, Sparkles } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { formatNumber } from '@/lib/utils';

const rewards = [
  { type: '운세', amount: 0, emoji: '💎', message: '오늘은 보석같은 하루가 될 거예요!', color: 'from-blue-500 to-cyan-500', rarity: 'rare' },
  { type: '행운', amount: 0, emoji: '💰', message: '큰 행운이 다가오고 있어요!', color: 'from-green-500 to-emerald-500', rarity: 'normal' },
  { type: '성공', amount: 0, emoji: '🪙', message: '모든 일이 성공할 거예요!', color: 'from-yellow-500 to-orange-500', rarity: 'normal' },
  { type: '희망', amount: 0, emoji: '⭐', message: '희망찬 하루가 펼쳐질 거예요!', color: 'from-purple-500 to-pink-500', rarity: 'common' },
  { type: '기쁨', amount: 0, emoji: '✨', message: '즐거운 일이 생길 거예요!', color: 'from-gray-400 to-gray-600', rarity: 'common' },
  { type: '운세', amount: 0, emoji: '🔮', message: '오늘 하루 행운이 가득할 거예요!', color: 'from-indigo-500 to-purple-500', rarity: 'special' },
  { type: '격려', amount: 0, emoji: '💪', message: '오늘도 화이팅! 할 수 있어요!', color: 'from-pink-500 to-rose-500', rarity: 'special' },
  { type: '축복', amount: 0, emoji: '🌟', message: '당신은 최고의 사장님이에요!', color: 'from-amber-500 to-yellow-500', rarity: 'special' },
];

export default function LotteryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && db) {
        try {
          const today = new Date().toISOString().split('T')[0];
          
          // 출석 기록 확인
          const checkInRef = doc(db, 'user_checkin', currentUser.uid);
          const checkInSnap = await getDoc(checkInRef);
          
          if (checkInSnap.exists()) {
            const data = checkInSnap.data();
            if (data.lastLotteryDate === today) {
              setHasPlayedToday(true);
              if (data.todayLottery) {
                setResult(data.todayLottery);
              }
            }
          }

          // 포인트 확인
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserPoints(userSnap.data()?.points || 0);
          }
        } catch (error) {
          console.error('Error checking lottery:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const getRandomReward = () => {
    const rand = Math.random();
    
    // 확률: 특별(5%), 레어(10%), 일반(35%), 커먼(50%)
    if (rand < 0.05) {
      // 특별 보상
      return rewards.filter(r => r.rarity === 'special')[Math.floor(Math.random() * 3)];
    } else if (rand < 0.15) {
      // 레어 보상
      return rewards.filter(r => r.rarity === 'rare')[0];
    } else if (rand < 0.5) {
      // 일반 보상
      return rewards.filter(r => r.rarity === 'normal')[Math.floor(Math.random() * 2)];
    } else {
      // 커먼 보상
      return rewards.filter(r => r.rarity === 'common')[Math.floor(Math.random() * 2)];
    }
  };

  const handleDrawLottery = async () => {
    if (!user || !db || hasPlayedToday || isSpinning) return;

    setIsSpinning(true);

    // 랜덤 보상 선택
    const selectedReward = getRandomReward();

    // 애니메이션 후 결과 표시
    setTimeout(async () => {
      setResult(selectedReward);
      setHasPlayedToday(true);
      setIsSpinning(false);

      try {
        const today = new Date().toISOString().split('T')[0];
        const checkInRef = doc(db, 'user_checkin', user.uid);

        // 복권 기록 저장
        await setDoc(checkInRef, {
          lastLotteryDate: today,
          todayLottery: selectedReward,
        }, { merge: true });
      } catch (error) {
        console.error('Lottery save error:', error);
      }
    }, 2500);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-yellow-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 pb-24">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-yellow-600 to-orange-600 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Ticket size={24} />
            <span>사장님 복권</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-8">
        {/* 복권 뽑기 */}
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          {isSpinning ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
              className="w-64 h-64 rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 flex items-center justify-center shadow-2xl mb-6"
            >
              <Ticket className="w-32 h-32 text-white" />
            </motion.div>
          ) : result ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`bg-gradient-to-br ${result.color} rounded-3xl p-8 shadow-2xl max-w-sm w-full text-white text-center`}
            >
              <div className="text-6xl mb-4">{result.emoji}</div>
              <div className="text-sm opacity-90 mb-2">{result.type}</div>
              <div className="text-lg font-bold leading-relaxed">
                {result.message}
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-xs opacity-80">내일 다시 찾아와 주세요! ✨</p>
              </div>
            </motion.div>
          ) : (
            <div className="text-center">
              <div className="w-64 h-64 rounded-full bg-gradient-to-br from-yellow-200 via-orange-200 to-red-200 flex items-center justify-center shadow-xl mb-8">
                <Ticket className="w-32 h-32 text-yellow-600" />
              </div>
              <p className="text-gray-600 mb-2 font-semibold">오늘의 복권을 뽑아보세요!</p>
              <p className="text-sm text-gray-500 mb-6">매일 무료로 복권을 뽑을 수 있어요</p>
              <button
                onClick={handleDrawLottery}
                disabled={hasPlayedToday}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                복권 뽑기 🎫
              </button>
            </div>
          )}

          {hasPlayedToday && !isSpinning && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">오늘은 이미 복권을 뽑으셨어요!</p>
              <p className="text-xs text-gray-400 mt-1">내일 다시 찾아와 주세요 🎁</p>
            </div>
          )}
        </div>

        {/* 보상 안내 */}
        <div className="bg-white/80 rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5 text-yellow-600" />
            복권 보상 안내
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>💎 운세 메시지 (레어)</span>
              <span className="text-xs text-gray-400">10%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>💰 행운 메시지 (일반)</span>
              <span className="text-xs text-gray-400">18%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🪙 성공 메시지 (일반)</span>
              <span className="text-xs text-gray-400">17%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>⭐ 희망 메시지 (커먼)</span>
              <span className="text-xs text-gray-400">25%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>✨ 기쁨 메시지 (커먼)</span>
              <span className="text-xs text-gray-400">25%</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span>🔮 특별 메시지</span>
              <span className="text-xs text-gray-400">5%</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}






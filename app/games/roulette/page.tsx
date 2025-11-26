'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CircleDot, Gift, Sparkles } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { formatNumber } from '@/lib/utils';

const rouletteItems = [
  { id: 0, label: '10 포인트', value: 10, emoji: '✨', color: '#E5E7EB' },
  { id: 1, label: '20 포인트', value: 20, emoji: '⭐', color: '#F3F4F6' },
  { id: 2, label: '50 포인트', value: 50, emoji: '💰', color: '#FEF3C7' },
  { id: 3, label: '100 포인트', value: 100, emoji: '💎', color: '#DBEAFE' },
  { id: 4, label: '격려', value: 0, emoji: '💪', message: '오늘도 화이팅!', color: '#FCE7F3' },
  { id: 5, label: '10 포인트', value: 10, emoji: '✨', color: '#E5E7EB' },
  { id: 6, label: '30 포인트', value: 30, emoji: '🪙', color: '#FEF3C7' },
  { id: 7, label: '20 포인트', value: 20, emoji: '⭐', color: '#F3F4F6' },
];

const ITEM_COUNT = rouletteItems.length;
const ITEM_ANGLE = 360 / ITEM_COUNT;

export default function RoulettePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && db) {
        try {
          const today = new Date().toISOString().split('T')[0];
          
          const checkInRef = doc(db, 'user_checkin', currentUser.uid);
          const checkInSnap = await getDoc(checkInRef);
          
          if (checkInSnap.exists()) {
            const data = checkInSnap.data();
            if (data.lastRouletteDate === today) {
              setHasPlayedToday(true);
              if (data.todayRoulette) {
                setResult(data.todayRoulette);
              }
            }
          }

          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserPoints(userSnap.data()?.points || 0);
          }
        } catch (error) {
          console.error('Error checking roulette:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSpin = async () => {
    if (!user || !db || hasPlayedToday || isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    // 랜덤 아이템 선택
    const selectedItem = rouletteItems[Math.floor(Math.random() * rouletteItems.length)];
    
    // 룰렛 회전 계산
    const randomSpins = 5 + Math.random() * 3;
    const targetAngle = selectedItem.id * ITEM_ANGLE;
    const finalRotation = rotation + (randomSpins * 360) + (360 - (targetAngle % 360));
    
    setRotation(finalRotation);

    setTimeout(async () => {
      setResult(selectedItem);
      setIsSpinning(false);
      setHasPlayedToday(true);

      try {
        const today = new Date().toISOString().split('T')[0];
        const checkInRef = doc(db, 'user_checkin', user.uid);

        if (selectedItem.value > 0) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          const currentPoints = userSnap.data()?.points || 0;
          await setDoc(userRef, {
            points: currentPoints + selectedItem.value,
          }, { merge: true });
          setUserPoints(currentPoints + selectedItem.value);
        }

        await setDoc(checkInRef, {
          lastRouletteDate: today,
          todayRoulette: selectedItem,
        }, { merge: true });
      } catch (error) {
        console.error('Roulette save error:', error);
      }
    }, 3000);
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
            <CircleDot size={24} />
            <span>사장님 룰렛</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-8">
        {/* 룰렛 */}
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative w-80 h-80 mb-8">
            {/* 룰렛 원판 */}
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ duration: 3, ease: "easeOut" }}
              className="w-full h-full rounded-full border-8 border-white shadow-2xl relative overflow-hidden"
            >
              <svg className="w-full h-full" viewBox="0 0 200 200">
                {rouletteItems.map((item, index) => {
                  const angle = (index * ITEM_ANGLE - 90) * (Math.PI / 180);
                  const nextAngle = ((index + 1) * ITEM_ANGLE - 90) * (Math.PI / 180);
                  const largeArc = ITEM_ANGLE > 180 ? 1 : 0;
                  const x1 = 100 + 100 * Math.cos(angle);
                  const y1 = 100 + 100 * Math.sin(angle);
                  const x2 = 100 + 100 * Math.cos(nextAngle);
                  const y2 = 100 + 100 * Math.sin(nextAngle);
                  const textX = 100 + 70 * Math.cos(angle + (ITEM_ANGLE * Math.PI / 360));
                  const textY = 100 + 70 * Math.sin(angle + (ITEM_ANGLE * Math.PI / 360));
                  
                  return (
                    <g key={item.id}>
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={item.color}
                        stroke="#fff"
                        strokeWidth="2"
                      />
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="16"
                        fontWeight="bold"
                        fill="#374151"
                      >
                        {item.emoji}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </motion.div>

            {/* 룰렛 화살표 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-lg"></div>
            </div>
          </div>

          {/* 결과 */}
          {result && !isSpinning && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center mb-6"
            >
              <div className="text-5xl mb-3">{result.emoji}</div>
              {result.value > 0 ? (
                <>
                  <div className="text-sm text-gray-500 mb-2">축하합니다!</div>
                  <div className="text-2xl font-bold text-gray-800">
                    +{formatNumber(result.value)} 포인트
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-500 mb-2">격려 메시지</div>
                  <div className="text-lg font-bold text-gray-800">{result.message}</div>
                </>
              )}
            </motion.div>
          )}

          {/* 룰렛 돌리기 버튼 */}
          {!isSpinning && (
            <button
              onClick={handleSpin}
              disabled={hasPlayedToday}
              className={`px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed ${
                hasPlayedToday
                  ? 'bg-gray-400 text-white'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
              }`}
            >
              {hasPlayedToday ? '오늘 이미 돌렸어요!' : '룰렛 돌리기 🎡'}
            </button>
          )}

          {hasPlayedToday && !isSpinning && !result && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">오늘은 이미 룰렛을 돌리셨어요!</p>
              <p className="text-xs text-gray-400 mt-1">내일 다시 찾아와 주세요 🎁</p>
            </div>
          )}
        </div>

        {/* 포인트 정보 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              <span className="font-bold text-gray-800">내 포인트</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(userPoints)}P
            </div>
          </div>
        </div>

        {/* 안내 */}
        <div className="bg-white/80 rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-600" />
            룰렛 안내
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 하루에 1회 무료로 룰렛을 돌릴 수 있어요</li>
            <li>• 포인트부터 격려 메시지까지 다양한 보상이 있어요</li>
            <li>• 매일 새로운 기회를 잡아보세요!</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

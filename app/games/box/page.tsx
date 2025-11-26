'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Box, Gift, Sparkles } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

interface BoxReward {
  type: '포인트' | '격려';
  amount: number;
  emoji: string;
  message?: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  name: string;
}

const boxRewards: BoxReward[] = [
  // 일반 (Common) - 60%
  { type: '포인트', amount: 5, emoji: '🪙', color: 'from-gray-400 to-gray-600', rarity: 'common', name: '작은 코인' },
  { type: '포인트', amount: 10, emoji: '⭐', color: 'from-blue-400 to-blue-600', rarity: 'common', name: '작은 별' },
  { type: '포인트', amount: 15, emoji: '💰', color: 'from-green-400 to-green-600', rarity: 'common', name: '작은 지갑' },
  
  // 레어 (Rare) - 25%
  { type: '포인트', amount: 20, emoji: '💎', color: 'from-cyan-400 to-cyan-600', rarity: 'rare', name: '반짝이는 다이아' },
  { type: '포인트', amount: 30, emoji: '💵', color: 'from-emerald-400 to-emerald-600', rarity: 'rare', name: '지폐' },
  { type: '포인트', amount: 40, emoji: '🎁', color: 'from-purple-400 to-purple-600', rarity: 'rare', name: '선물 상자' },
  
  // 영웅 (Epic) - 12%
  { type: '포인트', amount: 50, emoji: '🏆', color: 'from-amber-400 to-amber-600', rarity: 'epic', name: '트로피' },
  { type: '포인트', amount: 75, emoji: '👑', color: 'from-yellow-400 to-yellow-600', rarity: 'epic', name: '왕관' },
  { type: '격려', amount: 0, emoji: '🌟', message: '오늘 하루도 화이팅!', color: 'from-pink-400 to-pink-600', rarity: 'epic', name: '격려 메시지' },
  
  // 전설 (Legendary) - 3%
  { type: '포인트', amount: 100, emoji: '💯', color: 'from-red-500 to-orange-500', rarity: 'legendary', name: '백 포인트' },
  { type: '포인트', amount: 150, emoji: '🚀', color: 'from-indigo-500 to-purple-500', rarity: 'legendary', name: '로켓 보너스' },
  { type: '격려', amount: 0, emoji: '🎉', message: '당신은 최고의 사장님!', color: 'from-rainbow-500 to-rainbow-600', rarity: 'legendary', name: '특별 메시지' },
];

const rarityColors = {
  common: 'from-gray-300 to-gray-500',
  rare: 'from-blue-300 to-blue-500',
  epic: 'from-purple-300 to-purple-500',
  legendary: 'from-yellow-300 to-orange-500',
};

const rarityNames = {
  common: '일반',
  rare: '레어',
  epic: '영웅',
  legendary: '전설',
};

export default function BoxPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [hasOpenedToday, setHasOpenedToday] = useState(false);
  const [result, setResult] = useState<BoxReward | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [openHistory, setOpenHistory] = useState<BoxReward[]>([]);
  const [bulkResults, setBulkResults] = useState<BoxReward[]>([]);
  const [isOpeningBulk, setIsOpeningBulk] = useState(false);

  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && db) {
        try {
          const today = new Date().toISOString().split('T')[0];
          
          // 박스 열기 기록 확인
          const boxRef = doc(db, 'user_games', currentUser.uid);
          const boxSnap = await getDoc(boxRef);
          
          if (boxSnap.exists()) {
            const data = boxSnap.data();
            if (data.lastBoxDate === today) {
              setHasOpenedToday(true);
              if (data.todayBox) {
                setResult(data.todayBox);
              }
              if (data.boxHistory) {
                setOpenHistory(data.boxHistory.slice(-5)); // 최근 5개만
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
          console.error('Error checking box:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const getRandomReward = (): BoxReward => {
    const rand = Math.random();
    
    // 확률: 전설(3%), 영웅(12%), 레어(25%), 일반(60%)
    if (rand < 0.03) {
      // 전설 (3%)
      const legendary = boxRewards.filter(r => r.rarity === 'legendary');
      return legendary[Math.floor(Math.random() * legendary.length)];
    } else if (rand < 0.15) {
      // 영웅 (12%)
      const epic = boxRewards.filter(r => r.rarity === 'epic');
      return epic[Math.floor(Math.random() * epic.length)];
    } else if (rand < 0.40) {
      // 레어 (25%)
      const rare = boxRewards.filter(r => r.rarity === 'rare');
      return rare[Math.floor(Math.random() * rare.length)];
    } else {
      // 일반 (60%)
      const common = boxRewards.filter(r => r.rarity === 'common');
      return common[Math.floor(Math.random() * common.length)];
    }
  };

  const openBoxes10 = async () => {
    if (!user || !db) return;
    
    if (userPoints < 100) {
      alert('포인트가 부족합니다! (필요: 100포인트)');
      return;
    }

    setIsOpeningBulk(true);
    setResult(null);
    setBulkResults([]);

    // 10개 박스 열기
    const rewards: BoxReward[] = [];
    let totalPointsEarned = 0;

    // 연속으로 10개 열기 (애니메이션 효과를 위해 약간의 딜레이)
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 300)); // 각 박스마다 0.3초 딜레이
      const reward = getRandomReward();
      rewards.push(reward);
      
      if (reward.type === '포인트') {
        totalPointsEarned += reward.amount;
      }
    }

    setBulkResults(rewards);
    setIsOpeningBulk(false);

    try {
      const today = new Date().toISOString().split('T')[0];
      const boxRef = doc(db, 'user_games', user.uid);
      const boxSnap = await getDoc(boxRef);
      
      const history = boxSnap.exists() ? (boxSnap.data().boxHistory || []) : [];
      const updatedHistory = [...history, ...rewards].slice(-20); // 최근 20개만 저장

      // 포인트 계산 및 저장
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const currentPoints = userSnap.data()?.points || 0;
      const newPoints = currentPoints - 100 + totalPointsEarned;
      
      await setDoc(userRef, {
        points: newPoints,
      }, { merge: true });
      setUserPoints(newPoints);

      // 박스 열기 기록 저장
      await setDoc(boxRef, {
        lastBoxDate: today,
        boxHistory: updatedHistory,
      }, { merge: true });
      
      setOpenHistory(updatedHistory.slice(-5));
    } catch (error) {
      console.error('Box save error:', error);
    }
  };

  const openBox = async (usePoints: boolean = false) => {
    if (!user || !db) return;
    
    if (hasOpenedToday && !usePoints) {
      alert('오늘은 이미 무료 박스를 열었어요! 포인트로 추가 박스를 열 수 있습니다.');
      return;
    }

    if (usePoints && userPoints < 10) {
      alert('포인트가 부족합니다! (필요: 10포인트)');
      return;
    }

    setIsOpening(true);
    setResult(null);

    // 박스 열기 애니메이션 (2초)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const selectedReward = getRandomReward();
    setResult(selectedReward);
    setIsOpening(false);

    try {
      const today = new Date().toISOString().split('T')[0];
      const boxRef = doc(db, 'user_games', user.uid);
      const boxSnap = await getDoc(boxRef);
      
      const history = boxSnap.exists() ? (boxSnap.data().boxHistory || []) : [];
      const updatedHistory = [...history, selectedReward].slice(-10); // 최근 10개만 저장

      // 포인트 지급 (포인트 타입인 경우)
      if (selectedReward.type === '포인트' && selectedReward.amount > 0) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const currentPoints = userSnap.data()?.points || 0;
        
        let newPoints = currentPoints + selectedReward.amount;
        
        // 포인트로 열었으면 차감
        if (usePoints) {
          newPoints -= 10;
          setHasOpenedToday(true); // 포인트로 열어도 오늘 열었다고 표시
        }
        
        await setDoc(userRef, {
          points: newPoints,
        }, { merge: true });
        setUserPoints(newPoints);
      } else if (usePoints) {
        // 격려 메시지여도 포인트 차감
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const currentPoints = userSnap.data()?.points || 0;
        await setDoc(userRef, {
          points: currentPoints - 10,
        }, { merge: true });
        setUserPoints(currentPoints - 10);
      }

      // 박스 열기 기록 저장
      await setDoc(boxRef, {
        lastBoxDate: today,
        todayBox: selectedReward,
        boxHistory: updatedHistory,
      }, { merge: true });
      
      setOpenHistory(updatedHistory.slice(-5));
      setHasOpenedToday(true);
    } catch (error) {
      console.error('Box save error:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-24">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-indigo-600 to-purple-600 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Box size={24} />
            <span>랜덤 박스</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* 포인트 표시 */}
        <div className="bg-white rounded-xl p-4 shadow-lg mb-6 text-center">
          <div className="text-sm text-gray-600 mb-1">보유 포인트</div>
          <div className="text-2xl font-bold text-indigo-600">{userPoints.toLocaleString()}P</div>
        </div>

        {/* 박스 열기 영역 */}
        <div className="bg-white rounded-2xl p-8 shadow-xl mb-6 text-center">
          {!result && !isOpening && (
            <>
              <div className="text-8xl mb-4">📦</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">랜덤 박스</h2>
              <p className="text-gray-600 mb-6">
                매일 무료로 박스를 열어보세요!<br />
                다양한 보상을 받을 수 있어요!
              </p>
            </>
          )}

          {isOpening && (
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-8xl mb-4"
            >
              📦
            </motion.div>
          )}


          {/* 단일 박스 결과 - 10개 열기 모드가 아닐 때만 표시 */}
          {result && !isOpening && bulkResults.length === 0 && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mb-6"
            >
              <div className={`inline-block bg-gradient-to-br ${result.color} rounded-2xl p-8 shadow-xl w-full`}>
                <div className="text-8xl mb-4 text-center">{result.emoji}</div>
                <div className="text-white text-center">
                  <div className="text-lg font-bold mb-2">{result.name}</div>
                  {result.type === '포인트' && (
                    <div className="text-3xl font-bold">+{result.amount} 포인트</div>
                  )}
                  {result.type === '격려' && result.message && (
                    <div className="text-lg">{result.message}</div>
                  )}
                  <div className={`mt-4 px-3 py-1 rounded-full bg-white/20 text-xs font-bold inline-block`}>
                    {rarityNames[result.rarity]}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 10개 열기 결과 */}
          {bulkResults.length > 0 && !isOpeningBulk && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="text-xl font-bold mb-4 text-center">🎉 10개 박스 결과!</h3>
                <div className="grid grid-cols-5 gap-2 mb-4 max-h-48 overflow-y-auto">
                  {bulkResults.map((reward, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-white/20 rounded-lg p-2 text-center`}
                    >
                      <div className="text-2xl mb-1">{reward.emoji}</div>
                      {reward.type === '포인트' && (
                        <div className="text-xs font-bold">+{reward.amount}</div>
                      )}
                    </motion.div>
                  ))}
                </div>
                <div className="text-center pt-4 border-t border-white/20">
                  <div className="text-lg mb-1">
                    총 획득: +{bulkResults.filter(r => r.type === '포인트').reduce((sum, r) => sum + r.amount, 0)} 포인트
                  </div>
                  <div className="text-sm opacity-90">
                    소비: -100 포인트 | 순이익: {bulkResults.filter(r => r.type === '포인트').reduce((sum, r) => sum + r.amount, 0) - 100 >= 0 ? '+' : ''}{bulkResults.filter(r => r.type === '포인트').reduce((sum, r) => sum + r.amount, 0) - 100} 포인트
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 박스 열기 애니메이션 (10개) */}
          {isOpeningBulk && (
            <div className="mb-6">
              <div className="text-center mb-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-6xl inline-block"
                >
                  📦
                </motion.div>
                <div className="text-lg font-bold text-gray-700 mt-2">
                  박스 {bulkResults.length + 1}/10 열는 중...
                </div>
              </div>
              {bulkResults.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {bulkResults.map((reward, index) => (
                    <div
                      key={index}
                      className={`bg-gradient-to-br ${reward.color} rounded-lg p-2 text-center text-white`}
                    >
                      <div className="text-xl">{reward.emoji}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 버튼 */}
          <div className="space-y-3">
            {!hasOpenedToday && !isOpeningBulk && (
              <button
                onClick={() => openBox(false)}
                disabled={isOpening}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOpening ? '박스 여는 중...' : '🎁 무료 박스 열기'}
              </button>
            )}
            
            <button
              onClick={() => {
                setBulkResults([]);
                setResult(null);
                openBox(true);
              }}
              disabled={isOpening || isOpeningBulk || userPoints < 10}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOpening ? '박스 여는 중...' : userPoints < 10 
                ? '포인트 부족 (10P 필요)' 
                : '💎 포인트로 박스 열기 (10P)'}
            </button>

            <button
              onClick={() => {
                setResult(null);
                openBoxes10();
              }}
              disabled={isOpening || isOpeningBulk || userPoints < 100}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            >
              {isOpeningBulk ? (
                <>
                  <span className="relative z-10">박스 {bulkResults.length}/10 여는 중...</span>
                </>
              ) : userPoints < 100 ? (
                '포인트 부족 (100P 필요)'
              ) : (
                '🎊 박스 10개 한번에 열기! (100P)'
              )}
            </button>
          </div>
        </div>

        {/* 최근 열어본 박스 */}
        {openHistory.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">최근 열어본 박스</h3>
            <div className="space-y-2">
              {openHistory.slice().reverse().map((reward, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg bg-gradient-to-r ${reward.color} text-white`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{reward.emoji}</span>
                    <div>
                      <div className="font-bold">{reward.name}</div>
                      {reward.type === '포인트' && (
                        <div className="text-sm opacity-90">+{reward.amount} 포인트</div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-white/20 rounded-full">
                    {rarityNames[reward.rarity]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 확률 안내 */}
        <div className="bg-white/80 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📊 보상 확률</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-gray-400 to-gray-600"></div>
                <span className="text-sm text-gray-700">일반</span>
              </div>
              <span className="text-sm font-bold text-gray-600">60%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <span className="text-sm text-gray-700">레어</span>
              </div>
              <span className="text-sm font-bold text-gray-600">25%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-400 to-purple-600"></div>
                <span className="text-sm text-gray-700">영웅</span>
              </div>
              <span className="text-sm font-bold text-gray-600">12%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-yellow-400 to-orange-600"></div>
                <span className="text-sm text-gray-700">전설</span>
              </div>
              <span className="text-sm font-bold text-gray-600">3%</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            💡 매일 무료 박스 1개 + 포인트로 추가 박스 구매 가능!
          </p>
        </div>
      </main>
    </div>
  );
}


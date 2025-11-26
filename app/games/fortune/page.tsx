'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Gift } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

const fortunes = [
  { type: '매출', emoji: '💰', messages: [
    '오늘은 고객이 줄줄이 찾아올 거예요! 대박 예감!',
    '평소보다 조금 조용할 수 있지만, 내일이 기대돼요!',
    '특별한 손님이 찾아와 특별한 수익이 있을 거예요!',
    '오늘은 차분하게 준비하는 날. 내일을 기대해요!',
  ]},
  { type: '고객', emoji: '👥', messages: [
    '친절한 고객들이 많이 찾아올 거예요!',
    '오늘은 리뷰가 많이 올라올 수 있어요!',
    '새로운 단골 고객을 만날 수 있는 날이에요!',
    '고객과의 소통이 특히 중요해요. 미소 잃지 마세요!',
  ]},
  { type: '건강', emoji: '💪', messages: [
    '오늘은 컨디션이 좋아요! 모든 일이 순조로울 거예요!',
    '무리하지 말고 적절히 쉬는 것도 중요해요!',
    '스트레스를 풀 시간을 가져보세요. 휴식도 전략이에요!',
    '오늘은 특히 몸이 무겁게 느껴질 수 있어요. 충분히 쉬세요!',
  ]},
  { type: '재물', emoji: '💎', messages: [
    '예상치 못한 수익이 생길 수 있어요!',
    '비용 관리를 잘하면 이득을 볼 수 있어요!',
    '투자보다는 안정적으로 운영하는 게 좋아요!',
    '작은 것부터 차근차근 쌓아가세요!',
  ]},
];

export default function FortunePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [fortune, setFortune] = useState<{ type: string; emoji: string; message: string } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && db) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const userRef = doc(db, 'user_games', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.lastFortuneDate === today) {
              setHasPlayedToday(true);
              if (data.todayFortune) {
                setFortune(data.todayFortune);
              }
            }
          }
        } catch (error) {
          console.error('Error checking fortune:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDrawFortune = async () => {
    if (!user || !db || hasPlayedToday) return;

    setIsSpinning(true);

    // 랜덤 운세 선택
    const randomType = fortunes[Math.floor(Math.random() * fortunes.length)];
    const randomMessage = randomType.messages[Math.floor(Math.random() * randomType.messages.length)];

    const selectedFortune = {
      type: randomType.type,
      emoji: randomType.emoji,
      message: randomMessage,
    };

    // 애니메이션 후 결과 표시
    setTimeout(() => {
      setFortune(selectedFortune);
      setHasPlayedToday(true);
      setIsSpinning(false);

      // Firestore에 저장
      const today = new Date().toISOString().split('T')[0];
      const userRef = doc(db, 'user_games', user.uid);
      setDoc(userRef, {
        lastFortuneDate: today,
        todayFortune: selectedFortune,
      }, { merge: true }).catch(console.error);
    }, 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pb-24">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-purple-600 to-indigo-600 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles size={24} />
            <span>사장님 운세 구슬</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-8">
        {/* 운세 구슬 */}
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          {isSpinning ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-64 h-64 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 flex items-center justify-center shadow-2xl"
            >
              <div className="text-6xl">🔮</div>
            </motion.div>
          ) : fortune ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center"
            >
              <div className="text-6xl mb-4">{fortune.emoji}</div>
              <div className="text-sm text-gray-500 mb-2">오늘의 {fortune.type} 운세</div>
              <div className="text-lg font-bold text-gray-800 leading-relaxed">
                {fortune.message}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-400">내일 다시 찾아와 주세요! ✨</p>
              </div>
            </motion.div>
          ) : (
            <div className="text-center">
              <div className="w-64 h-64 rounded-full bg-gradient-to-br from-purple-200 via-pink-200 to-indigo-200 flex items-center justify-center shadow-xl mb-8">
                <div className="text-6xl">🔮</div>
              </div>
              <p className="text-gray-600 mb-6">오늘의 운세를 뽑아보세요!</p>
              <button
                onClick={handleDrawFortune}
                disabled={hasPlayedToday}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                운세 뽑기 ✨
              </button>
            </div>
          )}

          {hasPlayedToday && !isSpinning && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">오늘은 이미 운세를 뽑으셨어요!</p>
              <p className="text-xs text-gray-400 mt-1">내일 다시 찾아와 주세요 🎁</p>
            </div>
          )}
        </div>

        {/* 안내 */}
        <div className="mt-8 bg-white/80 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <Gift className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h3 className="font-bold text-gray-800 mb-2">운세 구슬 안내</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 하루에 1회 무료로 운세를 뽑을 수 있어요</li>
                <li>• 매출, 고객, 건강, 재물 운세 중 하나가 나와요</li>
                <li>• 매일 새로운 운세를 받아보세요!</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


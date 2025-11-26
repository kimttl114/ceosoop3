'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Gift, CheckCircle2, Sparkles } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

export default function CheckInPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [checkInHistory, setCheckInHistory] = useState<boolean[]>([]);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && db) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const userRef = doc(db, 'user_checkin', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            const lastCheckIn = data.lastCheckInDate;
            const history = data.checkInHistory || [];
            const consecutive = data.consecutiveDays || 0;
            const points = data.totalPoints || 0;

            setTotalPoints(points);
            setConsecutiveDays(consecutive);
            setCheckInHistory(history);

            if (lastCheckIn === today) {
              setHasCheckedInToday(true);
            }
          }
        } catch (error) {
          console.error('Error checking check-in:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCheckIn = async () => {
    if (!user || !db || hasCheckedInToday || isAnimating) return;

    setIsAnimating(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const userRef = doc(db, 'user_checkin', user.uid);
      const userSnap = await getDoc(userRef);

      let newConsecutive = 1;
      let newHistory = [true];
      let points = 5; // 기본 출석 포인트

      if (userSnap.exists()) {
        const data = userSnap.data();
        const lastCheckIn = data.lastCheckInDate;
        const history = data.checkInHistory || [];
        const consecutive = data.consecutiveDays || 0;

        // 연속 출석 계산
        if (lastCheckIn === yesterdayStr) {
          newConsecutive = consecutive + 1;
        } else if (lastCheckIn !== today) {
          newConsecutive = 1;
        }

        // 연속 출석 보너스
        if (newConsecutive >= 7) {
          points = 15; // 7일 연속 보너스
        } else if (newConsecutive >= 3) {
          points = 10; // 3일 연속 보너스
        }

        // 최근 7일 기록 업데이트
        newHistory = [...history.slice(-6), true];
      }

      // 출석 기록 가져오기 (totalPoints 계산용)
      const userSnapData = userSnap.exists() ? userSnap.data() : {};
      const currentTotalPoints = userSnapData.totalPoints || 0;

      // 출석 기록 저장
      await setDoc(userRef, {
        lastCheckInDate: today,
        checkInHistory: newHistory,
        consecutiveDays: newConsecutive,
        totalPoints: currentTotalPoints + points,
      }, { merge: true });

      // 포인트 저장 (users 컬렉션)
      const userPointsRef = doc(db, 'users', user.uid);
      const userPointsSnap = await getDoc(userPointsRef);
      const currentPoints = userPointsSnap.data()?.points || 0;
      await setDoc(userPointsRef, {
        points: currentPoints + points,
      }, { merge: true });

      setPointsEarned(points);
      setHasCheckedInToday(true);
      setConsecutiveDays(newConsecutive);
      setCheckInHistory(newHistory);
      setTotalPoints(totalPoints + points);

      setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
    } catch (error) {
      console.error('Check-in error:', error);
      alert('출석체크 중 오류가 발생했습니다.');
      setIsAnimating(false);
    }
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
            <Calendar size={24} />
            <span>일일 출석체크</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-8">
        {/* 출석체크 버튼 */}
        <div className="text-center mb-8">
          {isAnimating ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center shadow-2xl mb-6"
            >
              <CheckCircle2 className="w-24 h-24 text-white" />
            </motion.div>
          ) : hasCheckedInToday ? (
            <div className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center shadow-2xl mb-6">
              <CheckCircle2 className="w-24 h-24 text-white" />
            </div>
          ) : (
            <button
              onClick={handleCheckIn}
              className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-2xl mb-6 hover:shadow-3xl transition transform hover:scale-105"
            >
              <div className="text-center text-white">
                <Gift className="w-16 h-16 mx-auto mb-2" />
                <div className="text-lg font-bold">출석체크</div>
                <div className="text-sm opacity-90">포인트 받기</div>
              </div>
            </button>
          )}

          {isAnimating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-green-600 mb-2">
                +{pointsEarned} 포인트!
              </div>
              <div className="text-lg text-gray-600">
                {consecutiveDays}일 연속 출석! 🎉
              </div>
            </motion.div>
          )}

          {hasCheckedInToday && !isAnimating && (
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                ✅ 오늘 출석 완료!
              </div>
              <div className="text-lg text-gray-600">
                {consecutiveDays}일 연속 출석 중
              </div>
              <div className="text-sm text-gray-500 mt-2">
                내일 다시 찾아와 주세요!
              </div>
            </div>
          )}
        </div>

        {/* 통계 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-600" />
            출석 통계
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{consecutiveDays}</div>
              <div className="text-sm text-gray-600">연속 출석</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{totalPoints}</div>
              <div className="text-sm text-gray-600">누적 포인트</div>
            </div>
          </div>
        </div>

        {/* 최근 7일 출석 기록 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-4">최근 7일 출석 기록</h3>
          <div className="flex gap-2 justify-center">
            {Array.from({ length: 7 }).map((_, index) => {
              const isChecked = checkInHistory[index];
              const isToday = index === 6;
              return (
                <div
                  key={index}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                    isChecked
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  } ${isToday ? 'ring-2 ring-green-600' : ''}`}
                  title={isToday ? '오늘' : `${7 - index}일 전`}
                >
                  {isChecked ? '✓' : '-'}
                </div>
              );
            })}
          </div>
        </div>

        {/* 보상 안내 */}
        <div className="mt-6 bg-white/80 rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-600" />
            출석 보상 안내
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• 매일 출석: <span className="font-bold text-green-600">5 포인트</span></li>
            <li>• 3일 연속: <span className="font-bold text-blue-600">10 포인트</span></li>
            <li>• 7일 연속: <span className="font-bold text-purple-600">15 포인트</span></li>
          </ul>
        </div>
      </main>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Store, Zap, Trophy, Star, Gift, TrendingUp, Users, Crown } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { formatNumber } from '@/lib/utils';

interface Upgrade {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  revenuePerSecond: number;
  level: number;
  category: 'basic' | 'staff' | 'marketing' | 'special';
}

interface BusinessType {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  initialMoney: number;
  upgrades: Upgrade[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  requirement: number;
  reward: number;
  unlocked: boolean;
}

const businessTypes: BusinessType[] = [
  {
    id: 'chicken',
    name: '치킨집',
    emoji: '🍗',
    description: '바삭한 치킨으로 인기를 끌어보세요!',
    color: 'from-red-500 to-orange-500',
    initialMoney: 500,
    upgrades: [
      { id: 'counter', name: '포장 카운터', emoji: '🪑', cost: 100, revenuePerSecond: 2, level: 0, category: 'basic' },
      { id: 'fryer', name: '튀김기', emoji: '🔥', cost: 500, revenuePerSecond: 10, level: 0, category: 'basic' },
      { id: 'chef', name: '주방장', emoji: '👨‍🍳', cost: 2000, revenuePerSecond: 50, level: 0, category: 'staff' },
      { id: 'delivery', name: '배달 서비스', emoji: '🛵', cost: 5000, revenuePerSecond: 150, level: 0, category: 'marketing' },
      { id: 'franchise', name: '프랜차이즈', emoji: '🏢', cost: 20000, revenuePerSecond: 800, level: 0, category: 'special' },
    ],
  },
  {
    id: 'cafe',
    name: '카페',
    emoji: '☕',
    description: '향기로운 커피와 분위기로 손님을 유치하세요!',
    color: 'from-amber-500 to-yellow-500',
    initialMoney: 300,
    upgrades: [
      { id: 'counter', name: '주문대', emoji: '🪑', cost: 80, revenuePerSecond: 1.5, level: 0, category: 'basic' },
      { id: 'machine', name: '에스프레소 머신', emoji: '☕', cost: 400, revenuePerSecond: 8, level: 0, category: 'basic' },
      { id: 'barista', name: '바리스타', emoji: '👨‍🍳', cost: 1500, revenuePerSecond: 40, level: 0, category: 'staff' },
      { id: 'wifi', name: '무료 와이파이', emoji: '📶', cost: 3000, revenuePerSecond: 120, level: 0, category: 'marketing' },
      { id: 'roastery', name: '로스터리', emoji: '🏭', cost: 15000, revenuePerSecond: 600, level: 0, category: 'special' },
    ],
  },
  {
    id: 'korean',
    name: '한식당',
    emoji: '🍚',
    description: '정성스러운 한식을 제공하여 명성을 쌓으세요!',
    color: 'from-green-500 to-emerald-500',
    initialMoney: 400,
    upgrades: [
      { id: 'counter', name: '카운터', emoji: '🪑', cost: 90, revenuePerSecond: 1.8, level: 0, category: 'basic' },
      { id: 'stove', name: '가스레인지', emoji: '🔥', cost: 450, revenuePerSecond: 9, level: 0, category: 'basic' },
      { id: 'chef', name: '한식 장인', emoji: '👨‍🍳', cost: 1800, revenuePerSecond: 45, level: 0, category: 'staff' },
      { id: 'review', name: '리뷰 관리', emoji: '⭐', cost: 3500, revenuePerSecond: 130, level: 0, category: 'marketing' },
      { id: 'branch', name: '분점 개설', emoji: '🏢', cost: 18000, revenuePerSecond: 700, level: 0, category: 'special' },
    ],
  },
  {
    id: 'japanese',
    name: '일식당',
    emoji: '🍣',
    description: '신선한 일식을 선보이며 고급 레스토랑으로 성장하세요!',
    color: 'from-pink-500 to-rose-500',
    initialMoney: 600,
    upgrades: [
      { id: 'counter', name: '스시 카운터', emoji: '🪑', cost: 120, revenuePerSecond: 2.5, level: 0, category: 'basic' },
      { id: 'knife', name: '일식 칼', emoji: '🔪', cost: 600, revenuePerSecond: 12, level: 0, category: 'basic' },
      { id: 'sushi_chef', name: '스시 장인', emoji: '👨‍🍳', cost: 2500, revenuePerSecond: 60, level: 0, category: 'staff' },
      { id: 'reservation', name: '예약 시스템', emoji: '📞', cost: 6000, revenuePerSecond: 180, level: 0, category: 'marketing' },
      { id: 'omakase', name: '오마카세 코스', emoji: '👑', cost: 25000, revenuePerSecond: 1000, level: 0, category: 'special' },
    ],
  },
];

const achievements: Achievement[] = [
  { id: 'first_million', name: '첫 100만원', emoji: '💰', description: '총 수익 100만원 달성', requirement: 1000000, reward: 100, unlocked: false },
  { id: 'first_billion', name: '10억 달성', emoji: '💎', description: '총 수익 10억원 달성', requirement: 1000000000, reward: 1000, unlocked: false },
  { id: 'speed_runner', name: '스피드 러너', emoji: '⚡', description: '1분 안에 10만원 달성', requirement: 100000, reward: 200, unlocked: false },
  { id: 'collector', name: '수집가', emoji: '📦', description: '모든 업그레이드 10레벨 달성', requirement: 10, reward: 500, unlocked: false },
  { id: 'tycoon', name: '재벌', emoji: '👑', description: '모든 특별 업그레이드 달성', requirement: 5, reward: 2000, unlocked: false },
];

export default function StorePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [money, setMoney] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [userUpgrades, setUserUpgrades] = useState<Record<string, number>>({});
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [showBusinessSelect, setShowBusinessSelect] = useState(true);
  const [bonusActive, setBonusActive] = useState(false);
  const [bonusMultiplier, setBonusMultiplier] = useState(1);
  const [bonusTime, setBonusTime] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coinAnimations, setCoinAnimations] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && db) {
        await loadGameData(currentUser.uid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadGameData = async (uid: string) => {
    if (!db) return;
    
    try {
      const gameRef = doc(db, 'user_games', uid);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        const data = gameSnap.data();
        const storeData = data.storeGame || {};
        
        if (storeData.businessType) {
          setSelectedBusiness(storeData.businessType);
          setMoney(storeData.money || 0);
          setTotalEarned(storeData.totalEarned || 0);
          setUserUpgrades(storeData.upgrades || {});
          setLevel(storeData.level || 1);
          setExperience(storeData.experience || 0);
          setUnlockedAchievements(storeData.achievements || []);
          setShowBusinessSelect(false);
          setGameStarted(true);
          
          // 오프라인 수익 계산
          const offlineTime = Date.now() - (storeData.lastSave || Date.now());
          const offlineSeconds = Math.min(Math.floor(offlineTime / 1000), 86400); // 최대 24시간
          const revenuePerSecond = calculateRevenuePerSecond(storeData.upgrades || {}, storeData.businessType);
          const offlineEarnings = Math.floor(revenuePerSecond * offlineSeconds * (storeData.bonusMultiplier || 1));
          
          if (offlineEarnings > 0) {
            setMoney(prev => prev + offlineEarnings);
            setTotalEarned(prev => prev + offlineEarnings);
          }
        }
      }
    } catch (error) {
      console.error('Error loading game data:', error);
    }
  };

  const startBusiness = (businessId: string) => {
    const business = businessTypes.find(b => b.id === businessId);
    if (!business) return;

    setSelectedBusiness(businessId);
    setMoney(business.initialMoney);
    setTotalEarned(0);
    setUserUpgrades({});
    setLevel(1);
    setExperience(0);
    setShowBusinessSelect(false);
    setGameStarted(true);
    
    saveGame();
  };

  const calculateRevenuePerSecond = (upgradesData: Record<string, number>, businessType?: string | null) => {
    if (!businessType) return 0;
    const business = businessTypes.find(b => b.id === businessType);
    if (!business) return 0;

    let total = 0;
    Object.entries(upgradesData).forEach(([upgradeId, level]) => {
      const upgrade = business.upgrades.find(u => u.id === upgradeId);
      if (upgrade) {
        total += upgrade.revenuePerSecond * level;
      }
    });
    return total * bonusMultiplier;
  };

  useEffect(() => {
    if (!user || !selectedBusiness || !gameStarted) return;
    
    const revenuePerSecond = calculateRevenuePerSecond(userUpgrades, selectedBusiness);
    if (revenuePerSecond === 0) return;
    
    const interval = setInterval(() => {
      const earned = revenuePerSecond;
      setMoney(prev => prev + earned);
      setTotalEarned(prev => prev + earned);
      
      // 경험치 획득
      const expGain = Math.floor(earned / 10);
      setExperience(prev => {
        const newExp = prev + expGain;
        const expNeeded = level * 100;
        if (newExp >= expNeeded) {
          setLevel(prevLevel => prevLevel + 1);
          // 레벨업 보너스
          setBonusActive(true);
          setBonusMultiplier(2);
          setBonusTime(60);
          return newExp - expNeeded;
        }
        return newExp;
      });

      // 코인 애니메이션
      if (Math.random() > 0.7) {
        const newCoin = {
          id: Date.now(),
          x: Math.random() * 100,
          y: Math.random() * 100,
        };
        setCoinAnimations(prev => [...prev.slice(-4), newCoin]);
        setTimeout(() => {
          setCoinAnimations(prev => prev.filter(c => c.id !== newCoin.id));
        }, 2000);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [user, selectedBusiness, userUpgrades, bonusMultiplier, gameStarted, level]);

  // 보너스 타이머
  useEffect(() => {
    if (!bonusActive) return;

    const interval = setInterval(() => {
      setBonusTime(prev => {
        if (prev <= 1) {
          setBonusActive(false);
          setBonusMultiplier(1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [bonusActive]);

  // 업적 체크
  useEffect(() => {
    if (!selectedBusiness || !gameStarted) return;

    const business = businessTypes.find(b => b.id === selectedBusiness);
    if (!business) return;

    achievements.forEach(achievement => {
      if (unlockedAchievements.includes(achievement.id)) return;

      let unlocked = false;
      if (achievement.id === 'first_million' || achievement.id === 'first_billion') {
        unlocked = totalEarned >= achievement.requirement;
      } else if (achievement.id === 'collector') {
        unlocked = Object.values(userUpgrades).every(lvl => lvl >= achievement.requirement);
      } else if (achievement.id === 'tycoon') {
        const specialUpgrades = business.upgrades.filter(u => u.category === 'special');
        unlocked = specialUpgrades.every(upgrade => (userUpgrades[upgrade.id] || 0) > 0);
      }

      if (unlocked) {
        setUnlockedAchievements(prev => [...prev, achievement.id]);
        setMoney(prev => prev + achievement.reward);
        
        // 포인트 지급
        if (user && db) {
          const userRef = doc(db, 'users', user.uid);
          updateDoc(userRef, {
            points: increment(achievement.reward),
          }).catch(console.error);
        }
      }
    });
  }, [totalEarned, userUpgrades, selectedBusiness, unlockedAchievements, gameStarted, user, db]);

  const saveGame = async () => {
    if (!user || !db || !selectedBusiness) return;

    try {
      const gameRef = doc(db, 'user_games', user.uid);
      await setDoc(gameRef, {
        storeGame: {
          businessType: selectedBusiness,
          money,
          totalEarned,
          upgrades: userUpgrades,
          level,
          experience,
          achievements: unlockedAchievements,
          bonusMultiplier,
          lastSave: Date.now(),
        },
      }, { merge: true });

      // 포인트 지급 (총 수익 / 1000)
      const pointsToAdd = Math.floor(totalEarned / 1000);
      if (pointsToAdd > 0) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const lastStorePoints = userSnap.data()?.storeLastPoints || 0;
        
        if (pointsToAdd > lastStorePoints) {
          await updateDoc(userRef, {
            points: increment(pointsToAdd - lastStorePoints),
            storeLastPoints: pointsToAdd,
          });
        }
      }
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  useEffect(() => {
    if (!user || !db || !selectedBusiness || !gameStarted) return;
    
    const saveInterval = setInterval(() => {
      saveGame();
    }, 30000); // 30초마다 저장
    
    return () => clearInterval(saveInterval);
  }, [user, db, selectedBusiness, money, totalEarned, userUpgrades, level, experience, unlockedAchievements, gameStarted]);

  const buyUpgrade = (upgradeId: string) => {
    if (!selectedBusiness) return;
    const business = businessTypes.find(b => b.id === selectedBusiness);
    if (!business) return;

    const upgrade = business.upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;
    
    const currentLevel = userUpgrades[upgradeId] || 0;
    const cost = Math.floor(upgrade.cost * Math.pow(1.5, currentLevel));
    
    if (money >= cost) {
      setMoney(prev => prev - cost);
      setUserUpgrades(prev => ({
        ...prev,
        [upgradeId]: (prev[upgradeId] || 0) + 1,
      }));
    }
  };

  const getUpgradeCost = (upgradeId: string) => {
    if (!selectedBusiness) return 0;
    const business = businessTypes.find(b => b.id === selectedBusiness);
    if (!business) return 0;

    const upgrade = business.upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return 0;
    const currentLevel = userUpgrades[upgradeId] || 0;
    return Math.floor(upgrade.cost * Math.pow(1.5, currentLevel));
  };

  const revenuePerSecond = selectedBusiness ? calculateRevenuePerSecond(userUpgrades, selectedBusiness) : 0;
  const business = selectedBusiness ? businessTypes.find(b => b.id === selectedBusiness) : null;
  const unlockedAchievementsData = achievements.filter(a => unlockedAchievements.includes(a.id));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 pb-24 relative overflow-hidden">
      {/* 코인 애니메이션 */}
      <AnimatePresence>
        {coinAnimations.map(coin => (
          <motion.div
            key={coin.id}
            initial={{ opacity: 1, y: coin.y, x: coin.x, scale: 0 }}
            animate={{ opacity: 0, y: coin.y - 100, x: coin.x, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="fixed pointer-events-none z-50"
            style={{ left: `${coin.x}%`, top: `${coin.y}%` }}
          >
            <div className="text-2xl">💰</div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 헤더 */}
      <header className={`bg-gradient-to-br ${business?.color || 'from-emerald-600 to-green-600'} sticky top-0 z-30 shadow-lg`}>
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Store size={24} />
            <span>{business?.name || '가게 키우기'}</span>
          </h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 relative z-10">
        {showBusinessSelect ? (
          // 업종 선택
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-xl mb-6 text-center"
          >
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">가게 키우기</h2>
            <p className="text-gray-600 mb-6">
              원하는 업종을 선택하여 가게를 키워보세요!<br />
              업그레이드로 수익을 늘리고 업적을 달성하세요!
            </p>

            <div className="grid grid-cols-2 gap-4">
              {businessTypes.map((businessType) => (
                <motion.button
                  key={businessType.id}
                  onClick={() => startBusiness(businessType.id)}
                  className={`bg-gradient-to-br ${businessType.color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition transform hover:scale-105`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-4xl mb-2">{businessType.emoji}</div>
                  <div className="font-bold mb-1">{businessType.name}</div>
                  <div className="text-xs opacity-90 mb-2">{businessType.description}</div>
                  <div className="text-xs opacity-75">시작 자본: {formatNumber(businessType.initialMoney)}원</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <>
            {/* 보너스 알림 */}
            {bonusActive && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl p-4 mb-4 shadow-lg text-center font-bold"
              >
                ⚡ 레벨업 보너스! 수익 2배 ({bonusTime}초 남음)
              </motion.div>
            )}

            {/* 현재 상태 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-xl mb-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-200/30 to-green-200/30 rounded-full blur-3xl"></div>
              
              <div className="text-center mb-4 relative z-10">
                <div className="text-6xl mb-2">{business?.emoji}</div>
                <div className="text-4xl font-bold text-emerald-600 mb-1">
                  {formatNumber(money)}원
                </div>
                <div className="text-sm text-gray-600">
                  초당 수익: {formatNumber(revenuePerSecond)}원
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 relative z-10">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-600 mb-1">총 수익</div>
                  <div className="text-sm font-bold text-gray-800">
                    {formatNumber(totalEarned)}원
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-600 mb-1">레벨</div>
                  <div className="text-sm font-bold text-emerald-600 flex items-center justify-center gap-1">
                    <Star size={14} className="text-yellow-500" />
                    <span>{level}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-600 mb-1">경험치</div>
                  <div className="text-xs font-bold text-purple-600">
                    {experience} / {level * 100}
                  </div>
                </div>
              </div>

              {/* 경험치 바 */}
              <div className="mt-3 relative z-10">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(experience / (level * 100)) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>

            {/* 업적 */}
            {unlockedAchievementsData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 shadow-lg mb-4"
              >
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Trophy className="text-yellow-500" size={18} />
                  <span>달성한 업적 ({unlockedAchievementsData.length}/{achievements.length})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {unlockedAchievementsData.map(ach => (
                    <div
                      key={ach.id}
                      className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 flex items-center gap-2"
                    >
                      <span>{ach.emoji}</span>
                      <span className="text-xs font-semibold text-gray-800">{ach.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 업그레이드 목록 */}
            {business && (
              <div className="space-y-3 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Zap size={20} className="text-yellow-500" />
                  <span>업그레이드</span>
                </h2>
                
                {['basic', 'staff', 'marketing', 'special'].map(category => {
                  const categoryUpgrades = business.upgrades.filter(u => u.category === category);
                  if (categoryUpgrades.length === 0) return null;

                  const categoryNames = {
                    basic: '기본 시설',
                    staff: '직원',
                    marketing: '마케팅',
                    special: '특별 업그레이드',
                  };

                  return (
                    <div key={category} className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-600 mb-2 ml-1">
                        {categoryNames[category as keyof typeof categoryNames]}
                      </h3>
                      {categoryUpgrades.map(upgrade => {
                        const level = userUpgrades[upgrade.id] || 0;
                        const cost = getUpgradeCost(upgrade.id);
                        const canAfford = money >= cost;
                        
                        return (
                          <motion.div
                            key={upgrade.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-xl p-4 shadow-lg mb-3 relative z-10"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="text-4xl">{upgrade.emoji}</div>
                                <div className="flex-1">
                                  <div className="font-bold text-gray-800">{upgrade.name}</div>
                                  <div className="text-xs text-gray-600">
                                    레벨 {level} | +{formatNumber(upgrade.revenuePerSecond * level)}/초
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (!canAfford) {
                                    return;
                                  }
                                  buyUpgrade(upgrade.id);
                                }}
                                className={`px-4 py-3 rounded-lg font-bold transition-all min-w-[90px] touch-manipulation select-none ${
                                  canAfford
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 active:scale-95 cursor-pointer shadow-md'
                                    : 'bg-gray-200 text-gray-500 cursor-pointer active:scale-95'
                                }`}
                                style={{ 
                                  WebkitTapHighlightColor: 'transparent', 
                                  touchAction: 'manipulation',
                                  WebkitUserSelect: 'none',
                                  userSelect: 'none'
                                }}
                              >
                                {formatNumber(cost)}원
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 새로 시작 버튼 */}
            <button
              onClick={() => {
                if (confirm('정말 새로 시작하시겠습니까? 현재 진행 상황이 저장됩니다.')) {
                  setShowBusinessSelect(true);
                  setSelectedBusiness(null);
                  setGameStarted(false);
                }
              }}
              className="w-full bg-gray-500 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition mb-4"
            >
              새로 시작
            </button>

            {/* 안내 */}
            <div className="bg-white/80 rounded-xl p-4 shadow-lg">
              <p className="text-xs text-gray-600 text-center">
                💡 업그레이드로 수익을 늘리고 레벨업을 해보세요!<br />
                레벨업 시 수익 2배 보너스를 받을 수 있어요!<br />
                앱을 꺼도 수익이 계속 쌓여요! (총 수익 / 1000 = 포인트)
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

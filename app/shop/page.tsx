'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { ArrowLeft, ShoppingBag, Star, Sparkles, Crown, Trophy, Gift, Zap, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'badge' | 'emoji' | 'theme' | 'special';
  icon: string;
  color: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

const shopItems: ShopItem[] = [
  // 배지 카테고리
  {
    id: 'badge_star',
    name: '별 배지',
    description: '프로필에 표시되는 별 배지',
    price: 100,
    category: 'badge',
    icon: '⭐',
    color: 'from-yellow-400 to-yellow-600',
    rarity: 'common',
  },
  {
    id: 'badge_crown',
    name: '왕관 배지',
    description: '프로필에 표시되는 왕관 배지',
    price: 500,
    category: 'badge',
    icon: '👑',
    color: 'from-amber-400 to-amber-600',
    rarity: 'rare',
  },
  {
    id: 'badge_trophy',
    name: '트로피 배지',
    description: '프로필에 표시되는 트로피 배지',
    price: 300,
    category: 'badge',
    icon: '🏆',
    color: 'from-orange-400 to-orange-600',
    rarity: 'rare',
  },
  {
    id: 'badge_sparkles',
    name: '반짝이 배지',
    description: '프로필에 표시되는 반짝이 배지',
    price: 200,
    category: 'badge',
    icon: '✨',
    color: 'from-pink-400 to-pink-600',
    rarity: 'common',
  },
  {
    id: 'badge_diamond',
    name: '다이아몬드 배지',
    description: '프로필에 표시되는 다이아몬드 배지',
    price: 1000,
    category: 'badge',
    icon: '💎',
    color: 'from-cyan-400 to-cyan-600',
    rarity: 'epic',
  },
  {
    id: 'badge_fire',
    name: '불꽃 배지',
    description: '프로필에 표시되는 불꽃 배지',
    price: 800,
    category: 'badge',
    icon: '🔥',
    color: 'from-red-400 to-red-600',
    rarity: 'epic',
  },
  {
    id: 'badge_legend',
    name: '레전드 배지',
    description: '프로필에 표시되는 레전드 배지',
    price: 2000,
    category: 'badge',
    icon: '🌟',
    color: 'from-purple-400 to-purple-600',
    rarity: 'legendary',
  },
  
  // 테마 카테고리
  {
    id: 'theme_gold',
    name: '골드 테마',
    description: '프로필을 골드 테마로 변경',
    price: 500,
    category: 'theme',
    icon: '🎨',
    color: 'from-yellow-500 to-amber-500',
    rarity: 'rare',
  },
  {
    id: 'theme_rainbow',
    name: '레인보우 테마',
    description: '프로필을 레인보우 테마로 변경',
    price: 800,
    category: 'theme',
    icon: '🌈',
    color: 'from-pink-500 via-purple-500 to-blue-500',
    rarity: 'epic',
  },
  {
    id: 'theme_neon',
    name: '네온 테마',
    description: '프로필을 네온 테마로 변경',
    price: 600,
    category: 'theme',
    icon: '💡',
    color: 'from-cyan-500 to-green-500',
    rarity: 'epic',
  },
  
  // 특별 아이템
  {
    id: 'special_boost',
    name: '경험치 부스터',
    description: '1주일간 포인트 획득량 1.5배',
    price: 1000,
    category: 'special',
    icon: '⚡',
    color: 'from-yellow-500 to-orange-500',
    rarity: 'epic',
  },
  {
    id: 'special_adfree',
    name: '광고 제거 (1개월)',
    description: '1개월간 광고 없이 사용',
    price: 1500,
    category: 'special',
    icon: '🚫',
    color: 'from-gray-500 to-gray-700',
    rarity: 'rare',
  },
];

const categoryIcons = {
  badge: Trophy,
  emoji: Sparkles,
  theme: Crown,
  special: Gift,
};

const rarityColors = {
  common: 'border-gray-300 bg-gray-50',
  rare: 'border-blue-300 bg-blue-50',
  epic: 'border-purple-300 bg-purple-50',
  legendary: 'border-yellow-300 bg-yellow-50',
};

const rarityLabels = {
  common: '일반',
  rare: '희귀',
  epic: '영웅',
  legendary: '전설',
};

export default function ShopPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUserPoints(userData.points || 0);
            setOwnedItems(userData.shopItems || []);
          }
        } catch (error) {
          console.error('사용자 정보 불러오기 오류:', error);
        }
      } else {
        router.push('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handlePurchase = async (item: ShopItem) => {
    if (!user || !db) return;
    
    if (ownedItems.includes(item.id)) {
      alert('이미 구매한 아이템입니다!');
      return;
    }

    if (userPoints < item.price) {
      alert('포인트가 부족합니다!');
      return;
    }

    if (!confirm(`${item.name}을(를) ${item.price}P에 구매하시겠습니까?`)) {
      return;
    }

    setPurchasing(item.id);

    try {
      const userRef = doc(db, 'users', user.uid);
      
      // 포인트 차감 및 아이템 추가
      await updateDoc(userRef, {
        points: increment(-item.price),
        shopItems: [...ownedItems, item.id],
        updatedAt: new Date().toISOString(),
      });

      setUserPoints(prev => prev - item.price);
      setOwnedItems(prev => [...prev, item.id]);
      setPurchasing(null);
      setShowSuccess(true);
      
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error('구매 오류:', error);
      alert('구매에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
      setPurchasing(null);
    }
  };

  const filteredItems = selectedCategory
    ? shopItems.filter(item => item.category === selectedCategory)
    : shopItems;

  const categories = ['badge', 'theme', 'special'] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pb-24">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-purple-600 to-pink-600 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/20 rounded-full transition text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <ShoppingBag size={24} />
              <span>포인트 상점</span>
            </h1>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
            <span className="text-white font-bold">{userPoints.toLocaleString()}P</span>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* 카테고리 필터 */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition ${
              selectedCategory === null
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            전체
          </button>
          {categories.map((category) => {
            const Icon = categoryIcons[category];
            const categoryName = category === 'badge' ? '배지' : category === 'theme' ? '테마' : '특별';
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} />
                <span>{categoryName}</span>
              </button>
            );
          })}
        </div>

        {/* 아이템 그리드 */}
        <div className="grid grid-cols-2 gap-4">
          {filteredItems.map((item, index) => {
            const isOwned = ownedItems.includes(item.id);
            const canAfford = userPoints >= item.price;
            const isPurchasing = purchasing === item.id;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 ${
                  item.rarity ? rarityColors[item.rarity] : 'border-gray-200'
                } ${isOwned ? 'ring-2 ring-green-400' : ''}`}
              >
                {/* 아이템 이미지/아이콘 */}
                <div className={`bg-gradient-to-br ${item.color} p-6 text-center relative`}>
                  <div className="text-5xl mb-2">{item.icon}</div>
                  {item.rarity && (
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        item.rarity === 'legendary' ? 'bg-yellow-400 text-yellow-900' :
                        item.rarity === 'epic' ? 'bg-purple-400 text-purple-900' :
                        item.rarity === 'rare' ? 'bg-blue-400 text-blue-900' :
                        'bg-gray-400 text-gray-900'
                      }`}>
                        {rarityLabels[item.rarity]}
                      </span>
                    </div>
                  )}
                  {isOwned && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                        보유중
                      </span>
                    </div>
                  )}
                </div>

                {/* 아이템 정보 */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-1">{item.name}</h3>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  
                  {/* 가격 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-purple-600">{item.price.toLocaleString()}P</span>
                  </div>

                  {/* 구매 버튼 */}
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={isOwned || !canAfford || isPurchasing}
                    className={`w-full py-2 rounded-xl font-bold text-sm transition ${
                      isOwned
                        ? 'bg-green-500 text-white cursor-not-allowed'
                        : !canAfford
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : `bg-gradient-to-r ${item.color} text-white hover:shadow-lg`
                    }`}
                  >
                    {isPurchasing ? (
                      '구매 중...'
                    ) : isOwned ? (
                      '✓ 보유중'
                    ) : !canAfford ? (
                      '포인트 부족'
                    ) : (
                      '구매하기'
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 안내 */}
        <div className="mt-6 bg-white/80 rounded-xl p-4 shadow-lg">
          <p className="text-xs text-gray-600 text-center">
            💡 구매한 아이템은 마이페이지에서 설정할 수 있어요!<br />
            포인트는 게임, 출석체크, 게시글 작성으로 획득할 수 있습니다.
          </p>
        </div>
      </main>

      {/* 성공 메시지 */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
              <span className="text-xl">✓</span>
              <span className="font-bold">구매 완료!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}




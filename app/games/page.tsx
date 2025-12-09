'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Puzzle, Brain, Square, Scale, Target, Utensils, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import GamesBackground from '@/components/GamesBackground';

const games = [
  {
    id: 'diagnose',
    title: '내 시급은?',
    description: '사장님 실제 시급 자동 계산 🎯',
    icon: Target,
    color: 'from-blue-500 to-cyan-500',
    route: '/diagnose',
    available: true,
    daily: false,
    hot: true,
  },
  {
    id: 'balance',
    title: '사장님 밸런스 게임',
    description: '현실 자극적인 선택의 순간! 🔥',
    icon: Scale,
    color: 'from-purple-500 to-pink-500',
    route: '/games/balance',
    available: true,
    daily: false,
    hot: true,
  },
  {
    id: 'food-battle',
    title: '오늘 뭐먹지?',
    description: 'AI 음식 배틀로얄 게임 🍽️',
    icon: Utensils,
    color: 'from-orange-500 to-red-500',
    route: '/tools/food-battle',
    available: true,
    daily: false,
  },
  {
    id: 'puzzle',
    title: '매출 퍼즐',
    description: '2048 스타일 아이템 합치기',
    icon: Puzzle,
    color: 'from-indigo-500 to-purple-500',
    route: '/games/puzzle',
    available: true,
    daily: false,
  },
  {
    id: 'quiz',
    title: '비즈니스 퀴즈',
    description: '자영업 관련 퀴즈 풀기',
    icon: Brain,
    color: 'from-violet-500 to-purple-500',
    route: '/games/quiz',
    available: true,
    daily: false,
  },
  {
    id: 'tetris',
    title: '블록 게임',
    description: '테트리스 스타일 블록 떨어뜨리기',
    icon: Square,
    color: 'from-blue-500 to-cyan-500',
    route: '/games/tetris',
    available: true,
    daily: false,
  },
  {
    id: 'fortune',
    title: '무료 종합 운세',
    description: 'AI 올인원 운세 서비스 🔮',
    icon: Sparkles,
    color: 'from-yellow-500 to-amber-500',
    route: 'https://all-fo.vercel.app/',
    available: true,
    daily: false,
    external: true,
  },
];

export default function GamesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pb-24 relative overflow-hidden">
      {/* 아기자기한 배경 */}
      <GamesBackground />
      
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-purple-600 to-indigo-600 sticky top-0 z-30 shadow-lg backdrop-blur-sm bg-opacity-95">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles size={24} />
            <span>게임존</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6 relative z-10">
        {/* 귀여운 헤더 */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-4xl"
            >
              🎮
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="text-4xl"
            >
              ✨
            </motion.div>
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              className="text-4xl"
            >
              🎯
            </motion.div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            스트레스 해소 게임
          </h2>
          <p className="text-gray-600 text-sm">재미있게 놀면서 스트레스 해소! 💕</p>
        </div>

        <div className="space-y-4">
          {games.map((game, index) => {
            const Icon = game.icon;
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {game.available ? (
                  <Link
                    href={game.route}
                    className="block bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:scale-[1.02] border-2 border-white/50 relative overflow-hidden group"
                  >
                    {/* 반짝이는 효과 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        className={`w-16 h-16 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center flex-shrink-0 shadow-md`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-800">{game.title}</h3>
                          {game.daily && (
                            <motion.span
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full border border-green-200"
                            >
                              ✨ 일일
                            </motion.span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{game.description}</p>
                      </div>
                      <div className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        →
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="block bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 opacity-60 relative">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center flex-shrink-0 opacity-50`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-800">{game.title}</h3>
                          {game.daily && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full opacity-50">
                              일일
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{game.description}</p>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">
                        준비중
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gradient-to-r from-purple-100/80 via-pink-100/80 to-indigo-100/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-purple-200/50 relative overflow-hidden"
        >
          {/* 장식 요소 */}
          <div className="absolute top-2 right-2 text-2xl opacity-20">🎀</div>
          <div className="absolute bottom-2 left-2 text-2xl opacity-20">🌸</div>
          
          <p className="text-sm text-gray-700 text-center font-medium relative z-10">
            <span className="text-lg">🎮</span> 총 <span className="font-bold text-purple-600">{games.filter(g => g.available).length}개</span>의 게임을 즐길 수 있어요!<br />
            재미있게 놀아보세요! <span className="text-lg">🎉</span>
          </p>
        </motion.div>
      </main>
    </div>
  );
}


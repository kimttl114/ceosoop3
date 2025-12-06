'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Food } from '@/lib/foodDatabase'
import FoodCard from './FoodCard'

interface BattleArenaProps {
  food1: Food | null
  food2: Food | null
  winner: 'food1' | 'food2' | null
  reason: string
  round: number
  totalRounds: number
  remainingCount: number
}

export default function BattleArena({
  food1,
  food2,
  winner,
  reason,
  round,
  totalRounds,
  remainingCount,
}: BattleArenaProps) {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 border-2 border-gray-700 shadow-2xl">
      {/* 상태 표시 */}
      <div className="flex items-center justify-between mb-6 text-white">
        <div className="text-sm">
          <span className="text-gray-400">라운드: </span>
          <span className="font-bold text-yellow-400">
            {round}/{totalRounds}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-gray-400">남은 음식: </span>
          <span className="font-bold text-yellow-400">{remainingCount}개</span>
        </div>
      </div>

      {/* 배틀 영역 */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {food1 && food2 && (
            <motion.div
              key={`${food1.id}-${food2.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-8 py-8"
            >
              {/* 음식 1 */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <FoodCard
                  food={food1}
                  isWinner={winner === 'food1'}
                  isLoser={winner === 'food2'}
                  size="large"
                />
                
                {/* 능력치 바 */}
                <div className="w-full space-y-1 mt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-12">인기</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${food1.stats.popularity}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-yellow-400 h-full"
                      />
                    </div>
                    <span className="w-8 text-right">{food1.stats.popularity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-12">맛</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${food1.stats.taste}%` }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="bg-red-400 h-full"
                      />
                    </div>
                    <span className="w-8 text-right">{food1.stats.taste}</span>
                  </div>
                </div>
              </div>

              {/* VS */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="text-4xl font-bold text-red-500"
              >
                VS
              </motion.div>

              {/* 음식 2 */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <FoodCard
                  food={food2}
                  isWinner={winner === 'food2'}
                  isLoser={winner === 'food1'}
                  size="large"
                />
                
                {/* 능력치 바 */}
                <div className="w-full space-y-1 mt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-8 text-left">{food2.stats.popularity}</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${food2.stats.popularity}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-yellow-400 h-full"
                      />
                    </div>
                    <span className="w-12 text-right">인기</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-8 text-left">{food2.stats.taste}</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${food2.stats.taste}%` }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="bg-red-400 h-full"
                      />
                    </div>
                    <span className="w-12 text-right">맛</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 실황 텍스트 */}
      <AnimatePresence mode="wait">
        {reason && (
          <motion.div
            key={reason}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700"
          >
            <p className="text-center text-white font-medium">
              🎙️ {reason}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}



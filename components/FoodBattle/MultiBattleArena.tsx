'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Food } from '@/lib/foodDatabase'
import { getFoodImage } from '@/lib/unsplashImages'
import Image from 'next/image'

interface BattleMatch {
  food1: Food
  food2: Food
  winner?: 'food1' | 'food2'
}

interface MultiBattleArenaProps {
  matches: BattleMatch[]
  round: number
  totalRounds: number
  remainingCount: number
}

export default function MultiBattleArena({
  matches,
  round,
  totalRounds,
  remainingCount,
}: MultiBattleArenaProps) {
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({})

  const getImage = (food: Food) => food.imageUrl || getFoodImage(food.name)

  return (
    <div className="min-h-screen -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-2 sm:p-3">
      {/* 상태 표시 */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-black/40 backdrop-blur-sm rounded-xl p-2 sm:p-3 mb-2 border border-yellow-400/30"
      >
        <div className="flex items-center justify-between text-white text-xs sm:text-sm">
          <div>
            <span className="text-gray-400">R </span>
            <span className="font-bold text-yellow-400 text-base sm:text-lg">
              {round}/{totalRounds}
            </span>
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-center"
          >
            <span className="text-gray-400">남은 </span>
            <span className="font-bold text-red-400 text-base sm:text-lg">{remainingCount}</span>
          </motion.div>
          <div>
            <span className="text-gray-400">배틀 </span>
            <span className="font-bold text-orange-400 text-base sm:text-lg">{matches.length}</span>
          </div>
        </div>
        
        {/* 진행률 바 */}
        <div className="mt-2 w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((100 - remainingCount) / 100) * 100}%` }}
            className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 h-full"
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>

      {/* 10개 배틀 그리드 - 각각 좌우 분할 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <AnimatePresence mode="sync">
          {matches.map((match, index) => (
            <motion.div
              key={`match-${index}-${match.food1.id}-${match.food2.id}`}
              initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotateY: 180 }}
              transition={{ 
                delay: index * 0.05,
                type: 'spring',
                stiffness: 200,
                damping: 15
              }}
              className="relative"
            >
              {/* 배틀 카드 - 좌우 분할 */}
              <motion.div
                animate={
                  match.winner
                    ? {}
                    : {
                        boxShadow: [
                          '0 0 0px rgba(239, 68, 68, 0.5)',
                          '0 0 15px rgba(239, 68, 68, 0.8)',
                          '0 0 0px rgba(239, 68, 68, 0.5)',
                        ],
                      }
                }
                transition={{ duration: 1, repeat: match.winner ? 0 : Infinity }}
                className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl overflow-hidden border-2 border-red-500/30 shadow-lg"
              >
                <div className="flex items-stretch">
                  {/* 왼쪽 음식 */}
                  <div className={`flex-1 relative ${
                    match.winner === 'food1' ? 'ring-2 ring-yellow-400' : ''
                  } ${match.winner === 'food2' ? 'opacity-50 grayscale' : ''}`}>
                    <div className="relative w-full aspect-square">
                      {!imageErrors[match.food1.id] ? (
                        <Image
                          src={getImage(match.food1)}
                          alt={match.food1.name}
                          fill
                          className="object-cover"
                          onError={() => setImageErrors({ ...imageErrors, [match.food1.id]: true })}
                          sizes="(max-width: 640px) 50vw, 200px"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-900 to-orange-900 flex items-center justify-center text-4xl">
                          {match.food1.emoji}
                        </div>
                      )}
                      {/* 음식 이름 */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-2 sm:p-3">
                        <p className="text-white font-black text-sm sm:text-lg text-center drop-shadow-lg leading-tight">
                          {match.food1.name}
                        </p>
                      </div>
                    </div>
                    {/* 승자 표시 */}
                    {match.winner === 'food1' && (
                      <motion.div
                        initial={{ scale: 0, rotate: -360 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute top-2 right-2 bg-gradient-to-br from-yellow-300 to-yellow-500 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg border-2 border-white z-10"
                      >
                        🏆
                      </motion.div>
                    )}
                  </div>

                  {/* VS - 중앙 */}
                  <motion.div
                    animate={{
                      scale: match.winner ? [1, 0.8] : [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: match.winner ? 0 : Infinity,
                    }}
                    className="flex items-center justify-center bg-black/50 px-1 sm:px-2"
                  >
                    <div className="text-red-500 font-black text-lg sm:text-xl drop-shadow-[0_0_10px_rgba(239,68,68,1)]">
                      ⚔️
                    </div>
                  </motion.div>

                  {/* 오른쪽 음식 */}
                  <div className={`flex-1 relative ${
                    match.winner === 'food2' ? 'ring-2 ring-yellow-400' : ''
                  } ${match.winner === 'food1' ? 'opacity-50 grayscale' : ''}`}>
                    <div className="relative w-full aspect-square">
                      {!imageErrors[match.food2.id] ? (
                        <Image
                          src={getImage(match.food2)}
                          alt={match.food2.name}
                          fill
                          className="object-cover"
                          onError={() => setImageErrors({ ...imageErrors, [match.food2.id]: true })}
                          sizes="(max-width: 640px) 50vw, 200px"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center text-4xl">
                          {match.food2.emoji}
                        </div>
                      )}
                      {/* 음식 이름 */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-2 sm:p-3">
                        <p className="text-white font-black text-sm sm:text-lg text-center drop-shadow-lg leading-tight">
                          {match.food2.name}
                        </p>
                      </div>
                    </div>
                    {/* 승자 표시 */}
                    {match.winner === 'food2' && (
                      <motion.div
                        initial={{ scale: 0, rotate: -360 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute top-2 left-2 bg-gradient-to-br from-yellow-300 to-yellow-500 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg border-2 border-white z-10"
                      >
                        🏆
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 실황 텍스트 */}
      <motion.div
        key={`round-${round}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 p-3 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-yellow-500/20 backdrop-blur-sm rounded-xl border-2 border-orange-500/50"
      >
        <motion.p
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-center text-white text-xs sm:text-sm font-bold drop-shadow-lg"
        >
          🔥 {matches.length}개의 배틀이 동시에 진행 중! 🔥
        </motion.p>
      </motion.div>
    </div>
  )
}



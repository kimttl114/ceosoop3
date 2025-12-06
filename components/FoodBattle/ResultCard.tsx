'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Food } from '@/lib/foodDatabase'
import { getFoodImage } from '@/lib/unsplashImages'
import { Trophy, Medal, Sparkles } from 'lucide-react'
import Image from 'next/image'

interface ResultCardProps {
  winner: Food
  secondPlace: Food
  thirdPlace: Food
  onRestart: () => void
}

export default function ResultCard({
  winner,
  secondPlace,
  thirdPlace,
  onRestart,
}: ResultCardProps) {
  const [imageError, setImageError] = useState<{ [key: string]: boolean }>({})
  
  const getImage = (food: Food) => {
    return food.imageUrl || getFoodImage(food.name)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-4 sm:p-8 text-center relative overflow-hidden"
    >
      {/* 배경 애니메이션 */}
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 opacity-10"
      >
        <Sparkles className="absolute top-10 left-10" size={40} />
        <Sparkles className="absolute top-20 right-20" size={60} />
        <Sparkles className="absolute bottom-20 left-20" size={50} />
        <Sparkles className="absolute bottom-10 right-10" size={40} />
      </motion.div>

      <div className="relative z-10">
        {/* 우승 트로피 */}
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Trophy className="mx-auto text-white mb-4" size={48} />
        </motion.div>

        <motion.h2
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-3xl sm:text-5xl font-black text-white mb-6 drop-shadow-2xl"
        >
          🏆 최종 우승! 🏆
        </motion.h2>

        {/* 우승자 대형 이미지 */}
        <motion.div
          initial={{ scale: 0, rotateY: -180 }}
          animate={{ scale: 1, rotateY: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="relative w-48 h-48 sm:w-64 sm:h-64 mx-auto mb-6"
        >
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0px rgba(255, 255, 255, 0.5)',
                '0 0 40px rgba(255, 255, 255, 1)',
                '0 0 0px rgba(255, 255, 255, 0.5)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative w-full h-full rounded-3xl overflow-hidden border-8 border-white shadow-2xl"
          >
            {!imageError[winner.id] ? (
              <Image
                src={getImage(winner)}
                alt={winner.name}
                fill
                className="object-cover"
                onError={() => setImageError({ ...imageError, [winner.id]: true })}
                sizes="256px"
                unoptimized
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-yellow-200 to-orange-200 flex items-center justify-center text-8xl">
                {winner.emoji}
              </div>
            )}
          </motion.div>
          
          {/* 왕관 */}
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              y: [0, -5, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 text-6xl"
          >
            👑
          </motion.div>
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-5xl sm:text-7xl font-black text-white mb-6 drop-shadow-2xl leading-tight"
        >
          {winner.name}
        </motion.h3>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white/30 backdrop-blur-md rounded-2xl p-4 sm:p-6 mb-6 border-2 border-white shadow-2xl"
        >
          <p className="text-white text-lg sm:text-2xl font-bold drop-shadow-lg">
            🎉 100개 음식 배틀로얄 최후의 승자! 🎉
          </p>
        </motion.div>

        {/* 2,3등 - 이미지 포함 */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, type: 'spring' }}
            className="bg-white/30 backdrop-blur-md rounded-2xl p-3 sm:p-4 border-2 border-white shadow-xl"
          >
            <Medal className="mx-auto text-gray-100 mb-2" size={32} />
            <p className="text-white text-sm sm:text-lg font-bold mb-2">🥈 2등</p>
            
            {/* 2등 이미지 */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-2 rounded-xl overflow-hidden border-4 border-white shadow-lg">
              {!imageError[secondPlace.id] ? (
                <Image
                  src={getImage(secondPlace)}
                  alt={secondPlace.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError({ ...imageError, [secondPlace.id]: true })}
                  sizes="96px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-4xl">
                  {secondPlace.emoji}
                </div>
              )}
            </div>
            
            <p className="text-white text-base sm:text-xl font-black leading-tight">{secondPlace.name}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, type: 'spring' }}
            className="bg-white/30 backdrop-blur-md rounded-2xl p-3 sm:p-4 border-2 border-white shadow-xl"
          >
            <Medal className="mx-auto text-orange-200 mb-2" size={32} />
            <p className="text-white text-sm sm:text-lg font-bold mb-2">🥉 3등</p>
            
            {/* 3등 이미지 */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-2 rounded-xl overflow-hidden border-4 border-white shadow-lg">
              {!imageError[thirdPlace.id] ? (
                <Image
                  src={getImage(thirdPlace)}
                  alt={thirdPlace.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError({ ...imageError, [thirdPlace.id]: true })}
                  sizes="96px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center text-4xl">
                  {thirdPlace.emoji}
                </div>
              )}
            </div>
            
            <p className="text-white text-base sm:text-xl font-black leading-tight">{thirdPlace.name}</p>
          </motion.div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRestart}
            className="w-full bg-white text-orange-600 font-black py-4 sm:py-5 px-6 rounded-2xl shadow-2xl hover:bg-gray-100 transition-all text-lg sm:text-xl"
          >
            🔄 다시 배틀 시작!
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const message = `🏆 음식 배틀그라운드 결과!\n\n우승: ${winner.emoji} ${winner.name}\n2등: ${secondPlace.emoji} ${secondPlace.name}\n3등: ${thirdPlace.emoji} ${thirdPlace.name}\n\n100개 음식 중 최후의 승자는 ${winner.name}!`
              
              if (navigator.share) {
                navigator.share({
                  title: '음식 배틀그라운드',
                  text: message,
                })
              } else {
                navigator.clipboard.writeText(message)
                alert('결과가 클립보드에 복사되었습니다!')
              }
            }}
            className="w-full bg-white/30 backdrop-blur-md text-white font-black py-3 sm:py-4 px-6 rounded-2xl border-4 border-white hover:bg-white/40 transition-all shadow-2xl text-base sm:text-lg"
          >
            📤 결과 공유하기
          </motion.button>
        </div>

        {/* 추천 메시지 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-6 bg-white/30 backdrop-blur-md rounded-2xl p-4 border-2 border-white"
        >
          <motion.p
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-white text-lg sm:text-xl font-black drop-shadow-lg"
          >
            오늘은 {winner.name} 어때요? 😋
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  )
}



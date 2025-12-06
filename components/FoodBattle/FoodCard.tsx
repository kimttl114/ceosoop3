'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Food } from '@/lib/foodDatabase'
import { getFoodImage } from '@/lib/unsplashImages'
import Image from 'next/image'

interface FoodCardProps {
  food: Food
  isWinner?: boolean
  isLoser?: boolean
  size?: 'small' | 'medium' | 'large'
}

export default function FoodCard({ food, isWinner, isLoser, size = 'medium' }: FoodCardProps) {
  const [imageError, setImageError] = useState(false)
  const imageUrl = food.imageUrl || getFoodImage(food.name)

  const sizeClasses = {
    small: 'w-16 h-20',
    medium: 'w-24 h-28',
    large: 'w-32 h-36',
  }

  const imageSizes = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-20 h-20',
  }

  const emojiSizes = {
    small: 'text-3xl',
    medium: 'text-4xl',
    large: 'text-5xl',
  }

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{
        scale: isLoser ? 0 : 1,
        rotate: 0,
        opacity: isLoser ? 0 : 1,
      }}
      transition={{ duration: 0.4 }}
      className={`${sizeClasses[size]} flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 border-2 relative ${
        isWinner ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-gray-700'
      }`}
    >
      {isWinner && (
        <motion.div
          animate={{
            boxShadow: [
              '0 0 0px #FFD700',
              '0 0 20px #FFD700',
              '0 0 0px #FFD700',
            ],
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="absolute inset-0 rounded-xl"
        />
      )}

      {/* 음식 이미지 */}
      <motion.div
        animate={
          isWinner
            ? {
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0],
              }
            : {}
        }
        transition={{ duration: 0.6 }}
        className={`${imageSizes[size]} relative rounded-lg overflow-hidden bg-gray-700`}
      >
        {!imageError ? (
          <Image
            src={imageUrl}
            alt={food.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes={size === 'small' ? '48px' : size === 'medium' ? '64px' : '80px'}
            unoptimized
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${emojiSizes[size]}`}>
            {food.emoji}
          </div>
        )}
      </motion.div>

      <span className="text-white text-xs font-medium text-center line-clamp-1">
        {food.name}
      </span>

      {isWinner && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-3 -right-3 bg-yellow-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs"
        >
          WIN
        </motion.div>
      )}
    </motion.div>
  )
}



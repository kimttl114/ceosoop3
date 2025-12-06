'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { foodDatabase, Food, BattleLog } from '@/lib/foodDatabase'
import MultiBattleArena from '@/components/FoodBattle/MultiBattleArena'
import ResultCard from '@/components/FoodBattle/ResultCard'
import { ArrowLeft, Play, Pause } from 'lucide-react'

interface BattleMatch {
  food1: Food
  food2: Food
  winner?: 'food1' | 'food2'
}

export default function FoodBattlePage() {
  const router = useRouter()
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready')
  const [foods, setFoods] = useState<Food[]>([])
  const [currentMatches, setCurrentMatches] = useState<BattleMatch[]>([])
  const [round, setRound] = useState(0)
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [topThree, setTopThree] = useState<Food[]>([])
  const BATCH_SIZE = 10 // 동시에 진행할 배틀 수

  // 게임 시작
  const startGame = () => {
    // 음식 데이터 복사 및 초기화
    const initialFoods = foodDatabase.map((food) => ({
      ...food,
      isAlive: true,
      wins: 0,
    }))
    
    // 랜덤 셔플
    const shuffled = [...initialFoods].sort(() => Math.random() - 0.5)
    
    setFoods(shuffled)
    setGameState('playing')
    setRound(1)
    setBattleLogs([])
    setTopThree([])
  }

  // 단일 배틀 실행 (API 호출)
  const runSingleBattle = async (food1: Food, food2: Food): Promise<{ winner: 'food1' | 'food2', winnerFood: Food }> => {
    try {
      // API 호출
      const response = await fetch('/api/food-battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food1, food2 }),
      })

      const result = await response.json()
      
      // 승자 결정
      const winnerFood = result.winner === 'food1' ? food1 : food2
      winnerFood.wins++

      // 패자 제거
      const loserFood = result.winner === 'food1' ? food2 : food1
      loserFood.isAlive = false

      return { winner: result.winner, winnerFood }
    } catch (error) {
      console.error('배틀 오류:', error)
      
      // 폴백: 능력치 기반 승부
      const score1 = (
        food1.stats.popularity * 0.4 +
        food1.stats.taste * 0.3 +
        food1.stats.price * 0.2 +
        food1.stats.health * 0.1
      ) + Math.random() * 30
      
      const score2 = (
        food2.stats.popularity * 0.4 +
        food2.stats.taste * 0.3 +
        food2.stats.price * 0.2 +
        food2.stats.health * 0.1
      ) + Math.random() * 30
      
      const winner = score1 > score2 ? 'food1' : 'food2'
      const winnerFood = winner === 'food1' ? food1 : food2
      const loser = winner === 'food1' ? food2 : food1
      
      loser.isAlive = false
      winnerFood.wins++
      
      return { winner, winnerFood }
    }
  }

  // 배치 배틀 진행 (10개씩)
  const runBatchBattle = async (aliveFoods: Food[], isFinal: boolean = false) => {
    const survivors: Food[] = []
    
    // 10개씩 묶어서 처리
    for (let batchStart = 0; batchStart < aliveFoods.length; batchStart += BATCH_SIZE) {
      if (isPaused) {
        await new Promise((resolve) => {
          const interval = setInterval(() => {
            if (!isPaused) {
              clearInterval(interval)
              resolve(null)
            }
          }, 100)
        })
      }

      const batchEnd = Math.min(batchStart + BATCH_SIZE, aliveFoods.length)
      const batchFoods = aliveFoods.slice(batchStart, batchEnd)
      
      // 배치 내에서 쌍 만들기
      const matches: BattleMatch[] = []
      for (let i = 0; i < batchFoods.length; i += 2) {
        if (i + 1 < batchFoods.length) {
          matches.push({
            food1: batchFoods[i],
            food2: batchFoods[i + 1],
          })
        } else {
          // 홀수면 자동 진출
          survivors.push(batchFoods[i])
        }
      }

      // 화면에 표시
      setCurrentMatches(matches)
      
      // 결승전이면 긴 대기, 아니면 짧은 대기
      const showDelay = isFinal ? 1500 : 200
      await new Promise((resolve) => setTimeout(resolve, showDelay))

      // 모든 배틀을 동시에 실행
      const battlePromises = matches.map((match) =>
        runSingleBattle(match.food1, match.food2)
      )

      const results = await Promise.all(battlePromises)

      // 결과를 화면에 반영
      const updatedMatches = matches.map((match, index) => ({
        ...match,
        winner: results[index].winner,
      }))
      setCurrentMatches(updatedMatches)

      // 승자들을 survivors에 추가
      results.forEach((result) => {
        survivors.push(result.winnerFood)
      })

      // 결승전이면 긴 대기, 아니면 짧은 대기
      const resultDelay = isFinal ? 3000 : 300
      await new Promise((resolve) => setTimeout(resolve, resultDelay))
    }

    return survivors
  }

  // 게임 메인 루프
  useEffect(() => {
    if (gameState !== 'playing') return
    if (isPaused) return

    const runGame = async () => {
      let aliveFoods = foods.filter((f) => f.isAlive)

      while (aliveFoods.length > 1) {
        // 결승전 여부 확인 (남은 음식이 2개일 때)
        const isFinal = aliveFoods.length === 2
        
        const survivors = await runBatchBattle(aliveFoods, isFinal)
        aliveFoods = survivors
        setRound((prev) => prev + 1)
        
        // 상태 업데이트
        setFoods([...foods])
        
        // 결승전이 아니면 짧은 대기만
        if (!isFinal) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

      // 게임 종료
      const finalWinner = aliveFoods[0]
      const sortedByWins = [...foods].sort((a, b) => b.wins - a.wins)
      setTopThree([sortedByWins[0], sortedByWins[1], sortedByWins[2]])
      setGameState('finished')
    }

    runGame()
  }, [gameState, isPaused])

  const aliveFoods = foods.filter((f) => f.isAlive)
  const totalRounds = Math.ceil(Math.log2(100))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* 헤더 - 모바일 최적화 */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 border-b-4 border-yellow-400 sticky top-0 z-20 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 sm:gap-2 text-white hover:text-yellow-300 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium text-sm sm:text-base">뒤로</span>
            </button>
            <motion.h1
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-base sm:text-xl font-black text-white drop-shadow-lg"
            >
              🍽️ 음식 배틀그라운드
            </motion.h1>
            <div className="w-10 sm:w-20" /> {/* Spacer */}
          </div>
        </div>
      </motion.div>

      {/* 메인 컨텐츠 - 모바일 전체 화면 활용 */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {/* 시작 화면 */}
          {gameState === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center px-4 py-8 min-h-[calc(100vh-80px)] flex flex-col justify-center"
            >
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl sm:text-8xl mb-6"
              >
                🍗🍕🍜
              </motion.div>

              <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 drop-shadow-2xl">
                음식 배틀그라운드
              </h2>

              <p className="text-lg sm:text-2xl text-gray-300 mb-8 font-bold">
                100개의 음식이 대격돌!<br />
                최후의 1개만 살아남는다! 💥
              </p>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl p-6 sm:p-8 mb-8 border-2 border-orange-500 shadow-2xl max-w-md mx-auto"
              >
                <h3 className="text-lg sm:text-xl font-black text-yellow-400 mb-4 flex items-center justify-center gap-2">
                  <span>⚔️</span>
                  <span>게임 방식</span>
                  <span>⚔️</span>
                </h3>
                <ul className="text-left text-gray-300 space-y-3 text-sm sm:text-base font-medium">
                  <li className="flex items-center gap-2">
                    <span className="text-yellow-400 text-xl">✅</span>
                    <span>100개 음식 토너먼트 배틀</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-400 text-xl">🔥</span>
                    <span>10개씩 동시 배틀 진행!</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-400 text-xl">🤖</span>
                    <span>AI가 실시간 승부 판정</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400 text-xl">🏆</span>
                    <span>최후의 승자 = 오늘의 메뉴!</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400 text-xl">⏱️</span>
                    <span>약 15초 초스피드 ⚡</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-pink-400 text-xl">💥</span>
                    <span>결승전은 특별한 긴장감!</span>
                  </li>
                </ul>
              </motion.div>

              <motion.button
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white font-black text-xl sm:text-2xl py-5 px-12 rounded-full shadow-2xl hover:shadow-yellow-500/50 transition-all mx-auto border-4 border-white"
              >
                <Play className="inline mr-2" size={28} />
                배틀 시작! 🔥
              </motion.button>
            </motion.div>
          )}

          {/* 게임 진행 화면 - 전체 화면 */}
          {gameState === 'playing' && currentMatches.length > 0 && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 sm:px-6 py-4"
            >
              {/* 일시정지 버튼 */}
              <div className="flex justify-end mb-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsPaused(!isPaused)}
                  className="flex items-center gap-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-2 rounded-xl border-2 border-yellow-400 hover:border-yellow-300 transition-colors shadow-lg font-bold"
                >
                  {isPaused ? (
                    <>
                      <Play size={18} />
                      <span>계속</span>
                    </>
                  ) : (
                    <>
                      <Pause size={18} />
                      <span>일시정지</span>
                    </>
                  )}
                </motion.button>
              </div>

              <MultiBattleArena
                matches={currentMatches}
                round={round}
                totalRounds={totalRounds}
                remainingCount={aliveFoods.length}
              />
            </motion.div>
          )}

          {/* 결과 화면 */}
          {gameState === 'finished' && topThree.length === 3 && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <ResultCard
                winner={topThree[0]}
                secondPlace={topThree[1]}
                thirdPlace={topThree[2]}
                onRestart={startGame}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}


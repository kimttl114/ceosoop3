'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Puzzle } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

// 자영업 아이템 (2048 스타일)
const items = [
  { value: 2, emoji: '🍗', name: '치킨', color: 'bg-yellow-100' },
  { value: 4, emoji: '☕', name: '커피', color: 'bg-amber-100' },
  { value: 8, emoji: '🍜', name: '라면', color: 'bg-orange-100' },
  { value: 16, emoji: '🍕', name: '피자', color: 'bg-red-100' },
  { value: 32, emoji: '🍔', name: '햄버거', color: 'bg-yellow-200' },
  { value: 64, emoji: '🍱', name: '도시락', color: 'bg-green-100' },
  { value: 128, emoji: '🍰', name: '케이크', color: 'bg-pink-100' },
  { value: 256, emoji: '🍺', name: '맥주', color: 'bg-blue-100' },
  { value: 512, emoji: '🍷', name: '와인', color: 'bg-purple-100' },
  { value: 1024, emoji: '🍾', name: '샴페인', color: 'bg-indigo-100' },
  { value: 2048, emoji: '👑', name: '왕관', color: 'bg-gradient-to-br from-yellow-300 to-orange-300' },
];

const GRID_SIZE = 4;

export default function PuzzlePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [grid, setGrid] = useState<number[][]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && db) {
        try {
          const gameRef = doc(db, 'user_games', currentUser.uid);
          const gameSnap = await getDoc(gameRef);
          
          if (gameSnap.exists()) {
            const data = gameSnap.data();
            setBestScore(data.puzzleBestScore || 0);
          }
        } catch (error) {
          console.error('Error loading game data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 초기 그리드 생성
  const initGrid = useCallback(() => {
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    return newGrid;
  }, []);

  // 랜덤 타일 추가
  const addRandomTile = (grid: number[][]) => {
    const emptyCells: [number, number][] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j] === 0) {
          emptyCells.push([i, j]);
        }
      }
    }
    
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      grid[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
  };

  // 게임 시작
  useEffect(() => {
    if (user) {
      setGrid(initGrid());
      setScore(0);
      setGameOver(false);
      setWon(false);
    }
  }, [user, initGrid]);

  // 그리드 이동 로직
  const moveGrid = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver) return;

    const newGrid = grid.map(row => [...row]);
    let moved = false;
    let newScore = score;

    // 이동 및 병합 로직
    const processLine = (line: number[]) => {
      const filtered = line.filter(val => val !== 0);
      const merged: number[] = [];
      
      for (let i = 0; i < filtered.length; i++) {
        if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
          const mergedValue = filtered[i] * 2;
          merged.push(mergedValue);
          newScore += mergedValue;
          i++; // 다음 요소 스킵
        } else {
          merged.push(filtered[i]);
        }
      }
      
      while (merged.length < GRID_SIZE) {
        merged.push(0);
      }
      
      return merged;
    };

    // 방향별 처리
    if (direction === 'left') {
      for (let i = 0; i < GRID_SIZE; i++) {
        const newLine = processLine(newGrid[i]);
        if (JSON.stringify(newGrid[i]) !== JSON.stringify(newLine)) {
          moved = true;
        }
        newGrid[i] = newLine;
      }
    } else if (direction === 'right') {
      for (let i = 0; i < GRID_SIZE; i++) {
        const newLine = processLine([...newGrid[i]].reverse()).reverse();
        if (JSON.stringify(newGrid[i]) !== JSON.stringify(newLine)) {
          moved = true;
        }
        newGrid[i] = newLine;
      }
    } else if (direction === 'up') {
      for (let j = 0; j < GRID_SIZE; j++) {
        const column = newGrid.map(row => row[j]);
        const newColumn = processLine(column);
        if (JSON.stringify(column) !== JSON.stringify(newColumn)) {
          moved = true;
        }
        for (let i = 0; i < GRID_SIZE; i++) {
          newGrid[i][j] = newColumn[i];
        }
      }
    } else if (direction === 'down') {
      for (let j = 0; j < GRID_SIZE; j++) {
        const column = newGrid.map(row => row[j]);
        const newColumn = processLine([...column].reverse()).reverse();
        if (JSON.stringify(column) !== JSON.stringify(newColumn)) {
          moved = true;
        }
        for (let i = 0; i < GRID_SIZE; i++) {
          newGrid[i][j] = newColumn[i];
        }
      }
    }

    if (moved) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);
      
      // 2048 달성 확인
      if (!won && newGrid.some(row => row.some(cell => cell === 2048))) {
        setWon(true);
      }
      
      // 게임 오버 확인
      if (isGameOver(newGrid)) {
        setGameOver(true);
        saveBestScore(newScore);
      }
    }
  };

  // 게임 오버 확인
  const isGameOver = (grid: number[][]) => {
    // 빈 칸이 있는지 확인
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j] === 0) return false;
      }
    }
    
    // 병합 가능한 타일이 있는지 확인
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const current = grid[i][j];
        if (
          (i < GRID_SIZE - 1 && grid[i + 1][j] === current) ||
          (j < GRID_SIZE - 1 && grid[i][j + 1] === current)
        ) {
          return false;
        }
      }
    }
    
    return true;
  };

  // 최고 점수 저장
  const saveBestScore = async (currentScore: number) => {
    if (!user || !db || currentScore <= bestScore) return;
    
    try {
      const gameRef = doc(db, 'user_games', user.uid);
      await setDoc(gameRef, {
        puzzleBestScore: currentScore,
      }, { merge: true });
      setBestScore(currentScore);
      
      // 포인트 지급 (레벨 × 5)
      const level = Math.floor(currentScore / 100);
      const points = level * 5;
      if (points > 0) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const currentPoints = userSnap.data()?.points || 0;
        await setDoc(userRef, {
          points: currentPoints + points,
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  // 키보드 이벤트
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
        moveGrid(direction);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [grid, gameOver]);

  // 아이템 정보 가져오기
  const getItemInfo = (value: number) => {
    return items.find(item => item.value === value) || items[0];
  };

  // 게임 재시작
  const restartGame = () => {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold"
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
            <Puzzle size={24} />
            <span>매출 퍼즐</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* 점수 표시 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="text-sm text-gray-600 mb-1">현재 점수</div>
            <div className="text-2xl font-bold text-gray-900">{score.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="text-sm text-gray-600 mb-1">최고 점수</div>
            <div className="text-2xl font-bold text-purple-600">{bestScore.toLocaleString()}</div>
          </div>
        </div>

        {/* 게임 보드 */}
        <div className="bg-white rounded-2xl p-4 shadow-xl mb-4">
          <div className="bg-gray-200 rounded-lg p-2 grid grid-cols-4 gap-2">
            {grid.map((row, i) =>
              row.map((cell, j) => {
                const item = getItemInfo(cell);
                return (
                  <motion.div
                    key={`${i}-${j}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center ${
                      cell === 0 ? 'bg-gray-300' : item.color
                    } ${cell >= 256 ? 'text-white' : 'text-gray-800'}`}
                  >
                    {cell !== 0 && (
                      <>
                        <div className="text-2xl mb-1">{item.emoji}</div>
                        <div className="text-xs font-bold">{item.value}</div>
                      </>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* 조작 버튼 */}
        <div className="space-y-3 mb-4">
          <button
            onClick={() => moveGrid('up')}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition"
          >
            ↑ 위로
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => moveGrid('left')}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition"
            >
              ← 왼쪽
            </button>
            <button
              onClick={() => moveGrid('right')}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition"
            >
              오른쪽 →
            </button>
          </div>
          <button
            onClick={() => moveGrid('down')}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition"
          >
            ↓ 아래로
          </button>
        </div>

        {/* 게임 오버 / 승리 모달 */}
        <AnimatePresence>
          {(gameOver || won) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
              >
                {won ? (
                  <>
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">2048 달성!</h2>
                    <p className="text-gray-600 mb-6">축하합니다! 왕관을 만들었어요!</p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">😢</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">게임 오버</h2>
                    <p className="text-gray-600 mb-2">최종 점수: {score.toLocaleString()}</p>
                    {score > bestScore && (
                      <p className="text-purple-600 font-bold mb-6">🎊 최고 기록 갱신!</p>
                    )}
                  </>
                )}
                <button
                  onClick={restartGame}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition"
                >
                  다시 하기
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 안내 */}
        <div className="bg-white/80 rounded-xl p-4 shadow-lg">
          <p className="text-xs text-gray-600 text-center">
            💡 같은 아이템을 합쳐서 더 큰 아이템을 만드세요!<br />
            화살표 버튼 또는 키보드로 조작할 수 있어요.
          </p>
        </div>
      </main>
    </div>
  );
}




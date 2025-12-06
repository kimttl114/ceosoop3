'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Square } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

// 테트리스 블록 모양 정의
const TETROMINOES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
};

const COLORS = {
  I: 'from-cyan-400 to-cyan-600',
  O: 'from-yellow-400 to-yellow-600',
  T: 'from-purple-400 to-purple-600',
  S: 'from-green-400 to-green-600',
  Z: 'from-red-400 to-red-600',
  J: 'from-blue-400 to-blue-600',
  L: 'from-orange-400 to-orange-600',
};

type TetrominoType = keyof typeof TETROMINOES;

interface Position {
  x: number;
  y: number;
}

interface Tetromino {
  shape: number[][];
  type: TetrominoType;
  position: Position;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

export default function TetrisPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [board, setBoard] = useState<(TetrominoType | null)[][]>([]);
  const [currentPiece, setCurrentPiece] = useState<Tetromino | null>(null);
  const [nextPiece, setNextPiece] = useState<Tetromino | null>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [dropTime, setDropTime] = useState(1000);
  const [bestScore, setBestScore] = useState(0);
  const dropTimeRef = useRef<number>(1000);
  const lastTimeRef = useRef<number>(Date.now());

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
            setBestScore(data.tetrisBestScore || 0);
          }
        } catch (error) {
          console.error('Error loading game data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 보드 초기화
  const createBoard = useCallback(() => {
    return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
  }, []);

  // 랜덤 테트로미노 생성
  const createPiece = (): Tetromino => {
    const types = Object.keys(TETROMINOES) as TetrominoType[];
    const type = types[Math.floor(Math.random() * types.length)] as TetrominoType;
    return {
      shape: TETROMINOES[type],
      type,
      position: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 },
    };
  };

  // 블록 회전
  const rotatePiece = (piece: Tetromino): Tetromino => {
    const rotated = piece.shape[0].map((_, i) =>
      piece.shape.map(row => row[i]).reverse()
    );
    return { ...piece, shape: rotated };
  };

  // 블록이 보드 내에 있는지 확인
  const isValidPosition = (piece: Tetromino, board: (TetrominoType | null)[][], dx = 0, dy = 0): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.position.x + x + dx;
          const newY = piece.position.y + y + dy;
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return false;
          }
          if (newY >= 0 && board[newY][newX]) {
            return false;
          }
        }
      }
    }
    return true;
  };

  // 블록을 보드에 배치
  const placePiece = (piece: Tetromino, board: (TetrominoType | null)[][]) => {
    const newBoard = board.map(row => [...row]);
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.position.y + y;
          const boardX = piece.position.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = piece.type;
          }
        }
      }
    }
    return newBoard;
  };

  // 완성된 줄 제거
  const clearLines = (board: (TetrominoType | null)[][]): { newBoard: (TetrominoType | null)[][]; linesCleared: number } => {
    const newBoard = board.filter(row => row.some(cell => cell === null));
    const linesCleared = BOARD_HEIGHT - newBoard.length;
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }
    return { newBoard, linesCleared };
  };

  // 게임 시작
  const startGame = () => {
    const newBoard = createBoard();
    setBoard(newBoard);
    setScore(0);
    setLines(0);
    setLevel(1);
    setDropTime(1000);
    dropTimeRef.current = 1000;
    setGameOver(false);
    setGameStarted(true);
    
    const firstPiece = createPiece();
    const secondPiece = createPiece();
    setCurrentPiece(firstPiece);
    setNextPiece(secondPiece);
  };

  // 블록 떨어뜨리기
  const dropPiece = useCallback(() => {
    if (!currentPiece || gameOver || !gameStarted) return;

    if (isValidPosition(currentPiece, board, 0, 1)) {
      setCurrentPiece({ ...currentPiece, position: { ...currentPiece.position, y: currentPiece.position.y + 1 } });
    } else {
      // 블록 고정
      const newBoard = placePiece(currentPiece, board);
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
      
      if (linesCleared > 0) {
        setLines(prev => prev + linesCleared);
        setScore(prev => prev + linesCleared * 100 * level);
      }
      
      setBoard(clearedBoard);
      
      // 다음 블록
      if (nextPiece) {
        const newNextPiece = createPiece();
        setCurrentPiece({ ...nextPiece, position: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 } });
        setNextPiece(newNextPiece);
        
        // 게임 오버 확인
        if (!isValidPosition(nextPiece, clearedBoard)) {
          setGameOver(true);
          setGameStarted(false);
          saveBestScore();
        }
      }
    }
  }, [currentPiece, board, nextPiece, gameOver, gameStarted, level]);

  // 자동 낙하
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastTimeRef.current >= dropTimeRef.current) {
        dropPiece();
        lastTimeRef.current = now;
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, dropPiece, dropTime]);

  // 레벨 업
  useEffect(() => {
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
      const newDropTime = Math.max(100, 1000 - (newLevel - 1) * 100);
      setDropTime(newDropTime);
      dropTimeRef.current = newDropTime;
    }
  }, [lines, level]);

  // 키보드 컨트롤
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (!currentPiece) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (isValidPosition(currentPiece, board, -1, 0)) {
            setCurrentPiece({ ...currentPiece, position: { ...currentPiece.position, x: currentPiece.position.x - 1 } });
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (isValidPosition(currentPiece, board, 1, 0)) {
            setCurrentPiece({ ...currentPiece, position: { ...currentPiece.position, x: currentPiece.position.x + 1 } });
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          dropPiece();
          break;
        case 'ArrowUp':
        case ' ':
          e.preventDefault();
          const rotated = rotatePiece(currentPiece);
          if (isValidPosition(rotated, board)) {
            setCurrentPiece(rotated);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPiece, board, gameStarted, gameOver, dropPiece]);

  // 최고 점수 저장
  const saveBestScore = async () => {
    if (!user || !db || score <= bestScore) return;

    try {
      const gameRef = doc(db, 'user_games', user.uid);
      await setDoc(gameRef, {
        tetrisBestScore: score,
      }, { merge: true });
      setBestScore(score);
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  // 보드 렌더링용 (현재 블록 포함)
  const renderBoard = () => {
    const renderBoard = board.map(row => [...row]);
    
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.position.y + y;
            const boardX = currentPiece.position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              renderBoard[boardY][boardX] = currentPiece.type;
            }
          }
        }
      }
    }
    
    return renderBoard;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  const displayBoard = renderBoard();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 pb-24">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-blue-600 to-cyan-600 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Square size={24} />
            <span>블록 게임</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        {!gameStarted ? (
          <div className="bg-white rounded-2xl p-8 shadow-xl mb-6 text-center">
            <div className="text-6xl mb-4">🧱</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">블록 게임</h2>
            <p className="text-gray-600 mb-6">
              블록을 맞춰 줄을 제거하세요!<br />
              레벨이 올라갈수록 속도가 빨라져요!
            </p>
            {bestScore > 0 && (
              <div className="mb-4 text-sm text-gray-500">
                최고 점수: {bestScore.toLocaleString()}
              </div>
            )}
            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition"
            >
              게임 시작
            </button>
          </div>
        ) : (
          <>
            {/* 게임 정보 */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-white rounded-xl p-3 shadow-lg text-center">
                <div className="text-xs text-gray-600 mb-1">점수</div>
                <div className="text-lg font-bold text-blue-600">{score.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-lg text-center">
                <div className="text-xs text-gray-600 mb-1">줄</div>
                <div className="text-lg font-bold text-cyan-600">{lines}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-lg text-center">
                <div className="text-xs text-gray-600 mb-1">레벨</div>
                <div className="text-lg font-bold text-indigo-600">{level}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-lg text-center">
                <div className="text-xs text-gray-600 mb-1">최고</div>
                <div className="text-lg font-bold text-purple-600">{bestScore.toLocaleString()}</div>
              </div>
            </div>

            {/* 게임 보드와 다음 블록 */}
            <div className="flex gap-4 mb-4">
              {/* 게임 보드 */}
              <div className="flex-1 bg-white rounded-2xl p-3 shadow-xl">
                <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)` }}>
                  {displayBoard.map((row, y) =>
                    row.map((cell, x) => (
                      <div
                        key={`${y}-${x}`}
                        className={`aspect-square rounded ${
                          cell
                            ? `bg-gradient-to-br ${COLORS[cell]}`
                            : 'bg-gray-100'
                        }`}
                        style={{ minWidth: '24px', minHeight: '24px' }}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* 다음 블록 미리보기 */}
              {nextPiece && (
                <div className="bg-white rounded-xl p-4 shadow-lg">
                  <div className="text-xs font-bold text-gray-600 mb-2">다음</div>
                  <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${nextPiece.shape[0].length}, 1fr)` }}>
                    {nextPiece.shape.map((row, y) =>
                      row.map((cell, x) => (
                        <div
                          key={`next-${y}-${x}`}
                          className={`aspect-square rounded ${
                            cell
                              ? `bg-gradient-to-br ${COLORS[nextPiece.type]}`
                              : 'bg-transparent'
                          }`}
                          style={{ minWidth: '20px', minHeight: '20px' }}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 조작 버튼 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => {
                  if (currentPiece && isValidPosition(currentPiece, board, -1, 0)) {
                    setCurrentPiece({ ...currentPiece, position: { ...currentPiece.position, x: currentPiece.position.x - 1 } });
                  }
                }}
                className="bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition"
              >
                ←
              </button>
              <button
                onClick={() => {
                  if (currentPiece) {
                    const rotated = rotatePiece(currentPiece);
                    if (isValidPosition(rotated, board)) {
                      setCurrentPiece(rotated);
                    }
                  }
                }}
                className="bg-purple-500 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition"
              >
                🔄
              </button>
              <button
                onClick={() => {
                  if (currentPiece && isValidPosition(currentPiece, board, 1, 0)) {
                    setCurrentPiece({ ...currentPiece, position: { ...currentPiece.position, x: currentPiece.position.x + 1 } });
                  }
                }}
                className="bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition"
              >
                →
              </button>
            </div>
            <button
              onClick={dropPiece}
              className="w-full bg-cyan-500 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition mb-4"
            >
              ⬇ 빠르게 떨어뜨리기
            </button>

            {/* 게임 오버 모달 */}
            <AnimatePresence>
              {gameOver && (
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
                    <div className="text-6xl mb-4">😢</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">게임 오버</h2>
                    <div className="space-y-2 mb-6">
                      <div className="text-lg text-gray-700">점수: {score.toLocaleString()}</div>
                      <div className="text-lg text-gray-700">제거한 줄: {lines}줄</div>
                      <div className="text-lg text-gray-700">레벨: {level}</div>
                      {score > bestScore && (
                        <div className="text-blue-600 font-bold">🏆 최고 기록 갱신!</div>
                      )}
                      <div className="text-green-600 font-bold mt-4">
                        +{Math.floor(score / 20)} 포인트 획득!
                      </div>
                    </div>
                    <button
                      onClick={startGame}
                      className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold"
                    >
                      다시 하기
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* 안내 */}
        <div className="bg-white/80 rounded-xl p-4 shadow-lg">
          <p className="text-xs text-gray-600 text-center">
            💡 화살표 키 또는 버튼으로 조작하세요!<br />
            ←→ 이동 | ↑ 또는 스페이스 회전 | ↓ 빠른 낙하
          </p>
        </div>
      </main>
    </div>
  );
}






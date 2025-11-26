// 레벨 시스템

export interface Level {
  level: number;
  name: string;
  minPoints: number;
  emoji: string;
  color: string;
}

export const levels: Level[] = [
  { level: 1, name: '새싹', minPoints: 0, emoji: '🌱', color: 'from-green-400 to-green-600' },
  { level: 2, name: '잎새', minPoints: 50, emoji: '🌿', color: 'from-green-500 to-emerald-600' },
  { level: 3, name: '가지', minPoints: 150, emoji: '🌳', color: 'from-emerald-500 to-teal-600' },
  { level: 4, name: '나무', minPoints: 300, emoji: '🌲', color: 'from-teal-500 to-cyan-600' },
  { level: 5, name: '대나무', minPoints: 500, emoji: '🎋', color: 'from-amber-400 to-yellow-600' },
  { level: 6, name: '황금나무', minPoints: 800, emoji: '🏆', color: 'from-yellow-400 to-orange-600' },
  { level: 7, name: '다이아나무', minPoints: 1200, emoji: '💎', color: 'from-purple-400 to-indigo-600' },
  { level: 8, name: '전설의 나무', minPoints: 2000, emoji: '👑', color: 'from-pink-400 to-rose-600' },
];

export function getLevelByPoints(points: number): Level {
  for (let i = levels.length - 1; i >= 0; i--) {
    if (points >= levels[i].minPoints) {
      return levels[i];
    }
  }
  return levels[0];
}

export function getNextLevel(currentLevel: Level): Level | null {
  const nextIndex = levels.findIndex(l => l.level === currentLevel.level + 1);
  return nextIndex >= 0 ? levels[nextIndex] : null;
}

export function getProgressToNextLevel(points: number, currentLevel: Level): number {
  const nextLevel = getNextLevel(currentLevel);
  if (!nextLevel) return 100; // 최대 레벨

  const currentRange = nextLevel.minPoints - currentLevel.minPoints;
  const progress = points - currentLevel.minPoints;
  return Math.min(100, Math.max(0, (progress / currentRange) * 100));
}


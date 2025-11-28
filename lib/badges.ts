// 뱃지 시스템

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  condition: (stats: UserStats) => boolean;
}

export interface UserStats {
  points: number;
  consecutiveDays: number;
  postsCount: number;
  commentsCount: number;
  gamesPlayed: number;
}

export const badges: Badge[] = [
  {
    id: 'first_checkin',
    name: '첫 출석',
    description: '첫 출석체크 완료',
    emoji: '🎯',
    color: 'from-blue-500 to-cyan-500',
    condition: (stats) => stats.consecutiveDays >= 1,
  },
  {
    id: 'week_warrior',
    name: '일주일 전사',
    description: '7일 연속 출석',
    emoji: '🔥',
    color: 'from-orange-500 to-red-500',
    condition: (stats) => stats.consecutiveDays >= 7,
  },
  {
    id: 'month_master',
    name: '한 달의 달인',
    description: '30일 연속 출석',
    emoji: '👑',
    color: 'from-yellow-500 to-amber-500',
    condition: (stats) => stats.consecutiveDays >= 30,
  },
  {
    id: 'point_collector',
    name: '포인트 수집가',
    description: '100포인트 달성',
    emoji: '💎',
    color: 'from-purple-500 to-pink-500',
    condition: (stats) => stats.points >= 100,
  },
  {
    id: 'point_king',
    name: '포인트 왕',
    description: '1000포인트 달성',
    emoji: '💍',
    color: 'from-indigo-500 to-purple-500',
    condition: (stats) => stats.points >= 1000,
  },
  {
    id: 'first_post',
    name: '첫 글쓰기',
    description: '첫 게시글 작성',
    emoji: '✍️',
    color: 'from-green-500 to-emerald-500',
    condition: (stats) => stats.postsCount >= 1,
  },
  {
    id: 'social_butterfly',
    name: '소통의 달인',
    description: '댓글 10개 작성',
    emoji: '💬',
    color: 'from-pink-500 to-rose-500',
    condition: (stats) => stats.commentsCount >= 10,
  },
  {
    id: 'game_lover',
    name: '게임 애호가',
    description: '게임 10회 플레이',
    emoji: '🎮',
    color: 'from-teal-500 to-cyan-500',
    condition: (stats) => stats.gamesPlayed >= 10,
  },
];

export function getUnlockedBadges(stats: UserStats, userBadges: string[] = []): Badge[] {
  return badges.filter(badge => {
    // 이미 획득한 뱃지이거나 조건을 만족하는 뱃지
    return userBadges.includes(badge.id) || badge.condition(stats);
  });
}

export function getNewBadges(stats: UserStats, userBadges: string[] = []): Badge[] {
  return badges.filter(badge => {
    // 조건을 만족하지만 아직 획득하지 않은 뱃지
    return !userBadges.includes(badge.id) && badge.condition(stats);
  });
}




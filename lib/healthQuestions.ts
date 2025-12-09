// 건강 수명 계산기 질문 데이터

export interface HealthOption {
  text: string;
  score: number;
  warning?: string;
}

export interface HealthQuestion {
  id: number;
  category: string;
  question: string;
  options: HealthOption[];
  emoji: string;
}

export const healthQuestions: HealthQuestion[] = [
  // 카테고리 1: 근무 시간
  {
    id: 1,
    category: '근무 시간',
    question: '하루 평균 근무 시간은?',
    emoji: '⏰',
    options: [
      { text: '8시간 이하', score: 0, warning: '사장님이 아니신가요?' },
      { text: '9-12시간', score: 5, warning: '그래도 양반이네요' },
      { text: '13-15시간', score: 10, warning: '위험 수준입니다' },
      { text: '16시간 이상', score: 15, warning: '⚠️ 당장 병원 가세요' },
    ],
  },
  {
    id: 2,
    category: '근무 시간',
    question: '주 평균 출근 일수는?',
    emoji: '📅',
    options: [
      { text: '5일 이하', score: 0, warning: '축하합니다' },
      { text: '6일', score: 3, warning: '일반적이네요' },
      { text: '매일 (7일)', score: 7, warning: '휴무가 뭔가요?' },
      { text: '매일 + 명절도', score: 10, warning: '💀 RIP' },
    ],
  },
  // 카테고리 2: 식습관
  {
    id: 3,
    category: '식습관',
    question: '하루 식사 패턴은?',
    emoji: '🍚',
    options: [
      { text: '3끼 규칙적', score: 0, warning: '존경합니다' },
      { text: '2끼, 간식으로 때움', score: 5, warning: '위험해요' },
      { text: '1끼 + 라면/김밥', score: 10, warning: '위염 예약' },
      { text: '끼니 거르고 에너지드링크', score: 15, warning: '💀 ICU 직행' },
    ],
  },
  {
    id: 4,
    category: '식습관',
    question: '튀김/기름 냄새 노출 시간은?',
    emoji: '🍗',
    options: [
      { text: '해당없음', score: 0 },
      { text: '3시간 이하', score: 3 },
      { text: '6시간 이상', score: 8, warning: '폐가 기름범벅' },
      { text: '하루종일', score: 12, warning: '💀 폐암 고위험군' },
    ],
  },
  // 카테고리 3: 스트레스
  {
    id: 5,
    category: '스트레스',
    question: '손님 때문에 화난 적은?',
    emoji: '😤',
    options: [
      { text: '거의 없음', score: 0 },
      { text: '주 1-2회', score: 3 },
      { text: '거의 매일', score: 8, warning: '혈압 주의' },
      { text: '하루에도 몇 번', score: 12, warning: '💀 뇌졸중 위험' },
    ],
  },
  {
    id: 6,
    category: '스트레스',
    question: '새벽 3시에 깬 적 있나요?',
    emoji: '😰',
    options: [
      { text: '없음', score: 0 },
      { text: '가끔', score: 5 },
      { text: '자주', score: 10, warning: '수면 장애' },
      { text: '매일', score: 15, warning: '💀 정신과 가세요' },
    ],
  },
  // 카테고리 4: 생활 습관
  {
    id: 7,
    category: '생활 습관',
    question: '음주 빈도는?',
    emoji: '🍺',
    options: [
      { text: '안 마심', score: 0 },
      { text: '주 1-2회', score: 3 },
      { text: '거의 매일', score: 10, warning: '간 폭탄' },
      { text: '매일 + 폭음', score: 15, warning: '💀 간경화 예약' },
    ],
  },
  {
    id: 8,
    category: '생활 습관',
    question: '흡연 여부는?',
    emoji: '🚬',
    options: [
      { text: '안 피움', score: 0 },
      { text: '전자담배', score: 5 },
      { text: '반 갑 이하/일', score: 8 },
      { text: '한 갑 이상/일', score: 15, warning: '💀 폐암 1순위' },
    ],
  },
  {
    id: 9,
    category: '생활 습관',
    question: '운동 빈도는?',
    emoji: '🏃',
    options: [
      { text: '주 3회 이상', score: 0, warning: '신기하네요' },
      { text: '주 1-2회', score: 3 },
      { text: '한 달에 1-2회', score: 8 },
      { text: '운동이 뭔가요?', score: 12, warning: '💀 근육 소멸 중' },
    ],
  },
  {
    id: 10,
    category: '생활 습관',
    question: '마지막 건강검진은?',
    emoji: '🏥',
    options: [
      { text: '올해', score: 0, warning: '모범 사장님' },
      { text: '1-2년 전', score: 5 },
      { text: '3-5년 전', score: 10, warning: '위험해요' },
      { text: '기억 안 남', score: 15, warning: '💀 시한폭탄' },
    ],
  },
];

export interface HealthResult {
  level: 'safe' | 'warning' | 'danger' | 'critical';
  title: string;
  emoji: string;
  bodyAge: string;
  description: string;
  risks: string[];
  solutions: string[];
  color: string;
}

export function calculateHealthResult(totalScore: number, actualAge: number): HealthResult {
  if (totalScore <= 30) {
    return {
      level: 'safe',
      title: '아직 살 만해요',
      emoji: '😊',
      bodyAge: `${actualAge}세`,
      description: '자영업자 중 상위 5% 건강! 이대로만 유지하세요!',
      risks: ['방심은 금물!', '정기 검진 잊지 마세요'],
      solutions: [
        '현재 생활 습관 유지하기',
        '예방 검진 스케줄 잡기',
        '건강한 식단 계속 유지',
        '규칙적인 운동 지속',
      ],
      color: 'from-green-500 to-emerald-500',
    };
  } else if (totalScore <= 60) {
    return {
      level: 'warning',
      title: '노란불',
      emoji: '⚠️',
      bodyAge: `${actualAge + 10}세`,
      description: '경고 신호가 감지되었습니다. 지금 바꾸면 회복 가능!',
      risks: ['수면 부족 심각', '식습관 개선 필요', '스트레스 관리 시급'],
      solutions: [
        '알바 하나만 더 쓰세요',
        '주 1회는 운동하세요',
        '검진 꼭 받으세요',
        '규칙적인 식사 습관',
      ],
      color: 'from-yellow-500 to-orange-500',
    };
  } else if (totalScore <= 90) {
    return {
      level: 'danger',
      title: '빨간불',
      emoji: '🚨',
      bodyAge: `${actualAge + 20}세`,
      description: '위험! 이러다 진짜 죽습니다. 당장 조치가 필요합니다!',
      risks: [
        '⚠️ 뇌졸중 고위험군',
        '⚠️ 심근경색 가능성',
        '⚠️ 위염/간경화 진행 중',
      ],
      solutions: [
        '🏥 내일 병원 예약 (필수!)',
        '알바 2명 채용 (생존 문제)',
        '술/담배 당장 끊기',
        '가족에게 사랑한다고 말하기',
      ],
      color: 'from-red-500 to-rose-600',
    };
  } else {
    return {
      level: 'critical',
      title: '💀 사망 플래그',
      emoji: '💀',
      bodyAge: `${actualAge + 30}세`,
      description: '긴급 상황! 살아있는 게 기적입니다. 이건 농담이 아닙니다!',
      risks: [
        '📞 119 전화번호: 국번없이 119',
        '💰 가게 팔고 생명 사세요',
        '돈 벌려다 죽으면 뭐합니까?',
      ],
      solutions: [
        '⚠️ 당장 오늘 병원 가세요',
        '가족과 통화하세요',
        '유언장 준비도 고려하세요',
        '🙏 제발 건강 챙기세요',
      ],
      color: 'from-gray-800 to-black',
    };
  }
}

export const industryAverages = {
  '치킨집': 88,
  '카페': 65,
  '편의점': 79,
  '음식점': 82,
  '술집': 91,
  '프랜차이즈': 76,
  '기타': 75,
};


// 사장님 밸런스 게임 질문 데이터
// 현실적이고 자극적인 선택지 50개

export interface BalanceQuestion {
  id: number
  category: '매출' | '직원' | '손님' | '근무' | '돈' | '인간관계' | '미래' | '현실'
  question: string
  optionA: {
    text: string
    detail: string
    emoji: string
  }
  optionB: {
    text: string
    detail: string
    emoji: string
  }
  spicy: boolean // 자극적인 질문 표시
}

export const balanceQuestions: BalanceQuestion[] = [
  {
    id: 1,
    category: '매출',
    question: '당신의 선택은?',
    optionA: {
      emoji: '💰',
      text: '월 매출 1500만원, 주 7일 근무',
      detail: '돈은 많지만 개인시간 0분'
    },
    optionB: {
      emoji: '😴',
      text: '월 매출 800만원, 주 5일 근무',
      detail: '여유는 있지만 돈이 적음'
    },
    spicy: false
  },
  {
    id: 2,
    category: '직원',
    question: '알바생 채용, 누구를 뽑을래요?',
    optionA: {
      emoji: '🐢',
      text: '느리지만 성실하고 착한 알바',
      detail: '답답하지만 믿을 수 있음'
    },
    optionB: {
      emoji: '⚡',
      text: '빠르지만 불친절한 알바',
      detail: '효율적이지만 손님 불만 있음'
    },
    spicy: false
  },
  {
    id: 3,
    category: '손님',
    question: '이런 손님, 어떻게 하시겠어요?',
    optionA: {
      emoji: '😤',
      text: '진상 손님에게 정중히 맞대응',
      detail: '리뷰 테러 각오, 하지만 속 시원'
    },
    optionB: {
      emoji: '😭',
      text: '꾹 참고 웃으며 사과',
      detail: '안전하지만 스트레스 MAX'
    },
    spicy: true
  },
  {
    id: 4,
    category: '돈',
    question: '갑자기 1000만원 생겼다!',
    optionA: {
      emoji: '🏪',
      text: '가게에 올인 (시설/메뉴 투자)',
      detail: '리스크 있지만 성장 기회'
    },
    optionB: {
      emoji: '🏦',
      text: '통장에 저축 (비상금)',
      detail: '안전하지만 기회 상실'
    },
    spicy: false
  },
  {
    id: 5,
    category: '현실',
    question: '진짜 현실을 직면한다면?',
    optionA: {
      emoji: '💔',
      text: '망해가는 가게, 6개월 더 버티기',
      detail: '빚만 늘어나지만 희망 0.1%'
    },
    optionB: {
      emoji: '🚪',
      text: '지금 당장 정리하고 재취업',
      detail: '손해는 크지만 더 이상 안 밀림'
    },
    spicy: true
  },
  {
    id: 6,
    category: '직원',
    question: '직원이 실수로 50만원 손해!',
    optionA: {
      emoji: '😡',
      text: '급여에서 일부 차감',
      detail: '법적으로 위험, 직원 이탈 가능'
    },
    optionB: {
      emoji: '😭',
      text: '내가 다 감수한다',
      detail: '손해는 내가, 직원 관계는 유지'
    },
    spicy: true
  },
  {
    id: 7,
    category: '손님',
    question: '단골이 매일 와서 콘센트만 쓰고 안 가요',
    optionA: {
      emoji: '⚡',
      text: '콘센트 사용 금지 공지',
      detail: '단골 떠날 수도, 하지만 속 시원'
    },
    optionB: {
      emoji: '😓',
      text: '그냥 놔둔다',
      detail: '전기세 나가지만 단골 유지'
    },
    spicy: true
  },
  {
    id: 8,
    category: '근무',
    question: '당신의 이상적인 일과는?',
    optionA: {
      emoji: '🌙',
      text: '새벽 4시 출근 - 오후 3시 퇴근',
      detail: '오후가 자유롭지만 새벽이 고통'
    },
    optionB: {
      emoji: '☀️',
      text: '오전 10시 출근 - 밤 11시 퇴근',
      detail: '아침은 편하지만 저녁이 없음'
    },
    spicy: false
  },
  {
    id: 9,
    category: '매출',
    question: '배달앱 수수료 때문에 미치겠어요',
    optionA: {
      emoji: '📱',
      text: '수수료 30% 내고 배달앱 계속',
      detail: '매출은 높지만 남는 게 없음'
    },
    optionB: {
      emoji: '🏪',
      text: '배달 접고 매장만 운영',
      detail: '수익률은 높지만 매출 반토막'
    },
    spicy: true
  },
  {
    id: 10,
    category: '인간관계',
    question: '친구가 가게에서 공짜로 달라고 해요',
    optionA: {
      emoji: '💸',
      text: '계속 공짜로 준다',
      detail: '손해보지만 관계 유지'
    },
    optionB: {
      emoji: '💰',
      text: '정중히 거절, 할인만 해준다',
      detail: '합리적이지만 관계 어색'
    },
    spicy: true
  },
  {
    id: 11,
    category: '미래',
    question: '5년 후 당신의 모습은?',
    optionA: {
      emoji: '🏆',
      text: '5호점 오픈한 프랜차이즈 사장',
      detail: '성공했지만 더 바쁨'
    },
    optionB: {
      emoji: '✈️',
      text: '가게 정리하고 여유로운 직장인',
      detail: '안정적이지만 내 사업 포기'
    },
    spicy: false
  },
  {
    id: 12,
    category: '현실',
    question: '가장 듣기 싫은 말은?',
    optionA: {
      emoji: '😒',
      text: '"저기요~ 왜 이렇게 늦어요?"',
      detail: '손님의 무례한 재촉'
    },
    optionB: {
      emoji: '💔',
      text: '"사장님, 내일부터 안 나가요"',
      detail: '알바의 갑작스런 통보'
    },
    spicy: true
  },
  {
    id: 13,
    category: '돈',
    question: '창업 자금 5000만원 어떻게 마련?',
    optionA: {
      emoji: '🏠',
      text: '집 담보 대출',
      detail: '이자 부담, 실패하면 집 날림'
    },
    optionB: {
      emoji: '👨‍👩‍👧',
      text: '부모님/친척에게 빌리기',
      detail: '이자는 없지만 죄송함 평생'
    },
    spicy: true
  },
  {
    id: 14,
    category: '직원',
    question: '알바가 출근 30분 전에 "아파요" 문자',
    optionA: {
      emoji: '😤',
      text: '무조건 나오라고 한다',
      detail: '가게는 돌아가지만 관계 악화'
    },
    optionB: {
      emoji: '😭',
      text: '혼자 감당한다',
      detail: '죽어라 일하지만 착한 사장님'
    },
    spicy: true
  },
  {
    id: 15,
    category: '손님',
    question: '손님이 리뷰에 거짓말 쓰고 있어요',
    optionA: {
      emoji: '⚔️',
      text: 'CCTV 공개하고 법적 대응',
      detail: '속 시원하지만 이미지 타격'
    },
    optionB: {
      emoji: '🙏',
      text: '정중한 사과 댓글',
      detail: '억울하지만 더 큰 싸움 방지'
    },
    spicy: true
  },
  {
    id: 16,
    category: '매출',
    question: '월세 250만원 vs 권리금 5000만원',
    optionA: {
      emoji: '💸',
      text: '월세 높지만 권리금 0원 매장',
      detail: '초기 부담 낮음, 매달 압박'
    },
    optionB: {
      emoji: '💰',
      text: '권리금 5000만원, 월세 100만원',
      detail: '초기 부담 큼, 장기적 이득'
    },
    spicy: false
  },
  {
    id: 17,
    category: '근무',
    question: '명절에 가게 여시겠어요?',
    optionA: {
      emoji: '💰',
      text: '명절에도 오픈 (3배 매출)',
      detail: '돈은 되지만 가족 시간 0'
    },
    optionB: {
      emoji: '👨‍👩‍👧‍👦',
      text: '무조건 쉰다',
      detail: '가족과 함께지만 수입 포기'
    },
    spicy: false
  },
  {
    id: 18,
    category: '현실',
    question: '프랜차이즈 vs 독립 창업',
    optionA: {
      emoji: '🏢',
      text: '프랜차이즈 (안전한 노예)',
      detail: '망할 확률 낮지만 로열티 지옥'
    },
    optionB: {
      emoji: '🚀',
      text: '독립 창업 (위험한 자유)',
      detail: '자유롭지만 망할 확률 50%'
    },
    spicy: true
  },
  {
    id: 19,
    category: '직원',
    question: '10년 근속 직원이 급여 인상 요구',
    optionA: {
      emoji: '💸',
      text: '30% 올려준다',
      detail: '경영 압박, 하지만 충성도 UP'
    },
    optionB: {
      emoji: '💔',
      text: '10% 정도만 인상',
      detail: '합리적이지만 직원 떠날 수도'
    },
    spicy: false
  },
  {
    id: 20,
    category: '손님',
    question: '손님이 "주인 아줌마 불친절해"라고 리뷰',
    optionA: {
      emoji: '😡',
      text: '"나 사장이야! 아줌마 아니야!"',
      detail: '속 시원하지만 리뷰 전쟁 시작'
    },
    optionB: {
      emoji: '😭',
      text: '울면서 정중한 사과',
      detail: '자존심 상하지만 이미지 관리'
    },
    spicy: true
  },
  {
    id: 21,
    category: '돈',
    question: '매출이 3개월 연속 마이너스',
    optionA: {
      emoji: '🎰',
      text: '대출받아서 마케팅 올인',
      detail: '박타면 대박, 실패면 빚더미'
    },
    optionB: {
      emoji: '💊',
      text: '비용 줄이고 버티기',
      detail: '안전하지만 회복 더딤'
    },
    spicy: true
  },
  {
    id: 22,
    category: '인간관계',
    question: '옆 가게 사장님이 담합 제안',
    optionA: {
      emoji: '🤝',
      text: '같이 가격 올리기 합의',
      detail: '수익 증가, 하지만 불법 위험'
    },
    optionB: {
      emoji: '🚫',
      text: '정중히 거절',
      detail: '합법적이지만 경쟁 심화'
    },
    spicy: true
  },
  {
    id: 23,
    category: '미래',
    question: '가게가 대박나서 확장 제안',
    optionA: {
      emoji: '🏪',
      text: '2호점 오픈',
      detail: '성장 기회, 하지만 2배 스트레스'
    },
    optionB: {
      emoji: '💰',
      text: '1호점 집중, 안정화',
      detail: '안정적이지만 성장 포기'
    },
    spicy: false
  },
  {
    id: 24,
    category: '현실',
    question: '보건소 단속 걸렸어요 (벌금 50만원)',
    optionA: {
      emoji: '😱',
      text: '벌금 내고 제대로 고치기',
      detail: '돈은 들지만 안전'
    },
    optionB: {
      emoji: '🤫',
      text: '적당히 넘어가기',
      detail: '돈은 아끼지만 위험'
    },
    spicy: true
  },
  {
    id: 25,
    category: '직원',
    question: '직원이 손님한테 욕먹고 울어요',
    optionA: {
      emoji: '⚔️',
      text: '손님한테 당당히 대응',
      detail: '직원 사기 UP, 하지만 손님 잃음'
    },
    optionB: {
      emoji: '🙇',
      text: '손님한테 사과하고 직원 위로',
      detail: '손님 유지, 하지만 직원 실망'
    },
    spicy: true
  },
  {
    id: 26,
    category: '매출',
    question: '경쟁 가게가 바로 옆에 생겼어요',
    optionA: {
      emoji: '🔥',
      text: '가격 전쟁 시작',
      detail: '이기면 독점, 지면 공멸'
    },
    optionB: {
      emoji: '🎯',
      text: '차별화 전략 (메뉴/서비스)',
      detail: '안전하지만 시간 소요'
    },
    spicy: false
  },
  {
    id: 27,
    category: '손님',
    question: '단골이 "나 단골인데 왜 안 깎아줘?"',
    optionA: {
      emoji: '💰',
      text: '"죄송하지만 정가입니다"',
      detail: '원칙적이지만 단골 이탈'
    },
    optionB: {
      emoji: '💸',
      text: '할인해준다 (10%)',
      detail: '손해지만 단골 유지'
    },
    spicy: true
  },
  {
    id: 28,
    category: '근무',
    question: '건강검진 결과가 안 좋게 나왔어요',
    optionA: {
      emoji: '🏥',
      text: '1개월 휴업하고 치료',
      detail: '건강 회복, 하지만 수입 0'
    },
    optionB: {
      emoji: '💊',
      text: '약 먹으면서 계속 운영',
      detail: '수입은 유지, 건강은 악화'
    },
    spicy: true
  },
  {
    id: 29,
    category: '돈',
    question: '세금 신고, 어떻게 하시겠어요?',
    optionA: {
      emoji: '📄',
      text: '정직하게 전부 신고',
      detail: '세금 많지만 떳떳함'
    },
    optionB: {
      emoji: '🤫',
      text: '적당히... 조절',
      detail: '세금은 줄지만 걸리면 끝'
    },
    spicy: true
  },
  {
    id: 30,
    category: '인간관계',
    question: '동업하자는 친구 (출자 50:50)',
    optionA: {
      emoji: '🤝',
      text: '친구랑 동업 시작',
      detail: '부담 절반, 하지만 관계 파탄 위험'
    },
    optionB: {
      emoji: '👤',
      text: '혼자 한다',
      detail: '부담 크지만 독립적'
    },
    spicy: false
  },
  {
    id: 31,
    category: '현실',
    question: '식자재 업체가 가격 30% 인상 통보',
    optionA: {
      emoji: '💸',
      text: '그대로 받아들이고 메뉴 가격 인상',
      detail: '마진 유지, 하지만 손님 감소'
    },
    optionB: {
      emoji: '😭',
      text: '그대로 받아들이고 가격 동결',
      detail: '손님 유지, 하지만 마진 줄어듦'
    },
    spicy: false
  },
  {
    id: 32,
    category: '직원',
    question: '알바가 음식 몰래 먹다 걸렸어요',
    optionA: {
      emoji: '🚪',
      text: '당장 해고',
      detail: '원칙적이지만 인력난'
    },
    optionB: {
      emoji: '⚠️',
      text: '경고만 주고 계속 고용',
      detail: '인력 유지, 하지만 또 할 수도'
    },
    spicy: true
  },
  {
    id: 33,
    category: '손님',
    question: '손님이 "벌레 나왔다"며 전액 환불 요구',
    optionA: {
      emoji: '🎥',
      text: 'CCTV 확인 제안',
      detail: '진실 규명, 하지만 신경전'
    },
    optionB: {
      emoji: '💸',
      text: '그냥 환불해준다',
      detail: '손해지만 조용히 해결'
    },
    spicy: true
  },
  {
    id: 34,
    category: '매출',
    question: '유명 인플루언서가 무료 협찬 요청',
    optionA: {
      emoji: '📸',
      text: '무료로 제공 (마케팅 효과 기대)',
      detail: '홍보 되면 대박, 안 되면 손해'
    },
    optionB: {
      emoji: '💰',
      text: '정중히 거절 (정가 판매)',
      detail: '안전하지만 기회 상실'
    },
    spicy: false
  },
  {
    id: 35,
    category: '근무',
    question: '폭우/폭설 날씨에 가게 여시겠어요?',
    optionA: {
      emoji: '🌧️',
      text: '무조건 연다',
      detail: '손님 적어도 성실한 이미지'
    },
    optionB: {
      emoji: '🏠',
      text: '임시 휴업',
      detail: '안전하지만 수입 손실'
    },
    spicy: false
  },
  {
    id: 36,
    category: '돈',
    question: '대출 이자가 월 150만원이에요',
    optionA: {
      emoji: '🏦',
      text: '더 대출받아서 이자 갚기',
      detail: '당장은 편하지만 눈덩이'
    },
    optionB: {
      emoji: '💪',
      text: '허리띠 졸라매고 원금 갚기',
      detail: '고통스럽지만 근본 해결'
    },
    spicy: true
  },
  {
    id: 37,
    category: '인간관계',
    question: '배우자가 "가게 접고 취직해"',
    optionA: {
      emoji: '🏪',
      text: '가게 계속 운영',
      detail: '내 꿈 지키기, 하지만 가정 불화'
    },
    optionB: {
      emoji: '👔',
      text: '정리하고 취업',
      detail: '가정 평화, 하지만 후회 남음'
    },
    spicy: true
  },
  {
    id: 38,
    category: '미래',
    question: '10년 후 가게 위치 전망이 안 좋대요',
    optionA: {
      emoji: '🏃',
      text: '지금 당장 이전',
      detail: '선제 대응, 하지만 비용 큼'
    },
    optionB: {
      emoji: '⏰',
      text: '나중에 생각하자',
      detail: '당장은 편함, 나중에 후회'
    },
    spicy: false
  },
  {
    id: 39,
    category: '현실',
    question: '코로나 같은 위기가 또 온다면?',
    optionA: {
      emoji: '💪',
      text: '무조건 버틴다',
      detail: '끝까지 싸우지만 빚만 늘 수도'
    },
    optionB: {
      emoji: '🚪',
      text: '빨리 정리하고 나간다',
      detail: '손실 최소화, 재기 기회'
    },
    spicy: true
  },
  {
    id: 40,
    category: '직원',
    question: '직원이 인스타에 가게 욕하는 글 올렸어요',
    optionA: {
      emoji: '🔥',
      text: '당장 해고',
      detail: '속 시원, 하지만 법적 분쟁'
    },
    optionB: {
      emoji: '💬',
      text: '대화로 해결',
      detail: '원만하지만 신뢰 깨짐'
    },
    spicy: true
  },
  {
    id: 41,
    category: '손님',
    question: '손님이 "다른 데는 더 싸던데?"',
    optionA: {
      emoji: '😤',
      text: '"그럼 거기 가세요"',
      detail: '당당하지만 손님 잃음'
    },
    optionB: {
      emoji: '😢',
      text: '"저희 재료가 더 좋아서..."',
      detail: '설명하지만 무시당할 수도'
    },
    spicy: true
  },
  {
    id: 42,
    category: '매출',
    question: '배달 대행 vs 직접 배달',
    optionA: {
      emoji: '🛵',
      text: '알바 채용해서 직접 배달',
      detail: '수수료 없지만 관리 스트레스'
    },
    optionB: {
      emoji: '📱',
      text: '배달앱 수수료 내고 맡기기',
      detail: '편하지만 마진 줄어듦'
    },
    spicy: false
  },
  {
    id: 43,
    category: '근무',
    question: '명절 보너스 얼마 줄까요?',
    optionA: {
      emoji: '💰',
      text: '월급의 100% (두둑하게)',
      detail: '직원 사기 UP, 경영 압박'
    },
    optionB: {
      emoji: '💸',
      text: '월급의 50% (적당히)',
      detail: '합리적이지만 직원 실망'
    },
    spicy: false
  },
  {
    id: 44,
    category: '돈',
    question: '투자자가 나타났어요 (지분 30% 요구)',
    optionA: {
      emoji: '🤝',
      text: '투자 받는다',
      detail: '자금 여유, 하지만 간섭 받음'
    },
    optionB: {
      emoji: '👤',
      text: '거절하고 혼자 운영',
      detail: '독립적이지만 자금 부족'
    },
    spicy: false
  },
  {
    id: 45,
    category: '인간관계',
    question: '단골이 외상 요청 (50만원)',
    optionA: {
      emoji: '💳',
      text: '믿고 외상으로 준다',
      detail: '신뢰 유지, 하지만 안 갚을 수도'
    },
    optionB: {
      emoji: '🚫',
      text: '정중히 거절',
      detail: '안전하지만 관계 어색'
    },
    spicy: true
  },
  {
    id: 46,
    category: '현실',
    question: '재개발 소식이 들려요 (2년 후)',
    optionA: {
      emoji: '💰',
      text: '2년 더 버티고 보상 받기',
      detail: '보상금 기대, 하지만 불확실'
    },
    optionB: {
      emoji: '🏃',
      text: '지금 이전',
      detail: '안정적이지만 보상 포기'
    },
    spicy: false
  },
  {
    id: 47,
    category: '직원',
    question: '직원이 임신했어요',
    optionA: {
      emoji: '👶',
      text: '출산 휴가 보장하고 계속 고용',
      detail: '인간적이지만 인력난'
    },
    optionB: {
      emoji: '💼',
      text: '합의 하에 퇴사 유도',
      detail: '현실적이지만 죄책감'
    },
    spicy: true
  },
  {
    id: 48,
    category: '손님',
    question: '손님이 사진 찍는다고 30분째 자리 차지',
    optionA: {
      emoji: '⏰',
      text: '정중히 자리 비워달라고 요청',
      detail: '회전율 UP, 하지만 불편함 줄 수도'
    },
    optionB: {
      emoji: '😑',
      text: '그냥 놔둔다',
      detail: '손님 만족, 하지만 장사 안 됨'
    },
    spicy: true
  },
  {
    id: 49,
    category: '미래',
    question: '은퇴 자금 5억 vs 가게 10호점',
    optionA: {
      emoji: '💰',
      text: '5억 모으고 은퇴',
      detail: '안정적 노후, 하지만 성장 포기'
    },
    optionB: {
      emoji: '🏢',
      text: '계속 확장해서 10호점',
      detail: '제국 건설, 하지만 스트레스 10배'
    },
    spicy: false
  },
  {
    id: 50,
    category: '현실',
    question: '마지막 질문: 지금 행복하세요?',
    optionA: {
      emoji: '😊',
      text: '힘들지만 행복하다',
      detail: '내 가게, 내 인생, 후회 없음'
    },
    optionB: {
      emoji: '😭',
      text: '솔직히 후회된다',
      detail: '다시 돌아가면 안 했을 것 같음'
    },
    spicy: true
  }
]

// 카테고리별 색상 매핑
export const categoryColors: Record<string, string> = {
  '매출': 'from-green-500 to-emerald-600',
  '직원': 'from-blue-500 to-cyan-600',
  '손님': 'from-red-500 to-orange-600',
  '근무': 'from-purple-500 to-pink-600',
  '돈': 'from-yellow-500 to-amber-600',
  '인간관계': 'from-indigo-500 to-blue-600',
  '미래': 'from-teal-500 to-green-600',
  '현실': 'from-gray-700 to-gray-900'
}

// 랜덤으로 질문 가져오기
export function getRandomQuestions(count: number = 10): BalanceQuestion[] {
  const shuffled = [...balanceQuestions].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// 카테고리별 질문 가져오기
export function getQuestionsByCategory(category: string): BalanceQuestion[] {
  return balanceQuestions.filter(q => q.category === category)
}

// 자극적인 질문만 가져오기
export function getSpicyQuestions(): BalanceQuestion[] {
  return balanceQuestions.filter(q => q.spicy)
}


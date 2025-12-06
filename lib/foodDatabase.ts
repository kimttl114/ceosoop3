// 음식 배틀그라운드 - 음식 데이터베이스

export interface Food {
  id: string
  name: string
  emoji: string
  imageUrl?: string      // Unsplash 이미지 URL
  category: '한식' | '중식' | '일식' | '양식' | '분식' | '치킨' | '디저트' | '패스트푸드' | '기타'
  stats: {
    popularity: number    // 인기도 (1-100)
    taste: number        // 맛 (1-100)
    price: number        // 가격 합리성 (1-100)
    health: number       // 건강함 (1-100)
  }
  isAlive: boolean       // 생존 여부
  wins: number           // 승리 횟수
  rank?: number          // 최종 순위
}

export const foodDatabase: Food[] = [
  // 한식 (20개)
  { id: '1', name: '김치찌개', emoji: '🍲', category: '한식', stats: { popularity: 85, taste: 90, price: 70, health: 75 }, isAlive: true, wins: 0 },
  { id: '2', name: '된장찌개', emoji: '🥘', category: '한식', stats: { popularity: 80, taste: 85, price: 75, health: 80 }, isAlive: true, wins: 0 },
  { id: '3', name: '불고기', emoji: '🍖', category: '한식', stats: { popularity: 90, taste: 95, price: 60, health: 70 }, isAlive: true, wins: 0 },
  { id: '4', name: '삼겹살', emoji: '🥓', category: '한식', stats: { popularity: 95, taste: 98, price: 65, health: 50 }, isAlive: true, wins: 0 },
  { id: '5', name: '비빔밥', emoji: '🍚', category: '한식', stats: { popularity: 85, taste: 88, price: 70, health: 85 }, isAlive: true, wins: 0 },
  { id: '6', name: '냉면', emoji: '🍜', category: '한식', stats: { popularity: 80, taste: 85, price: 75, health: 80 }, isAlive: true, wins: 0 },
  { id: '7', name: '갈비탕', emoji: '🍲', category: '한식', stats: { popularity: 82, taste: 90, price: 50, health: 75 }, isAlive: true, wins: 0 },
  { id: '8', name: '육개장', emoji: '🥘', category: '한식', stats: { popularity: 78, taste: 85, price: 70, health: 75 }, isAlive: true, wins: 0 },
  { id: '9', name: '순대국', emoji: '🍲', category: '한식', stats: { popularity: 75, taste: 82, price: 80, health: 65 }, isAlive: true, wins: 0 },
  { id: '10', name: '제육볶음', emoji: '🍖', category: '한식', stats: { popularity: 88, taste: 92, price: 75, health: 60 }, isAlive: true, wins: 0 },
  { id: '11', name: '김치볶음밥', emoji: '🍚', category: '한식', stats: { popularity: 82, taste: 85, price: 85, health: 70 }, isAlive: true, wins: 0 },
  { id: '12', name: '부대찌개', emoji: '🍲', category: '한식', stats: { popularity: 90, taste: 93, price: 70, health: 55 }, isAlive: true, wins: 0 },
  { id: '13', name: '삼계탕', emoji: '🍗', category: '한식', stats: { popularity: 80, taste: 88, price: 60, health: 90 }, isAlive: true, wins: 0 },
  { id: '14', name: '돼지갈비', emoji: '🥩', category: '한식', stats: { popularity: 87, taste: 94, price: 55, health: 60 }, isAlive: true, wins: 0 },
  { id: '15', name: '해물파전', emoji: '🥞', category: '한식', stats: { popularity: 85, taste: 90, price: 70, health: 65 }, isAlive: true, wins: 0 },
  { id: '16', name: '순두부찌개', emoji: '🍲', category: '한식', stats: { popularity: 83, taste: 87, price: 75, health: 80 }, isAlive: true, wins: 0 },
  { id: '17', name: '닭볶음탕', emoji: '🍗', category: '한식', stats: { popularity: 84, taste: 89, price: 70, health: 70 }, isAlive: true, wins: 0 },
  { id: '18', name: '감자탕', emoji: '🥘', category: '한식', stats: { popularity: 82, taste: 88, price: 70, health: 70 }, isAlive: true, wins: 0 },
  { id: '19', name: '쌈밥', emoji: '🥬', category: '한식', stats: { popularity: 75, taste: 80, price: 75, health: 90 }, isAlive: true, wins: 0 },
  { id: '20', name: '족발', emoji: '🍖', category: '한식', stats: { popularity: 88, taste: 92, price: 60, health: 55 }, isAlive: true, wins: 0 },

  // 중식 (15개)
  { id: '21', name: '짜장면', emoji: '🍜', category: '중식', stats: { popularity: 95, taste: 90, price: 85, health: 60 }, isAlive: true, wins: 0 },
  { id: '22', name: '짬뽕', emoji: '🍲', category: '중식', stats: { popularity: 90, taste: 95, price: 80, health: 65 }, isAlive: true, wins: 0 },
  { id: '23', name: '탕수육', emoji: '🍤', category: '중식', stats: { popularity: 93, taste: 96, price: 65, health: 45 }, isAlive: true, wins: 0 },
  { id: '24', name: '볶음밥', emoji: '🍚', category: '중식', stats: { popularity: 85, taste: 88, price: 80, health: 70 }, isAlive: true, wins: 0 },
  { id: '25', name: '마라탕', emoji: '🌶️', category: '중식', stats: { popularity: 88, taste: 92, price: 75, health: 65 }, isAlive: true, wins: 0 },
  { id: '26', name: '마라샹궈', emoji: '🥘', category: '중식', stats: { popularity: 85, taste: 90, price: 70, health: 60 }, isAlive: true, wins: 0 },
  { id: '27', name: '양장피', emoji: '🥗', category: '중식', stats: { popularity: 75, taste: 80, price: 70, health: 70 }, isAlive: true, wins: 0 },
  { id: '28', name: '깐풍기', emoji: '🍗', category: '중식', stats: { popularity: 87, taste: 91, price: 75, health: 55 }, isAlive: true, wins: 0 },
  { id: '29', name: '유산슬', emoji: '🥘', category: '중식', stats: { popularity: 78, taste: 82, price: 75, health: 75 }, isAlive: true, wins: 0 },
  { id: '30', name: '울면', emoji: '🍜', category: '중식', stats: { popularity: 80, taste: 85, price: 80, health: 70 }, isAlive: true, wins: 0 },
  { id: '31', name: '유니짜장', emoji: '🍜', category: '중식', stats: { popularity: 82, taste: 87, price: 70, health: 60 }, isAlive: true, wins: 0 },
  { id: '32', name: '삼선짬뽕', emoji: '🍲', category: '중식', stats: { popularity: 86, taste: 92, price: 65, health: 70 }, isAlive: true, wins: 0 },
  { id: '33', name: '짬짜면', emoji: '🍜', category: '중식', stats: { popularity: 92, taste: 93, price: 75, health: 60 }, isAlive: true, wins: 0 },
  { id: '34', name: '고추잡채', emoji: '🥘', category: '중식', stats: { popularity: 76, taste: 80, price: 70, health: 65 }, isAlive: true, wins: 0 },
  { id: '35', name: '라조기', emoji: '🍗', category: '중식', stats: { popularity: 83, taste: 88, price: 75, health: 50 }, isAlive: true, wins: 0 },

  // 일식 (15개)
  { id: '36', name: '초밥', emoji: '🍣', category: '일식', stats: { popularity: 85, taste: 90, price: 50, health: 85 }, isAlive: true, wins: 0 },
  { id: '37', name: '라멘', emoji: '🍜', category: '일식', stats: { popularity: 92, taste: 95, price: 70, health: 65 }, isAlive: true, wins: 0 },
  { id: '38', name: '돈카츠', emoji: '🍛', category: '일식', stats: { popularity: 95, taste: 96, price: 75, health: 55 }, isAlive: true, wins: 0 },
  { id: '39', name: '우동', emoji: '🍜', category: '일식', stats: { popularity: 88, taste: 86, price: 80, health: 75 }, isAlive: true, wins: 0 },
  { id: '40', name: '소바', emoji: '🍜', category: '일식', stats: { popularity: 75, taste: 78, price: 70, health: 80 }, isAlive: true, wins: 0 },
  { id: '41', name: '규동', emoji: '🍚', category: '일식', stats: { popularity: 82, taste: 88, price: 85, health: 70 }, isAlive: true, wins: 0 },
  { id: '42', name: '오코노미야끼', emoji: '🥞', category: '일식', stats: { popularity: 80, taste: 85, price: 75, health: 65 }, isAlive: true, wins: 0 },
  { id: '43', name: '타코야키', emoji: '🍡', category: '일식', stats: { popularity: 83, taste: 87, price: 80, health: 60 }, isAlive: true, wins: 0 },
  { id: '44', name: '가라아게', emoji: '🍗', category: '일식', stats: { popularity: 86, taste: 90, price: 75, health: 50 }, isAlive: true, wins: 0 },
  { id: '45', name: '텐동', emoji: '🍤', category: '일식', stats: { popularity: 78, taste: 83, price: 70, health: 60 }, isAlive: true, wins: 0 },
  { id: '46', name: '장어덮밥', emoji: '🍱', category: '일식', stats: { popularity: 80, taste: 88, price: 50, health: 75 }, isAlive: true, wins: 0 },
  { id: '47', name: '야끼소바', emoji: '🍜', category: '일식', stats: { popularity: 77, taste: 82, price: 80, health: 65 }, isAlive: true, wins: 0 },
  { id: '48', name: '샤브샤브', emoji: '🥘', category: '일식', stats: { popularity: 84, taste: 89, price: 60, health: 85 }, isAlive: true, wins: 0 },
  { id: '49', name: '회덮밥', emoji: '🍚', category: '일식', stats: { popularity: 81, taste: 87, price: 65, health: 80 }, isAlive: true, wins: 0 },
  { id: '50', name: '연어덮밥', emoji: '🍱', category: '일식', stats: { popularity: 85, taste: 90, price: 70, health: 85 }, isAlive: true, wins: 0 },

  // 양식 (15개)
  { id: '51', name: '피자', emoji: '🍕', category: '양식', stats: { popularity: 98, taste: 97, price: 70, health: 45 }, isAlive: true, wins: 0 },
  { id: '52', name: '파스타', emoji: '🍝', category: '양식', stats: { popularity: 93, taste: 94, price: 75, health: 60 }, isAlive: true, wins: 0 },
  { id: '53', name: '스테이크', emoji: '🥩', category: '양식', stats: { popularity: 90, taste: 96, price: 40, health: 65 }, isAlive: true, wins: 0 },
  { id: '54', name: '리조또', emoji: '🍚', category: '양식', stats: { popularity: 78, taste: 85, price: 60, health: 70 }, isAlive: true, wins: 0 },
  { id: '55', name: '햄버거', emoji: '🍔', category: '양식', stats: { popularity: 95, taste: 92, price: 75, health: 50 }, isAlive: true, wins: 0 },
  { id: '56', name: '샌드위치', emoji: '🥪', category: '양식', stats: { popularity: 85, taste: 80, price: 85, health: 75 }, isAlive: true, wins: 0 },
  { id: '57', name: '샐러드', emoji: '🥗', category: '양식', stats: { popularity: 70, taste: 65, price: 70, health: 95 }, isAlive: true, wins: 0 },
  { id: '58', name: '그라탕', emoji: '🥘', category: '양식', stats: { popularity: 76, taste: 82, price: 65, health: 60 }, isAlive: true, wins: 0 },
  { id: '59', name: '오믈렛', emoji: '🍳', category: '양식', stats: { popularity: 77, taste: 81, price: 80, health: 70 }, isAlive: true, wins: 0 },
  { id: '60', name: '크림수프', emoji: '🥣', category: '양식', stats: { popularity: 72, taste: 78, price: 75, health: 65 }, isAlive: true, wins: 0 },
  { id: '61', name: '치킨까스', emoji: '🍗', category: '양식', stats: { popularity: 88, taste: 90, price: 80, health: 55 }, isAlive: true, wins: 0 },
  { id: '62', name: '피쉬앤칩스', emoji: '🐟', category: '양식', stats: { popularity: 74, taste: 79, price: 70, health: 60 }, isAlive: true, wins: 0 },
  { id: '63', name: '새우튀김', emoji: '🍤', category: '양식', stats: { popularity: 82, taste: 88, price: 75, health: 55 }, isAlive: true, wins: 0 },
  { id: '64', name: '미트볼', emoji: '🍝', category: '양식', stats: { popularity: 79, taste: 83, price: 75, health: 60 }, isAlive: true, wins: 0 },
  { id: '65', name: '라자냐', emoji: '🍝', category: '양식', stats: { popularity: 81, taste: 87, price: 65, health: 60 }, isAlive: true, wins: 0 },

  // 분식 (10개)
  { id: '66', name: '떡볶이', emoji: '🍢', category: '분식', stats: { popularity: 92, taste: 90, price: 90, health: 55 }, isAlive: true, wins: 0 },
  { id: '67', name: '순대', emoji: '🌭', category: '분식', stats: { popularity: 80, taste: 82, price: 85, health: 60 }, isAlive: true, wins: 0 },
  { id: '68', name: '튀김', emoji: '🍤', category: '분식', stats: { popularity: 85, taste: 87, price: 90, health: 50 }, isAlive: true, wins: 0 },
  { id: '69', name: '김밥', emoji: '🍱', category: '분식', stats: { popularity: 88, taste: 85, price: 95, health: 75 }, isAlive: true, wins: 0 },
  { id: '70', name: '라면', emoji: '🍜', category: '분식', stats: { popularity: 93, taste: 91, price: 95, health: 55 }, isAlive: true, wins: 0 },
  { id: '71', name: '만두', emoji: '🥟', category: '분식', stats: { popularity: 87, taste: 88, price: 85, health: 65 }, isAlive: true, wins: 0 },
  { id: '72', name: '컵라면', emoji: '🍜', category: '분식', stats: { popularity: 84, taste: 80, price: 98, health: 45 }, isAlive: true, wins: 0 },
  { id: '73', name: '어묵', emoji: '🍢', category: '분식', stats: { popularity: 82, taste: 79, price: 90, health: 60 }, isAlive: true, wins: 0 },
  { id: '74', name: '국물떡볶이', emoji: '🍲', category: '분식', stats: { popularity: 86, taste: 89, price: 85, health: 55 }, isAlive: true, wins: 0 },
  { id: '75', name: '쫄면', emoji: '🍜', category: '분식', stats: { popularity: 81, taste: 84, price: 85, health: 60 }, isAlive: true, wins: 0 },

  // 치킨 (10개)
  { id: '76', name: '후라이드치킨', emoji: '🍗', category: '치킨', stats: { popularity: 95, taste: 95, price: 70, health: 40 }, isAlive: true, wins: 0 },
  { id: '77', name: '양념치킨', emoji: '🍗', category: '치킨', stats: { popularity: 98, taste: 98, price: 70, health: 35 }, isAlive: true, wins: 0 },
  { id: '78', name: '간장치킨', emoji: '🍗', category: '치킨', stats: { popularity: 88, taste: 92, price: 70, health: 40 }, isAlive: true, wins: 0 },
  { id: '79', name: '마늘치킨', emoji: '🍗', category: '치킨', stats: { popularity: 85, taste: 90, price: 70, health: 45 }, isAlive: true, wins: 0 },
  { id: '80', name: '파닭', emoji: '🍗', category: '치킨', stats: { popularity: 82, taste: 88, price: 70, health: 50 }, isAlive: true, wins: 0 },
  { id: '81', name: '반반치킨', emoji: '🍗', category: '치킨', stats: { popularity: 93, taste: 95, price: 70, health: 38 }, isAlive: true, wins: 0 },
  { id: '82', name: '뿌링클', emoji: '🍗', category: '치킨', stats: { popularity: 90, taste: 93, price: 65, health: 35 }, isAlive: true, wins: 0 },
  { id: '83', name: '허니콤보', emoji: '🍗', category: '치킨', stats: { popularity: 87, taste: 91, price: 70, health: 40 }, isAlive: true, wins: 0 },
  { id: '84', name: '핫치킨', emoji: '🍗', category: '치킨', stats: { popularity: 84, taste: 89, price: 70, health: 40 }, isAlive: true, wins: 0 },
  { id: '85', name: '순살치킨', emoji: '🍗', category: '치킨', stats: { popularity: 91, taste: 92, price: 65, health: 45 }, isAlive: true, wins: 0 },

  // 디저트 (10개)
  { id: '86', name: '아이스크림', emoji: '🍦', category: '디저트', stats: { popularity: 92, taste: 93, price: 80, health: 30 }, isAlive: true, wins: 0 },
  { id: '87', name: '케이크', emoji: '🍰', category: '디저트', stats: { popularity: 90, taste: 94, price: 60, health: 25 }, isAlive: true, wins: 0 },
  { id: '88', name: '마카롱', emoji: '🍪', category: '디저트', stats: { popularity: 85, taste: 88, price: 50, health: 35 }, isAlive: true, wins: 0 },
  { id: '89', name: '타르트', emoji: '🥧', category: '디저트', stats: { popularity: 78, taste: 85, price: 55, health: 40 }, isAlive: true, wins: 0 },
  { id: '90', name: '초콜릿', emoji: '🍫', category: '디저트', stats: { popularity: 88, taste: 92, price: 75, health: 30 }, isAlive: true, wins: 0 },
  { id: '91', name: '도넛', emoji: '🍩', category: '디저트', stats: { popularity: 86, taste: 89, price: 80, health: 35 }, isAlive: true, wins: 0 },
  { id: '92', name: '쿠키', emoji: '🍪', category: '디저트', stats: { popularity: 84, taste: 86, price: 85, health: 40 }, isAlive: true, wins: 0 },
  { id: '93', name: '푸딩', emoji: '🍮', category: '디저트', stats: { popularity: 80, taste: 83, price: 75, health: 50 }, isAlive: true, wins: 0 },
  { id: '94', name: '젤라또', emoji: '🍨', category: '디저트', stats: { popularity: 81, taste: 87, price: 65, health: 40 }, isAlive: true, wins: 0 },
  { id: '95', name: '와플', emoji: '🧇', category: '디저트', stats: { popularity: 83, taste: 88, price: 70, health: 45 }, isAlive: true, wins: 0 },

  // 패스트푸드 (5개)
  { id: '96', name: '감자튀김', emoji: '🍟', category: '패스트푸드', stats: { popularity: 94, taste: 90, price: 85, health: 35 }, isAlive: true, wins: 0 },
  { id: '97', name: '핫도그', emoji: '🌭', category: '패스트푸드', stats: { popularity: 82, taste: 84, price: 85, health: 45 }, isAlive: true, wins: 0 },
  { id: '98', name: '치즈버거', emoji: '🍔', category: '패스트푸드', stats: { popularity: 91, taste: 93, price: 75, health: 40 }, isAlive: true, wins: 0 },
  { id: '99', name: '너겟', emoji: '🍗', category: '패스트푸드', stats: { popularity: 87, taste: 88, price: 85, health: 40 }, isAlive: true, wins: 0 },
  { id: '100', name: '타코', emoji: '🌮', category: '패스트푸드', stats: { popularity: 79, taste: 82, price: 75, health: 55 }, isAlive: true, wins: 0 },
]

export interface BattleLog {
  round: number
  match: number
  food1: Food
  food2: Food
  winner: Food
  reason: string
  timestamp: number
}



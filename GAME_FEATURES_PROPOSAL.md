# 게임 기능 추가 제안서

## 🎮 자영업자 커뮤니티에 적합한 게임 아이디어

### 1. **사장님 운세 게임** ⭐ (추천)
- **개념**: 매일 다른 운세를 확인하고, 좋은 운세를 받으면 포인트 획득
- **구현 난이도**: ⭐⭐ (쉬움)
- **기능**:
  - 일일 운세 확인 (하루 1회)
  - 운세에 따라 포인트 지급 (대길: +10, 길: +5, 평: +2)
  - 연속 출석 보너스
- **위치**: 기존 "운세보기" 메뉴에 통합

### 2. **사장님 퀴즈 게임** 🧠
- **개념**: 자영업 관련 퀴즈를 풀고 포인트 획득
- **구현 난이도**: ⭐⭐⭐ (보통)
- **기능**:
  - 일일 퀴즈 (하루 3문제)
  - 정답 시 포인트 획득 (+5점)
  - 연속 정답 보너스
  - 주간 퀴즈 챌린지
- **위치**: 새로운 "게임" 메뉴 또는 하단 네비게이션

### 3. **복권/추첨 게임** 🎰
- **개념**: 포인트를 사용하여 복권을 구매하고 당첨 시 포인트 획득
- **구현 난이도**: ⭐⭐⭐ (보통)
- **기능**:
  - 일일 무료 복권 1장
  - 포인트로 추가 복권 구매 (10포인트 = 1장)
  - 당첨 시 포인트 지급 (10~1000점 랜덤)
  - 당첨 확률: 70% (소액), 20% (중액), 9% (대액), 1% (최대액)
- **위치**: 게임 메뉴

### 4. **사장님 랜덤 박스** 📦
- **개념**: 포인트로 랜덤 박스를 열고 다양한 보상 획득
- **구현 난이도**: ⭐⭐ (쉬움)
- **기능**:
  - 일반 박스 (50포인트): 소액 포인트, 배지
  - 고급 박스 (200포인트): 중액 포인트, 특별 배지
  - 프리미엄 박스 (500포인트): 대액 포인트, 희귀 배지
- **위치**: 게임 메뉴

### 5. **간단한 퍼즐 게임** 🧩
- **개념**: 간단한 숫자 퍼즐이나 단어 맞추기
- **구현 난이도**: ⭐⭐⭐⭐ (어려움)
- **기능**:
  - 2048 스타일 숫자 퍼즐
  - 자영업 관련 단어 맞추기
  - 점수에 따라 포인트 지급
- **위치**: 게임 메뉴

### 6. **사장님 룰렛** 🎡
- **개념**: 일일 무료 룰렛으로 포인트나 보상 획득
- **구현 난이도**: ⭐⭐ (쉬움)
- **기능**:
  - 하루 1회 무료 룰렛
  - 포인트로 추가 회전 (20포인트)
  - 다양한 보상 (포인트, 배지, 특별 혜택)
- **위치**: 게임 메뉴

## 🎯 추천 구현 순서

### Phase 1: 간단한 게임 (빠른 구현)
1. **사장님 운세 게임** - 기존 운세 메뉴 확장
2. **사장님 룰렛** - 간단하고 재미있음

### Phase 2: 중간 난이도 게임
3. **복권/추첨 게임** - 포인트 시스템과 연동
4. **사장님 랜덤 박스** - 포인트 소비 유도

### Phase 3: 고급 게임
5. **사장님 퀴즈 게임** - 콘텐츠 관리 필요
6. **퍼즐 게임** - 복잡한 로직

## 📱 UI/UX 디자인

### 게임 메뉴 추가
```
하단 네비게이션:
[홈] [업종별] [지역별] [게임] [마이]
```

### 게임 페이지 레이아웃
```
┌─────────────────────────┐
│  🎮 게임 센터           │
├─────────────────────────┤
│  ┌─────┐  ┌─────┐      │
│  │ 🎡  │  │ 📦  │      │
│  │룰렛 │  │박스 │      │
│  └─────┘  └─────┘      │
│  ┌─────┐  ┌─────┐      │
│  │ 🎰  │  │ ⭐  │      │
│  │복권 │  │운세 │      │
│  └─────┘  └─────┘      │
└─────────────────────────┘
```

## 💾 데이터 구조

### Firestore: `user_games` 컬렉션
```typescript
{
  userId: string
  lastFortuneDate: string        // 마지막 운세 확인 날짜
  fortuneStreak: number           // 연속 운세 확인 일수
  lastRouletteDate: string        // 마지막 룰렛 날짜
  lastLotteryDate: string         // 마지막 복권 날짜
  totalGamesPlayed: number        // 총 게임 플레이 횟수
  totalPointsEarned: number       // 게임으로 획득한 포인트
  achievements: string[]          // 게임 업적
  gameHistory: Array<{            // 게임 내역
    gameType: 'fortune' | 'roulette' | 'lottery' | 'box'
    result: any
    pointsEarned: number
    timestamp: Timestamp
  }>
}
```

## 🛠️ 기술 구현 예시

### 1. 운세 게임 컴포넌트
```typescript
// components/FortuneGame.tsx
'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

const fortunes = [
  { type: '대길', message: '오늘은 대박날! 모든 일이 순조롭게 진행됩니다.', points: 10, emoji: '🌟' },
  { type: '길', message: '좋은 하루가 될 것 같습니다.', points: 5, emoji: '✨' },
  { type: '평', message: '무난한 하루입니다.', points: 2, emoji: '😊' },
  { type: '흉', message: '조심하세요. 신중하게 결정하세요.', points: 0, emoji: '⚠️' },
]

export default function FortuneGame() {
  const [user, setUser] = useState<any>(null)
  const [fortune, setFortune] = useState<any>(null)
  const [canPlay, setCanPlay] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 로그인 상태 확인
    // 오늘 이미 운세를 봤는지 확인
    checkCanPlay()
  }, [])

  const checkCanPlay = async () => {
    if (!user || !db) return
    
    const userGameRef = doc(db, 'user_games', user.uid)
    const userGameSnap = await getDoc(userGameRef)
    
    if (userGameSnap.exists()) {
      const data = userGameSnap.data()
      const today = new Date().toDateString()
      if (data.lastFortuneDate === today) {
        setCanPlay(false)
        // 오늘 받은 운세 표시
        if (data.lastFortune) {
          setFortune(data.lastFortune)
        }
      }
    }
  }

  const playFortune = async () => {
    if (!user || !db || !canPlay) return

    setLoading(true)
    
    // 랜덤 운세 선택
    const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)]
    
    try {
      // 사용자 게임 데이터 업데이트
      const userGameRef = doc(db, 'user_games', user.uid)
      const today = new Date().toDateString()
      
      await updateDoc(userGameRef, {
        lastFortuneDate: today,
        lastFortune: randomFortune,
        fortuneStreak: increment(1),
        totalGamesPlayed: increment(1),
        totalPointsEarned: increment(randomFortune.points),
      })

      // 포인트 추가
      if (randomFortune.points > 0) {
        await addPoints(user.uid, randomFortune.points, '운세 게임 보상')
      }

      setFortune(randomFortune)
      setCanPlay(false)
    } catch (error) {
      console.error('운세 게임 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4">사장님 운세</h3>
      
      {fortune ? (
        <div className="text-center">
          <div className="text-6xl mb-4">{fortune.emoji}</div>
          <div className="text-2xl font-bold mb-2">{fortune.type}</div>
          <p className="text-gray-600 mb-4">{fortune.message}</p>
          {fortune.points > 0 && (
            <div className="text-green-600 font-bold">
              +{fortune.points} 포인트 획득!
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <p className="text-gray-600 mb-4">오늘의 운세를 확인해보세요!</p>
          <button
            onClick={playFortune}
            disabled={loading || !canPlay}
            className="px-6 py-3 bg-[#FFBF00] text-[#1A2B4E] rounded-xl font-bold hover:bg-[#FFBF00]/90 transition disabled:opacity-50"
          >
            {loading ? '확인 중...' : '운세 보기'}
          </button>
        </div>
      )}
    </div>
  )
}
```

### 2. 룰렛 게임 컴포넌트
```typescript
// components/RouletteGame.tsx
'use client'

import { useState } from 'react'
import { auth, db } from '@/lib/firebase'

const rewards = [
  { name: '소액 포인트', points: 10, emoji: '💰', probability: 40 },
  { name: '중액 포인트', points: 50, emoji: '💵', probability: 30 },
  { name: '대액 포인트', points: 100, emoji: '💎', probability: 20 },
  { name: '특별 배지', points: 0, emoji: '🏆', probability: 10 },
]

export default function RouletteGame() {
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<any>(null)

  const spin = () => {
    if (spinning) return
    
    setSpinning(true)
    
    // 룰렛 애니메이션
    setTimeout(() => {
      // 확률에 따라 보상 선택
      const random = Math.random() * 100
      let cumulative = 0
      let selectedReward = rewards[0]
      
      for (const reward of rewards) {
        cumulative += reward.probability
        if (random <= cumulative) {
          selectedReward = reward
          break
        }
      }
      
      setResult(selectedReward)
      setSpinning(false)
      
      // Firebase에 저장 및 포인트 지급
      saveResult(selectedReward)
    }, 3000) // 3초 애니메이션
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4">사장님 룰렛</h3>
      
      <div className="relative w-64 h-64 mx-auto mb-4">
        {/* 룰렛 UI */}
        <div className={`w-full h-full rounded-full border-4 border-[#1A2B4E] ${spinning ? 'animate-spin' : ''}`}>
          {/* 룰렛 섹션들 */}
        </div>
      </div>
      
      <button
        onClick={spin}
        disabled={spinning}
        className="w-full px-6 py-3 bg-[#FFBF00] text-[#1A2B4E] rounded-xl font-bold hover:bg-[#FFBF00]/90 transition disabled:opacity-50"
      >
        {spinning ? '돌리는 중...' : '룰렛 돌리기'}
      </button>
      
      {result && (
        <div className="mt-4 text-center">
          <div className="text-4xl mb-2">{result.emoji}</div>
          <div className="font-bold text-lg">{result.name}</div>
          {result.points > 0 && (
            <div className="text-green-600">+{result.points} 포인트!</div>
          )}
        </div>
      )}
    </div>
  )
}
```

## 🎨 게임 페이지 구조

```
app/games/page.tsx
├── FortuneGame (운세 게임)
├── RouletteGame (룰렛 게임)
├── LotteryGame (복권 게임)
└── RandomBoxGame (랜덤 박스 게임)
```

## 📊 포인트 시스템 연동

게임에서 획득한 포인트는 기존 포인트 시스템과 연동:
- 게임 포인트 → 사용자 포인트에 합산
- 게임 내역 → 포인트 히스토리에 기록
- 게임 업적 → 사용자 업적에 추가

## 🚀 구현 시작하기

가장 간단한 **운세 게임**부터 시작하는 것을 추천합니다:
1. 구현 난이도가 낮음
2. 기존 운세 메뉴와 통합 가능
3. 사용자 참여도 높음
4. 포인트 시스템과 자연스럽게 연동

원하시는 게임을 선택해주시면 바로 구현해드리겠습니다!


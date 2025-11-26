'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, Check, X, RefreshCw } from 'lucide-react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

interface AIAvatarGeneratorProps {
  onAvatarGenerated: (imageUrl: string) => void
  currentAvatarUrl?: string
}

export default function AIAvatarGenerator({
  onAvatarGenerated,
  currentAvatarUrl,
}: AIAvatarGeneratorProps) {
  const [keywords, setKeywords] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generationCount, setGenerationCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const maxGenerations = 2

  // Firebase에서 생성 횟수와 날짜 불러오기
  useEffect(() => {
    const loadGenerationCount = async () => {
      if (!auth || !db) {
        setLoading(false)
        return
      }

      const user = auth.currentUser
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)
        
        if (userSnap.exists()) {
          const userData = userSnap.data()
          const lastDate = userData.lastAvatarGenerationDate
          const count = userData.avatarGenerationCount || 0
          
          // 날짜 확인
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          if (lastDate) {
            const lastDateObj = lastDate.toDate ? lastDate.toDate() : new Date(lastDate)
            lastDateObj.setHours(0, 0, 0, 0)
            
            // 날짜가 다르면 (하루가 지났으면) 리셋
            if (lastDateObj.getTime() !== today.getTime()) {
              setGenerationCount(0)
              // Firebase도 리셋
              await updateDoc(userRef, {
                avatarGenerationCount: 0,
                lastAvatarGenerationDate: serverTimestamp(),
              })
            } else {
              setGenerationCount(count)
            }
          } else {
            setGenerationCount(0)
          }
        } else {
          setGenerationCount(0)
        }
      } catch (error) {
        console.error('생성 횟수 불러오기 오류:', error)
        setGenerationCount(0)
      } finally {
        setLoading(false)
      }
    }

    loadGenerationCount()
  }, [])

  // 키워드 예시
  const keywordExamples = [
    '치킨집 사장님, 밝은 분위기',
    '카페 사장님, 따뜻한 느낌',
    '한식당 사장님, 전통적인',
    '행복한 자영업자',
    '친근한 사장님',
  ]

  const handleGenerate = async () => {
    if (!keywords.trim()) {
      setError('키워드를 입력해주세요.')
      return
    }

    if (!auth || !db) {
      setError('로그인이 필요합니다.')
      return
    }

    const user = auth.currentUser
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    // 최신 횟수 확인
    if (generationCount >= maxGenerations) {
      setError(`하루 최대 ${maxGenerations}회까지 생성할 수 있습니다.`)
      return
    }

    setGenerating(true)
    setError(null)
    setGeneratedImageUrl(null)

    try {
      // Firebase에 생성 횟수 증가 (선반영)
      const userRef = doc(db, 'users', user.uid)
      const newCount = generationCount + 1
      
      await updateDoc(userRef, {
        avatarGenerationCount: newCount,
        lastAvatarGenerationDate: serverTimestamp(),
      })
      
      setGenerationCount(newCount)

      // API 호출
      const response = await fetch('/api/generate-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords }),
      })

      const data = await response.json()

      if (!response.ok) {
        // 실패 시 횟수 되돌리기
        await updateDoc(userRef, {
          avatarGenerationCount: generationCount,
        })
        setGenerationCount(generationCount)
        throw new Error(data.error || '이미지 생성에 실패했습니다.')
      }

      setGeneratedImageUrl(data.imageUrl)
    } catch (err: any) {
      setError(err.message || '이미지 생성 중 오류가 발생했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  const handleConfirm = async () => {
    if (generatedImageUrl) {
      onAvatarGenerated(generatedImageUrl)
      setGeneratedImageUrl(null)
      setKeywords('')
      // 생성 횟수는 유지 (확정 후에도 리셋하지 않음)
    }
  }

  const handleRegenerate = () => {
    setGeneratedImageUrl(null)
    setError(null)
  }

  const handleExampleClick = (example: string) => {
    setKeywords(example)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-[#1A2B4E]" size={20} />
        <h3 className="text-lg font-bold text-gray-900">AI 아바타 생성</h3>
      </div>

      {/* 현재 아바타 표시 */}
      {currentAvatarUrl && !generatedImageUrl && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">현재 아바타</p>
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#1A2B4E] bg-gray-100">
            <img
              src={currentAvatarUrl}
              alt="현재 아바타"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* 생성 횟수 표시 */}
      {!loading && (
        <div className="bg-blue-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-700">
            남은 생성 횟수: <span className="font-bold text-[#1A2B4E]">{maxGenerations - generationCount}</span> / {maxGenerations}
          </p>
          <p className="text-xs text-gray-500 mt-1">매일 자정에 횟수가 초기화됩니다.</p>
        </div>
      )}

      {/* 키워드 입력 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          아바타 설명 (키워드)
        </label>
        <textarea
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="예: 치킨집 사장님, 밝은 분위기, 친근한"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1A2B4E] text-gray-800 resize-none"
          rows={3}
          maxLength={100}
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-500">
            원하는 아바타를 설명하는 키워드를 입력하세요
          </p>
          <span className="text-xs text-gray-400">{keywords.length}/100</span>
        </div>
      </div>

      {/* 키워드 예시 */}
      <div>
        <p className="text-xs text-gray-600 mb-2">💡 키워드 예시</p>
        <div className="flex flex-wrap gap-2">
          {keywordExamples.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* 생성 버튼 */}
      <button
        onClick={handleGenerate}
        disabled={generating || !keywords.trim() || generationCount >= maxGenerations}
        className="w-full py-3 bg-[#1A2B4E] text-white rounded-xl font-bold hover:bg-[#1A2B4E]/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            <span>생성 중...</span>
          </>
        ) : (
          <>
            <Sparkles size={20} />
            <span>AI로 아바타 생성</span>
          </>
        )}
      </button>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 생성된 이미지 표시 */}
      {generatedImageUrl && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border-2 border-[#1A2B4E]">
            <p className="text-sm font-medium text-gray-700 mb-3">생성된 아바타</p>
            <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
              <img
                src={generatedImageUrl}
                alt="생성된 아바타"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 bg-[#FFBF00] text-[#1A2B4E] rounded-lg font-bold hover:bg-[#FFBF00]/90 transition flex items-center justify-center gap-2"
              >
                <Check size={18} />
                <span>이걸로 결정</span>
              </button>
              <button
                onClick={handleRegenerate}
                disabled={generationCount >= maxGenerations}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                <span>다시 만들기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


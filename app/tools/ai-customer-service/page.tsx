'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, Copy, Check, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const businessTypes = ['치킨집', '카페', '한식당', '중식당', '일식당', '양식당', '분식', '베이커리', '술집', '기타'];
const customerEmotions = [
  { value: 'angry', label: '화난', emoji: '😠', color: 'red' },
  { value: 'dissatisfied', label: '불만', emoji: '😞', color: 'orange' },
  { value: 'questioning', label: '질문', emoji: '🤔', color: 'blue' },
  { value: 'praising', label: '칭찬', emoji: '😊', color: 'green' },
  { value: 'neutral', label: '중립', emoji: '😐', color: 'gray' },
];
const channels = [
  { value: 'phone', label: '전화', emoji: '📞' },
  { value: 'kakaotalk', label: '카카오톡', emoji: '💬' },
  { value: 'review', label: '리뷰', emoji: '⭐' },
  { value: 'inperson', label: '직접 대면', emoji: '👤' },
];

export default function AICustomerServicePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [businessType, setBusinessType] = useState('치킨집');
  const [situation, setSituation] = useState('');
  const [customerEmotion, setCustomerEmotion] = useState('angry');
  const [channel, setChannel] = useState('kakaotalk');
  const [additionalContext, setAdditionalContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // 로그인 체크
  useEffect(() => {
    if (!auth) {
      setLoadingAuth(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router]);

  // 로딩 중 표시
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  // 로그인하지 않은 경우 (리다이렉트 중)
  if (!user) {
    return null;
  }

  const handleGenerate = async () => {
    if (!situation.trim()) {
      setError('상황을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/ai/customer-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessType,
          situation: situation.trim(),
          customerEmotion,
          channel,
          additionalContext: additionalContext || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '생성에 실패했습니다.');
      }

      setResults(data.data);
    } catch (err: any) {
      setError(err.message || '고객 대응 가이드 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      alert('복사에 실패했습니다.');
    }
  };

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
            <MessageCircle size={24} />
            <span>AI 고객 대응 가이드</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* 입력 폼 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">💬 고객 상황 입력</h2>

          <div className="space-y-4">
            {/* 업종 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">업종</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800"
              >
                {businessTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* 상황 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                고객 상황 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="예: 음식이 늦게 나왔어요, 배달이 잘못 왔어요, 메뉴가 맛없어요 등"
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800 resize-none"
              />
            </div>

            {/* 고객 감정 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">고객 감정</label>
              <div className="grid grid-cols-5 gap-2">
                {customerEmotions.map((emotion) => {
                  const isSelected = customerEmotion === emotion.value;
                  const colorClasses: Record<string, string> = {
                    red: isSelected ? 'border-red-500 bg-red-50 text-red-700' : '',
                    orange: isSelected ? 'border-orange-500 bg-orange-50 text-orange-700' : '',
                    blue: isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : '',
                    green: isSelected ? 'border-green-500 bg-green-50 text-green-700' : '',
                    gray: isSelected ? 'border-gray-500 bg-gray-50 text-gray-700' : '',
                  };
                  return (
                    <button
                      key={emotion.value}
                      onClick={() => setCustomerEmotion(emotion.value)}
                      className={`py-3 rounded-xl border-2 transition ${
                        isSelected
                          ? colorClasses[emotion.color]
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xl mb-1">{emotion.emoji}</div>
                      <div className="text-xs font-medium">{emotion.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 채널 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">소통 채널</label>
              <div className="grid grid-cols-4 gap-2">
                {channels.map((ch) => (
                  <button
                    key={ch.value}
                    onClick={() => setChannel(ch.value)}
                    className={`py-3 rounded-xl border-2 transition ${
                      channel === ch.value
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{ch.emoji}</div>
                    <div className="text-xs font-medium">{ch.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 추가 맥락 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">추가 맥락 (선택)</label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="예: 단골 고객, 첫 방문 고객, 특별한 요청 등"
                rows={2}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800 resize-none"
              />
            </div>

            {/* 생성 버튼 */}
            <button
              onClick={handleGenerate}
              disabled={loading || !situation.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>생성 중...</span>
                </>
              ) : (
                <>
                  <MessageCircle size={20} />
                  <span>대응 가이드 생성하기</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 에러 메시지 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3"
            >
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 결과 */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* 체크리스트 */}
              {results.checklist && results.checklist.length > 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <p className="text-yellow-800 text-sm font-semibold mb-2">✅ 대응 시 확인사항</p>
                  <ul className="space-y-1">
                    {results.checklist.map((item: string, i: number) => (
                      <li key={i} className="text-yellow-700 text-sm flex items-start gap-2">
                        <span className="text-yellow-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 팁 */}
              {results.tips && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 text-sm font-semibold mb-1">💡 대응 팁</p>
                  <p className="text-blue-700 text-sm">{results.tips}</p>
                </div>
              )}

              {/* 생성된 대응 문구들 */}
              {results.responses?.map((response: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 mb-1">{response.approach}</h3>
                      {response.keyPoints && response.keyPoints.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {response.keyPoints.map((point: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                            >
                              {point}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(response.message, index)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition ml-2"
                    >
                      {copiedIndex === index ? (
                        <Check size={20} className="text-green-500" />
                      ) : (
                        <Copy size={20} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                      {response.message}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* 다시 생성 버튼 */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                <span>다시 생성하기</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}


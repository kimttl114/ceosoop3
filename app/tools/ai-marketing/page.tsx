'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const businessTypes = ['치킨집', '카페', '한식당', '중식당', '일식당', '양식당', '분식', '베이커리', '술집', '기타'];
const eventTypes = ['오픈 이벤트', '할인 이벤트', '시즌 이벤트', '프로모션', '기념일 이벤트', '기타'];
const targetAudiences = ['20대', '30대', '40대', '가족 단위', '직장인', '학생', '전체'];
const tones = [
  { value: 'friendly', label: '친근한', emoji: '😊' },
  { value: 'professional', label: '전문적인', emoji: '💼' },
  { value: 'fun', label: '재미있는', emoji: '🎉' },
  { value: 'emotional', label: '감성적인', emoji: '💝' },
  { value: 'premium', label: '프리미엄', emoji: '✨' },
];
const platforms = [
  { value: 'instagram', label: '인스타그램', emoji: '📷' },
  { value: 'facebook', label: '페이스북', emoji: '👥' },
  { value: 'flyer', label: '전단지', emoji: '📄' },
  { value: 'banner', label: '배너', emoji: '🖼️' },
  { value: 'kakao', label: '카카오톡', emoji: '💬' },
];

export default function AIMarketingPage() {
  const router = useRouter();
  const [businessType, setBusinessType] = useState('치킨집');
  const [eventType, setEventType] = useState('할인 이벤트');
  const [discount, setDiscount] = useState<number | ''>('');
  const [targetAudience, setTargetAudience] = useState('20-30대');
  const [tone, setTone] = useState('friendly');
  const [platform, setPlatform] = useState('instagram');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/ai/marketing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessType,
          eventType,
          discount: discount ? Number(discount) : undefined,
          targetAudience,
          tone,
          platform,
          additionalInfo: additionalInfo || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '생성에 실패했습니다.');
      }

      setResults(data.data);
    } catch (err: any) {
      setError(err.message || '마케팅 문구 생성에 실패했습니다.');
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pb-24">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-purple-600 to-pink-600 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles size={24} />
            <span>AI 마케팅 문구 생성기</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* 입력 폼 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📝 마케팅 정보 입력</h2>

          <div className="space-y-4">
            {/* 업종 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">업종</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-800"
              >
                {businessTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* 이벤트 유형 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">이벤트 유형</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-800"
              >
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* 할인율 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">할인율 (선택)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value ? Number(e.target.value) : '')}
                placeholder="예: 20"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-800"
              />
            </div>

            {/* 타겟 고객 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">타겟 고객</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-800"
              >
                {targetAudiences.map((audience) => (
                  <option key={audience} value={audience}>
                    {audience}
                  </option>
                ))}
              </select>
            </div>

            {/* 톤앤매너 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">톤앤매너</label>
              <div className="grid grid-cols-5 gap-2">
                {tones.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`py-3 rounded-xl border-2 transition ${
                      tone === t.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{t.emoji}</div>
                    <div className="text-xs font-medium">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 플랫폼 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">플랫폼</label>
              <div className="grid grid-cols-5 gap-2">
                {platforms.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={`py-3 rounded-xl border-2 transition ${
                      platform === p.value
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{p.emoji}</div>
                    <div className="text-xs font-medium">{p.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 추가 정보 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">추가 정보 (선택)</label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="예: 특별한 메뉴, 시간 제한 등"
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-800 resize-none"
              />
            </div>

            {/* 생성 버튼 */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>생성 중...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>마케팅 문구 생성하기</span>
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
              className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6"
            >
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
              {/* 팁 */}
              {results.tips && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 text-sm font-semibold mb-1">💡 사용 팁</p>
                  <p className="text-blue-700 text-sm">{results.tips}</p>
                </div>
              )}

              {/* 생성된 문구들 */}
              {results.versions?.map((version: any, index: number) => {
                const fullText = `${version.emoji} ${version.content}\n\n${version.hashtags?.join(' ') || ''}`;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-100"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800 mb-1">{version.title}</h3>
                        <div className="text-sm text-gray-500">{version.emoji}</div>
                      </div>
                      <button
                        onClick={() => handleCopy(fullText, index)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        {copiedIndex === index ? (
                          <Check size={20} className="text-green-500" />
                        ) : (
                          <Copy size={20} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 mb-3">
                      <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                        {version.content}
                      </p>
                    </div>
                    {version.hashtags && version.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {version.hashtags.map((tag: string, i: number) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}

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




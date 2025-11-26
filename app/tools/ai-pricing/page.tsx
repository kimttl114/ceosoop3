'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, TrendingUp, Copy, Check, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatNumber } from '@/lib/utils';

const businessTypes = ['치킨집', '카페', '한식당', '중식당', '일식당', '양식당', '분식', '베이커리', '술집', '기타'];
const regions = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const targetCustomers = ['20대', '30대', '40대', '가족 단위', '직장인', '학생', '프리미엄', '전체'];

export default function AIPricingPage() {
  const router = useRouter();
  const [businessType, setBusinessType] = useState('치킨집');
  const [cost, setCost] = useState<number | ''>('');
  const [targetMargin, setTargetMargin] = useState<number | ''>(30);
  const [region, setRegion] = useState('서울');
  const [targetCustomer, setTargetCustomer] = useState('20-30대');
  const [competitorPrices, setCompetitorPrices] = useState<string>('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!cost || cost <= 0) {
      setError('원가를 입력해주세요.');
      return;
    }

    if (!targetMargin || targetMargin <= 0 || targetMargin >= 100) {
      setError('목표 마진율을 올바르게 입력해주세요 (0-100).');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const competitorPricesArray = competitorPrices
        ? competitorPrices.split(',').map(p => Number(p.trim())).filter(p => !isNaN(p) && p > 0)
        : undefined;

      const response = await fetch('/api/ai/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessType,
          cost: Number(cost),
          targetMargin: Number(targetMargin),
          competitorPrices: competitorPricesArray,
          region,
          targetCustomer,
          additionalInfo: additionalInfo || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '생성에 실패했습니다.');
      }

      setResults(data.data);
    } catch (err: any) {
      setError(err.message || '가격 책정 조언 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('복사되었습니다!');
    } catch (err) {
      alert('복사에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 pb-24">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-amber-600 to-orange-600 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign size={24} />
            <span>AI 가격 책정 조언</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* 입력 폼 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">💰 가격 정보 입력</h2>

          <div className="space-y-4">
            {/* 업종 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">업종</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-gray-800"
              >
                {businessTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* 원가 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                원가 (원) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value ? Number(e.target.value) : '')}
                placeholder="예: 5000"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-gray-800"
              />
            </div>

            {/* 목표 마진율 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                목표 마진율 (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={targetMargin}
                onChange={(e) => setTargetMargin(e.target.value ? Number(e.target.value) : '')}
                placeholder="예: 30"
                min="1"
                max="99"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-gray-800"
              />
            </div>

            {/* 지역 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">지역</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-gray-800"
              >
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* 타겟 고객 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">타겟 고객</label>
              <select
                value={targetCustomer}
                onChange={(e) => setTargetCustomer(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-gray-800"
              >
                {targetCustomers.map((customer) => (
                  <option key={customer} value={customer}>
                    {customer}
                  </option>
                ))}
              </select>
            </div>

            {/* 경쟁사 가격 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">경쟁사 가격 (선택)</label>
              <input
                type="text"
                value={competitorPrices}
                onChange={(e) => setCompetitorPrices(e.target.value)}
                placeholder="쉼표로 구분 (예: 15000, 16000, 17000)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-gray-800"
              />
              <p className="text-xs text-gray-500 mt-1">여러 가격을 쉼표로 구분하여 입력하세요</p>
            </div>

            {/* 추가 정보 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">추가 정보 (선택)</label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="예: 특별한 재료 사용, 프리미엄 서비스 등"
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-gray-800 resize-none"
              />
            </div>

            {/* 생성 버튼 */}
            <button
              onClick={handleGenerate}
              disabled={loading || !cost || !targetMargin}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>분석 중...</span>
                </>
              ) : (
                <>
                  <TrendingUp size={20} />
                  <span>가격 조언 받기</span>
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
              {/* 가격 분석 */}
              {results.priceAnalysis && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-amber-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-amber-600" />
                    <span>가격 분석</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                      <div className="text-sm text-red-700 mb-1">최저 가격 (10% 마진)</div>
                      <div className="text-2xl font-bold text-red-600">
                        {formatNumber(results.priceAnalysis.minPrice)}원
                      </div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-300">
                      <div className="text-sm text-amber-700 mb-1">권장 가격</div>
                      <div className="text-3xl font-bold text-amber-600">
                        {formatNumber(results.priceAnalysis.recommendedPrice)}원
                      </div>
                      <div className="text-xs text-amber-600 mt-1">
                        {results.priceAnalysis.priceExplanation}
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <div className="text-sm text-purple-700 mb-1">프리미엄 가격</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {formatNumber(results.priceAnalysis.premiumPrice)}원
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 경쟁력 분석 */}
              {results.competitiveness && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600" />
                    <span>경쟁력 분석</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-blue-800 text-sm mb-2">{results.competitiveness.analysis}</p>
                      <p className="text-blue-700 font-semibold">시장 내 위치: {results.competitiveness.position}</p>
                    </div>
                    {results.competitiveness.advantages && results.competitiveness.advantages.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">✅ 장점</p>
                        <ul className="space-y-1">
                          {results.competitiveness.advantages.map((adv: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-green-500 mt-1">•</span>
                              <span>{adv}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {results.competitiveness.risks && results.competitiveness.risks.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">⚠️ 리스크</p>
                        <ul className="space-y-1">
                          {results.competitiveness.risks.map((risk: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-orange-500 mt-1">•</span>
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 전략 */}
              {results.strategy && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">💡 가격 전략</h3>
                  <div className="space-y-3">
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-green-800 font-semibold mb-2">추천 전략</p>
                      <p className="text-green-700 text-sm">{results.strategy.recommendation}</p>
                    </div>
                    {results.strategy.pricingModel && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">가격 모델</p>
                        <p className="text-sm text-gray-600">{results.strategy.pricingModel}</p>
                      </div>
                    )}
                    {results.strategy.promotionTips && results.strategy.promotionTips.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">프로모션 팁</p>
                        <ul className="space-y-1">
                          {results.strategy.promotionTips.map((tip: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-purple-500 mt-1">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 타겟 고객 분석 */}
              {results.targetCustomerAnalysis && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">👥 타겟 고객 분석</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">가격 민감도:</span> {results.targetCustomerAnalysis.priceSensitivity}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">가치 인식:</span> {results.targetCustomerAnalysis.valuePerception}
                    </p>
                    {results.targetCustomerAnalysis.recommendations && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-gray-700 mb-2">추천사항</p>
                        <ul className="space-y-1">
                          {results.targetCustomerAnalysis.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-indigo-500 mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 팁 */}
              {results.tips && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 text-sm font-semibold mb-1">💡 추가 팁</p>
                  <p className="text-blue-700 text-sm">{results.tips}</p>
                </div>
              )}

              {/* 다시 생성 버튼 */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                <span>다시 분석하기</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}


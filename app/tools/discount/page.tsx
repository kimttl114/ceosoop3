'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Percent } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function DiscountCalculatorPage() {
  const router = useRouter();
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [discountRate, setDiscountRate] = useState<number | ''>('');
  const [costRate, setCostRate] = useState<number | ''>(70); // 원가율 (기본 70%)

  const calculateDiscount = () => {
    if (!originalPrice || originalPrice === 0) return null;

    const price = Number(originalPrice);
    const discount = Number(discountRate) || 0;
    const cost = Number(costRate) || 70;

    const discountedPrice = price * (1 - discount / 100);
    const costAmount = price * (cost / 100);
    const profitBefore = price - costAmount;
    const profitAfter = discountedPrice - costAmount;
    const profitChange = profitAfter - profitBefore;
    const marginBefore = price > 0 ? ((profitBefore / price) * 100).toFixed(1) : '0';
    const marginAfter = discountedPrice > 0 ? ((profitAfter / discountedPrice) * 100).toFixed(1) : '0';

    return {
      discountedPrice: Math.round(discountedPrice),
      profitBefore: Math.round(profitBefore),
      profitAfter: Math.round(profitAfter),
      profitChange: Math.round(profitChange),
      marginBefore,
      marginAfter,
      isProfitable: profitAfter >= 0,
    };
  };

  const result = calculateDiscount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 pb-24">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-rose-600 to-pink-600 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Percent size={24} />
            <span>할인율 계산기</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="space-y-4">
            {/* 원가 입력 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                정가 (원)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="10000"
                  className="w-full text-3xl font-bold text-center py-4 border-b-2 border-gray-300 focus:border-rose-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
            </div>

            {/* 할인율 입력 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                할인율 (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(e.target.value ? Number(e.target.value) : '')}
                  placeholder="20"
                  min="0"
                  max="99"
                  className="w-full text-2xl font-bold text-center py-3 border-b-2 border-gray-300 focus:border-rose-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
              <div className="flex gap-2 mt-2">
                {[10, 20, 30, 50].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setDiscountRate(rate)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      discountRate === rate
                        ? 'bg-rose-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>

            {/* 원가율 입력 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                원가율 (%) <span className="text-xs text-gray-400">(정가 대비)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={costRate}
                  onChange={(e) => setCostRate(e.target.value ? Number(e.target.value) : '')}
                  placeholder="70"
                  min="0"
                  max="100"
                  className="w-full text-2xl font-bold text-center py-3 border-b-2 border-gray-300 focus:border-rose-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 계산 결과 */}
        {result && (
          <div className="space-y-4">
            <div className={`rounded-2xl p-6 shadow-lg text-white ${
              result.isProfitable 
                ? 'bg-gradient-to-br from-rose-500 to-pink-500' 
                : 'bg-gradient-to-br from-red-500 to-orange-500'
            }`}>
              <h3 className="text-lg font-bold mb-4 text-center">할인 후 가격</h3>
              <div className="bg-white/20 rounded-xl p-4 border-2 border-white/50">
                <div className="text-sm opacity-90 mb-1">최종 판매가격</div>
                <div className="text-3xl font-bold">{formatNumber(result.discountedPrice)}원</div>
              </div>
              {!result.isProfitable && (
                <div className="mt-4 bg-red-600/50 rounded-lg p-3 text-center">
                  <p className="text-sm font-bold">⚠️ 손실 발생!</p>
                  <p className="text-xs mt-1">할인율을 낮추거나 원가를 줄이세요.</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-center text-gray-800">수익 변화</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">할인 전 수익</span>
                  <span className="text-sm font-bold text-blue-700">{formatNumber(result.profitBefore)}원</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">할인 후 수익</span>
                  <span className="text-sm font-bold text-green-700">{formatNumber(result.profitAfter)}원</span>
                </div>
                <div className={`flex justify-between items-center p-3 rounded-lg border-2 ${
                  result.profitChange < 0 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-gray-50 border-gray-300'
                }`}>
                  <span className="text-sm font-bold text-gray-800">수익 변화</span>
                  <span className={`text-sm font-bold ${
                    result.profitChange < 0 ? 'text-red-700' : 'text-gray-900'
                  }`}>
                    {result.profitChange >= 0 ? '+' : ''}{formatNumber(result.profitChange)}원
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">할인 전 마진율</div>
                    <div className="text-lg font-bold text-gray-900">{result.marginBefore}%</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">할인 후 마진율</div>
                    <div className="text-lg font-bold text-gray-900">{result.marginAfter}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 안내 */}
        <div className="mt-6 bg-white/80 rounded-2xl p-4 shadow-lg">
          <p className="text-xs text-gray-600 text-center">
            💡 할인 시 수익 변화를 미리 확인하고 최적의 할인율을 결정하세요.
          </p>
        </div>
      </main>
    </div>
  );
}






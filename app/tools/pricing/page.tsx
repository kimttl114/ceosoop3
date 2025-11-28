'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function PricingHelperPage() {
  const router = useRouter();
  const [materialCost, setMaterialCost] = useState<number | ''>('');
  const [laborCost, setLaborCost] = useState<number | ''>('');
  const [overhead, setOverhead] = useState<number | ''>('');
  const [targetMargin, setTargetMargin] = useState<number | ''>(30);

  const calculatePricing = () => {
    if (!materialCost || materialCost === 0) return null;

    const material = Number(materialCost);
    const labor = Number(laborCost) || 0;
    const overheadCost = Number(overhead) || 0;
    const margin = Number(targetMargin) || 30;

    const totalCost = material + labor + overheadCost;
    const recommendedPrice = totalCost / (1 - margin / 100);
    const profit = recommendedPrice - totalCost;
    const actualMargin = recommendedPrice > 0 ? (profit / recommendedPrice) * 100 : 0;

    return {
      totalCost: Math.round(totalCost),
      recommendedPrice: Math.round(recommendedPrice),
      profit: Math.round(profit),
      actualMargin: actualMargin.toFixed(1),
    };
  };

  const result = calculatePricing();

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
            <span>가격 책정 도우미</span>
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
                재료비/원가 (원)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={materialCost}
                  onChange={(e) => setMaterialCost(e.target.value ? Number(e.target.value) : '')}
                  placeholder="10000"
                  className="w-full text-2xl font-bold text-center py-3 border-b-2 border-gray-300 focus:border-amber-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
            </div>

            {/* 인건비 입력 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                인건비 (원) <span className="text-xs text-gray-400">(선택)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value ? Number(e.target.value) : '')}
                  placeholder="5000"
                  className="w-full text-2xl font-bold text-center py-3 border-b-2 border-gray-300 focus:border-amber-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
            </div>

            {/* 간접비 입력 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                간접비 (원) <span className="text-xs text-gray-400">(선택)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={overhead}
                  onChange={(e) => setOverhead(e.target.value ? Number(e.target.value) : '')}
                  placeholder="2000"
                  className="w-full text-2xl font-bold text-center py-3 border-b-2 border-gray-300 focus:border-amber-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
            </div>

            {/* 목표 마진율 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                목표 마진율 (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(e.target.value ? Number(e.target.value) : '')}
                  placeholder="30"
                  min="0"
                  max="99"
                  className="w-full text-2xl font-bold text-center py-3 border-b-2 border-gray-300 focus:border-amber-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
              <div className="flex gap-2 mt-2">
                {[20, 30, 40, 50].map((margin) => (
                  <button
                    key={margin}
                    onClick={() => setTargetMargin(margin)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      targetMargin === margin
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {margin}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 계산 결과 */}
        {result && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 shadow-lg text-white">
              <h3 className="text-lg font-bold mb-4 text-center">권장 판매가격</h3>
              <div className="bg-white/20 rounded-xl p-4 border-2 border-white/50">
                <div className="text-sm opacity-90 mb-1">최종 권장가격</div>
                <div className="text-3xl font-bold">{formatNumber(result.recommendedPrice)}원</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-center text-gray-800">손익 분석</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">총 원가</span>
                  <span className="text-sm font-bold text-gray-900">{formatNumber(result.totalCost)}원</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">예상 수익</span>
                  <span className="text-sm font-bold text-green-700">{formatNumber(result.profit)}원</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <span className="text-sm font-bold text-gray-800">실제 마진율</span>
                  <span className="text-sm font-bold text-blue-700">{result.actualMargin}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 안내 */}
        <div className="mt-6 bg-white/80 rounded-2xl p-4 shadow-lg">
          <p className="text-xs text-gray-600 text-center">
            💡 경쟁 가격과 시장 상황을 함께 고려하여 최종 가격을 결정하세요.
          </p>
        </div>
      </main>
    </div>
  );
}




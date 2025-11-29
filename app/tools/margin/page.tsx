'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function MarginCalculatorPage() {
  const router = useRouter();
  const [revenue, setRevenue] = useState<number | ''>('');
  const [cost, setCost] = useState<number | ''>('');
  const [fixedCost, setFixedCost] = useState<number | ''>('');

  const calculateMargin = () => {
    if (!revenue || revenue === 0) return null;

    const rev = Number(revenue);
    const c = Number(cost) || 0;
    const fc = Number(fixedCost) || 0;

    const totalCost = c + fc;
    const profit = rev - totalCost;
    const marginRate = rev > 0 ? (profit / rev) * 100 : 0;
    const breakEvenRevenue = fc > 0 && marginRate > 0 ? fc / (marginRate / 100) : 0;

    return {
      profit: Math.round(profit),
      marginRate: marginRate.toFixed(1),
      breakEven: Math.round(breakEvenRevenue),
    };
  };

  const result = calculateMargin();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pb-24">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-green-600 to-emerald-600 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp size={24} />
            <span>마진율 계산기</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="space-y-4">
            {/* 매출 입력 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                매출 (원)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value ? Number(e.target.value) : '')}
                  placeholder="1000000"
                  className="w-full text-3xl font-bold text-center py-4 border-b-2 border-gray-300 focus:border-green-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
            </div>

            {/* 원가 입력 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                원가/재료비 (원)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value ? Number(e.target.value) : '')}
                  placeholder="300000"
                  className="w-full text-2xl font-bold text-center py-3 border-b-2 border-gray-300 focus:border-green-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
            </div>

            {/* 고정비 입력 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                고정비 (월세, 인건비 등) (원)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={fixedCost}
                  onChange={(e) => setFixedCost(e.target.value ? Number(e.target.value) : '')}
                  placeholder="500000"
                  className="w-full text-2xl font-bold text-center py-3 border-b-2 border-gray-300 focus:border-green-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
            </div>
          </div>
        </div>

        {/* 계산 결과 */}
        {result && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 shadow-lg text-white">
              <h3 className="text-lg font-bold mb-4 text-center">계산 결과</h3>
              <div className="space-y-4">
                <div className="bg-white/20 rounded-xl p-4">
                  <div className="text-sm opacity-90 mb-1">순수익</div>
                  <div className="text-3xl font-bold">{formatNumber(result.profit)}원</div>
                </div>
                <div className="bg-white/30 rounded-xl p-4 border-2 border-white/50">
                  <div className="text-sm opacity-90 mb-1">마진율</div>
                  <div className="text-3xl font-bold">{result.marginRate}%</div>
                </div>
              </div>
            </div>

            {result.breakEven > 0 && (
              <div className="bg-blue-50 rounded-2xl p-6 shadow-lg border-2 border-blue-200">
                <div className="text-sm text-blue-700 font-semibold mb-1">손익분기점</div>
                <div className="text-2xl font-bold text-blue-900">
                  {formatNumber(result.breakEven)}원
                </div>
                <div className="text-xs text-blue-600 mt-2">
                  이 금액 이상 매출이어야 손익분기입니다
                </div>
              </div>
            )}
          </div>
        )}

        {/* 안내 */}
        <div className="mt-6 bg-white/80 rounded-2xl p-4 shadow-lg">
          <p className="text-xs text-gray-600 text-center">
            💡 마진율 = (순수익 / 매출) × 100
          </p>
        </div>
      </main>
    </div>
  );
}






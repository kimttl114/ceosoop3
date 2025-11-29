'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function RevenueTargetCalculatorPage() {
  const router = useRouter();
  const [targetProfit, setTargetProfit] = useState<number | ''>('');
  const [costRate, setCostRate] = useState<number | ''>(70); // 원가율
  const [fixedCost, setFixedCost] = useState<number | ''>('');

  const calculateRevenue = () => {
    if (!targetProfit || targetProfit === 0) return null;

    const profit = Number(targetProfit);
    const cost = Number(costRate) || 70;
    const fixed = Number(fixedCost) || 0;

    // 목표 수익 달성에 필요한 매출 = (고정비 + 목표수익) / (1 - 원가율)
    const marginRate = (100 - cost) / 100;
    const requiredRevenue = marginRate > 0 ? (fixed + profit) / marginRate : 0;
    const dailyRevenue = requiredRevenue / 30; // 월 매출을 일 매출로
    const weeklyRevenue = requiredRevenue / 4.3; // 월 매출을 주 매출로

    return {
      requiredRevenue: Math.round(requiredRevenue),
      dailyRevenue: Math.round(dailyRevenue),
      weeklyRevenue: Math.round(weeklyRevenue),
      marginRate: (100 - cost).toFixed(1),
    };
  };

  const result = calculateRevenue();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 pb-24">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-teal-600 to-cyan-600 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Target size={24} />
            <span>매출 목표 계산기</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="space-y-4">
            {/* 목표 수익 입력 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                목표 수익 (원/월)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={targetProfit}
                  onChange={(e) => setTargetProfit(e.target.value ? Number(e.target.value) : '')}
                  placeholder="5000000"
                  className="w-full text-3xl font-bold text-center py-4 border-b-2 border-gray-300 focus:border-teal-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
            </div>

            {/* 원가율 입력 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                원가율 (%) <span className="text-xs text-gray-400">(매출 대비)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={costRate}
                  onChange={(e) => setCostRate(e.target.value ? Number(e.target.value) : '')}
                  placeholder="70"
                  min="0"
                  max="99"
                  className="w-full text-2xl font-bold text-center py-3 border-b-2 border-gray-300 focus:border-teal-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>

            {/* 고정비 입력 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                고정비 (원/월) <span className="text-xs text-gray-400">(선택)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={fixedCost}
                  onChange={(e) => setFixedCost(e.target.value ? Number(e.target.value) : '')}
                  placeholder="2000000"
                  className="w-full text-2xl font-bold text-center py-3 border-b-2 border-gray-300 focus:border-teal-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
            </div>
          </div>
        </div>

        {/* 계산 결과 */}
        {result && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl p-6 shadow-lg text-white">
              <h3 className="text-lg font-bold mb-4 text-center">필요한 월 매출</h3>
              <div className="bg-white/20 rounded-xl p-4 border-2 border-white/50">
                <div className="text-sm opacity-90 mb-1">목표 달성에 필요한 매출</div>
                <div className="text-3xl font-bold">{formatNumber(result.requiredRevenue)}원</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-center text-gray-800">일일/주간 목표</h3>
              <div className="space-y-3">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-xs text-blue-600 mb-1">일일 매출 목표</div>
                  <div className="text-2xl font-bold text-blue-900">{formatNumber(result.dailyRevenue)}원</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-xs text-green-600 mb-1">주간 매출 목표</div>
                  <div className="text-2xl font-bold text-green-900">{formatNumber(result.weeklyRevenue)}원</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
                  <div className="text-xs text-gray-600 mb-1">마진율</div>
                  <div className="text-xl font-bold text-gray-900">{result.marginRate}%</div>
                </div>
              </div>
            </div>

            {/* 목표 달성 팁 */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 shadow-lg border-2 border-yellow-200">
              <h3 className="text-sm font-bold mb-3 text-gray-800">🎯 목표 달성 팁</h3>
              <ul className="space-y-2 text-xs text-gray-700">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>일일 목표를 세워 꾸준히 추적하세요</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>주간 단위로 목표 달성도를 확인하세요</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>목표 달성이 어렵다면 원가율을 재검토하세요</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* 안내 */}
        <div className="mt-6 bg-white/80 rounded-2xl p-4 shadow-lg">
          <p className="text-xs text-gray-600 text-center">
            💡 목표 수익 달성을 위해 필요한 매출을 계산하여 구체적인 목표를 세우세요.
          </p>
        </div>
      </main>
    </div>
  );
}






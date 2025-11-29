'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calculator } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function VatCalculatorPage() {
  const router = useRouter();
  const [amount, setAmount] = useState<number | ''>('');
  const [vatType, setVatType] = useState<'include' | 'exclude'>('exclude');

  const calculateVat = () => {
    if (!amount || amount === 0) return null;

    const amt = Number(amount);

    if (vatType === 'include') {
      // 부가세 포함 가격
      const supplyValue = Math.round(amt / 1.1);
      const vat = amt - supplyValue;
      return {
        supplyValue,
        vat: Math.round(vat),
        total: amt,
      };
    } else {
      // 부가세 제외 가격
      const supplyValue = amt;
      const vat = Math.round(amt * 0.1);
      const total = amt + vat;
      return {
        supplyValue,
        vat,
        total,
      };
    }
  };

  const result = calculateVat();

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
            <Calculator size={24} />
            <span>부가세 계산기</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="space-y-4">
            {/* 계산 타입 선택 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                계산 방식
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setVatType('exclude')}
                  className={`flex-1 py-3 rounded-xl font-semibold transition ${
                    vatType === 'exclude'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  부가세 별도
                </button>
                <button
                  onClick={() => setVatType('include')}
                  className={`flex-1 py-3 rounded-xl font-semibold transition ${
                    vatType === 'include'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  부가세 포함
                </button>
              </div>
            </div>

            {/* 금액 입력 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {vatType === 'exclude' ? '공급가액 (부가세 제외)' : '총액 (부가세 포함)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="1000000"
                  className="w-full text-3xl font-bold text-center py-4 border-b-2 border-gray-300 focus:border-purple-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
            </div>
          </div>
        </div>

        {/* 계산 결과 */}
        {result && (
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 shadow-lg text-white">
            <h3 className="text-lg font-bold mb-4 text-center">계산 결과</h3>
            <div className="space-y-4">
              <div className="bg-white/20 rounded-xl p-4">
                <div className="text-sm opacity-90 mb-1">공급가액</div>
                <div className="text-2xl font-bold">{formatNumber(result.supplyValue)}원</div>
              </div>
              <div className="bg-white/20 rounded-xl p-4">
                <div className="text-sm opacity-90 mb-1">부가세 (10%)</div>
                <div className="text-2xl font-bold">{formatNumber(result.vat)}원</div>
              </div>
              <div className="bg-white/30 rounded-xl p-4 border-2 border-white/50">
                <div className="text-sm opacity-90 mb-1">{vatType === 'exclude' ? '합계' : '총액'}</div>
                <div className="text-3xl font-bold">{formatNumber(result.total)}원</div>
              </div>
            </div>
          </div>
        )}

        {/* 안내 */}
        <div className="mt-6 bg-white/80 rounded-2xl p-4 shadow-lg">
          <p className="text-xs text-gray-600 text-center">
            💡 부가세는 10%를 기준으로 계산됩니다
          </p>
        </div>
      </main>
    </div>
  );
}






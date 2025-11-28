'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function LaborCostCalculatorPage() {
  const router = useRouter();
  const [monthlySalary, setMonthlySalary] = useState<number | ''>('');

  // 4대보험 계산 (2024년 기준)
  const calculateInsurance = (salary: number) => {
    // 건강보험료 (월급여액의 6.86%)
    const healthInsurance = Math.round(salary * 0.0686 / 2); // 본인 부담 50%
    
    // 고용보험료 (월급여액의 0.8%)
    const employmentInsurance = Math.round(salary * 0.008 / 2); // 본인 부담 50%
    
    // 산재보험료 (업종별 상이, 평균 0.6% 가정)
    const industrialAccident = Math.round(salary * 0.006);
    
    // 국민연금 (월급여액의 9%)
    const nationalPension = Math.round(salary * 0.09 / 2); // 본인 부담 50%
    
    return {
      healthInsurance,
      employmentInsurance,
      industrialAccident,
      nationalPension,
      totalInsurance: healthInsurance + employmentInsurance + industrialAccident + nationalPension,
      employeeInsurance: healthInsurance + employmentInsurance + nationalPension, // 근로자 부담분
      employerInsurance: healthInsurance + employmentInsurance + nationalPension + industrialAccident, // 사업주 부담분
    };
  };

  const result = monthlySalary ? calculateInsurance(Number(monthlySalary)) : null;
  const netSalary = monthlySalary && result ? Number(monthlySalary) - result.employeeInsurance : null;
  const totalCost = monthlySalary && result ? Number(monthlySalary) + (result.employerInsurance - result.employeeInsurance) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-24">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-indigo-600 to-purple-600 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={24} />
            <span>인건비 계산기</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="space-y-4">
            {/* 월급 입력 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                월 기본급 (원)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(e.target.value ? Number(e.target.value) : '')}
                  placeholder="3000000"
                  className="w-full text-3xl font-bold text-center py-4 border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
            </div>
          </div>
        </div>

        {/* 계산 결과 */}
        {result && (
          <div className="space-y-4">
            {/* 근로자 실지급액 */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl p-6 shadow-lg text-white">
              <h3 className="text-lg font-bold mb-4 text-center">근로자 실지급액</h3>
              <div className="bg-white/20 rounded-xl p-4 border-2 border-white/50">
                <div className="text-sm opacity-90 mb-1">세후 실지급액</div>
                <div className="text-3xl font-bold">{formatNumber(netSalary || 0)}원</div>
              </div>
            </div>

            {/* 사업주 총 인건비 */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 shadow-lg text-white">
              <h3 className="text-lg font-bold mb-4 text-center">사업주 총 인건비</h3>
              <div className="bg-white/20 rounded-xl p-4 border-2 border-white/50">
                <div className="text-sm opacity-90 mb-1">월 총 인건비 (4대보험 포함)</div>
                <div className="text-3xl font-bold">{formatNumber(totalCost || 0)}원</div>
              </div>
            </div>

            {/* 4대보험 상세 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-center text-gray-800">4대보험 상세 내역</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">건강보험</span>
                  <span className="text-sm font-bold text-blue-700">{formatNumber(result.healthInsurance)}원</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">국민연금</span>
                  <span className="text-sm font-bold text-green-700">{formatNumber(result.nationalPension)}원</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">고용보험</span>
                  <span className="text-sm font-bold text-yellow-700">{formatNumber(result.employmentInsurance)}원</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">산재보험</span>
                  <span className="text-sm font-bold text-red-700">{formatNumber(result.industrialAccident)}원</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <span className="text-sm font-bold text-gray-800">사업주 부담 합계</span>
                  <span className="text-sm font-bold text-gray-900">{formatNumber(result.employerInsurance)}원</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 안내 */}
        <div className="mt-6 bg-white/80 rounded-2xl p-4 shadow-lg">
          <p className="text-xs text-gray-600 text-center">
            💡 4대보험료는 업종과 소득구간에 따라 상이할 수 있습니다. 정확한 금액은 관할 고용센터에 문의하세요.
          </p>
        </div>
      </main>
    </div>
  );
}




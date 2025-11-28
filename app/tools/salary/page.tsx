'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calculator } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function SalaryCalculatorPage() {
  const router = useRouter();
  const [hourlyWage, setHourlyWage] = useState<number | ''>('');
  const [dailyHours, setDailyHours] = useState<number | ''>(8);
  const [weeklyDays, setWeeklyDays] = useState<number | ''>(5);

  const calculateSalary = () => {
    if (!hourlyWage || !dailyHours || !weeklyDays) return null;

    const hourly = Number(hourlyWage);
    const hours = Number(dailyHours);
    const days = Number(weeklyDays);

    const dailySalary = hourly * hours;
    const weeklySalary = dailySalary * days;
    const monthlySalary = weeklySalary * 4.3;

    return {
      daily: Math.round(dailySalary),
      weekly: Math.round(weeklySalary),
      monthly: Math.round(monthlySalary),
    };
  };

  const result = calculateSalary();

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
            <Calculator size={24} />
            <span>월급 계산기</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="space-y-4">
            {/* 시급 입력 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                시급 (원)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={hourlyWage}
                  onChange={(e) => setHourlyWage(e.target.value ? Number(e.target.value) : '')}
                  placeholder="10000"
                  className="w-full text-3xl font-bold text-center py-4 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
            </div>

            {/* 일 근무 시간 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                하루 근무 시간
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(e.target.value ? Number(e.target.value) : '')}
                  placeholder="8"
                  className="w-full text-2xl font-bold text-center py-3 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">시간</span>
              </div>
            </div>

            {/* 주 근무 일수 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                주 근무 일수
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={weeklyDays}
                  onChange={(e) => setWeeklyDays(e.target.value ? Number(e.target.value) : '')}
                  placeholder="5"
                  min="1"
                  max="7"
                  className="w-full text-2xl font-bold text-center py-3 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">일</span>
              </div>
            </div>
          </div>
        </div>

        {/* 계산 결과 */}
        {result && (
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 shadow-lg text-white">
            <h3 className="text-lg font-bold mb-4 text-center">계산 결과</h3>
            <div className="space-y-4">
              <div className="bg-white/20 rounded-xl p-4">
                <div className="text-sm opacity-90 mb-1">일급</div>
                <div className="text-2xl font-bold">{formatNumber(result.daily)}원</div>
              </div>
              <div className="bg-white/20 rounded-xl p-4">
                <div className="text-sm opacity-90 mb-1">주급</div>
                <div className="text-2xl font-bold">{formatNumber(result.weekly)}원</div>
              </div>
              <div className="bg-white/30 rounded-xl p-4 border-2 border-white/50">
                <div className="text-sm opacity-90 mb-1">월급 (4.3주 기준)</div>
                <div className="text-3xl font-bold">{formatNumber(result.monthly)}원</div>
              </div>
            </div>
          </div>
        )}

        {/* 안내 */}
        <div className="mt-6 bg-white/80 rounded-2xl p-4 shadow-lg">
          <p className="text-xs text-gray-600 text-center">
            💡 월급은 주 4.3주를 기준으로 계산됩니다
          </p>
        </div>
      </main>
    </div>
  );
}




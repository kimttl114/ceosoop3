'use client';

import { useEffect, useState, useRef, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import { Download, Share2, ArrowLeft, Loader2, Sparkles, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface Prophecy {
  threeMonths: string;
  sixMonths: string;
  oneYear: string;
  survivalChance: string;
  warning: string;
  opportunity: string;
}

interface DiagnosisResult {
  type: 'daily' | 'monthly';
  hourlyWage: number;
  marginRate: number;
  rank: string;
  rankTier?: number;
  closureRate?: number;
  toxicComment: string;
  solutions: string[];
  prophecy?: Prophecy;
  // 하루 진단 필드
  dailyRevenue?: number;
  dailyNetProfit?: number;
  dailyHours?: number;
  // 월 진단 필드
  monthlyRevenue?: number;
  monthlyNetProfit?: number;
  weeklyDays?: number;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  useEffect(() => {
    const type = searchParams.get('type') as 'daily' | 'monthly';
    
    // 하루 진단 파라미터 파싱
    if (type === 'daily') {
      const revenue = parseFloat(searchParams.get('revenue') || '0');
      const netProfit = parseFloat(searchParams.get('netProfit') || '0');
      const hours = parseFloat(searchParams.get('hours') || '0');

      if (!revenue || !netProfit || !hours) {
        router.push('/diagnose');
        return;
      }

      // API 호출
      fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'daily',
          revenue,
          netProfit,
          hours,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || '진단 중 오류가 발생했습니다.');
          }
          return res.json();
        })
        .then((data) => {
          if (data.error) {
            throw new Error(data.error);
          }
          setResult(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error:', error);
          alert(error.message || '진단 중 오류가 발생했습니다.');
          router.push('/diagnose');
        });
    } 
    // 월 진단 파라미터 파싱
    else {
      const monthlyRevenue = parseFloat(searchParams.get('monthlyRevenue') || '0');
      const netProfit = parseFloat(searchParams.get('netProfit') || '0');
      const dailyHours = parseFloat(searchParams.get('dailyHours') || '0');
      const weeklyDays = parseFloat(searchParams.get('weeklyDays') || '0');

      if (!monthlyRevenue || !netProfit || !dailyHours || !weeklyDays) {
        router.push('/diagnose');
        return;
      }

      // API 호출
      fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'monthly',
          monthlyRevenue,
          netProfit,
          dailyHours,
          weeklyDays,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || '진단 중 오류가 발생했습니다.');
          }
          return res.json();
        })
        .then((data) => {
          if (data.error) {
            throw new Error(data.error);
          }
          setResult(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error:', error);
          alert(error.message || '진단 중 오류가 발생했습니다.');
          router.push('/diagnose');
        });
    }
  }, [searchParams, router]);

  // 고정된 바코드 패턴
  const barcodeWidths = useMemo(() => {
    return [3, 2, 4, 2, 3, 1, 4, 2, 3, 2, 4, 1, 3, 2, 4, 2, 3, 1, 4, 2, 3, 2, 4, 1, 3, 2, 4, 2, 3, 1, 4, 2, 3, 2, 4, 1, 3, 2, 4, 2];
  }, []);

  const handleDownload = async () => {
    if (!receiptRef.current) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      const link = document.createElement('a');
      const typeLabel = result?.type === 'daily' ? '하루' : '월';
      link.download = `자영업-생존-성적표-${typeLabel}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Download error:', error);
      alert('이미지 저장 중 오류가 발생했습니다.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">진단 결과를 생성하고 있습니다...</p>
        </div>
      </div>
    );
  }

  const isDaily = result.type === 'daily';
  const currentDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 하루 진단 데이터
  const dailyRevenue = result.dailyRevenue || 0;
  const dailyNetProfit = result.dailyNetProfit || 0;
  const dailyHours = result.dailyHours || 0;
  const dailyFixedCost = (dailyRevenue * 10000) - (dailyNetProfit * 10000);

  // 월 진단 데이터
  const monthlyRevenue = result.monthlyRevenue || 0;
  const monthlyNetProfit = result.monthlyNetProfit || 0;
  const monthlyFixedCost = (monthlyRevenue * 10000) - (monthlyNetProfit * 10000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* 영수증 */}
        <div
          ref={receiptRef}
          className="bg-white p-8 rounded-lg shadow-lg font-mono receipt-jagged"
          style={{ maxWidth: '400px', margin: '0 auto' }}
        >
          {/* 상단 헤더 */}
          <div className="text-center mb-6 pb-4 border-b-2 border-dashed border-gray-400">
            <h1 className="text-2xl font-bold mb-2">*** 자영업 생존 성적표 ***</h1>
            <p className="text-xs text-gray-600">
              {isDaily ? 'DAILY SURVIVAL REPORT' : 'MONTHLY SURVIVAL REPORT'}
            </p>
            {isDaily && (
              <p className="text-xs text-indigo-600 font-semibold mt-1">하루 진단</p>
            )}
          </div>

          {/* 항목들 */}
          <div className="space-y-4 mb-6">
            {isDaily ? (
              <>
                <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                  <span className="text-sm">일 매출</span>
                  <span className="text-lg font-semibold">{formatNumber(dailyRevenue)}만원</span>
                </div>
                
                {dailyFixedCost > 0 && (
                  <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                    <span className="text-sm">일 고정비용</span>
                    <span className="text-lg font-semibold">{formatNumber(Math.round(dailyFixedCost / 10000))}만원</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center border-b-2 border-gray-800 pb-2">
                  <span className="text-sm">일 순수익</span>
                  <span className="text-lg font-semibold">{formatNumber(dailyNetProfit)}만원</span>
                </div>

                <div className="pt-4 pb-2 border-t-2 border-gray-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">사장님 시급</span>
                    <span className="text-2xl font-bold text-red-600">
                      {formatNumber(result.hourlyWage)}원
                    </span>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-xs text-gray-500">
                      (마진율: {result.marginRate.toFixed(1)}% | 근무: {dailyHours}시간)
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                  <span className="text-sm">월 매출</span>
                  <span className="text-lg font-semibold">{formatNumber(monthlyRevenue)}만원</span>
                </div>
                
                <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                  <span className="text-sm">고정비용</span>
                  <span className="text-lg font-semibold">{formatNumber(Math.round(monthlyFixedCost / 10000))}만원</span>
                </div>
                
                <div className="flex justify-between items-center border-b-2 border-gray-800 pb-2">
                  <span className="text-sm">순수익</span>
                  <span className="text-lg font-semibold">{formatNumber(monthlyNetProfit)}만원</span>
                </div>

                <div className="pt-4 pb-2 border-t-2 border-gray-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">사장님 시급</span>
                    <span className="text-2xl font-bold text-red-600">
                      {formatNumber(result.hourlyWage)}원
                    </span>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-xs text-gray-500">
                      (마진율: {result.marginRate.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 분석 섹션 */}
          <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-400">
            <div className="mb-4">
              <div className="text-xs text-gray-600 mb-1">내 계급</div>
              <div className="text-xl font-bold">{result.rank}</div>
              <div className="text-xs text-gray-500 mt-1">
                시급: {formatNumber(result.hourlyWage)}원
              </div>
            </div>

            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500">
              <div className="text-xs text-gray-600 mb-1">AI 독설</div>
              <div className="text-sm font-semibold text-red-700">{result.toxicComment}</div>
            </div>

            <div className="mb-4">
              <div className="text-xs text-gray-600 mb-2">지금 당장 해야 할 것</div>
              <ul className="space-y-1">
                {result.solutions.map((solution, index) => (
                  <li key={index} className="text-sm flex items-start">
                    <span className="mr-2">{(index + 1)}.</span>
                    <span>{solution}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 폐업률 표시 */}
            {result.closureRate !== undefined && (
              <div className="mt-4 p-3 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded">
                <div className="text-xs text-gray-600 mb-1">예상 폐업률</div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-red-700">{result.closureRate.toFixed(1)}%</span>
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                      style={{ width: `${Math.min(result.closureRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 하단 */}
          <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-400">
            {/* 바코드 */}
            <div className="flex justify-center mb-4">
              <div className="flex gap-1">
                {barcodeWidths.map((width, i) => (
                  <div
                    key={i}
                    className="bg-black"
                    style={{
                      width: `${width}px`,
                      height: '40px',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="text-center text-xs text-gray-500">
              <p>발급일: {currentDate}</p>
              <p className="mt-1">www.자영업생존키트.kr</p>
            </div>
          </div>
        </div>

        {/* 미래 예언 섹션 */}
        {result.prophecy && (
          <div className="mt-6 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-2xl shadow-xl p-6 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-800">🔮 미래 예언</h2>
            </div>

            <div className="space-y-4">
              {/* 3개월 후 */}
              <div className="bg-white/70 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-purple-700">3개월 후</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{result.prophecy.threeMonths}</p>
              </div>

              {/* 6개월 후 */}
              <div className="bg-white/70 rounded-lg p-4 border border-indigo-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-indigo-700">6개월 후</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{result.prophecy.sixMonths}</p>
              </div>

              {/* 1년 후 */}
              <div className="bg-white/70 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-blue-700">1년 후</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{result.prophecy.oneYear}</p>
              </div>

              {/* 생존 확률 */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-bold text-green-700">생존 확률</span>
                </div>
                <p className="text-sm text-gray-700">{result.prophecy.survivalChance}</p>
              </div>

              {/* 경고 */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border-l-4 border-red-500">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-bold text-red-700">⚠️ 경고</span>
                </div>
                <p className="text-sm text-gray-700">{result.prophecy.warning}</p>
              </div>

              {/* 기회 */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4 border-l-4 border-amber-500">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-700">💡 기회 포인트</span>
                </div>
                <p className="text-sm text-gray-700">{result.prophecy.opportunity}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-purple-200 text-center">
              <p className="text-xs text-gray-500 italic">* 예언은 현재 데이터를 기반으로 한 예측입니다. 실제 결과는 달라질 수 있습니다.</p>
            </div>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                영수증 이미지 저장
              </>
            )}
          </button>

          <button
            onClick={() => {
              const typeLabel = isDaily ? '오늘 하루' : '이번 달';
              const text = `내 자영업 생존 성적표 (${typeLabel})\n시급: ${formatNumber(result.hourlyWage)}원\n계급: ${result.rank}\n\n${result.toxicComment}`;
              const url = window.location.href;
              navigator.share?.({
                title: '자영업 생존 성적표',
                text,
                url,
              }).catch(() => {
                navigator.clipboard.writeText(`${text}\n${url}`);
                alert('링크가 클립보드에 복사되었습니다!');
              });
            }}
            className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            공유하기
          </button>

          <a
            href="https://ceosoop33.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors text-center"
          >
            이 영수증 들고 커뮤니티 가기 →
          </a>

          <button
            onClick={() => router.push('/diagnose')}
            className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            다시 진단하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}

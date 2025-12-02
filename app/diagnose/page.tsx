'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Calendar, Sun, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

type DiagnosisType = 'daily' | 'monthly';

interface FormData {
  diagnosisType?: DiagnosisType;
  // 하루 진단 필드
  dailyRevenue?: number;
  dailyNetProfit?: number;
  dailyHours: number;
  dailyKnowsNetProfit: boolean;
  dailyFixedCost?: number;
  dailyCostRate: number;
  dailyCommissionRate: number;
  // 월 진단 필드
  monthlyRevenue?: number;
  monthlyNetProfit?: number;
  monthlyDailyHours: number;
  monthlyWeeklyDays: number;
  monthlyKnowsNetProfit: boolean;
  monthlyFixedCost?: number;
  monthlyCostRate: number;
  monthlyCommissionRate: number;
}

const STEPS = {
  TYPE_SELECT: 0,
  REVENUE: 1,
  NET_PROFIT: 2,
  WORK_HOURS: 3,
} as const;

export default function DiagnosePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // useForm Hook은 항상 최상위에서 호출되어야 함 (Hook 규칙 준수)
  const { control, handleSubmit, watch, setValue, resetField, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      diagnosisType: undefined as DiagnosisType | undefined,
      // 하루 진단 기본값
      dailyRevenue: undefined,
      dailyNetProfit: undefined,
      dailyHours: 8,
      dailyKnowsNetProfit: false,
      dailyFixedCost: undefined,
      dailyCostRate: 35,
      dailyCommissionRate: 10,
      // 월 진단 기본값
      monthlyRevenue: undefined,
      monthlyNetProfit: undefined,
      monthlyDailyHours: 8,
      monthlyWeeklyDays: 5,
      monthlyKnowsNetProfit: false,
      monthlyFixedCost: undefined,
      monthlyCostRate: 35,
      monthlyCommissionRate: 10,
    },
  });

  // 로그인 체크
  useEffect(() => {
    if (!auth) {
      setLoadingAuth(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router]);

  const diagnosisType = watch('diagnosisType');
  const dailyRevenue = watch('dailyRevenue');
  const dailyNetProfit = watch('dailyNetProfit');
  const dailyFixedCost = watch('dailyFixedCost');
  const dailyCostRate = watch('dailyCostRate');
  const dailyCommissionRate = watch('dailyCommissionRate');
  const dailyKnowsNetProfit = watch('dailyKnowsNetProfit');
  
  const monthlyRevenue = watch('monthlyRevenue');
  const monthlyNetProfit = watch('monthlyNetProfit');
  const monthlyFixedCost = watch('monthlyFixedCost');
  const monthlyCostRate = watch('monthlyCostRate');
  const monthlyCommissionRate = watch('monthlyCommissionRate');
  const monthlyKnowsNetProfit = watch('monthlyKnowsNetProfit');

  // 하루 진단 예상 순수익 계산
  const estimatedDailyNetProfit = dailyKnowsNetProfit ? 0 : 
    (dailyRevenue ? 
      Math.max(0, (dailyRevenue * 10000) - ((dailyFixedCost || 0) * 10000) - 
        ((dailyRevenue * 10000) * dailyCostRate / 100) - 
        ((dailyRevenue * 10000) * dailyCommissionRate / 100)) / 10000 : 0);

  // 월 진단 예상 순수익 계산
  const estimatedMonthlyNetProfit = monthlyKnowsNetProfit ? 0 : 
    (monthlyRevenue ? 
      Math.max(0, (monthlyRevenue * 10000) - ((monthlyFixedCost || 0) * 10000) - 
        ((monthlyRevenue * 10000) * monthlyCostRate / 100) - 
        ((monthlyRevenue * 10000) * monthlyCommissionRate / 100)) / 10000 : 0);

  const onSubmit = async (data: FormData) => {
    if (!data.diagnosisType) {
      alert('진단 타입을 선택해주세요.')
      return
    }
    
    setIsLoading(true);
    try {
      if (data.diagnosisType === 'daily') {
        const netProfit = data.dailyKnowsNetProfit 
          ? (data.dailyNetProfit || 0)
          : estimatedDailyNetProfit;

        const params = new URLSearchParams({
          type: 'daily',
          revenue: (data.dailyRevenue || 0).toString(),
          netProfit: (netProfit || 0).toString(),
          hours: data.dailyHours.toString(),
        });

        router.push(`/result?${params.toString()}`);
      } else {
        const netProfit = data.monthlyKnowsNetProfit 
          ? (data.monthlyNetProfit || 0)
          : estimatedMonthlyNetProfit;

        const params = new URLSearchParams({
          type: 'monthly',
          monthlyRevenue: ((data.monthlyRevenue ?? 0) || 0).toString(),
          netProfit: (netProfit || 0).toString(),
          dailyHours: (data.monthlyDailyHours || 8).toString(),
          weeklyDays: (data.monthlyWeeklyDays || 5).toString(),
        });

        router.push(`/result?${params.toString()}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < Object.keys(STEPS).length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 로딩 중 표시
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  // 로그인하지 않은 경우 (리다이렉트 중)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-24">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-600 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="mb-3 p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-white mb-2">
            사장 시급판독기
          </h1>
          <p className="text-sm text-white/90">
            AI가 내 시급에 따라 조언해드립니다.
          </p>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-md mx-auto px-4 py-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {/* 진단 타입 선택 */}
            {currentStep === STEPS.TYPE_SELECT && (
              <motion.div
                key="typeSelect"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <h2 className="text-xl font-bold mb-6 text-gray-800 text-center">
                  어떤 진단을 원하시나요?
                </h2>
                
                <div className="space-y-4">
                  <Controller
                    name="diagnosisType"
                    control={control}
                    rules={{ required: '진단 타입을 선택해주세요.' }}
                    render={({ field }) => (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange('daily');
                            nextStep();
                          }}
                          className={cn(
                            "w-full p-6 rounded-xl border-2 transition-all text-left",
                            field.value === 'daily'
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center",
                              field.value === 'daily' ? "bg-indigo-500" : "bg-gray-200"
                            )}>
                              <Sun className={cn(
                                "w-6 h-6",
                                field.value === 'daily' ? "text-white" : "text-gray-500"
                              )} />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-800 mb-1">하루 진단</h3>
                              <p className="text-sm text-gray-600">오늘 하루 매출과 수익으로 시급 계산</p>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            field.onChange('monthly');
                            nextStep();
                          }}
                          className={cn(
                            "w-full p-6 rounded-xl border-2 transition-all text-left",
                            field.value === 'monthly'
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center",
                              field.value === 'monthly' ? "bg-indigo-500" : "bg-gray-200"
                            )}>
                              <Calendar className={cn(
                                "w-6 h-6",
                                field.value === 'monthly' ? "text-white" : "text-gray-500"
                              )} />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-800 mb-1">월 진단</h3>
                              <p className="text-sm text-gray-600">이번 달 전체 매출과 수익으로 시급 계산</p>
                            </div>
                          </div>
                        </button>
                      </>
                    )}
                  />
                </div>
              </motion.div>
            )}

            {/* 매출 입력 - 하루 진단 */}
            {currentStep === STEPS.REVENUE && diagnosisType === 'daily' && (
              <motion.div
                key="dailyRevenue"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                  사장님, 오늘 얼마 파셨나요?
                </h2>
                <Controller
                  name="dailyRevenue"
                  control={control}
                  rules={{ 
                    required: '매출을 입력해주세요.',
                    min: { value: 1, message: '1만원 이상 입력해주세요.' }
                  }}
                  render={({ field }) => (
                    <div>
                      <div className="relative">
                        <input
                          {...field}
                          type="number"
                          placeholder=""
                          value={field.value || ''}
                          className={cn(
                            "w-full text-4xl font-bold text-center py-4 border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none",
                            errors.dailyRevenue && "border-red-500"
                          )}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                          만원
                        </span>
                      </div>
                      {errors.dailyRevenue && (
                        <p className="text-red-500 text-sm mt-2">{errors.dailyRevenue.message}</p>
                      )}
                    </div>
                  )}
                />
                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!dailyRevenue || dailyRevenue <= 0 || dailyRevenue === undefined}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    다음
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* 매출 입력 - 월 진단 */}
            {currentStep === STEPS.REVENUE && diagnosisType === 'monthly' && (
              <motion.div
                key="monthlyRevenue"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                  사장님, 이번 달 얼마 파셨나요?
                </h2>
                <Controller
                  name="monthlyRevenue"
                  control={control}
                  rules={{ 
                    required: '매출을 입력해주세요.',
                    min: { value: 1, message: '1만원 이상 입력해주세요.' }
                  }}
                  render={({ field }) => (
                    <div>
                      <div className="relative">
                        <input
                          {...field}
                          type="number"
                          placeholder=""
                          value={field.value || ''}
                          className={cn(
                            "w-full text-4xl font-bold text-center py-4 border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none",
                            errors.monthlyRevenue && "border-red-500"
                          )}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                          만원
                        </span>
                      </div>
                      {errors.monthlyRevenue && (
                        <p className="text-red-500 text-sm mt-2">{errors.monthlyRevenue.message}</p>
                      )}
                    </div>
                  )}
                />
                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!monthlyRevenue || monthlyRevenue <= 0 || monthlyRevenue === undefined}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    다음
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* 순수익 입력 - 하루 진단 */}
            {currentStep === STEPS.NET_PROFIT && diagnosisType === 'daily' && (
              <motion.div
                key="dailyNetProfit"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                  오늘 순수익이 얼마인지 정확히 아시나요?
                </h2>
                
                <div className="flex gap-4 mb-8">
                  <Controller
                    name="dailyKnowsNetProfit"
                    control={control}
                    render={({ field }) => (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange(true);
                            resetField('dailyFixedCost');
                            setValue('dailyCostRate', 35);
                            setValue('dailyCommissionRate', 10);
                          }}
                          className={cn(
                            "flex-1 py-4 rounded-xl font-semibold transition-colors",
                            field.value === true
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          )}
                        >
                          네
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange(false);
                            resetField('dailyNetProfit');
                          }}
                          className={cn(
                            "flex-1 py-4 rounded-xl font-semibold transition-colors",
                            field.value === false
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          )}
                        >
                          아니요
                        </button>
                      </>
                    )}
                  />
                </div>

                <AnimatePresence mode="wait">
                  {dailyKnowsNetProfit ? (
                    <motion.div
                      key="direct"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-lg font-semibold mb-3">
                        오늘 통장에 꽂힌 돈이 얼마인가요?
                      </label>
                      <Controller
                        name="dailyNetProfit"
                        control={control}
                        rules={{ 
                          required: '순수익을 입력해주세요.',
                          min: { value: 0, message: '0 이상 입력해주세요.' }
                        }}
                        render={({ field }) => (
                          <div>
                            <div className="relative">
                              <input
                                {...field}
                                type="number"
                                placeholder=""
                                value={field.value || ''}
                                className={cn(
                                  "w-full text-3xl font-bold text-center py-4 border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none",
                                  errors.dailyNetProfit && "border-red-500"
                                )}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                                만원
                              </span>
                            </div>
                            {errors.dailyNetProfit && (
                              <p className="text-red-500 text-sm mt-2">{errors.dailyNetProfit.message}</p>
                            )}
                          </div>
                        )}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="auto"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className="block text-lg font-semibold mb-3">
                          오늘 고정비(인건비 등)는 얼마인가요?
                        </label>
                        <Controller
                          name="dailyFixedCost"
                          control={control}
                          rules={{ min: { value: 0, message: '0 이상 입력해주세요.' } }}
                          render={({ field }) => (
                            <div>
                              <div className="relative">
                                <input
                                  {...field}
                                  type="number"
                                  placeholder=""
                                  value={field.value || ''}
                                  className="w-full text-2xl font-bold text-center py-3 border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none"
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">
                                  만원
                                </span>
                              </div>
                            </div>
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-lg font-semibold mb-3">
                          재료비/원가율은요? ({dailyCostRate}%)
                        </label>
                        <Controller
                          name="dailyCostRate"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="range"
                              min="0"
                              max="100"
                              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-lg font-semibold mb-3">
                          배달/수수료 비중은요? ({dailyCommissionRate}%)
                        </label>
                        <Controller
                          name="dailyCommissionRate"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="range"
                              min="0"
                              max="50"
                              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          )}
                        />
                      </div>

                      {estimatedDailyNetProfit > 0 && (
                        <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
                          <p className="text-sm text-gray-600 mb-1">예상 순수익</p>
                          <p className="text-3xl font-bold text-indigo-600">
                            {estimatedDailyNetProfit.toFixed(1)}만원
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={
                      (dailyKnowsNetProfit && (!dailyNetProfit || dailyNetProfit <= 0)) ||
                      (!dailyKnowsNetProfit && (estimatedDailyNetProfit <= 0 || !dailyRevenue || dailyRevenue <= 0))
                    }
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    다음
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* 순수익 입력 - 월 진단 (기존 로직) */}
            {currentStep === STEPS.NET_PROFIT && diagnosisType === 'monthly' && (
              <motion.div
                key="monthlyNetProfit"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                  순수익이 얼마인지 정확히 아시나요?
                </h2>
                
                <div className="flex gap-4 mb-8">
                  <Controller
                    name="monthlyKnowsNetProfit"
                    control={control}
                    render={({ field }) => (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange(true);
                            resetField('monthlyFixedCost');
                            setValue('monthlyCostRate', 35);
                            setValue('monthlyCommissionRate', 10);
                          }}
                          className={cn(
                            "flex-1 py-4 rounded-xl font-semibold transition-colors",
                            field.value === true
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          )}
                        >
                          네
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange(false);
                            resetField('monthlyNetProfit');
                          }}
                          className={cn(
                            "flex-1 py-4 rounded-xl font-semibold transition-colors",
                            field.value === false
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          )}
                        >
                          아니요
                        </button>
                      </>
                    )}
                  />
                </div>

                <AnimatePresence mode="wait">
                  {monthlyKnowsNetProfit ? (
                    <motion.div
                      key="direct"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-lg font-semibold mb-3">
                        통장에 꽂힌 돈이 얼마인가요?
                      </label>
                      <Controller
                        name="monthlyNetProfit"
                        control={control}
                        rules={{ 
                          required: '순수익을 입력해주세요.',
                          min: { value: 0, message: '0 이상 입력해주세요.' }
                        }}
                        render={({ field }) => (
                          <div>
                            <div className="relative">
                              <input
                                {...field}
                                type="number"
                                placeholder=""
                                value={field.value || ''}
                                className={cn(
                                  "w-full text-3xl font-bold text-center py-4 border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none",
                                  errors.monthlyNetProfit && "border-red-500"
                                )}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                                만원
                              </span>
                            </div>
                            {errors.monthlyNetProfit && (
                              <p className="text-red-500 text-sm mt-2">{errors.monthlyNetProfit.message}</p>
                            )}
                          </div>
                        )}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="auto"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className="block text-lg font-semibold mb-3">
                          고정비(월세+인건비 등)는 얼마인가요?
                        </label>
                        <Controller
                          name="monthlyFixedCost"
                          control={control}
                          rules={{ min: { value: 0, message: '0 이상 입력해주세요.' } }}
                          render={({ field }) => (
                            <div>
                              <div className="relative">
                                <input
                                  {...field}
                                  type="number"
                                  placeholder=""
                                  value={field.value || ''}
                                  className="w-full text-2xl font-bold text-center py-3 border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none"
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">
                                  만원
                                </span>
                              </div>
                            </div>
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-lg font-semibold mb-3">
                          재료비/원가율은요? ({monthlyCostRate}%)
                        </label>
                        <Controller
                          name="monthlyCostRate"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="range"
                              min="0"
                              max="100"
                              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-lg font-semibold mb-3">
                          배달/수수료 비중은요? ({monthlyCommissionRate}%)
                        </label>
                        <Controller
                          name="monthlyCommissionRate"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="range"
                              min="0"
                              max="50"
                              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          )}
                        />
                      </div>

                      {estimatedMonthlyNetProfit > 0 && (
                        <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
                          <p className="text-sm text-gray-600 mb-1">예상 순수익</p>
                          <p className="text-3xl font-bold text-indigo-600">
                            {estimatedMonthlyNetProfit.toFixed(1)}만원
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={
                      (monthlyKnowsNetProfit && (!monthlyNetProfit || monthlyNetProfit <= 0)) ||
                      (!monthlyKnowsNetProfit && (estimatedMonthlyNetProfit <= 0 || !monthlyRevenue || monthlyRevenue <= 0))
                    }
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    다음
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* 근무 시간 입력 - 하루 진단 */}
            {currentStep === STEPS.WORK_HOURS && diagnosisType === 'daily' && (
              <motion.div
                key="dailyWorkHours"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                  오늘 몇 시간 일하셨나요?
                </h2>
                
                <Controller
                  name="dailyHours"
                  control={control}
                  rules={{ 
                    required: '근무 시간을 입력해주세요.',
                    min: { value: 1, message: '1시간 이상 입력해주세요.' },
                    max: { value: 24, message: '24시간 이하로 입력해주세요.' }
                  }}
                  render={({ field }) => (
                    <div>
                      <div className="relative">
                        <input
                          {...field}
                          type="number"
                          placeholder="8"
                          className={cn(
                            "w-full text-4xl font-bold text-center py-4 border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none",
                            errors.dailyHours && "border-red-500"
                          )}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                          시간
                        </span>
                      </div>
                      {errors.dailyHours && (
                        <p className="text-red-500 text-sm mt-2">{errors.dailyHours.message}</p>
                      )}
                    </div>
                  )}
                />

                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    이전
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? '처리 중...' : '진단 결과 영수증 뽑기'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* 근무 시간 입력 - 월 진단 (기존 로직) */}
            {currentStep === STEPS.WORK_HOURS && diagnosisType === 'monthly' && (
              <motion.div
                key="monthlyWorkHours"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                  하루 몇 시간, 주 며칠 일하세요?
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-semibold mb-3">
                      하루 근무 시간
                    </label>
                    <Controller
                      name="monthlyDailyHours"
                      control={control}
                      rules={{ 
                        required: '근무 시간을 입력해주세요.',
                        min: { value: 1, message: '1시간 이상 입력해주세요.' },
                        max: { value: 24, message: '24시간 이하로 입력해주세요.' }
                      }}
                      render={({ field }) => (
                        <div>
                          <div className="relative">
                            <input
                              {...field}
                              type="number"
                              placeholder="8"
                              className={cn(
                                "w-full text-3xl font-bold text-center py-4 border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none",
                                errors.monthlyDailyHours && "border-red-500"
                              )}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                              시간
                            </span>
                          </div>
                          {errors.monthlyDailyHours && (
                            <p className="text-red-500 text-sm mt-2">{errors.monthlyDailyHours.message}</p>
                          )}
                        </div>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-semibold mb-3">
                      주 근무 일수
                    </label>
                    <Controller
                      name="monthlyWeeklyDays"
                      control={control}
                      rules={{ 
                        required: '근무 일수를 입력해주세요.',
                        min: { value: 1, message: '1일 이상 입력해주세요.' },
                        max: { value: 7, message: '7일 이하로 입력해주세요.' }
                      }}
                      render={({ field }) => (
                        <div>
                          <div className="relative">
                            <input
                              {...field}
                              type="number"
                              placeholder="5"
                              className={cn(
                                "w-full text-3xl font-bold text-center py-4 border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none",
                                errors.monthlyWeeklyDays && "border-red-500"
                              )}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                              일
                            </span>
                          </div>
                          {errors.monthlyWeeklyDays && (
                            <p className="text-red-500 text-sm mt-2">{errors.monthlyWeeklyDays.message}</p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    이전
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? '처리 중...' : '진단 결과 영수증 뽑기'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}

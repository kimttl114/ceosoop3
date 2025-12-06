'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Calculator, FileText, TrendingUp, Users, Percent, DollarSign, Sparkles, MessageCircle, Brain, ShoppingBag, Mic, Shield } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const tools = [
  {
    id: 'id-check',
    title: '🚨 미성년자 출입 방어기',
    description: '신분증 나이 확인 (영업정지 방지)',
    icon: Shield,
    color: 'from-red-500 to-orange-500',
    route: '/tools/id-check',
    available: true,
  },
  {
    id: 'wifi-qr',
    title: '📶 매장 와이파이 QR',
    description: 'QR 코드로 자동 연결 포스터 제작',
    icon: Sparkles,
    color: 'from-blue-500 to-indigo-600',
    route: '/tools/wifi-qr',
    available: true,
  },
  {
    id: 'salary',
    title: '월급 계산기',
    description: '시급/일급/월급 빠르게 계산',
    icon: Calculator,
    color: 'from-blue-500 to-cyan-500',
    route: '/tools/salary',
    available: true,
  },
  {
    id: 'margin',
    title: '마진율 계산기',
    description: '손익분기점 자동 계산',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-500',
    route: '/tools/margin',
    available: true,
  },
  {
    id: 'vat',
    title: '부가세 계산기',
    description: '부가세 빠르게 계산',
    icon: Calculator,
    color: 'from-purple-500 to-pink-500',
    route: '/tools/vat',
    available: true,
  },
  {
    id: 'labor',
    title: '인건비 계산기',
    description: '4대보험 포함 실지급액 계산',
    icon: Users,
    color: 'from-indigo-500 to-purple-500',
    route: '/tools/labor',
    available: true,
  },
  {
    id: 'pricing',
    title: '가격 책정 도우미',
    description: '원가 기반 최적 가격 제안',
    icon: DollarSign,
    color: 'from-amber-500 to-orange-500',
    route: '/tools/pricing',
    available: true,
  },
  {
    id: 'discount',
    title: '할인율 계산기',
    description: '할인 후 가격과 손익 분석',
    icon: Percent,
    color: 'from-rose-500 to-pink-500',
    route: '/tools/discount',
    available: true,
  },
  {
    id: 'document',
    title: '문서 생성기',
    description: '근로계약서, 임대차계약서 등',
    icon: FileText,
    color: 'from-orange-500 to-red-500',
    route: '/ai-document',
    available: true,
  },
  {
    id: 'announcement',
    title: '안내방송 생성기',
    description: '매장 안내방송 자동 제작',
    icon: Mic,
    color: 'from-purple-500 to-indigo-500',
    route: '/tools/announcement',
    available: true,
  },
];

const aiTools = [
  {
    id: 'ai-marketing',
    title: 'AI 마케팅 문구',
    description: 'SNS/전단지용 문구 자동 생성',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    route: '/tools/ai-marketing',
    available: true,
  },
  {
    id: 'ai-customer-service',
    title: 'AI 고객 대응',
    description: '고객 불만 대응 가이드 생성',
    icon: MessageCircle,
    color: 'from-blue-500 to-cyan-500',
    route: '/tools/ai-customer-service',
    available: true,
  },
  {
    id: 'ai-pricing',
    title: 'AI 가격 조언',
    description: '최적 가격대 및 전략 제안',
    icon: Brain,
    color: 'from-amber-500 to-orange-500',
    route: '/tools/ai-pricing',
    available: true,
  },
];

export default function ToolsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen pb-24 relative z-10">
      {/* 블러 모핑 배경 */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
      
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-blue-600 to-indigo-600 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator size={24} />
            <span>도구존</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6 relative z-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">🛠️ 실용 도구 모음</h2>
          <p className="text-gray-600 text-sm">업무에 바로 쓸 수 있는 도구들</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {tool.available ? (
                  <Link
                    href={tool.route}
                    className={`block bg-gradient-to-br ${tool.color} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition transform hover:scale-105`}
                  >
                    <div className="text-3xl mb-2 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-sm font-bold mb-1">{tool.title}</div>
                    <div className="text-xs opacity-90">{tool.description}</div>
                  </Link>
                ) : (
                  <div className={`block bg-gradient-to-br ${tool.color} rounded-2xl p-5 text-white shadow-lg opacity-60 relative`}>
                    <div className="text-3xl mb-2 flex items-center justify-center opacity-50">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-sm font-bold mb-1">{tool.title}</div>
                    <div className="text-xs opacity-90">{tool.description}</div>
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 text-xs font-semibold text-white/80 bg-white/20 rounded-full">
                        준비중
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* AI 도구 섹션 */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Sparkles className="text-purple-600" size={24} />
              <span>🤖 AI 도구</span>
            </h2>
            <p className="text-gray-600 text-sm">AI가 도와주는 스마트한 비즈니스 도구</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {aiTools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (tools.length + index) * 0.1 }}
                >
                  {tool.available ? (
                    <Link
                      href={tool.route}
                      className={`block bg-gradient-to-br ${tool.color} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition transform hover:scale-105 relative overflow-hidden`}
                    >
                      {/* AI 배지 */}
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 text-xs font-bold text-white bg-white/20 rounded-full backdrop-blur-sm">
                          AI
                        </span>
                      </div>
                      <div className="text-3xl mb-2 flex items-center justify-center">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-sm font-bold mb-1">{tool.title}</div>
                      <div className="text-xs opacity-90">{tool.description}</div>
                    </Link>
                  ) : (
                    <div className={`block bg-gradient-to-br ${tool.color} rounded-2xl p-5 text-white shadow-lg opacity-60 relative`}>
                      <div className="text-3xl mb-2 flex items-center justify-center opacity-50">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-sm font-bold mb-1">{tool.title}</div>
                      <div className="text-xs opacity-90">{tool.description}</div>
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 text-xs font-semibold text-white/80 bg-white/20 rounded-full">
                          준비중
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 bg-white/80 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
          <p className="text-sm text-gray-600 text-center">
            더 많은 도구가 곧 추가될 예정입니다! 🚀
          </p>
        </div>
      </main>
    </div>
  );
}


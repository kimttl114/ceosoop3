'use client'

import { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Settings, Save, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      // 설정 저장 로직 (추후 구현)
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('설정이 저장되었습니다.')
    } catch (error) {
      console.error('설정 저장 오류:', error)
      alert('설정 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">설정</h1>
          <p className="text-gray-600">시스템 설정을 관리하세요</p>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-blue-900 font-semibold mb-2">🚧 개발 중인 기능입니다</h3>
              <p className="text-sm text-blue-800">
                시스템 설정 페이지는 현재 개발 중입니다. 추후 다음 기능들이 추가될 예정입니다:
              </p>
              <ul className="mt-3 text-sm text-blue-700 space-y-1 ml-4 list-disc">
                <li>카테고리 관리 (추가/수정/삭제)</li>
                <li>업종 관리</li>
                <li>지역 관리</li>
                <li>자동 삭제 규칙 설정</li>
                <li>공지사항 템플릿 관리</li>
                <li>시스템 알림 설정</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 임시 설정 섹션 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Settings size={24} className="text-gray-600" />
            <span>기본 설정</span>
          </h2>

          <div className="space-y-6">
            {/* 카테고리 관리 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">게시판 카테고리</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {['🔥 베스트', '🗣️ 대나무숲', '❓ 빌런박제소', '😄 유머 & 이슈', '🥕 비틱방(자랑방)'].map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700"
                    >
                      {category}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  💡 카테고리 추가/수정 기능은 추후 업데이트 예정입니다.
                </p>
              </div>
            </div>

            {/* 업종 관리 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">업종 목록</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {['🍗 치킨', '☕ 카페', '🍚 한식', '🥟 중식', '🍣 일식', '🍝 양식', '🍢 분식', '🏪 기타'].map((business) => (
                    <span
                      key={business}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700"
                    >
                      {business}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  💡 업종 추가/수정 기능은 추후 업데이트 예정입니다.
                </p>
              </div>
            </div>

            {/* 저장 버튼 (비활성화) */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={true}
                className="px-6 py-3 bg-gray-300 text-gray-500 rounded-xl font-medium cursor-not-allowed flex items-center gap-2"
              >
                <Save size={20} />
                <span>저장 (준비 중)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 고급 설정 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">고급 설정</h2>
          <div className="text-center py-8 text-gray-500">
            <Settings size={48} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">고급 설정은 추후 업데이트 예정입니다</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}


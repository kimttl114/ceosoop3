'use client'

import { useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  reportType: 'post' | 'message' | 'comment'
  targetId: string
  targetAuthorId?: string
  targetContent?: string
}

// 신고 사유 목록
const reportReasons = [
  { value: 'spam', label: '스팸/광고', emoji: '📢' },
  { value: 'inappropriate', label: '부적절한 내용', emoji: '🚫' },
  { value: 'personal_info', label: '개인정보 노출', emoji: '🔒' },
  { value: 'harassment', label: '욕설/혐오 표현', emoji: '😡' },
  { value: 'fake', label: '허위 정보', emoji: '❌' },
  { value: 'other', label: '기타', emoji: '📝' },
]

export default function ReportModal({
  isOpen,
  onClose,
  reportType,
  targetId,
  targetAuthorId,
  targetContent,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [customReason, setCustomReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 모달 닫을 때 초기화
  const handleClose = () => {
    setSelectedReason('')
    setCustomReason('')
    setSubmitting(false)
    onClose()
  }

  // 신고 제출
  const handleSubmit = async () => {
    if (!auth?.currentUser) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!selectedReason) {
      alert('신고 사유를 선택해주세요.')
      return
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      alert('기타 사유를 입력해주세요.')
      return
    }

    if (!db) {
      alert('Firebase가 초기화되지 않았습니다.')
      return
    }

    setSubmitting(true)

    try {
      const user = auth.currentUser
      
      // 신고 대상 정보 가져오기
      let targetData: any = {
        id: targetId,
        type: reportType,
      }

      if (targetAuthorId) {
        targetData.authorId = targetAuthorId
      }

      if (targetContent) {
        // 내용은 일부만 저장 (개인정보 보호)
        targetData.contentPreview = targetContent.substring(0, 100)
      }

      // 신고 데이터 저장
      await addDoc(collection(db, 'reports'), {
        reporterId: user.uid,
        reportType: reportType,
        targetId: targetId,
        targetAuthorId: targetAuthorId || '',
        targetContentPreview: targetContent?.substring(0, 100) || '',
        reason: selectedReason,
        customReason: selectedReason === 'other' ? customReason.trim() : '',
        status: 'pending', // pending, reviewed, resolved, rejected
        timestamp: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
      })

      alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.')
      handleClose()
    } catch (error: any) {
      console.error('신고 제출 실패:', error)
      alert('신고 제출에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const typeLabels = {
    post: '게시글',
    message: '쪽지',
    comment: '댓글',
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">신고하기</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-red-100 rounded-full transition"
            disabled={submitting}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{typeLabels[reportType]}</span>을(를) 신고하는 이유를 선택해주세요.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              허위 신고는 제재를 받을 수 있습니다.
            </p>
          </div>

          {/* 신고 사유 선택 */}
          <div className="space-y-2 mb-4">
            {reportReasons.map((reason) => (
              <button
                key={reason.value}
                onClick={() => setSelectedReason(reason.value)}
                disabled={submitting}
                className={`w-full p-3 rounded-xl border-2 transition text-left ${
                  selectedReason === reason.value
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } disabled:opacity-50`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{reason.emoji}</span>
                  <span className="font-medium text-gray-900">{reason.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* 기타 사유 입력 */}
          {selectedReason === 'other' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상세 사유
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="신고 사유를 상세히 입력해주세요..."
                className="w-full h-32 outline-none resize-none text-gray-700 border-2 border-gray-200 rounded-xl p-4 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                maxLength={500}
                disabled={submitting}
              />
              <div className="text-xs text-gray-400 mt-1 text-right">
                {customReason.length}/500
              </div>
            </div>
          )}

          {/* 안내 문구 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-4">
            <p className="text-xs text-blue-700">
              <strong>안내:</strong> 신고된 내용은 검토 후 조치됩니다. 신고 처리 결과는 별도로 안내되지 않을 수 있습니다.
            </p>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
            disabled={submitting}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedReason || (selectedReason === 'other' && !customReason.trim())}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>신고 중...</span>
              </>
            ) : (
              <>
                <AlertTriangle size={18} />
                <span>신고하기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}


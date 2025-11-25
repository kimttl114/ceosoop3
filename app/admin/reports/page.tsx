'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  where, 
  updateDoc, 
  doc,
  Timestamp 
} from 'firebase/firestore'
import AdminLayout from '@/components/AdminLayout'
import { Flag, Eye, Check, X, AlertTriangle, Loader2 } from 'lucide-react'

interface Report {
  id: string
  reporterId: string
  reportType: 'post' | 'message' | 'comment'
  targetId: string
  targetAuthorId: string
  targetContentPreview: string
  reason: string
  customReason?: string
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected'
  timestamp: any
  reviewedAt?: any
  reviewedBy?: string
}

const reportReasons: Record<string, string> = {
  spam: '스팸/광고',
  inappropriate: '부적절한 내용',
  personal_info: '개인정보 노출',
  harassment: '욕설/혐오 표현',
  fake: '허위 정보',
  other: '기타',
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved' | 'rejected'>('all')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }

    const fetchReports = async () => {
      try {
        let q
        if (filter === 'all') {
          q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'))
        } else {
          q = query(
            collection(db, 'reports'),
            where('status', '==', filter),
            orderBy('timestamp', 'desc')
          )
        }

        const snapshot = await getDocs(q)
        const reportsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Report[]

        setReports(reportsList)
      } catch (error) {
        console.error('신고 목록 불러오기 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [filter])

  const handleStatusChange = async (reportId: string, newStatus: 'resolved' | 'rejected') => {
    if (!db) return

    setProcessing(true)
    try {
      const reportRef = doc(db, 'reports', reportId)
      await updateDoc(reportRef, {
        status: newStatus,
        reviewedAt: Timestamp.now(),
        // reviewedBy는 현재 사용자 ID로 설정해야 함
      })

      // 목록 업데이트
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: newStatus,
                reviewedAt: Timestamp.now(),
              }
            : r
        )
      )

      if (selectedReport?.id === reportId) {
        setSelectedReport(null)
      }

      alert(newStatus === 'resolved' ? '신고가 승인되었습니다.' : '신고가 기각되었습니다.')
    } catch (error) {
      console.error('신고 상태 변경 오류:', error)
      alert('처리 중 오류가 발생했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('ko-KR')
  }

  const filteredReports = reports

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-[#1A2B4E]" size={48} />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">신고 관리</h1>
            <p className="text-gray-600">신고된 내용을 검토하고 처리하세요</p>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: '전체' },
              { value: 'pending', label: '대기중' },
              { value: 'reviewed', label: '검토중' },
              { value: 'resolved', label: '처리완료' },
              { value: 'rejected', label: '기각' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === f.value
                    ? 'bg-[#1A2B4E] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 신고 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사유</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신고 시간</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      신고 내역이 없습니다
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {report.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {report.reportType === 'post' ? '게시글' : 
                         report.reportType === 'comment' ? '댓글' : '쪽지'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {reportReasons[report.reason] || report.reason}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            report.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : report.status === 'resolved'
                              ? 'bg-green-100 text-green-800'
                              : report.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {report.status === 'pending'
                            ? '대기중'
                            : report.status === 'resolved'
                            ? '처리완료'
                            : report.status === 'rejected'
                            ? '기각'
                            : '검토중'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatTime(report.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition text-blue-600"
                            title="상세보기"
                          >
                            <Eye size={16} />
                          </button>
                          {report.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(report.id, 'resolved')}
                                disabled={processing}
                                className="p-2 hover:bg-green-50 rounded-lg transition text-green-600 disabled:opacity-50"
                                title="승인"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => handleStatusChange(report.id, 'rejected')}
                                disabled={processing}
                                className="p-2 hover:bg-red-50 rounded-lg transition text-red-600 disabled:opacity-50"
                                title="기각"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 신고 상세 모달 */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-red-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">신고 상세</h2>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">신고 타입</h3>
                  <p className="text-gray-900">
                    {selectedReport.reportType === 'post' ? '게시글' : 
                     selectedReport.reportType === 'comment' ? '댓글' : '쪽지'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">신고 사유</h3>
                  <p className="text-gray-900">
                    {reportReasons[selectedReport.reason] || selectedReport.reason}
                  </p>
                  {selectedReport.customReason && (
                    <p className="text-sm text-gray-600 mt-2">{selectedReport.customReason}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">신고 대상 내용</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedReport.targetContentPreview || '내용 없음'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">신고 시간</h3>
                  <p className="text-gray-900">{formatTime(selectedReport.timestamp)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">상태</h3>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full inline-block ${
                      selectedReport.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : selectedReport.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : selectedReport.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {selectedReport.status === 'pending'
                      ? '대기중'
                      : selectedReport.status === 'resolved'
                      ? '처리완료'
                      : selectedReport.status === 'rejected'
                      ? '기각'
                      : '검토중'}
                  </span>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  닫기
                </button>
                {selectedReport.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleStatusChange(selectedReport.id, 'resolved')
                        setSelectedReport(null)
                      }}
                      disabled={processing}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => {
                        handleStatusChange(selectedReport.id, 'rejected')
                        setSelectedReport(null)
                      }}
                      disabled={processing}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50"
                    >
                      기각
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}


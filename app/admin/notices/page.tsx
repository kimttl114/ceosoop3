'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  getDocs, 
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import AdminLayout from '@/components/AdminLayout'
import { FileText, Plus, Loader2, Trash2, Edit2, AlertCircle } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

interface Notice {
  id: string
  title: string
  content: string
  authorName: string
  authorId: string
  isImportant: boolean
  visible: boolean
  createdAt: any
  updatedAt?: any
  deleted?: boolean
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isImportant: false,
    visible: true,
  })
  const [saving, setSaving] = useState(false)

  // 사용자 정보 불러오기
  useEffect(() => {
    if (!auth) return

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })

    return () => unsubscribe()
  }, [])

  // 공지사항 목록 불러오기
  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }

    const loadNotices = async () => {
      try {
        const noticesRef = collection(db, 'notices')
        const q = query(noticesRef, orderBy('createdAt', 'desc'))
        
        const snapshot = await getDocs(q)
        const noticesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notice[]

        setNotices(noticesList)
      } catch (error: any) {
        console.error('공지사항 불러오기 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    loadNotices()
  }, [])

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      isImportant: false,
      visible: true,
    })
    setEditingNotice(null)
    setIsFormOpen(false)
  }

  // 공지사항 저장
  const handleSave = async () => {
    if (!db || !user) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }

    setSaving(true)

    try {
      const noticesRef = collection(db, 'notices')

      if (editingNotice) {
        // 수정
        const noticeRef = doc(db, 'notices', editingNotice.id)
        await updateDoc(noticeRef, {
          title: formData.title.trim(),
          content: formData.content.trim(),
          isImportant: formData.isImportant,
          visible: formData.visible,
          updatedAt: serverTimestamp(),
        })
        alert('공지사항이 수정되었습니다.')
      } else {
        // 새로 작성
        await addDoc(noticesRef, {
          title: formData.title.trim(),
          content: formData.content.trim(),
          authorName: user.displayName || '관리자',
          authorId: user.uid,
          isImportant: formData.isImportant,
          visible: formData.visible,
          deleted: false,
          createdAt: serverTimestamp(),
        })
        alert('공지사항이 작성되었습니다.')
      }

      resetForm()
      // 목록 새로고침
      const q = query(noticesRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const noticesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notice[]
      setNotices(noticesList)
    } catch (error: any) {
      console.error('공지사항 저장 오류:', error)
      alert('공지사항 저장에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
    } finally {
      setSaving(false)
    }
  }

  // 공지사항 삭제
  const handleDelete = async (noticeId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return
    }

    if (!db) return

    try {
      const noticeRef = doc(db, 'notices', noticeId)
      await updateDoc(noticeRef, {
        deleted: true,
        visible: false,
      })
      alert('공지사항이 삭제되었습니다.')
      
      // 목록 새로고침
      const noticesRef = collection(db, 'notices')
      const q = query(noticesRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const noticesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notice[]
      setNotices(noticesList)
    } catch (error: any) {
      console.error('공지사항 삭제 오류:', error)
      alert('공지사항 삭제에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
    }
  }

  // 수정 시작
  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice)
    setFormData({
      title: notice.title,
      content: notice.content,
      isImportant: notice.isImportant || false,
      visible: notice.visible !== false,
    })
    setIsFormOpen(true)
  }

  // 날짜 포맷팅
  const formatDate = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-gray-400" size={48} />
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
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="text-red-500" size={28} />
              공지사항 관리
            </h1>
            <p className="text-sm text-gray-500 mt-1">공지사항을 작성하고 관리합니다.</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setIsFormOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A2B4E] text-white rounded-lg font-medium hover:bg-[#1A2B4E]/90 transition"
          >
            <Plus size={20} />
            새 공지사항
          </button>
        </div>

        {/* 작성/수정 폼 */}
        {isFormOpen && (
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-[#1A2B4E]">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingNotice ? '공지사항 수정' : '새 공지사항 작성'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="공지사항 제목을 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  내용 *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="공지사항 내용을 입력하세요"
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E] resize-y"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isImportant}
                    onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                    className="w-4 h-4 text-[#1A2B4E] border-gray-300 rounded focus:ring-[#1A2B4E]"
                  />
                  <span className="text-sm font-medium text-gray-700">중요 공지</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.visible}
                    onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                    className="w-4 h-4 text-[#1A2B4E] border-gray-300 rounded focus:ring-[#1A2B4E]"
                  />
                  <span className="text-sm font-medium text-gray-700">공개</span>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t">
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.title.trim() || !formData.content.trim()}
                  className="flex-1 px-4 py-2 bg-[#1A2B4E] text-white rounded-lg font-medium hover:bg-[#1A2B4E]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      저장 중...
                    </span>
                  ) : (
                    '저장'
                  )}
                </button>
                <button
                  onClick={resetForm}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 공지사항 목록 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">공지사항 목록 ({notices.length})</h2>
          </div>

          {notices.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">등록된 공지사항이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {notice.isImportant && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                            중요
                          </span>
                        )}
                        {!notice.visible && (
                          <span className="px-2 py-0.5 bg-gray-400 text-white text-xs font-bold rounded-full">
                            비공개
                          </span>
                        )}
                        {notice.deleted && (
                          <span className="px-2 py-0.5 bg-gray-500 text-white text-xs font-bold rounded-full">
                            삭제됨
                          </span>
                        )}
                        <h3 className="text-lg font-bold text-gray-900">{notice.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{notice.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>작성자: {notice.authorName || '관리자'}</span>
                        <span>작성일: {formatDate(notice.createdAt)}</span>
                        {notice.updatedAt && (
                          <span>수정일: {formatDate(notice.updatedAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(notice)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition text-blue-600"
                        title="수정"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(notice.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
                        title="삭제"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}




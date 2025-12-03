'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  deleteDoc, 
  doc,
  getDoc,
  collectionGroup,
  where,
} from 'firebase/firestore'
import AdminLayout from '@/components/AdminLayout'
import { MessageSquare, Trash2, Eye, Search, Loader2, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Comment {
  id: string
  postId: string
  content: string
  author: string
  uid: string
  timestamp: any
  postTitle?: string
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchComments = async () => {
      try {
        if (!db) {
          console.error('Firebase가 초기화되지 않았습니다.')
          setLoading(false)
          return
        }

        // 모든 게시글의 댓글을 가져오기
        const postsSnapshot = await getDocs(query(collection(db, 'posts'), orderBy('timestamp', 'desc')))
        const allComments: Comment[] = []

        for (const postDoc of postsSnapshot.docs) {
          const commentsQuery = query(
            collection(db, 'posts', postDoc.id, 'comments'),
            orderBy('timestamp', 'desc')
          )
          const commentsSnapshot = await getDocs(commentsQuery)
          
          const postTitle = postDoc.data().title || '제목 없음'
          
          commentsSnapshot.docs.forEach((commentDoc) => {
            allComments.push({
              id: commentDoc.id,
              postId: postDoc.id,
              postTitle: postTitle,
              ...commentDoc.data(),
            } as Comment)
          })
        }

        // 최신 순으로 정렬
        allComments.sort((a, b) => {
          const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0)
          const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0)
          return timeB.getTime() - timeA.getTime()
        })

        setComments(allComments)
      } catch (error: any) {
        console.error('댓글 목록 불러오기 오류:', error)
        if (error?.code === 'permission-denied') {
          alert('댓글 목록을 불러올 권한이 없습니다. Firestore 보안 규칙을 확인하세요.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [])

  const handleDelete = async (commentId: string, postId: string) => {
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    setProcessing(true)
    try {
      if (!db) {
        throw new Error('Firebase가 초기화되지 않았습니다.')
      }

      await deleteDoc(doc(db, 'posts', postId, 'comments', commentId))
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      if (selectedComment?.id === commentId) {
        setSelectedComment(null)
      }
      alert('댓글이 삭제되었습니다.')
    } catch (error: any) {
      console.error('댓글 삭제 오류:', error)
      let errorMessage = '삭제 중 오류가 발생했습니다.\n\n'
      
      if (error?.code === 'permission-denied') {
        errorMessage += '권한이 부족합니다. Firestore 보안 규칙을 확인하세요.\n\n'
        errorMessage += '해결 방법:\n'
        errorMessage += '1. Firebase Console > Firestore Database > 규칙\n'
        errorMessage += '2. ADMIN_FIRESTORE_RULES.md 파일 참고\n'
        errorMessage += '3. 관리자 권한 확인 (users 컬렉션의 isAdmin 필드)'
      } else if (error?.code === 'not-found') {
        errorMessage += '댓글을 찾을 수 없습니다.'
      } else if (error?.code === 'unavailable') {
        errorMessage += 'Firebase 서비스에 연결할 수 없습니다. 네트워크를 확인하세요.'
      } else {
        errorMessage += `오류: ${error?.message || '알 수 없는 오류'}\n`
        errorMessage += `코드: ${error?.code || '없음'}`
      }
      
      alert(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('ko-KR')
  }

  const filteredComments = comments.filter((comment) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        comment.content.toLowerCase().includes(query) ||
        comment.author.toLowerCase().includes(query) ||
        comment.postTitle?.toLowerCase().includes(query)
      )
    }
    return true
  })

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">댓글 관리</h1>
            <p className="text-gray-600">댓글을 검토하고 관리하세요</p>
          </div>
          <div className="text-sm text-gray-600">
            전체 댓글: <span className="font-bold text-gray-900">{comments.length}</span>개
          </div>
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="댓글 내용, 작성자, 게시글 제목으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E]"
            />
          </div>
        </div>

        {/* 댓글 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">댓글 내용</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">게시글</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성 시간</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredComments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {searchQuery ? '검색 결과가 없습니다' : '댓글이 없습니다'}
                    </td>
                  </tr>
                ) : (
                  filteredComments.map((comment) => (
                    <tr key={`${comment.postId}-${comment.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedComment(comment)}
                          className="text-sm text-gray-900 hover:text-[#1A2B4E] text-left max-w-md truncate block"
                        >
                          {comment.content}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{comment.author}</td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/board/${comment.postId}`}
                          className="text-sm text-blue-600 hover:underline max-w-xs truncate block"
                          target="_blank"
                        >
                          {comment.postTitle || '게시글 보기'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatTime(comment.timestamp)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedComment(comment)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition text-blue-600"
                            title="상세보기"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(comment.id, comment.postId)}
                            disabled={processing}
                            className="p-2 hover:bg-red-50 rounded-lg transition text-red-600 disabled:opacity-50"
                            title="삭제"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 댓글 상세 모달 */}
        {selectedComment && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">댓글 상세</h2>
                <button
                  onClick={() => setSelectedComment(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">댓글 내용</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedComment.content}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">작성자</h3>
                  <p className="text-gray-900">{selectedComment.author}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">원본 게시글</h3>
                  <Link
                    href={`/board/${selectedComment.postId}`}
                    target="_blank"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {selectedComment.postTitle || '게시글 보기'}
                    <ExternalLink size={14} />
                  </Link>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">작성 시간</h3>
                  <p className="text-gray-900">{formatTime(selectedComment.timestamp)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">사용자 ID</h3>
                  <p className="text-gray-600 text-xs font-mono">{selectedComment.uid}</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setSelectedComment(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  닫기
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedComment.id, selectedComment.postId)
                    setSelectedComment(null)
                  }}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}


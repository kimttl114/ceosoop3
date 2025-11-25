'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  where, 
  deleteDoc, 
  doc,
  updateDoc,
  Timestamp 
} from 'firebase/firestore'
import AdminLayout from '@/components/AdminLayout'
import { FileText, Trash2, Eye, EyeOff, Search, Loader2, X } from 'lucide-react'

interface Post {
  id: string
  title: string
  content: string
  author: string
  uid: string
  category: string
  businessType?: string
  region?: string
  timestamp: any
  likes: number
  comments: number
  hidden?: boolean
  deleted?: boolean
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'hidden' | 'deleted'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }

    const fetchPosts = async () => {
      try {
        let q
        if (filter === 'all') {
          q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'))
        } else if (filter === 'hidden') {
          q = query(
            collection(db, 'posts'),
            where('hidden', '==', true),
            orderBy('timestamp', 'desc')
          )
        } else {
          // deleted 필터는 실제로는 soft delete를 구현해야 함
          q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'))
        }

        const snapshot = await getDocs(q)
        const postsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[]

        setPosts(postsList)
      } catch (error) {
        console.error('게시글 목록 불러오기 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [filter])

  const handleHide = async (postId: string, hide: boolean) => {
    if (!db) return

    setProcessing(true)
    try {
      const postRef = doc(db, 'posts', postId)
      await updateDoc(postRef, {
        hidden: hide,
        hiddenAt: hide ? Timestamp.now() : null,
      })

      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, hidden: hide } : p))
      )

      alert(hide ? '게시글이 숨김 처리되었습니다.' : '게시글이 복구되었습니다.')
    } catch (error) {
      console.error('게시글 숨김 처리 오류:', error)
      alert('처리 중 오류가 발생했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    if (!db) return

    setProcessing(true)
    try {
      await deleteDoc(doc(db, 'posts', postId))
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      if (selectedPost?.id === postId) {
        setSelectedPost(null)
      }
      alert('게시글이 삭제되었습니다.')
    } catch (error) {
      console.error('게시글 삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('ko-KR')
  }

  const filteredPosts = posts.filter((post) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query)
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">게시글 관리</h1>
            <p className="text-gray-600">게시글을 검토하고 관리하세요</p>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="제목, 내용, 작성자로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E]"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: '전체' },
              { value: 'hidden', label: '숨김처리' },
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

        {/* 게시글 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">좋아요</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">댓글</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성 시간</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      게시글이 없습니다
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => (
                    <tr key={post.id} className={`hover:bg-gray-50 ${post.hidden ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {post.hidden && <EyeOff size={16} className="text-gray-400" />}
                          <button
                            onClick={() => setSelectedPost(post)}
                            className="text-sm font-medium text-gray-900 hover:text-[#1A2B4E] text-left max-w-xs truncate"
                          >
                            {post.title}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{post.author}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{post.category || '잡담'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{post.likes || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{post.comments || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatTime(post.timestamp)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedPost(post)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition text-blue-600"
                            title="상세보기"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleHide(post.id, !post.hidden)}
                            disabled={processing}
                            className="p-2 hover:bg-yellow-50 rounded-lg transition text-yellow-600 disabled:opacity-50"
                            title={post.hidden ? '복구' : '숨김'}
                          >
                            {post.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
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

        {/* 게시글 상세 모달 */}
        {selectedPost && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">게시글 상세</h2>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">제목</h3>
                  <p className="text-lg font-semibold text-gray-900">{selectedPost.title}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">작성자</h3>
                  <p className="text-gray-900">{selectedPost.author}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">카테고리</h3>
                  <p className="text-gray-900">{selectedPost.category || '잡담'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">내용</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedPost.content}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">좋아요</h3>
                    <p className="text-gray-900">{selectedPost.likes || 0}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">댓글</h3>
                    <p className="text-gray-900">{selectedPost.comments || 0}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">작성 시간</h3>
                  <p className="text-gray-900">{formatTime(selectedPost.timestamp)}</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  닫기
                </button>
                <button
                  onClick={() => {
                    handleHide(selectedPost.id, !selectedPost.hidden)
                    setSelectedPost(null)
                  }}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-xl font-medium hover:bg-yellow-700 transition disabled:opacity-50"
                >
                  {selectedPost.hidden ? '복구' : '숨김'}
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedPost.id)
                    setSelectedPost(null)
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


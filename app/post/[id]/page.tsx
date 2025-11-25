'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  increment,
  arrayUnion,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { ArrowLeft, Trash2, Heart, Flag } from 'lucide-react'
import AvatarMini from '@/components/AvatarMini'
import Link from 'next/link'
import ReportModal from '@/components/ReportModal'
import PostAuthorBadge from '@/components/PostAuthorBadge'

export default function PostDetailPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params?.id as string

  const [user, setUser] = useState<any>(null)
  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likedBy, setLikedBy] = useState<string[]>([])
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment', id: string, authorId?: string, content?: string } | null>(null)
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState<string | null>(null)
  const [commentAvatars, setCommentAvatars] = useState<Record<string, string>>({})

  // 로그인 상태 확인
  useEffect(() => {
    if (!auth) return

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  // 게시글 실시간 불러오기
  useEffect(() => {
    if (!db || !postId) return

    const postRef = doc(db, 'posts', postId)
    
    const unsubscribe = onSnapshot(
      postRef,
      async (postSnap) => {
        if (postSnap.exists()) {
          const postData = {
            id: postSnap.id,
            ...postSnap.data(),
          } as any
          setPost(postData)

          // 좋아요한 사용자 목록 불러오기
          if (postData.likedBy && Array.isArray(postData.likedBy)) {
            setLikedBy(postData.likedBy)
            if (user && postData.likedBy.includes(user.uid)) {
              setLiked(true)
            } else {
              setLiked(false)
            }
          } else {
            setLikedBy([])
            setLiked(false)
          }

          // 작성자 아바타 가져오기 (한 번만)
          if (postData.uid && db && !authorAvatarUrl) {
            try {
              const userRef = doc(db, 'users', postData.uid)
              const userSnap = await getDoc(userRef)
              if (userSnap.exists()) {
                const userData = userSnap.data()
                setAuthorAvatarUrl(userData.avatarUrl || null)
              }
            } catch (error) {
              console.error('작성자 아바타 불러오기 오류:', error)
            }
          }
          
          setLoading(false)
        } else {
          alert('게시글을 찾을 수 없습니다.')
          router.push('/')
        }
      },
      (error) => {
        console.error('게시글 불러오기 오류:', error)
        alert('게시글을 불러오는 중 오류가 발생했습니다.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [db, postId, router, user, authorAvatarUrl])

  // 댓글 실시간 불러오기
  useEffect(() => {
    if (!db || !postId) return

    const commentsRef = collection(db, 'posts', postId, 'comments')
    const q = query(commentsRef, orderBy('timestamp', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const commentList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setComments(commentList)

        // 각 댓글 작성자의 아바타 가져오기
        const currentDb = db
        if (currentDb) {
          const userIds = commentList.map((comment: any) => comment.uid).filter(Boolean) as string[]
          const uniqueUserIds = Array.from(new Set(userIds))
          
          setCommentAvatars((prevAvatars) => {
            const avatarPromises = uniqueUserIds.map(async (uid: string) => {
              // 이미 캐시에 있고 유효한 값이 있으면 스킵
              if (prevAvatars[uid] && prevAvatars[uid] !== null && prevAvatars[uid] !== '') {
                return null
              }
              try {
                const userRef = doc(currentDb, 'users', uid)
                const userSnap = await getDoc(userRef)
                if (userSnap.exists()) {
                  const userData = userSnap.data()
                  const avatarUrl = userData.avatarUrl || null
                  // null이나 빈 문자열이 아닐 때만 반환
                  if (avatarUrl && avatarUrl.trim() !== '') {
                    return { uid, avatarUrl }
                  }
                }
              } catch (error) {
                console.error(`댓글 작성자 ${uid} 아바타 불러오기 오류:`, error)
              }
              return null
            })

            Promise.all(avatarPromises).then((avatarResults) => {
              const newAvatars: Record<string, string> = {}
              avatarResults.forEach((result) => {
                if (result && result.avatarUrl) {
                  newAvatars[result.uid] = result.avatarUrl
                }
              })
              if (Object.keys(newAvatars).length > 0) {
                setCommentAvatars((current) => {
                  // 중복 업데이트 방지: 이미 있는 값은 덮어쓰지 않음
                  const updated = { ...current }
                  Object.keys(newAvatars).forEach((uid) => {
                    // 기존 값이 없거나 빈 값일 때만 업데이트
                    if (!updated[uid] || updated[uid] === '') {
                      updated[uid] = newAvatars[uid]
                    }
                  })
                  return updated
                })
              }
            })

            return prevAvatars // 즉시 반환 (비동기 업데이트는 위에서 처리)
          })
        }
      },
      (error) => {
        console.error('댓글 불러오기 오류:', error)
      }
    )

    return () => unsubscribe()
  }, [db, postId])

  // 상대적 시간 표시
  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return '시간 없음'

    const postTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - postTime.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    if (weeks < 4) return `${weeks}주 전`
    if (months < 12) return `${months}개월 전`
    return postTime.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // 익명 닉네임 생성 (댓글용)
  const generateAnonymousName = () => {
    const adjectives = ['지친', '행복한', '대박난', '화난', '새벽의']
    const nouns = ['닭발', '족발', '아메리카노', '마라탕', '포스기', '사장님']

    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]

    return `${randomAdjective} ${randomNoun}`
  }

  // 좋아요 클릭
  const handleLike = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!db || !postId) return

    // 이미 좋아요를 눌렀는지 확인
    if (liked || likedBy.includes(user.uid)) {
      alert('이미 공감하셨습니다.')
      return
    }

    try {
      const postRef = doc(db, 'posts', postId)
      
      await updateDoc(postRef, {
        likes: increment(1),
        likedBy: arrayUnion(user.uid),
      })
      
      setLiked(true)
      setLikedBy((prev) => [...prev, user.uid])
    } catch (error) {
      console.error('좋아요 오류:', error)
      alert('좋아요 처리 중 오류가 발생했습니다.')
    }
  }

  // 댓글 등록
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!commentText.trim()) {
      alert('댓글을 입력해주세요.')
      return
    }

    if (!db || !postId) return

    setSubmitting(true)

    try {
      const authorName = generateAnonymousName()
      const commentsRef = collection(db, 'posts', postId, 'comments')

      await addDoc(commentsRef, {
        content: commentText.trim(),
        author: authorName,
        uid: user.uid,
        timestamp: serverTimestamp(),
      })

      // 댓글 수 업데이트
      const postRef = doc(db, 'posts', postId)
      await updateDoc(postRef, {
        comments: increment(1),
      })

      setCommentText('')
    } catch (error) {
      console.error('댓글 등록 오류:', error)
      alert('댓글 등록 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // 게시글 삭제
  const handleDelete = async () => {
    if (!user || !post) return

    if (user.uid !== post.uid) {
      alert('본인이 작성한 글만 삭제할 수 있습니다.')
      return
    }

    if (!confirm('정말 삭제하시겠습니까?')) {
      return
    }

    if (!db || !postId) return

    try {
      await deleteDoc(doc(db, 'posts', postId))
      alert('게시글이 삭제되었습니다.')
      router.push('/')
    } catch (error) {
      console.error('게시글 삭제 오류:', error)
      alert('게시글 삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2B4E] mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">게시글을 찾을 수 없습니다.</p>
          <Link href="/" className="text-[#1A2B4E] hover:underline">
            메인으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 relative z-10">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">게시글</h1>
          <div className="flex items-center gap-2">
            {user && user.uid !== post.uid && (
              <button
                onClick={() => {
                  setReportTarget({
                    type: 'post',
                    id: postId,
                    authorId: post.uid,
                    content: post.content,
                  })
                  setIsReportModalOpen(true)
                }}
                className="p-2 hover:bg-orange-50 rounded-full transition text-orange-600"
                title="신고"
              >
                <Flag size={20} />
              </button>
            )}
            {user && user.uid === post.uid && (
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-50 rounded-full transition text-red-500"
                title="삭제"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 게시글 내용 */}
      <main className="max-w-md mx-auto bg-white">
        <article className="p-5">
          {/* 작성자 정보 */}
          <div className="flex items-center gap-3 mb-4">
            <AvatarMini avatarUrl={authorAvatarUrl} userId={post.uid} size={40} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{post.author || '익명의 사장님'}</span>
                <PostAuthorBadge authorId={post.uid} />
              </div>
              <div className="text-xs text-gray-400">{formatRelativeTime(post.timestamp)}</div>
            </div>
            {post.businessType && (
              <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
                {post.businessType}
              </span>
            )}
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>

          {/* 본문 */}
          <div className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
            {user ? post.content : '🔒 로그인해야 볼 수 있어요'}
          </div>

          {/* 좋아요 및 신고 버튼 */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
            <button
              onClick={handleLike}
              disabled={!user || liked || (user && likedBy.includes(user.uid))}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${
                liked || (user && likedBy.includes(user.uid))
                  ? 'bg-red-50 text-red-500 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart size={20} className={liked || (user && likedBy.includes(user.uid)) ? 'fill-current' : ''} />
              <span className="font-medium">{post.likes || 0}</span>
            </button>
            {user && user.uid !== post.uid && (
              <button
                onClick={() => {
                  setReportTarget({
                    type: 'post',
                    id: postId,
                    authorId: post.uid,
                    content: post.content,
                  })
                  setIsReportModalOpen(true)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 transition"
                title="게시글 신고"
              >
                <Flag size={18} />
                <span className="text-sm font-medium">신고</span>
              </button>
            )}
          </div>

          {/* 댓글 목록 */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              댓글 {comments.length}
            </h2>
            {comments.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>아직 댓글이 없습니다.</p>
                <p className="text-sm mt-2">첫 번째 댓글을 남겨보세요!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                    <AvatarMini size={32} avatarUrl={commentAvatars[comment.uid]} userId={comment.uid} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900">
                            {comment.author || '익명'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatRelativeTime(comment.timestamp)}
                          </span>
                        </div>
                        {user && user.uid !== comment.uid && (
                          <button
                            onClick={() => {
                              setReportTarget({
                                type: 'comment',
                                id: comment.id,
                                authorId: comment.uid,
                                content: comment.content,
                              })
                              setIsReportModalOpen(true)
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-50 text-orange-600 hover:bg-orange-100 transition text-xs font-medium"
                            title="댓글 신고"
                          >
                            <Flag size={12} />
                            <span>신고</span>
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </main>

      {/* 댓글 입력창 (Sticky) */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
          <div className="max-w-md mx-auto px-4 py-3">
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1A2B4E] focus:border-transparent"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="px-6 py-2 bg-[#1A2B4E] text-white rounded-full font-medium hover:bg-[#1A2B4E]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 비로그인 사용자 안내 */}
      {!user && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
          <div className="max-w-md mx-auto px-4 py-3 text-center">
            <p className="text-sm text-gray-600">
              댓글을 남기려면{' '}
              <Link href="/" className="text-[#1A2B4E] font-semibold hover:underline">
                로그인
              </Link>
              이 필요합니다.
            </p>
          </div>
        </div>
      )}

      {/* 신고 모달 */}
      {reportTarget && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false)
            setReportTarget(null)
          }}
          reportType={reportTarget.type}
          targetId={reportTarget.id}
          targetAuthorId={reportTarget.authorId}
          targetContent={reportTarget.content}
        />
      )}
    </div>
  )
}


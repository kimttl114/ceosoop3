'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, updateDoc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp, runTransaction } from 'firebase/firestore'
import { ArrowLeft, Clock, MessageSquare, Heart, Loader2, Check, AlertCircle } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import AvatarMini from '@/components/AvatarMini'
import { useVerification } from '@/hooks/useVerification'

export default function PollDetailPage() {
  const router = useRouter()
  const params = useParams()
  const pollId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [poll, setPoll] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userVote, setUserVote] = useState<'A' | 'B' | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentOption, setCommentOption] = useState<'A' | 'B' | null>(null)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [userAvatar, setUserAvatar] = useState<string>('')
  const { isVerified, loading: verificationLoading } = useVerification()

  // 로그인 상태 확인
  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser && db) {
        // 사용자 아바타 불러오기
        try {
          const userRef = doc(db, 'users', currentUser.uid)
          const userSnap = await getDoc(userRef)
          if (userSnap.exists()) {
            const userData = userSnap.data()
            setUserAvatar(userData.avatarUrl || '')
          }
        } catch (error) {
          console.error('사용자 정보 불러오기 오류:', error)
        }

        // 사용자가 이미 투표했는지 확인
        if (pollId) {
          try {
            const voteRef = doc(db, 'decision_polls', pollId, 'votes', currentUser.uid)
            const voteSnap = await getDoc(voteRef)
            if (voteSnap.exists()) {
              const voteData = voteSnap.data()
              setUserVote(voteData.selectedOption)
            }
          } catch (error) {
            console.error('투표 정보 불러오기 오류:', error)
          }
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [pollId])

  // 투표 상세 정보 실시간 업데이트
  useEffect(() => {
    if (!db || !pollId) return

    const pollRef = doc(db, 'decision_polls', pollId)

    const unsubscribe = onSnapshot(pollRef, (snapshot) => {
      if (snapshot.exists()) {
        const pollData = {
          id: snapshot.id,
          ...snapshot.data(),
        }
        setPoll(pollData)
      } else {
        setPoll(null)
      }
    })

    // 조회수 증가 (한 번만)
    if (user) {
      const incrementViews = async () => {
        try {
          const pollSnap = await getDoc(pollRef)
          if (pollSnap.exists()) {
            const currentViews = pollSnap.data().views || 0
            await updateDoc(pollRef, {
              views: currentViews + 1,
            })
          }
        } catch (error) {
          console.error('조회수 증가 오류:', error)
        }
      }
      incrementViews()
    }

    return () => unsubscribe()
  }, [db, pollId, user])

  // 댓글 실시간 업데이트
  useEffect(() => {
    if (!db || !pollId) return

    const commentsQuery = query(
      collection(db, 'decision_polls', pollId, 'comments'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setComments(commentList)
    })

    return () => unsubscribe()
  }, [db, pollId])

  // 투표하기
  const handleVote = async (option: 'A' | 'B') => {
    if (!user || !db || !poll || isVoting) return

    if (!isVerified) {
      alert('사업자 인증이 필요합니다. 인증된 찐사장들만 투표할 수 있습니다.')
      router.push('/auth/verify')
      return
    }

    // 이미 같은 선택지에 투표했으면 무시
    if (userVote === option) return

    setIsVoting(true)

    try {
      const pollRef = doc(db, 'decision_polls', pollId)
      const voteRef = doc(db, 'decision_polls', pollId, 'votes', user.uid)

      await runTransaction(db, async (transaction) => {
        // 투표 문서 읽기
        const pollSnap = await transaction.get(pollRef)
        if (!pollSnap.exists()) {
          throw new Error('투표가 존재하지 않습니다.')
        }

        const currentPoll = pollSnap.data()
        const oldVoteSnap = await transaction.get(voteRef)

        let newOptionAVotes = currentPoll.optionA?.votes || 0
        let newOptionBVotes = currentPoll.optionB?.votes || 0

        // 기존 투표가 있으면 제거
        if (oldVoteSnap.exists()) {
          const oldVote = oldVoteSnap.data().selectedOption
          if (oldVote === 'A') {
            newOptionAVotes = Math.max(0, newOptionAVotes - 1)
          } else if (oldVote === 'B') {
            newOptionBVotes = Math.max(0, newOptionBVotes - 1)
          }
        }

        // 새 투표 추가
        if (option === 'A') {
          newOptionAVotes += 1
        } else {
          newOptionBVotes += 1
        }

        // 투표 업데이트
        transaction.update(pollRef, {
          optionA: {
            ...currentPoll.optionA,
            votes: newOptionAVotes,
          },
          optionB: {
            ...currentPoll.optionB,
            votes: newOptionBVotes,
          },
          updatedAt: serverTimestamp(),
        })

        // 사용자 투표 기록
        transaction.set(voteRef, {
          userId: user.uid,
          selectedOption: option,
          votedAt: serverTimestamp(),
        })
      })

      setUserVote(option)
    } catch (error: any) {
      console.error('투표 오류:', error)
      alert('투표에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
    } finally {
      setIsVoting(false)
    }
  }

  // 댓글 작성
  const handleSubmitComment = async () => {
    if (!user || !db || !poll || !newComment.trim() || isSubmittingComment) return

    if (!isVerified) {
      alert('사업자 인증이 필요합니다. 인증된 찐사장들만 댓글을 작성할 수 있습니다.')
      router.push('/auth/verify')
      return
    }

    setIsSubmittingComment(true)

    try {
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)
      const userData = userSnap.exists() ? userSnap.data() : {}
      const authorName = userData.anonymousName || '익명의 사장님'

      await addDoc(collection(db, 'decision_polls', pollId, 'comments'), {
        userId: user.uid,
        authorName: authorName,
        content: newComment.trim(),
        option: commentOption,
        createdAt: serverTimestamp(),
        likes: 0,
      })

      // 댓글 수 증가
      const pollRef = doc(db, 'decision_polls', pollId)
      await updateDoc(pollRef, {
        comments: (poll.comments || 0) + 1,
      })

      setNewComment('')
      setCommentOption(null)
    } catch (error: any) {
      console.error('댓글 작성 오류:', error)
      alert('댓글 작성에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // 마감까지 남은 시간
  const getTimeRemaining = (deadline: any) => {
    if (!deadline) return '마감 시간 미설정'

    const now = new Date()
    const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline)
    const diff = deadlineDate.getTime() - now.getTime()

    if (diff <= 0) return '마감됨'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours < 1) {
      if (minutes < 1) return '마감 임박'
      return `${minutes}분 남음`
    }
    if (hours < 24) return `${hours}시간 남음`
    const days = Math.floor(hours / 24)
    return `${days}일 남음`
  }

  // 상대적 시간 포맷팅
  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return ''

    const now = new Date()
    const postTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const diff = now.getTime() - postTime.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    return postTime.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#1A2B4E]" size={48} />
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="text-gray-400 mx-auto mb-4" size={48} />
          <p className="text-gray-600">투표를 찾을 수 없습니다.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-[#1A2B4E] text-white rounded-lg font-medium hover:bg-[#1A2B4E]/90 transition"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  const totalVotes = (poll.optionA?.votes || 0) + (poll.optionB?.votes || 0)
  const optionAPercent = totalVotes > 0 ? Math.round((poll.optionA?.votes || 0) / totalVotes * 100) : 0
  const optionBPercent = totalVotes > 0 ? Math.round((poll.optionB?.votes || 0) / totalVotes * 100) : 0
  const isClosed = poll.status === 'closed' || (poll.deadline && (poll.deadline.toDate ? poll.deadline.toDate() : new Date(poll.deadline)) < new Date())

  return (
    <div className="min-h-screen pb-24 relative z-10 bg-[#F5F7FA]">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-[#1A2B4E] to-[#2C3E50] sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">투표 상세</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* 투표 정보 카드 */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {/* 작성자 정보 */}
          <div className="flex items-center gap-2 mb-4">
            <AvatarMini size={32} avatarUrl={userAvatar} userId={poll.authorId} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{poll.authorName || '익명의 사장님'}</p>
              <p className="text-xs text-gray-500">{formatRelativeTime(poll.createdAt)}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={14} />
              <span>{getTimeRemaining(poll.deadline)}</span>
            </div>
          </div>

          {/* 제목 */}
          <h2 className="text-lg font-bold text-gray-900 mb-3">{poll.title}</h2>

          {/* 설명 */}
          {poll.description && (
            <div className="text-sm text-gray-700 mb-4 whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              {user && isVerified ? poll.description : !user ? '🔒 로그인이 필요합니다' : !isVerified ? '🔒 사업자 인증이 필요합니다' : poll.description}
            </div>
          )}
          
          {/* 미인증 사용자 안내 */}
          {user && !isVerified && !verificationLoading && (
            <div className="mb-4 p-4 bg-amber-50 rounded-xl border-2 border-amber-200 text-center">
              <p className="text-sm font-semibold text-gray-900 mb-2">🔒 사업자 인증이 필요합니다</p>
              <p className="text-xs text-gray-600 mb-3">
                인증된 찐사장들만 투표에 참여할 수 있습니다.
              </p>
              <button
                onClick={() => router.push('/auth/verify')}
                className="bg-[#FFBF00] text-[#1A2B4E] px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#FFBF00]/90 transition"
              >
                사업자 인증하기
              </button>
            </div>
          )}

          {/* 선택지 */}
          <div className="space-y-3 mb-4">
            {/* 선택지 A */}
            <button
              onClick={() => !isClosed && !isVoting && handleVote('A')}
              disabled={isClosed || isVoting || !user || !isVerified}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                userVote === 'A'
                  ? 'border-[#1A2B4E] bg-[#1A2B4E]/5'
                  : 'border-gray-200 hover:border-[#1A2B4E]/50 bg-white'
              } ${isClosed || !user || !isVerified ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-sm font-bold text-gray-900 flex-1 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>A. {poll.optionA?.text || ''}</span>
                {userVote === 'A' && (
                  <Check size={20} className="text-[#1A2B4E] flex-shrink-0" />
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                <div
                  className="bg-[#1A2B4E] h-3 rounded-full transition-all"
                  style={{ width: `${optionAPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{poll.optionA?.votes || 0}표</span>
                <span className="font-bold">{optionAPercent}%</span>
              </div>
            </button>

            {/* 선택지 B */}
            <button
              onClick={() => !isClosed && !isVoting && handleVote('B')}
              disabled={isClosed || isVoting || !user || !isVerified}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                userVote === 'B'
                  ? 'border-[#1A2B4E] bg-[#1A2B4E]/5'
                  : 'border-gray-200 hover:border-[#1A2B4E]/50 bg-white'
              } ${isClosed || !user || !isVerified ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-sm font-bold text-gray-900 flex-1 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>B. {poll.optionB?.text || ''}</span>
                {userVote === 'B' && (
                  <Check size={20} className="text-[#1A2B4E] flex-shrink-0" />
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                <div
                  className="bg-[#1A2B4E] h-3 rounded-full transition-all"
                  style={{ width: `${optionBPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{poll.optionB?.votes || 0}표</span>
                <span className="font-bold">{optionBPercent}%</span>
              </div>
            </button>
          </div>

          {/* 통계 */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-600">
            <span>총 {totalVotes}명 참여</span>
            {poll.businessType && (
              <span className="px-2 py-1 bg-gray-100 rounded-full">{poll.businessType}</span>
            )}
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare size={18} />
            <span>의견 ({comments.length})</span>
          </h3>

          {/* 댓글 작성 */}
          {user && isVerified && !isClosed && (
            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="의견을 남겨주세요..."
                className="w-full h-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1A2B4E] text-sm resize-none"
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCommentOption(commentOption === 'A' ? null : 'A')}
                    className={`px-3 py-1 text-xs rounded-full transition ${
                      commentOption === 'A'
                        ? 'bg-[#1A2B4E] text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    A 의견
                  </button>
                  <button
                    onClick={() => setCommentOption(commentOption === 'B' ? null : 'B')}
                    className={`px-3 py-1 text-xs rounded-full transition ${
                      commentOption === 'B'
                        ? 'bg-[#1A2B4E] text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    B 의견
                  </button>
                </div>
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="px-4 py-1.5 bg-[#1A2B4E] text-white text-xs font-medium rounded-lg hover:bg-[#1A2B4E]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingComment ? '작성 중...' : '작성'}
                </button>
              </div>
            </div>
          )}

          {/* 댓글 목록 */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">아직 의견이 없습니다.</p>
            ) : (
              comments.map((comment: any) => (
                <div key={comment.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900">
                        {comment.authorName || '익명'}
                      </span>
                      {comment.option && (
                        <span className="px-2 py-0.5 bg-[#1A2B4E] text-white text-[10px] rounded-full">
                          {comment.option} 선택
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {user && isVerified ? comment.content : !user ? '🔒 로그인이 필요합니다' : '🔒 사업자 인증이 필요합니다'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  )
}


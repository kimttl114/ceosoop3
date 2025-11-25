'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { ArrowLeft, Trash2, Loader2, Mail, MailOpen, Reply, Flag } from 'lucide-react'
import AvatarMini from '@/components/AvatarMini'
import BottomNav from '@/components/BottomNav'
import MessageModal from '@/components/MessageModal'
import ReportModal from '@/components/ReportModal'

export default function MessageDetailPage() {
  const router = useRouter()
  const params = useParams()
  const messageId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<any>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false)

  // 로그인 상태 확인
  useEffect(() => {
    if (!auth || !db) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.push('/')
      }
    })

    return () => unsubscribe()
  }, [router])

  // 쪽지 불러오기
  useEffect(() => {
    if (!user || !db || !messageId) return

    const loadMessage = async () => {
      try {
        const messageRef = doc(db, 'messages', messageId)
        const messageSnap = await getDoc(messageRef)

        if (!messageSnap.exists()) {
          alert('쪽지를 찾을 수 없습니다.')
          router.push('/messages')
          return
        }

        const messageData = messageSnap.data()
        
        // 본인이 받은 쪽지인지 확인
        if (messageData.receiverId !== user.uid && messageData.senderId !== user.uid) {
          alert('권한이 없습니다.')
          router.push('/messages')
          return
        }

        setMessage({
          id: messageSnap.id,
          ...messageData,
        })

        // 받은 쪽지이고 아직 읽지 않았다면 읽음 처리
        if (messageData.receiverId === user.uid && !messageData.read) {
          await updateDoc(messageRef, {
            read: true,
          })
        }

        setLoading(false)
      } catch (error) {
        console.error('쪽지 불러오기 오류:', error)
        setLoading(false)
      }
    }

    loadMessage()
  }, [user, db, messageId, router])

  // 쪽지 삭제
  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return
    }

    if (!user || !db || !message) return

    try {
      const messageRef = doc(db, 'messages', messageId)
      const isReceived = message.receiverId === user.uid

      if (isReceived) {
        await updateDoc(messageRef, {
          deletedByReceiver: true,
        })
      } else {
        await updateDoc(messageRef, {
          deletedBySender: true,
        })
      }

      router.push('/messages')
    } catch (error) {
      console.error('쪽지 삭제 실패:', error)
      alert('쪽지 삭제에 실패했습니다.')
    }
  }

  // 상대적 시간 포맷팅
  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return ''

    const now = new Date()
    const messageTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const diff = now.getTime() - messageTime.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    return messageTime.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#1A2B4E] mx-auto mb-4" size={48} />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user || !message) {
    return null
  }

  const isReceived = message.receiverId === user.uid
  const otherUserName = isReceived ? message.senderName : message.receiverName

  return (
    <div className="min-h-screen pb-24 relative z-10">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">쪽지</h1>
          </div>
          <div className="flex items-center gap-2">
            {user && isReceived && message.senderId !== user.uid && (
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="p-2 hover:bg-orange-50 rounded-full transition text-orange-600"
                title="신고"
              >
                <Flag size={20} />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-50 rounded-full transition text-red-600"
              title="삭제"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* 쪽지 내용 */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* 발신자/수신자 정보 */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
            <AvatarMini size={50} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-gray-900">
                  {isReceived ? '보낸 사람' : '받는 사람'}
                </span>
                {isReceived && message.read ? (
                  <MailOpen size={16} className="text-gray-400" />
                ) : isReceived ? (
                  <Mail size={16} className="text-[#1A2B4E]" />
                ) : null}
              </div>
              <p className="text-lg font-semibold text-[#1A2B4E]">{otherUserName}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatRelativeTime(message.timestamp)}
              </p>
            </div>
          </div>

          {/* 쪽지 내용 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">내용</h3>
              <div className="bg-gray-50 rounded-xl p-4 min-h-[200px]">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 답장 버튼 (받은 쪽지인 경우만) */}
        {isReceived && (
          <div className="mt-6">
            <button
              onClick={() => setIsReplyModalOpen(true)}
              className="w-full py-3 bg-[#1A2B4E] text-white rounded-xl font-bold hover:bg-[#1A2B4E]/90 transition flex items-center justify-center gap-2"
            >
              <Reply size={20} />
              <span>답장하기</span>
            </button>
          </div>
        )}
      </main>

      {/* 답장 모달 */}
      {isReceived && (
        <MessageModal
          isOpen={isReplyModalOpen}
          onClose={() => setIsReplyModalOpen(false)}
          receiverId={message.senderId}
          receiverName={message.senderName}
          postTitle={message.postTitle ? `Re: ${message.postTitle}` : undefined}
        />
      )}

      {/* 신고 모달 */}
      {message && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          reportType="message"
          targetId={message.id}
          targetAuthorId={message.senderId}
          targetContent={message.content}
        />
      )}

      <BottomNav />
    </div>
  )
}


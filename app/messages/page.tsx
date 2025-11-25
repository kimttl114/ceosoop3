'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore'
import { ArrowLeft, Send, Mail, MailOpen, Trash2, Loader2, Reply, Flag } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import AvatarMini from '@/components/AvatarMini'
import MessageModal from '@/components/MessageModal'
import ReportModal from '@/components/ReportModal'

export default function MessagesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const [receivedMessages, setReceivedMessages] = useState<any[]>([])
  const [sentMessages, setSentMessages] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false)
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string; postTitle?: string } | null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState<{ id: string; authorId?: string; content?: string } | null>(null)

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
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  // 받은 쪽지 불러오기
  useEffect(() => {
    if (!user || !db) return

    const q = query(
      collection(db, 'messages'),
      where('receiverId', '==', user.uid),
      where('deletedByReceiver', '==', false)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        
        // timestamp로 정렬 (클라이언트 사이드)
        const sortedMessages = messages.sort((a: any, b: any) => {
          const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0)
          const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0)
          return bTime.getTime() - aTime.getTime()
        })
        
        setReceivedMessages(sortedMessages)
        
        // 안읽은 쪽지 개수 계산
        const unread = sortedMessages.filter((msg: any) => !msg.read).length
        setUnreadCount(unread)
      },
      (error: any) => {
        console.error('받은 쪽지 불러오기 오류:', error)
        // 인덱스 오류인 경우 안내
        if (error?.code === 'failed-precondition') {
          console.warn('Firestore 인덱스가 필요합니다. Firebase Console에서 인덱스를 생성해주세요.')
        }
      }
    )

    return () => unsubscribe()
  }, [user, db])

  // 보낸 쪽지 불러오기
  useEffect(() => {
    if (!user || !db) return

    const q = query(
      collection(db, 'messages'),
      where('senderId', '==', user.uid),
      where('deletedBySender', '==', false)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        
        // timestamp로 정렬 (클라이언트 사이드)
        const sortedMessages = messages.sort((a: any, b: any) => {
          const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0)
          const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0)
          return bTime.getTime() - aTime.getTime()
        })
        
        setSentMessages(sortedMessages)
      },
      (error: any) => {
        console.error('보낸 쪽지 불러오기 오류:', error)
        if (error?.code === 'failed-precondition') {
          console.warn('Firestore 인덱스가 필요합니다. Firebase Console에서 인덱스를 생성해주세요.')
        }
      }
    )

    return () => unsubscribe()
  }, [user, db])

  // 쪽지 읽음 처리
  const handleMarkAsRead = async (messageId: string) => {
    if (!user || !db) return

    try {
      const messageRef = doc(db, 'messages', messageId)
      await updateDoc(messageRef, {
        read: true,
      })
    } catch (error) {
      console.error('읽음 처리 실패:', error)
    }
  }

  // 쪽지 삭제
  const handleDelete = async (messageId: string, isReceived: boolean) => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return
    }

    if (!user || !db) return

    try {
      const messageRef = doc(db, 'messages', messageId)
      if (isReceived) {
        await updateDoc(messageRef, {
          deletedByReceiver: true,
        })
      } else {
        await updateDoc(messageRef, {
          deletedBySender: true,
        })
      }
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
    return messageTime.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
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

  if (!user) {
    return null
  }

  const currentMessages = activeTab === 'received' ? receivedMessages : sentMessages

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
            <h1 className="text-xl font-bold text-gray-900">쪽지함</h1>
          </div>
        </div>
      </header>

      {/* 탭 */}
      <div className="bg-white border-b border-gray-200 sticky top-[57px] z-20">
        <div className="max-w-md mx-auto px-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 py-3 text-center font-medium transition relative ${
                activeTab === 'received'
                  ? 'text-[#1A2B4E] border-b-2 border-[#1A2B4E]'
                  : 'text-gray-500'
              }`}
            >
              받은 쪽지
              {unreadCount > 0 && activeTab === 'received' && (
                <span className="absolute top-2 right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 py-3 text-center font-medium transition ${
                activeTab === 'sent'
                  ? 'text-[#1A2B4E] border-b-2 border-[#1A2B4E]'
                  : 'text-gray-500'
              }`}
            >
              보낸 쪽지
            </button>
          </div>
        </div>
      </div>

      {/* 쪽지 목록 */}
      <main className="max-w-md mx-auto px-4 py-4">
        {currentMessages.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm mt-4">
            <Mail className="text-gray-300 mx-auto mb-3" size={48} />
            <p className="text-sm text-gray-500">
              {activeTab === 'received' ? '받은 쪽지가 없습니다.' : '보낸 쪽지가 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {currentMessages.map((message: any) => (
              <div
                key={message.id}
                onClick={() => {
                  if (activeTab === 'received' && !message.read) {
                    handleMarkAsRead(message.id)
                  }
                  router.push(`/messages/${message.id}`)
                }}
                className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer border-2 ${
                  activeTab === 'received' && !message.read
                    ? 'border-[#1A2B4E] bg-blue-50'
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AvatarMini size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">
                          {activeTab === 'received' ? message.senderName : message.receiverName}
                        </span>
                        {activeTab === 'received' && !message.read && (
                          <span className="w-2 h-2 bg-[#1A2B4E] rounded-full"></span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {message.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {activeTab === 'received' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setReplyTarget({
                                  id: message.senderId,
                                  name: message.senderName,
                                  postTitle: message.postTitle,
                                })
                                setIsReplyModalOpen(true)
                              }}
                              className="text-xs text-[#1A2B4E] hover:text-[#1A2B4E]/80 transition flex items-center gap-1 font-medium"
                            >
                              <Reply size={14} />
                              <span>답장</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setReportTarget({
                                  id: message.id,
                                  authorId: message.senderId,
                                  content: message.content,
                                })
                                setIsReportModalOpen(true)
                              }}
                              className="text-xs text-orange-600 hover:text-orange-700 transition flex items-center gap-1"
                            >
                              <Flag size={14} />
                              <span>신고</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(message.id, activeTab === 'received')
                          }}
                          className="text-xs text-red-500 hover:text-red-700 transition flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          <span>삭제</span>
                        </button>
                      </div>
                      {activeTab === 'received' && message.read ? (
                        <MailOpen size={14} className="text-gray-400" />
                      ) : activeTab === 'received' ? (
                        <Mail size={14} className="text-[#1A2B4E]" />
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 답장 모달 */}
      {replyTarget && (
        <MessageModal
          isOpen={isReplyModalOpen}
          onClose={() => {
            setIsReplyModalOpen(false)
            setReplyTarget(null)
          }}
          receiverId={replyTarget.id}
          receiverName={replyTarget.name}
          postTitle={replyTarget.postTitle ? `Re: ${replyTarget.postTitle}` : undefined}
        />
      )}

      {/* 신고 모달 */}
      {reportTarget && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false)
            setReportTarget(null)
          }}
          reportType="message"
          targetId={reportTarget.id}
          targetAuthorId={reportTarget.authorId}
          targetContent={reportTarget.content}
        />
      )}

      <BottomNav />
    </div>
  )
}


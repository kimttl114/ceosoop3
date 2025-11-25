'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { X, Send, Loader2 } from 'lucide-react'

interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  receiverId: string
  receiverName: string
  postTitle?: string
}

export default function MessageModal({
  isOpen,
  onClose,
  receiverId,
  receiverName,
  postTitle,
}: MessageModalProps) {
  const [user, setUser] = useState<any>(null)
  const [userAnonymousName, setUserAnonymousName] = useState<string>('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  // 로그인 상태 확인 및 사용자 정보 불러오기
  useEffect(() => {
    if (!auth || !db) return

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      
      if (currentUser && db) {
        try {
          const userRef = doc(db, 'users', currentUser.uid)
          const userSnap = await getDoc(userRef)
          
          if (userSnap.exists()) {
            const userData = userSnap.data()
            if (userData.anonymousName) {
              setUserAnonymousName(userData.anonymousName)
            }
          }
        } catch (error) {
          console.error('사용자 정보 불러오기 오류:', error)
        }
      }
    })

    return () => unsubscribe()
  }, [db])

  // 모달 닫을 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setContent('')
      setSending(false)
    }
  }, [isOpen])

  // 쪽지 보내기
  const handleSend = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!content.trim()) {
      alert('쪽지 내용을 입력해주세요.')
      return
    }

    if (user.uid === receiverId) {
      alert('자기 자신에게는 쪽지를 보낼 수 없습니다.')
      return
    }

    if (!db) {
      alert('Firebase가 초기화되지 않았습니다.')
      return
    }

    setSending(true)

    try {
      const senderName = userAnonymousName || '익명의 사장님'
      
      // 받는 사람의 익명 이름 가져오기
      let finalReceiverName = receiverName
      try {
        const receiverRef = doc(db, 'users', receiverId)
        const receiverSnap = await getDoc(receiverRef)
        if (receiverSnap.exists()) {
          const receiverData = receiverSnap.data()
          if (receiverData.anonymousName) {
            finalReceiverName = receiverData.anonymousName
          }
        }
      } catch (error) {
        console.error('받는 사람 정보 불러오기 오류:', error)
      }

      const messageData = {
        senderId: user.uid,
        receiverId: receiverId,
        senderName: senderName,
        receiverName: finalReceiverName,
        content: content.trim(),
        timestamp: serverTimestamp(),
        read: false,
        deletedBySender: false,
        deletedByReceiver: false,
        postTitle: postTitle || '',
      }

      const docRef = await addDoc(collection(db, 'messages'), messageData)
      
      console.log('쪽지 전송 성공:', docRef.id)
      alert('쪽지가 전송되었습니다!')
      setContent('')
      onClose()
    } catch (error: any) {
      console.error('쪽지 전송 실패:', error)
      console.error('에러 상세:', {
        code: error?.code,
        message: error?.message,
        stack: error?.stack,
      })
      alert('쪽지 전송에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">쪽지 보내기</h2>
            <p className="text-sm text-gray-500 mt-1">받는 사람: {receiverName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {postTitle && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 mb-1">관련 게시글</p>
              <p className="text-sm font-medium text-gray-900">{postTitle}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              쪽지 내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="쪽지 내용을 입력하세요..."
              className="w-full h-48 outline-none resize-none text-gray-700 border-2 border-gray-200 rounded-xl p-4 focus:border-[#1A2B4E] focus:ring-2 focus:ring-[#1A2B4E]/10"
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                익명으로 전송되며, 받는 사람은 보낸 사람의 익명 아이디만 확인할 수 있습니다.
              </p>
              <span className="text-xs text-gray-400">{content.length}/500</span>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
            disabled={sending}
          >
            취소
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !content.trim()}
            className="flex-1 px-4 py-3 bg-[#1A2B4E] text-white rounded-xl font-medium hover:bg-[#1A2B4E]/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>전송 중...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>전송</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}


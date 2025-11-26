'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db, storage } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { ArrowLeft, Sparkles, Download, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { saveAs } from 'file-saver'

// RTF 형식으로 변환 (한글 호환)
const convertToRTF = (text: string): string => {
  // RTF 헤더
  let rtf = '{\\rtf1\\ansi\\ansicpg949\\deff0\\nouicompat\\deflang1033{\\fonttbl{\\f0\\fnil\\fcharset129 \\uc0\\u47569 \\u47548 ;}}\n'
  rtf += '{\\*\\generator 자영업자 대나무숲}\\viewkind4\\uc1 \n'
  
  // 텍스트를 RTF 형식으로 변환
  const lines = text.split('\n')
  lines.forEach((line) => {
    // 특수 문자 이스케이프
    const escaped = line
      .replace(/\\/g, '\\\\')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/\n/g, '\\par ')
    rtf += escaped + '\\par\n'
  })
  
  rtf += '}'
  return rtf
}

export default function AIDocumentPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>({})
  const [userInput, setUserInput] = useState('')
  const [documentType, setDocumentType] = useState('') // 사용자가 선택하거나 AI가 자동 판단
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDocument, setGeneratedDocument] = useState<any>(null)
  const [editedContent, setEditedContent] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<'docx' | 'pdf' | 'txt' | 'hwp'>('docx')
  const [error, setError] = useState<string | null>(null)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [additionalData, setAdditionalData] = useState<Record<string, any>>({})
  const [showAdditionalForm, setShowAdditionalForm] = useState(false)

  // 로그인 상태 확인 및 사용자 정보 불러오기
  useEffect(() => {
    if (!auth || !db) return

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid)
          const userSnap = await getDoc(userRef)
          if (userSnap.exists()) {
            const data = userSnap.data()
            setUserInfo({
              businessName: data.businessName || '',
              businessNumber: data.businessNumber || '',
              representativeName: data.representativeName || data.anonymousName || '',
              address: data.address || '',
            })
          }
        } catch (error) {
          console.error('사용자 정보 불러오기 오류:', error)
        }
      }
    })
    return () => unsubscribe()
  }, [db])

  // 문서 생성
  const handleGenerate = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }

    if (!userInput.trim()) {
      setError('요청 내용을 입력해주세요.')
      return
    }

    if (!documentType) {
      setError('문서 유형을 선택해주세요.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedDocument(null)
    setMissingFields([])
    setWarnings([])

    try {
      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentType,
          userInput,
          userInfo: {}, // 프로필 정보 사용 안 함
          additionalData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // 치명적인 에러만 표시
        if (data.errors && data.errors.length > 0) {
          setError(data.error || '법적 요건 검증에 실패했습니다.')
          setMissingFields(data.errors || [])
          setWarnings(data.warnings || [])
        } else {
          setError(data.error || '문서 생성에 실패했습니다.')
        }
        return
      }

      setGeneratedDocument(data)
      setEditedContent(data.documentContent || '')
      setIsEditing(false)
      setWarnings(data.warnings || [])
      setShowAdditionalForm(false)
      setMissingFields([])
    } catch (error: any) {
      console.error('문서 생성 오류:', error)
      setError('문서 생성 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'))
    } finally {
      setIsGenerating(false)
    }
  }

  // 수정된 내용으로 DOCX 재생성
  const handleRegenerateDocx = async () => {
    if (!editedContent.trim()) {
      alert('내용을 입력해주세요.')
      return
    }

    try {
      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentType,
          userInput: editedContent,
          userInfo: {},
          additionalData: {},
          regenerateOnly: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '문서 재생성에 실패했습니다.')
      }

      setGeneratedDocument({
        ...generatedDocument,
        documentBase64: data.documentBase64,
        documentContent: editedContent,
      })
      alert('문서가 업데이트되었습니다.')
    } catch (error: any) {
      console.error('문서 재생성 오류:', error)
      alert('문서 재생성 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'))
    }
  }

  // 문서 다운로드
  const handleDownload = async () => {
    if (!generatedDocument && !editedContent) return

    try {
      const contentToDownload = editedContent || generatedDocument.documentContent
      const fileName = generatedDocument?.fileName || `${documentType}_${Date.now()}`

      if (downloadFormat === 'txt') {
        // TXT 파일 다운로드
        const blob = new Blob([contentToDownload], { type: 'text/plain;charset=utf-8' })
        saveAs(blob, fileName.replace('.docx', '.txt'))
      } else if (downloadFormat === 'hwp') {
        // HWP 파일 다운로드 (RTF 형식으로 제공, 한글에서 열어서 HWP로 저장 가능)
        const rtfContent = convertToRTF(contentToDownload)
        const blob = new Blob([rtfContent], { type: 'application/x-rtf' })
        saveAs(blob, fileName.replace('.docx', '.rtf'))
        alert('한글 파일 형식은 RTF로 저장됩니다. 한글 프로그램에서 열어 HWP로 변환할 수 있습니다.')
      } else if (downloadFormat === 'pdf') {
        // PDF는 서버에서 생성 필요
        alert('PDF 다운로드는 준비 중입니다. 현재는 DOCX, TXT, HWP 형식을 지원합니다.')
        return
      } else {
        // DOCX 파일 다운로드
        let docxBase64 = generatedDocument.documentBase64

        // 수정된 내용이 있으면 재생성
        if (editedContent && editedContent !== generatedDocument.documentContent) {
          try {
            const response = await fetch('/api/generate-document', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                documentType,
                userInput: editedContent,
                userInfo: {},
                additionalData: {},
                regenerateOnly: true,
              }),
            })
            const data = await response.json()
            if (response.ok) {
              docxBase64 = data.documentBase64
              // 업데이트된 문서 정보 저장
              setGeneratedDocument({
                ...generatedDocument,
                documentBase64: data.documentBase64,
                documentContent: editedContent,
              })
            }
          } catch (regenerateError) {
            console.error('문서 재생성 오류:', regenerateError)
            // 재생성 실패해도 기존 문서로 다운로드
          }
        }

        const byteCharacters = atob(docxBase64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })

        saveAs(blob, fileName)

        // Firebase Storage에 저장 (DOCX 형식으로 저장)
        if (user && storage) {
          try {
            const finalFileName = fileName
            const blobToSave = blob
            const storageRef = ref(storage, `generated_documents/${user.uid}/${Date.now()}_${finalFileName}`)
            await uploadBytes(storageRef, blobToSave)
            const downloadUrl = await getDownloadURL(storageRef)

            // Firestore에 기록 저장
            if (db) {
              await addDoc(collection(db, 'generated_documents'), {
                userId: user.uid,
                documentType,
                fileName: finalFileName,
                downloadUrl,
                userInput: editedContent || userInput,
                extractedData: generatedDocument?.extractedData || {},
                createdAt: serverTimestamp(),
              })
            }
          } catch (storageError) {
            console.error('Firebase Storage 저장 오류:', storageError)
          }
        }
      }
    } catch (error: any) {
      console.error('다운로드 오류:', error)
      alert('다운로드 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'))
    }
  }


  return (
    <div className="min-h-screen pb-24 relative z-10 bg-[#F5F7FA]">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-[#1A2B4E] to-[#2C3E50] sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/20 rounded-full transition text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles size={24} />
              <span>AI 서류양식 생성기</span>
            </h1>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">💡 사용 방법</p>
              <p>필요한 서류를 자연어로 입력하시면 AI가 자동으로 생성해드립니다.</p>
              <p className="mt-2 text-xs text-blue-600">
                * 생성된 문서는 참고용이며, 법적 검토를 권장합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 문서 유형 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            문서 유형
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1A2B4E] text-gray-800 bg-white"
          >
            <option value="">문서 유형을 선택하세요</option>
            <option value="근로계약서">근로계약서</option>
            <option value="영수증">영수증</option>
            <option value="임대차계약서">임대차계약서</option>
            <option value="급여명세서">급여명세서</option>
            <option value="공급계약서">공급계약서</option>
            <option value="세금계산서">세금계산서</option>
          </select>
        </div>

        {/* 입력 영역 */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            어떤 서류가 필요하신가요?
          </label>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="예: 치킨집 직원용 근로계약서 만들어줘. 시급 9,500원, 주 5일 근무, 오후 2시부터 밤 10시까지, 3개월 계약기간"
            className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1A2B4E] focus:ring-2 focus:ring-[#1A2B4E]/10 text-gray-800 resize-none"
          />
        </div>



        {/* 경고 메시지 */}
        {warnings.length > 0 && !showAdditionalForm && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="font-semibold text-yellow-800">⚠️ 주의사항</p>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && !showAdditionalForm && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700 mb-2">{error}</p>
              {missingFields.length > 0 && (
                <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                  {missingFields.map((field, index) => (
                    <li key={index}>{field}</li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => {
                setError(null)
                setMissingFields([])
                setWarnings([])
              }}
              className="text-red-500 hover:text-red-700"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* 생성 버튼 */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !userInput.trim() || !documentType}
          className="w-full py-4 bg-gradient-to-r from-[#1A2B4E] to-[#2C3E50] text-white rounded-xl font-bold hover:from-[#1A2B4E]/90 hover:to-[#2C3E50]/90 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>AI가 문서를 생성하고 있어요...</span>
            </>
          ) : (
            <>
              <Sparkles size={20} />
              <span>문서 생성하기</span>
            </>
          )}
        </button>

        {/* 생성된 문서 미리보기 및 편집 */}
        {generatedDocument && (
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={24} className="text-green-500" />
                <h3 className="text-lg font-bold text-gray-900">문서 생성 완료!</h3>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium"
              >
                {isEditing ? '편집 완료' : '✏️ 편집하기'}
              </button>
            </div>

            {/* 경고 메시지 */}
            {warnings.length > 0 && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="font-semibold text-yellow-800 text-sm">⚠️ 주의사항</p>
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs text-yellow-700">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 문서 내용 (편집 가능) */}
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onCopy={(e) => {
                  e.preventDefault()
                  alert('복사가 제한되어 있습니다.')
                }}
                onCut={(e) => {
                  e.preventDefault()
                  alert('잘라내기가 제한되어 있습니다.')
                }}
                onPaste={(e) => {
                  // 붙여넣기는 허용 (편집을 위해)
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  alert('우클릭이 제한되어 있습니다.')
                }}
                className="w-full h-96 px-4 py-3 border-2 border-[#1A2B4E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E]/10 text-gray-800 resize-none font-sans text-sm leading-relaxed no-copy"
                placeholder="문서 내용을 수정하세요..."
              />
            ) : (
              <div 
                className="bg-gray-50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto no-copy"
                onCopy={(e) => {
                  e.preventDefault()
                  alert('복사가 제한되어 있습니다.')
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  alert('우클릭이 제한되어 있습니다.')
                }}
              >
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {editedContent}
                </pre>
              </div>
            )}

            {/* 다운로드 형식 선택 */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                다운로드 형식
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDownloadFormat('docx')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    downloadFormat === 'docx'
                      ? 'bg-[#1A2B4E] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  DOCX
                </button>
                <button
                  onClick={() => setDownloadFormat('hwp')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    downloadFormat === 'hwp'
                      ? 'bg-[#1A2B4E] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  한글 (HWP)
                </button>
                <button
                  onClick={() => setDownloadFormat('txt')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    downloadFormat === 'txt'
                      ? 'bg-[#1A2B4E] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  TXT
                </button>
                <button
                  onClick={() => setDownloadFormat('pdf')}
                  disabled
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    downloadFormat === 'pdf'
                      ? 'bg-[#1A2B4E] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } opacity-50 cursor-not-allowed`}
                  title="준비 중"
                >
                  PDF (준비중)
                </button>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#FFBF00] to-[#F59E0B] text-[#1A2B4E] rounded-xl font-bold hover:from-[#FFBF00]/90 hover:to-[#F59E0B]/90 transition shadow-lg flex items-center justify-center gap-2"
              >
                <Download size={20} />
                <span>{downloadFormat.toUpperCase()} 다운로드</span>
              </button>
              {isEditing && editedContent !== generatedDocument.documentContent && (
                <button
                  onClick={handleRegenerateDocx}
                  className="px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
                  title="수정된 내용으로 DOCX 재생성"
                >
                  저장
                </button>
              )}
              <button
                onClick={() => {
                  setGeneratedDocument(null)
                  setEditedContent('')
                  setUserInput('')
                  setAdditionalData({})
                  setWarnings([])
                  setIsEditing(false)
                }}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition"
              >
                새로 만들기
              </button>
            </div>
          </div>
        )}

        {/* 비로그인 안내 */}
        {!user && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-4">로그인하면 AI 서류양식 생성기를 사용할 수 있습니다.</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-[#1A2B4E] text-white rounded-lg font-medium hover:bg-[#1A2B4E]/90 transition"
            >
              로그인하기
            </button>
          </div>
        )}
      </main>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  )
}


'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mic, Music, Download, Loader2, Upload, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { auth, storage, db } from '@/lib/firebase'
import { ref, listAll, getDownloadURL, uploadBytes } from 'firebase/storage'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import BottomNav from '@/components/BottomNav'

export default function AnnouncementPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [text, setText] = useState('잠시 후 영업을 종료합니다. 찾아주셔서 감사합니다.')
  const [selectedBgm, setSelectedBgm] = useState<string>('none')
  const [bgmFiles, setBgmFiles] = useState<Array<{ name: string; url: string; type: 'public' | 'private' }>>([])
  const [loadingBgm, setLoadingBgm] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingBgm, setUploadingBgm] = useState(false)
  const [localBgmFiles, setLocalBgmFiles] = useState<string[]>([])
  const [uploadingPublicBgm, setUploadingPublicBgm] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [volume, setVolume] = useState(1)

  // 사용자 인증 확인
  useEffect(() => {
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  // BGM 파일 목록 불러오기
  useEffect(() => {
    loadBgmFiles()
    loadLocalBgmFiles()
  }, [user])

  // 로컬 BGM 파일 목록 불러오기
  const loadLocalBgmFiles = async () => {
    try {
      const response = await fetch('/api/upload-public-bgm')
      if (response.ok) {
        const data = await response.json()
        setLocalBgmFiles(data.files || [])
      }
    } catch (error) {
      console.error('로컬 BGM 목록 불러오기 실패:', error)
    }
  }

  // 로컬 BGM을 공용으로 업로드
  const handleUploadLocalBgm = async (fileName?: string) => {
    if (localBgmFiles.length === 0) {
      alert('업로드할 로컬 BGM 파일이 없습니다.')
      return
    }

    let targetFileName: string | null | undefined = fileName

    if (!targetFileName) {
      // 파일 선택 UI
      const fileList = localBgmFiles.join('\n')
      const promptResult = prompt(
        `업로드할 파일명을 입력하세요:\n\n${fileList}\n\n(모든 파일을 업로드하려면 "all" 입력)`,
        localBgmFiles[0]
      )
      targetFileName = promptResult

      if (!targetFileName) {
        return
      }

      // 모든 파일 업로드
      if (targetFileName.toLowerCase() === 'all') {
        for (const file of localBgmFiles) {
          await uploadSingleFile(file)
        }
        await loadBgmFiles()
        return
      }

      if (!localBgmFiles.includes(targetFileName)) {
        alert('존재하지 않는 파일명입니다.')
        return
      }
    }

    await uploadSingleFile(targetFileName)
  }

  // 단일 파일 업로드
  const uploadSingleFile = async (fileName: string) => {
    if (!storage) {
      alert('Storage가 초기화되지 않았습니다.')
      return
    }

    setUploadingPublicBgm(true)
    setError(null)

    try {
      // 1. 서버에서 파일 읽기 (Base64)
      const response = await fetch('/api/upload-public-bgm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '파일 읽기 실패')
      }

      // 2. Base64를 Blob으로 변환
      const byteCharacters = atob(data.base64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: data.contentType || 'audio/mpeg' })

      // 3. Firebase Storage에 업로드
      const publicBgmRef = ref(storage, `bgm/public/${fileName}`)
      await uploadBytes(publicBgmRef, blob)

      alert(`${fileName}이(가) 공용 BGM으로 업로드되었습니다!`)
      await loadBgmFiles()
    } catch (error: any) {
      console.error(`${fileName} 업로드 실패:`, error)
      alert(`${fileName} 업로드 실패: ${error.message || '알 수 없는 오류'}`)
    } finally {
      setUploadingPublicBgm(false)
    }
  }

  const loadBgmFiles = async () => {
    if (!storage) return

    setLoadingBgm(true)
    setError(null)
    
    try {
      const allFiles: Array<{ name: string; url: string; type: 'public' | 'private' }> = []

      // 1. 공용 BGM 로드 (모든 사용자가 사용 가능)
      try {
        const publicBgmRef = ref(storage, 'bgm/public')
        const publicFileList = await listAll(publicBgmRef)
        
        const publicFiles = await Promise.all(
          publicFileList.items.map(async (item) => {
            const url = await getDownloadURL(item)
            return { 
              name: item.name, 
              url,
              type: 'public' as const
            }
          })
        )
        
        allFiles.push(...publicFiles)
      } catch (error: any) {
        // 공용 폴더가 없거나 접근 불가능한 경우는 무시
        if (error.code !== 'storage/object-not-found' && error.code !== 'storage/unauthorized') {
          console.warn('공용 BGM 파일 목록 불러오기 실패:', error)
        }
      }

      // 2. 개인 BGM 로드 (로그인한 사용자만)
      if (user) {
        try {
          const privateBgmRef = ref(storage, `bgm/${user.uid}`)
          const privateFileList = await listAll(privateBgmRef)
          
          const privateFiles = await Promise.all(
            privateFileList.items.map(async (item) => {
              const url = await getDownloadURL(item)
              return { 
                name: item.name, 
                url,
                type: 'private' as const
              }
            })
          )
          
          allFiles.push(...privateFiles)
        } catch (error: any) {
          // 개인 폴더가 없거나 접근 불가능한 경우는 무시
          if (error.code !== 'storage/object-not-found' && error.code !== 'storage/unauthorized') {
            console.warn('개인 BGM 파일 목록 불러오기 실패:', error)
          }
        }
      }
      
      setBgmFiles(allFiles)
    } catch (error: any) {
      console.error('BGM 파일 목록 불러오기 오류:', error)
      setBgmFiles([])
    } finally {
      setLoadingBgm(false)
    }
  }

  // BGM 파일 업로드
  const handleBgmUpload = async (file: File) => {
    if (!user || !storage) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!file.type.startsWith('audio/')) {
      alert('오디오 파일만 업로드 가능합니다.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.')
      return
    }

    setUploadingBgm(true)
    setError(null)

    try {
      const bgmRef = ref(storage, `bgm/${user.uid}/${Date.now()}_${file.name}`)
      await uploadBytes(bgmRef, file)
      await loadBgmFiles()
      alert('BGM 파일이 업로드되었습니다.')
    } catch (error: any) {
      console.error('BGM 업로드 실패:', error)
      alert('BGM 업로드에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
    } finally {
      setUploadingBgm(false)
    }
  }

  // TTS 음성 생성 (서버 API 호출)
  const generateSpeech = async (text: string): Promise<Blob> => {
    try {
      // 서버 API 호출
      const response = await fetch('/api/generate-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, bgmUrl: null }),
      })

      if (response.ok) {
        return await response.blob()
      }

      // 서버 API가 준비되지 않은 경우
      throw new Error('서버 TTS API가 준비되지 않았습니다.')
    } catch (error: any) {
      throw new Error('음성 생성에 실패했습니다. 서버 TTS API 설정이 필요합니다.')
    }
  }

  // 오디오 믹싱 (Web Audio API)
  const mixAudio = async (voiceBlob: Blob, bgmUrl: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // Voice 오디오 로드
        const voiceUrl = URL.createObjectURL(voiceBlob)
        const voiceAudio = new Audio(voiceUrl)
        
        voiceAudio.addEventListener('loadeddata', async () => {
          try {
            // Voice 길이 확인
            const voiceDuration = voiceAudio.duration

            // BGM 오디오 로드
            const bgmAudio = new Audio(bgmUrl)
            
            bgmAudio.addEventListener('loadeddata', async () => {
              try {
                // BGM 반복 설정 (Voice 길이만큼)
                bgmAudio.loop = true
                
                // Web Audio API로 믹싱
                const voiceSource = audioContext.createMediaElementSource(voiceAudio)
                const bgmSource = audioContext.createMediaElementSource(bgmAudio)
                
                // Gain 노드로 볼륨 조절 (Voice: 1.0, BGM: -15dB ≈ 0.178)
                const voiceGain = audioContext.createGain()
                voiceGain.gain.value = 1.0
                
                const bgmGain = audioContext.createGain()
                bgmGain.gain.value = 0.178 // -15dB
                
                // BGM 페이드 아웃 (Voice 끝나는 시점부터 2초 동안)
                const fadeOutStart = voiceDuration
                const fadeOutEnd = voiceDuration + 2
                bgmGain.gain.setValueAtTime(0.178, fadeOutStart)
                bgmGain.gain.linearRampToValueAtTime(0, fadeOutEnd)
                
                // Destination으로 연결 (믹싱)
                const destination = audioContext.createMediaStreamDestination()
                voiceGain.connect(destination)
                bgmGain.connect(destination)
                
                // MediaRecorder로 최종 오디오 녹음
                const mediaRecorder = new MediaRecorder(destination.stream, {
                  mimeType: 'audio/webm;codecs=opus'
                })
                
                const chunks: Blob[] = []
                
                mediaRecorder.ondataavailable = (e) => {
                  if (e.data.size > 0) {
                    chunks.push(e.data)
                  }
                }
                
                mediaRecorder.onstop = () => {
                  const finalBlob = new Blob(chunks, { type: 'audio/webm' })
                  resolve(finalBlob)
                  URL.revokeObjectURL(voiceUrl)
                  audioContext.close()
                }
                
                // 녹음 시작
                mediaRecorder.start()
                
                // 오디오 재생
                const playPromise1 = voiceAudio.play()
                const playPromise2 = bgmAudio.play()
                
                Promise.all([playPromise1, playPromise2]).catch(reject)
                
                // Voice 길이 + 2초 후 정지
                setTimeout(() => {
                  mediaRecorder.stop()
                  voiceAudio.pause()
                  bgmAudio.pause()
                  voiceAudio.currentTime = 0
                  bgmAudio.currentTime = 0
                }, (voiceDuration + 2) * 1000)
                
              } catch (error) {
                reject(error)
                URL.revokeObjectURL(voiceUrl)
              }
            })
            
            bgmAudio.addEventListener('error', () => {
              reject(new Error('BGM 로드 실패'))
              URL.revokeObjectURL(voiceUrl)
            })
            
            bgmAudio.load()
            
          } catch (error) {
            reject(error)
            URL.revokeObjectURL(voiceUrl)
          }
        })
        
        voiceAudio.addEventListener('error', () => {
          reject(new Error('Voice 로드 실패'))
          URL.revokeObjectURL(voiceUrl)
        })
        
        voiceAudio.load()
        
      } catch (error: any) {
        reject(new Error('오디오 믹싱 실패: ' + (error.message || '알 수 없는 오류')))
      }
    })
  }

  // 방송 생성
  const handleGenerate = async () => {
    if (!text.trim()) {
      alert('안내 문구를 입력해주세요.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setAudioUrl(null)
    setAudioBlob(null)

    try {
      // 1. TTS 음성 생성
      const voiceBlob = await generateSpeech(text)
      
      // 2. BGM 선택 여부 확인
      const bgmUrl = selectedBgm !== 'none' 
        ? bgmFiles.find(f => {
            if (selectedBgm.startsWith('public_')) {
              return f.type === 'public' && selectedBgm === `public_${f.name}`
            } else if (selectedBgm.startsWith('private_')) {
              return f.type === 'private' && selectedBgm === `private_${f.name}`
            }
            return false
          })?.url
        : undefined

      // 3. 오디오 믹싱
      const finalBlob = bgmUrl 
        ? await mixAudio(voiceBlob, bgmUrl)
        : voiceBlob

      // 4. 결과 표시
      const url = URL.createObjectURL(finalBlob)
      setAudioUrl(url)
      setAudioBlob(finalBlob)

    } catch (error: any) {
      console.error('방송 생성 실패:', error)
      setError(error.message || '방송 생성에 실패했습니다.')
      alert('방송 생성에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
    } finally {
      setIsGenerating(false)
    }
  }

  // 오디오 재생/일시정지
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // 오디오 다운로드
  const handleDownload = () => {
    if (!audioBlob) return

    const url = URL.createObjectURL(audioBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `안내방송_${Date.now()}.mp3`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Mic size={24} />
            <span>안내방송 생성기</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          {/* 안내 */}
          <div className="text-center">
            <div className="text-4xl mb-2">🎙️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">AI 매장 안내방송 제작소</h2>
            <p className="text-sm text-gray-600">텍스트를 입력하면 안내방송이 자동으로 생성됩니다</p>
          </div>

          {/* BGM 설정 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Music size={16} className="inline mr-1" />
              배경음악 (BGM)
            </label>
            
            <div className="space-y-3">
              <select
                value={selectedBgm}
                onChange={(e) => setSelectedBgm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E]"
                disabled={loadingBgm || uploadingBgm}
              >
                <option value="none">배경음악 없음</option>
                {/* 공용 BGM */}
                {bgmFiles.filter(f => f.type === 'public').length > 0 && (
                  <optgroup label="🔊 공용 BGM">
                    {bgmFiles
                      .filter(f => f.type === 'public')
                      .map((file) => (
                        <option key={`public_${file.name}`} value={`public_${file.name}`}>
                          {file.name.replace(/^\d+_/, '')}
                        </option>
                      ))}
                  </optgroup>
                )}
                {/* 개인 BGM */}
                {bgmFiles.filter(f => f.type === 'private').length > 0 && (
                  <optgroup label="🎵 내 BGM">
                    {bgmFiles
                      .filter(f => f.type === 'private')
                      .map((file) => (
                        <option key={`private_${file.name}`} value={`private_${file.name}`}>
                          {file.name.replace(/^\d+_/, '')}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>

              {loadingBgm && (
                <p className="text-xs text-gray-500 text-center">BGM 목록을 불러오는 중...</p>
              )}

              {/* BGM 업로드 */}
              {user && (
                <>
                  <label className="block">
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleBgmUpload(file)
                      }}
                      disabled={uploadingBgm}
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#1A2B4E] transition">
                      {uploadingBgm ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-gray-400" />
                          <span className="text-sm text-gray-500">업로드 중...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">개인 BGM 업로드</span>
                        </>
                      )}
                    </div>
                  </label>
                  {localBgmFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 font-semibold">📁 로컬 BGM 파일 ({localBgmFiles.length}개)</p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {localBgmFiles.map((fileName) => (
                          <button
                            key={fileName}
                            onClick={() => handleUploadLocalBgm(fileName)}
                            disabled={uploadingBgm || uploadingPublicBgm}
                            className="w-full px-3 py-1.5 text-left bg-green-50 border border-green-200 rounded text-xs hover:bg-green-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                          >
                            <span className="truncate flex-1">{fileName}</span>
                            <Upload size={12} className="flex-shrink-0 ml-2" />
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => handleUploadLocalBgm('all')}
                        disabled={uploadingBgm || uploadingPublicBgm}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {uploadingPublicBgm ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>모든 파일 업로드 중...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            <span>모든 로컬 BGM을 공용으로 업로드</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}

              {!user && (
                <p className="text-xs text-gray-500 text-center">로그인하면 BGM을 업로드할 수 있습니다</p>
              )}
            </div>
          </div>

          {/* 텍스트 입력 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              안내 문구
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="잠시 후 영업을 종료합니다. 찾아주셔서 감사합니다."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E] resize-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{text.length}자</p>
          </div>

          {/* 생성 버튼 */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            className="w-full bg-[#1A2B4E] text-white py-4 rounded-xl font-bold hover:bg-[#1A2B4E]/90 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>생성 중...</span>
              </>
            ) : (
              <>
                <Mic size={20} />
                <span>방송 만들기</span>
              </>
            )}
          </button>

          {/* 오류 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">⚠️ {error}</p>
            </div>
          )}

          {/* 결과 */}
          {audioUrl && audioBlob && (
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h3 className="font-bold text-gray-900">생성된 방송</h3>
              
              {/* 오디오 플레이어 */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onTimeUpdate={() => {
                    // 진행바 업데이트를 위한 강제 리렌더링
                    if (audioRef.current) {
                      setVolume(audioRef.current.volume)
                    }
                  }}
                  className="w-full"
                  controls
                />
                
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 bg-[#1A2B4E] text-white rounded-full flex items-center justify-center hover:bg-[#1A2B4E]/90 transition"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                  >
                    <Download size={16} />
                    <span className="text-sm font-medium">다운로드</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 안내 메시지 */}
          {!isGenerating && !audioUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2">
                💡 <strong>사용 방법:</strong>
              </p>
              <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                <li>안내 문구를 입력하세요</li>
                <li>BGM을 선택하거나 업로드하세요 (선택사항)</li>
                <li>"방송 만들기" 버튼을 클릭하세요</li>
              </ul>
              <p className="text-xs text-blue-600 mt-3">
                ⚠️ 실제 TTS 기능은 서버 API 설정이 필요합니다.
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}


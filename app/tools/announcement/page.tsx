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
  
  // TTS 음성 설정
  const [voiceLang, setVoiceLang] = useState<string>('ko') // 언어
  const [voiceSpeed, setVoiceSpeed] = useState<'normal' | 'slow'>('normal') // 속도
  const [voiceGender, setVoiceGender] = useState<'male' | 'female' | 'neutral'>('neutral') // 음성 성별
  const [voiceTld, setVoiceTld] = useState<string>('com') // TLD (방언)

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

    // "all" 처리 (파일명이 아니므로 먼저 체크)
    if (targetFileName && targetFileName.toLowerCase() === 'all') {
      targetFileName = null // prompt로 처리하도록
    }

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
        setUploadingPublicBgm(true)
        let successCount = 0
        let failCount = 0
        const failedFiles: string[] = []
        const successFiles: string[] = []

        for (const file of localBgmFiles) {
          try {
            await uploadSingleFile(file, true) // true = 배치 업로드 중 (alert 없음)
            successCount++
            successFiles.push(file)
          } catch (error: any) {
            failCount++
            failedFiles.push(file)
            console.error(`${file} 업로드 실패:`, error)
          }
        }

        setUploadingPublicBgm(false)
        await loadBgmFiles()

        // 결과 요약 메시지
        if (failCount === 0) {
          alert(`✅ 모든 파일 업로드 완료!\n\n성공: ${successCount}개\n\n업로드된 파일:\n${successFiles.join('\n')}`)
        } else if (successCount > 0) {
          alert(`⚠️ 부분 업로드 완료\n\n✅ 성공: ${successCount}개\n${successFiles.map(f => `  - ${f}`).join('\n')}\n\n❌ 실패: ${failCount}개\n${failedFiles.map(f => `  - ${f}`).join('\n')}\n\n실패한 파일은 서버의 bgm 폴더에 있는지 확인해주세요.`)
        } else {
          alert(`❌ 모든 파일 업로드 실패\n\n실패한 파일:\n${failedFiles.map(f => `  - ${f}`).join('\n')}\n\n파일이 서버의 bgm 폴더에 있는지 확인해주세요.`)
        }
        return
      }

      if (!localBgmFiles.includes(targetFileName)) {
        alert('존재하지 않는 파일명입니다.')
        return
      }
    }

    // 단일 파일 업로드
    if (!localBgmFiles.includes(targetFileName)) {
      alert(`파일을 찾을 수 없습니다: ${targetFileName}\n\n서버의 bgm 폴더에 파일이 있는지 확인해주세요.`)
      return
    }

    await uploadSingleFile(targetFileName, false) // false = 단일 업로드 (alert 표시)
  }

  // 단일 파일 업로드
  // isBatch: true = 배치 업로드 중 (alert 없음), false = 단일 업로드 (alert 표시)
  const uploadSingleFile = async (fileName: string, isBatch: boolean = false): Promise<void> => {
    if (!storage) {
      const error = new Error('Storage가 초기화되지 않았습니다.')
      throw error
    }

    // 배치 업로드 중이 아니면 로딩 상태 설정
    if (!isBatch && !uploadingPublicBgm) {
      setUploadingPublicBgm(true)
    }
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
        throw new Error(data.error || '파일을 찾을 수 없습니다.')
      }

      if (!data.base64) {
        throw new Error('파일 데이터를 받을 수 없습니다.')
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

      console.log(`${fileName} 업로드 성공`)
      
      // 단일 파일 업로드일 때만 alert 표시 및 BGM 목록 새로고침
      if (!isBatch) {
        alert(`${fileName}이(가) 공용 BGM으로 업로드되었습니다!`)
        await loadBgmFiles()
      }
    } catch (error: any) {
      console.error(`${fileName} 업로드 실패:`, error)
      // 단일 파일 업로드일 때만 alert 표시
      if (!isBatch) {
        alert(`${fileName} 업로드 실패: ${error.message || '알 수 없는 오류'}\n\n파일이 서버의 bgm 폴더에 있는지 확인해주세요.`)
      }
      throw error // 에러를 다시 throw하여 상위 함수에서 처리할 수 있도록
    } finally {
      // 단일 파일 업로드일 때만 상태 초기화
      if (!isBatch) {
        setUploadingPublicBgm(false)
      }
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
      console.log('TTS 음성 생성 시작:', text.substring(0, 50))
      
      // 서버 API 호출
      const response = await fetch('/api/generate-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, bgmUrl: null }),
      })

      if (response.ok) {
        const blob = await response.blob()
        console.log('TTS 음성 생성 완료:', {
          size: blob.size,
          type: blob.type,
          url: URL.createObjectURL(blob)
        })
        
        // Blob이 비어있는지 확인
        if (blob.size === 0) {
          throw new Error('생성된 오디오 파일이 비어있습니다.')
        }
        
        // Blob 크기가 너무 작으면 문제일 수 있음 (최소 1KB 이상)
        if (blob.size < 1024) {
          console.warn('생성된 오디오 파일이 너무 작습니다:', blob.size, 'bytes')
        }
        
        return blob
      }

      // 에러 응답 처리
      let errorMessage = '음성 생성에 실패했습니다.'
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
        
        console.error('TTS API 에러:', errorData)
        
        // 구체적인 에러 메시지 제공
        if (errorData.error?.includes('Python')) {
          errorMessage = 'Python이 설치되지 않았습니다. Python을 설치해주세요.'
        } else if (errorData.error?.includes('gtts') || errorData.error?.includes('pydub')) {
          errorMessage = '필수 Python 라이브러리가 설치되지 않았습니다.\n다음 명령어로 설치해주세요:\npy -m pip install gtts pydub'
        } else if (errorData.error?.includes('FFmpeg')) {
          errorMessage = 'FFmpeg가 설치되지 않았습니다. BGM 없이 생성하려면 FFmpeg 설치가 필요합니다.'
        }
      } catch {
        // JSON 파싱 실패 시 기본 메시지 사용
      }

      throw new Error(errorMessage)
    } catch (error: any) {
      console.error('TTS 음성 생성 실패:', error)
      // 네트워크 오류 또는 기타 오류
      if (error.message && !error.message.includes('음성 생성에 실패')) {
        throw error
      }
      throw new Error(error.message || '음성 생성에 실패했습니다. 서버 설정을 확인해주세요.')
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
                let mediaRecorder: MediaRecorder | null = null
                
                // MediaRecorder 지원 형식 확인
                const supportedMimeTypes = [
                  'audio/webm;codecs=opus',
                  'audio/webm',
                  'audio/ogg;codecs=opus',
                  'audio/mp4',
                ]
                
                let selectedMimeType = 'audio/webm'
                for (const mimeType of supportedMimeTypes) {
                  if (MediaRecorder.isTypeSupported(mimeType)) {
                    selectedMimeType = mimeType
                    console.log('MediaRecorder MIME 타입 선택:', selectedMimeType)
                    break
                  }
                }
                
                try {
                  mediaRecorder = new MediaRecorder(destination.stream, {
                    mimeType: selectedMimeType
                  })
                } catch (e: any) {
                  console.error('MediaRecorder 생성 실패:', e)
                  // 기본 형식으로 재시도
                  try {
                    mediaRecorder = new MediaRecorder(destination.stream)
                  } catch (e2: any) {
                    reject(new Error('MediaRecorder를 생성할 수 없습니다: ' + e2.message))
                    return
                  }
                }
                
                const chunks: Blob[] = []
                let recordingStopped = false
                
                mediaRecorder.ondataavailable = (e) => {
                  if (e.data && e.data.size > 0) {
                    console.log('오디오 데이터 수신:', e.data.size, 'bytes')
                    chunks.push(e.data)
                  }
                }
                
                mediaRecorder.onstop = () => {
                  console.log('녹음 중지, 총 청크 수:', chunks.length)
                  
                  if (chunks.length === 0) {
                    reject(new Error('녹음된 오디오 데이터가 없습니다.'))
                    URL.revokeObjectURL(voiceUrl)
                    audioContext.close()
                    return
                  }
                  
                  const finalBlob = new Blob(chunks, { type: selectedMimeType })
                  console.log('최종 오디오 Blob 생성:', {
                    size: finalBlob.size,
                    type: finalBlob.type
                  })
                  
                  if (finalBlob.size === 0) {
                    reject(new Error('생성된 오디오 파일이 비어있습니다.'))
                    URL.revokeObjectURL(voiceUrl)
                    audioContext.close()
                    return
                  }
                  
                  resolve(finalBlob)
                  
                  // 정리
                  setTimeout(() => {
                    URL.revokeObjectURL(voiceUrl)
                    audioContext.close()
                  }, 1000)
                }
                
                mediaRecorder.onerror = (e: any) => {
                  console.error('MediaRecorder 오류:', e)
                  reject(new Error('녹음 중 오류가 발생했습니다: ' + (e.error?.message || '알 수 없는 오류')))
                  URL.revokeObjectURL(voiceUrl)
                  audioContext.close()
                }
                
                // 녹음 시작 (timeslice를 지정하여 주기적으로 데이터 수신)
                mediaRecorder.start(100) // 100ms마다 데이터 수신
                console.log('녹음 시작:', { duration: voiceDuration, mimeType: selectedMimeType })
                
                // 오디오 재생
                const playPromise1 = voiceAudio.play().catch((e) => {
                  console.error('Voice 재생 실패:', e)
                })
                const playPromise2 = bgmAudio.play().catch((e) => {
                  console.error('BGM 재생 실패:', e)
                })
                
                Promise.all([playPromise1, playPromise2]).catch((e) => {
                  console.warn('오디오 재생 경고:', e)
                  // 재생 실패해도 녹음은 계속 진행
                })
                
                // Voice 길이 + 2초 후 정지
                const stopTimeout = setTimeout(() => {
                  if (!recordingStopped && mediaRecorder && mediaRecorder.state !== 'inactive') {
                    recordingStopped = true
                    console.log('녹음 중지 예약')
                    
                    // MediaRecorder 상태 확인
                    if (mediaRecorder.state === 'recording') {
                      mediaRecorder.stop()
                    } else {
                      console.warn('MediaRecorder가 이미 중지됨:', mediaRecorder.state)
                    }
                    
                    voiceAudio.pause()
                    bgmAudio.pause()
                    voiceAudio.currentTime = 0
                    bgmAudio.currentTime = 0
                  }
                }, (voiceDuration + 2) * 1000)
                
                // 오디오가 끝나면 자동으로 정지
                voiceAudio.addEventListener('ended', () => {
                  console.log('Voice 재생 완료')
                  setTimeout(() => {
                    if (!recordingStopped && mediaRecorder && mediaRecorder.state !== 'inactive') {
                      recordingStopped = true
                      clearTimeout(stopTimeout)
                      if (mediaRecorder.state === 'recording') {
                        mediaRecorder.stop()
                      }
                      voiceAudio.pause()
                      bgmAudio.pause()
                    }
                  }, 2000) // 2초 후 정지 (페이드 아웃)
                })
                
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
      // 1. BGM 선택 여부 확인
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

      console.log('방송 생성 시작:', { text: text.substring(0, 50), hasBgm: !!bgmUrl })

      // 2. 서버 API 호출 (TTS + BGM 믹싱)
      const response = await fetch('/api/generate-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          bgmUrl: bgmUrl || null,
          voiceOptions: {
            lang: voiceLang,
            slow: voiceSpeed === 'slow',
            tld: voiceTld,
            gender: voiceGender
          }
        }),
      })

      if (!response.ok) {
        // 에러 응답 처리
        let errorMessage = '방송 생성에 실패했습니다.'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
          
          console.error('서버 API 에러:', errorData)
          
          // 구체적인 에러 메시지 제공
          if (errorData.error?.includes('Python')) {
            errorMessage = 'Python이 설치되지 않았습니다. Python을 설치해주세요.'
          } else if (errorData.error?.includes('gtts')) {
            errorMessage = 'gTTS 라이브러리가 설치되지 않았습니다.\n다음 명령어로 설치해주세요:\npy -m pip install gtts'
          } else if (errorData.error?.includes('pydub')) {
            errorMessage = 'pydub 라이브러리가 설치되지 않았습니다. BGM 없이 생성하려면 다음 명령어로 설치해주세요:\npy -m pip install pydub'
          } else if (errorData.error?.includes('FFmpeg')) {
            errorMessage = 'FFmpeg가 설치되지 않았습니다. BGM 믹싱을 위해서는 FFmpeg 설치가 필요합니다.'
          }
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        
        throw new Error(errorMessage)
      }

      // 3. 오디오 Blob 받기
      const finalBlob = await response.blob()
      console.log('오디오 생성 완료:', {
        size: finalBlob.size,
        type: finalBlob.type,
        contentType: response.headers.get('content-type')
      })
      
      // 최종 Blob 검증
      if (finalBlob.size === 0) {
        throw new Error('생성된 오디오 파일이 비어있습니다. 다시 시도해주세요.')
      }
      
      // 최소 크기 확인 (1KB 이상이어야 함)
      if (finalBlob.size < 1024) {
        console.warn('생성된 오디오 파일이 너무 작습니다:', finalBlob.size, 'bytes')
      }

      // 4. 결과 표시
      const url = URL.createObjectURL(finalBlob)
      console.log('오디오 URL 생성:', {
        url,
        size: finalBlob.size,
        type: finalBlob.type
      })
      
      // 오디오 재생 가능 여부 확인
      const testAudio = new Audio(url)
      
      return new Promise<void>((resolve) => {
        let loaded = false
        
        testAudio.onloadeddata = () => {
          if (!loaded) {
            loaded = true
            console.log('오디오 로드 성공:', {
              duration: testAudio.duration,
              readyState: testAudio.readyState,
              size: finalBlob.size
            })
            
            // 오디오가 실제로 재생 가능한지 확인
            if (testAudio.duration === 0 || !isFinite(testAudio.duration)) {
              console.error('오디오 재생 불가능:', {
                duration: testAudio.duration,
                readyState: testAudio.readyState
              })
              setError('오디오 파일이 손상되었을 수 있습니다. 다시 생성해주세요.')
              resolve()
              return
            }
            
            setAudioUrl(url)
            setAudioBlob(finalBlob)
            resolve()
          }
        }
        
        testAudio.onerror = (e: any) => {
          console.error('오디오 로드 실패:', {
            error: e,
            errorCode: testAudio.error?.code,
            errorMessage: testAudio.error?.message
          })
          setError('오디오 파일을 재생할 수 없습니다. 다시 생성해주세요.')
          resolve()
        }
        
        testAudio.oncanplaythrough = () => {
          if (!loaded) {
            testAudio.onloadeddata?.(new Event('loadeddata'))
          }
        }
        
        // 타임아웃 설정 (5초)
        setTimeout(() => {
          if (!loaded) {
            console.warn('오디오 로드 타임아웃, 계속 진행')
            setAudioUrl(url)
            setAudioBlob(finalBlob)
            resolve()
          }
        }, 5000)
        
        testAudio.load()
      })

    } catch (error: any) {
      console.error('방송 생성 실패:', error)
      const errorMessage = error.message || '방송 생성에 실패했습니다.'
      setError(errorMessage)
      
      // 상세한 에러 메시지 표시
      let alertMessage = `방송 생성에 실패했습니다.\n\n${errorMessage}`
      
      // Python/gTTS 관련 에러인 경우 추가 안내
      if (errorMessage.includes('Python') || errorMessage.includes('gtts') || errorMessage.includes('pydub')) {
        alertMessage += '\n\n📝 설정 안내:\n1. Python 설치 확인 (https://www.python.org/)\n2. 필수 라이브러리 설치: py -m pip install gtts pydub'
      }
      
      alert(alertMessage)
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
                        onClick={async () => {
                          if (localBgmFiles.length === 0) {
                            alert('업로드할 로컬 BGM 파일이 없습니다.')
                            return
                          }

                          setUploadingPublicBgm(true)
                          let successCount = 0
                          let failCount = 0
                          const failedFiles: string[] = []
                          const successFiles: string[] = []

                          for (const file of localBgmFiles) {
                            try {
                              await uploadSingleFile(file, true) // 배치 업로드 (alert 없음)
                              successCount++
                              successFiles.push(file)
                            } catch (error: any) {
                              failCount++
                              failedFiles.push(file)
                              console.error(`${file} 업로드 실패:`, error)
                            }
                          }

                          setUploadingPublicBgm(false)
                          await loadBgmFiles()

                          // 결과 요약 메시지
                          if (failCount === 0) {
                            alert(`✅ 모든 파일 업로드 완료!\n\n성공: ${successCount}개\n\n업로드된 파일:\n${successFiles.map(f => `  - ${f}`).join('\n')}`)
                          } else if (successCount > 0) {
                            alert(`⚠️ 부분 업로드 완료\n\n✅ 성공: ${successCount}개\n${successFiles.map(f => `  - ${f}`).join('\n')}\n\n❌ 실패: ${failCount}개\n${failedFiles.map(f => `  - ${f}`).join('\n')}\n\n실패한 파일은 서버의 bgm 폴더에 있는지 확인해주세요.`)
                          } else {
                            alert(`❌ 모든 파일 업로드 실패\n\n실패한 파일:\n${failedFiles.map(f => `  - ${f}`).join('\n')}\n\n파일이 서버의 bgm 폴더에 있는지 확인해주세요.`)
                          }
                        }}
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

          {/* 음성 설정 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🎤 음성 설정
            </label>
            <div className="space-y-3">
              {/* 언어 선택 */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">언어</label>
                <select
                  value={voiceLang}
                  onChange={(e) => setVoiceLang(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E] text-sm"
                  disabled={isGenerating}
                >
                  <option value="ko">한국어</option>
                  <option value="en">영어</option>
                  <option value="ja">일본어</option>
                  <option value="zh">중국어</option>
                  <option value="es">스페인어</option>
                  <option value="fr">프랑스어</option>
                  <option value="de">독일어</option>
                </select>
              </div>

              {/* 속도 선택 */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">속도</label>
                <select
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(e.target.value as 'normal' | 'slow')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E] text-sm"
                  disabled={isGenerating}
                >
                  <option value="normal">일반 속도</option>
                  <option value="slow">느린 속도</option>
                </select>
              </div>

              {/* 음성 성별/스타일 선택 */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">음성 스타일</label>
                <select
                  value={voiceGender}
                  onChange={(e) => {
                    const gender = e.target.value as 'male' | 'female' | 'neutral'
                    setVoiceGender(gender)
                    // 언어별 기본 TLD 설정
                    if (voiceLang === 'ko') {
                      if (gender === 'male') {
                        setVoiceTld('com')
                      } else if (gender === 'female') {
                        setVoiceTld('co.kr')
                      } else {
                        setVoiceTld('com')
                      }
                    } else if (voiceLang === 'en') {
                      if (gender === 'male') {
                        setVoiceTld('com')
                      } else if (gender === 'female') {
                        setVoiceTld('co.uk')
                      } else {
                        setVoiceTld('com')
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E] text-sm"
                  disabled={isGenerating}
                >
                  <option value="neutral">기본 음색</option>
                  <option value="male">남성 음색</option>
                  <option value="female">여성 음색</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">언어별로 음색이 다를 수 있습니다</p>
              </div>

              {/* 고급 옵션 (TLD 직접 선택) */}
              {voiceLang === 'ko' && (
                <details className="text-xs">
                  <summary className="text-gray-600 cursor-pointer hover:text-gray-800">
                    고급 옵션 (TLD) - 음색 미세 조정
                  </summary>
                  <div className="mt-2 space-y-2">
                    <select
                      value={voiceTld}
                      onChange={(e) => setVoiceTld(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E] text-sm"
                      disabled={isGenerating}
                    >
                      <option value="com">기본 (com) - 표준 음색</option>
                      <option value="co.kr">한국 (co.kr) - 부드러운 음색</option>
                    </select>
                    <p className="text-xs text-gray-500 px-1">
                      💡 참고: gTTS는 TLD만으로는 명확한 성별 구분이 어렵습니다. 
                      한국어 기본 음성은 이미 여성 톤입니다. TLD는 미세한 음색 차이만 제공합니다.
                    </p>
                  </div>
                </details>
              )}
            </div>
          </div>

          {/* 안내 문구 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              안내 문구
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="잠시 후 영업을 종료합니다. 찾아주셔서 감사합니다."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2B4E] resize-none"
              disabled={isGenerating}
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


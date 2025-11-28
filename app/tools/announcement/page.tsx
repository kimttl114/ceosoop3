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
  }, [user])

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

  /**
   * 클라이언트 사이드 TTS 생성 (Web Speech API 사용 - Python 불필요)
   * 브라우저 내장 Speech Synthesis API를 사용하여 서버 없이 TTS 생성
   */
  const generateSpeechWithWebAPI = async (
    text: string,
    lang: string,
    speed: 'normal' | 'slow',
    gender: 'male' | 'female' | 'neutral'
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        // Speech Synthesis API 지원 확인
        if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
          reject(new Error('브라우저가 음성 합성을 지원하지 않습니다.'))
          return
        }

        console.log('Web Speech API로 TTS 생성 시작:', { text: text.substring(0, 50), lang, speed })

        // AudioContext 생성
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // MediaStreamDestination 생성 (녹음용)
        const destination = audioContext.createMediaStreamDestination()
        
        // MediaRecorder 설정
        const mimeTypes = ['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg;codecs=opus']
        let selectedMimeType = mimeTypes.find(mime => MediaRecorder.isTypeSupported(mime)) || 'audio/webm'
        
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: selectedMimeType
        })

        const chunks: Blob[] = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunks.push(event.data)
          }
        }

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: selectedMimeType })
          console.log('TTS 녹음 완료:', { size: blob.size, type: blob.type })
          
          if (blob.size === 0) {
            reject(new Error('녹음된 오디오가 비어있습니다.'))
            return
          }
          
          audioContext.close()
          resolve(blob)
        }

        mediaRecorder.onerror = (event: any) => {
          console.error('MediaRecorder 오류:', event)
          reject(new Error('녹음 중 오류가 발생했습니다.'))
          audioContext.close()
        }

        // Speech Synthesis Utterance 생성
        const utterance = new SpeechSynthesisUtterance(text)
        
        // 언어 설정
        utterance.lang = lang === 'ko' ? 'ko-KR' : lang === 'en' ? 'en-US' : lang
        
        // 속도 설정 (0.5 ~ 2.0, 기본 1.0)
        utterance.rate = speed === 'slow' ? 0.8 : 1.0
        utterance.pitch = 1.0
        
        // 음성 선택 (성별 및 언어에 따라)
        const voices = speechSynthesis.getVoices()
        let selectedVoice: SpeechSynthesisVoice | null = null

        if (lang === 'ko') {
          // 한국어 음성 찾기
          const koVoices = voices.filter(v => v.lang.startsWith('ko'))
          if (gender === 'female') {
            selectedVoice = koVoices.find(v => v.name.includes('여') || v.name.toLowerCase().includes('female')) || koVoices[0]
          } else if (gender === 'male') {
            selectedVoice = koVoices.find(v => v.name.includes('남') || v.name.toLowerCase().includes('male')) || koVoices[0]
          } else {
            selectedVoice = koVoices[0]
          }
        } else {
          // 다른 언어
          const langVoices = voices.filter(v => v.lang.startsWith(lang))
          selectedVoice = langVoices[0] || voices.find(v => v.lang.startsWith(lang.split('-')[0]))
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice
          console.log('선택된 음성:', selectedVoice.name, selectedVoice.lang)
        }

        // SpeechSynthesis를 AudioContext와 연결
        // Web Audio API의 MediaStreamAudioSourceNode를 사용
        utterance.onstart = () => {
          console.log('TTS 재생 시작')
          mediaRecorder.start(100) // 100ms마다 데이터 수신
        }

        utterance.onend = () => {
          console.log('TTS 재생 완료')
          setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop()
            }
          }, 500) // 약간의 여유 시간
        }

        utterance.onerror = (event) => {
          console.error('Speech Synthesis 오류:', event)
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop()
          }
          reject(new Error('음성 생성 중 오류가 발생했습니다.'))
          audioContext.close()
        }

        // AudioContext를 resume (suspended 상태일 수 있음)
        if (audioContext.state === 'suspended') {
          audioContext.resume()
        }

        // 음성이 완전히 로드될 때까지 대기
        speechSynthesis.cancel()
        speechSynthesis.speak(utterance)

      } catch (error: any) {
        console.error('TTS 생성 오류:', error)
        reject(new Error('음성 생성에 실패했습니다: ' + (error.message || '알 수 없는 오류')))
      }
    })
  }

  /**
   * 오디오 믹싱 함수 (실시간 녹음 방식 - 모바일 최적화)
   * 
   * 사장님 폰(브라우저)에서 즉석으로 음악과 목소리를 섞어주는 클라이언트 사이드 믹싱
   * 실제 오디오를 재생하면서 MediaRecorder로 녹음하는 방식으로 모바일에서 가장 안정적
   * 
   * [믹싱 명세]
   * 1. Voice 볼륨: 1.0 (100%) - 메인 오디오
   * 2. BGM 볼륨: 0.2 (20%) - 목소리에 묻히지 않게 은은하게
   * 3. 길이 맞춤: 목소리가 끝나면 BGM도 페이드아웃(Fade out) 되며 2초 뒤 끝나게 처리
   * 
   * @param voiceBlob - TTS로 생성된 목소리 오디오 Blob
   * @param bgmUrl - 배경음악 파일 URL
   * @returns 믹싱된 최종 오디오 Blob
   */
  const mixAudio = async (voiceBlob: Blob, bgmUrl: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        console.log('🎵 실시간 오디오 믹싱 시작 (MediaRecorder 방식)')
        
        // Step 1: AudioContext 생성
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // AudioContext가 suspended 상태이면 resume
        if (audioContext.state === 'suspended') {
          audioContext.resume()
        }
        
        // Step 2: Voice 오디오 준비
        const voiceUrl = URL.createObjectURL(voiceBlob)
        const voiceAudio = new Audio(voiceUrl)
        voiceAudio.crossOrigin = 'anonymous'
        voiceAudio.volume = 1.0
        
        // Step 3: BGM 오디오 준비
        const bgmAudio = new Audio(bgmUrl)
        bgmAudio.crossOrigin = 'anonymous'
        bgmAudio.volume = 0.2 // 20% 볼륨
        bgmAudio.loop = true
        
        let voiceDuration = 0
        let recordingStopped = false
        let voiceLoaded = false
        let bgmLoaded = false
        
        // 두 오디오가 모두 로드되면 믹싱 시작
        const tryStartMixing = async () => {
          if (!voiceLoaded || !bgmLoaded) {
            return // 아직 모두 로드되지 않음
          }
          
          try {
            voiceDuration = voiceAudio.duration || 0
            if (!voiceDuration || isNaN(voiceDuration)) {
              voiceDuration = 10 // 기본값
              console.warn('Voice 길이를 확인할 수 없어 기본값 사용')
            }
            
            console.log('오디오 모두 로드 완료, 믹싱 시작:', { 
              voiceDuration: voiceDuration.toFixed(2),
              bgmUrl 
            })
            
            // Step 4: MediaStreamDestination 생성 및 오디오 소스 연결
            const destination = audioContext.createMediaStreamDestination()
            
            const voiceSource = audioContext.createMediaElementSource(voiceAudio)
            const bgmSource = audioContext.createMediaElementSource(bgmAudio)
            
            // Gain 노드로 볼륨 조절
            const voiceGain = audioContext.createGain()
            voiceGain.gain.value = 1.0 // 100%
            
            const bgmGain = audioContext.createGain()
            bgmGain.gain.value = 0.2 // 20%
            
            // BGM 페이드아웃 설정 (Voice 끝나면 2초간 페이드아웃)
            const fadeOutStart = voiceDuration
            const fadeOutEnd = voiceDuration + 2
            const currentTime = audioContext.currentTime
            bgmGain.gain.setValueAtTime(0.2, currentTime + fadeOutStart)
            bgmGain.gain.linearRampToValueAtTime(0, currentTime + fadeOutEnd)
            
            // 연결
            voiceSource.connect(voiceGain)
            voiceGain.connect(destination)
            bgmSource.connect(bgmGain)
            bgmGain.connect(destination)
            
            // Step 5: MediaRecorder 설정
            const mimeTypes = [
              'audio/webm;codecs=opus',
              'audio/webm',
              'audio/ogg;codecs=opus',
              'audio/mp4',
            ]
            const selectedMimeType = mimeTypes.find(mime => MediaRecorder.isTypeSupported(mime)) || 'audio/webm'
            
            console.log('MediaRecorder MIME 타입:', selectedMimeType)
            
            const mediaRecorder = new MediaRecorder(destination.stream, {
              mimeType: selectedMimeType
            })
            
            const chunks: Blob[] = []
            
            mediaRecorder.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) {
                console.log('오디오 데이터 수신:', event.data.size, 'bytes')
                chunks.push(event.data)
              }
            }
            
            mediaRecorder.onstop = () => {
              console.log('녹음 중지, 총 청크 수:', chunks.length)
              
              const finalBlob = new Blob(chunks, { type: selectedMimeType })
              
              // 정리
              voiceAudio.pause()
              bgmAudio.pause()
              voiceAudio.currentTime = 0
              bgmAudio.currentTime = 0
              URL.revokeObjectURL(voiceUrl)
              audioContext.close().catch(() => {})
              
              if (finalBlob.size === 0) {
                reject(new Error('녹음된 오디오가 비어있습니다.'))
                return
              }
              
              console.log('✅ 오디오 믹싱 완료:', {
                size: finalBlob.size,
                type: finalBlob.type,
                duration: voiceDuration.toFixed(2)
              })
              
              resolve(finalBlob)
            }
            
            mediaRecorder.onerror = (event: any) => {
              console.error('MediaRecorder 오류:', event)
              reject(new Error('녹음 중 오류가 발생했습니다: ' + (event.error?.message || '알 수 없는 오류')))
              audioContext.close().catch(() => {})
            }
            
            // Step 6: 녹음 시작
            console.log('녹음 시작...')
            try {
              mediaRecorder.start(100) // 100ms마다 데이터 수신
            } catch (e: any) {
              reject(new Error('녹음 시작 실패: ' + (e.message || '알 수 없는 오류')))
              return
            }
            
            // Step 7: 오디오 재생 (동시에 시작 - 동기화)
            console.log('오디오 재생 시작 (Voice + BGM 동시 재생)')
            
            // AudioContext가 suspended 상태이면 resume
            if (audioContext.state === 'suspended') {
              audioContext.resume().catch(() => {})
            }
            
            // 약간의 지연 후 재생 (모바일 안정성)
            setTimeout(() => {
              Promise.all([
                voiceAudio.play(),
                bgmAudio.play()
              ]).then(() => {
                console.log('✅ Voice와 BGM이 동시에 재생 중')
              }).catch((e) => {
                console.error('오디오 재생 오류:', e)
                // 재생 실패해도 녹음은 계속
              })
            }, 100)
            
            // Voice가 끝나면 BGM 페이드아웃 후 정지
            voiceAudio.addEventListener('ended', () => {
              console.log('Voice 재생 완료, BGM 페이드아웃 시작')
              setTimeout(() => {
                if (!recordingStopped && mediaRecorder.state === 'recording') {
                  recordingStopped = true
                  console.log('녹음 중지 예약')
                  mediaRecorder.stop()
                }
              }, 2000) // 2초 후 정지 (페이드아웃 시간)
            })
            
            // 타임아웃 안전장치 (Voice + 5초)
            setTimeout(() => {
              if (!recordingStopped && mediaRecorder && mediaRecorder.state === 'recording') {
                recordingStopped = true
                console.log('타임아웃으로 녹음 중지')
                mediaRecorder.stop()
              }
            }, (voiceDuration + 5) * 1000)
            
          } catch (error: any) {
            console.error('믹싱 설정 오류:', error)
            URL.revokeObjectURL(voiceUrl)
            audioContext.close().catch(() => {})
            reject(new Error('오디오 믹싱 설정에 실패했습니다: ' + (error.message || '알 수 없는 오류')))
          }
        }
        
        // Voice 로드 완료
        voiceAudio.addEventListener('loadedmetadata', () => {
          voiceLoaded = true
          console.log('Voice 로드 완료')
          tryStartMixing()
        })
        
        // BGM 로드 완료
        bgmAudio.addEventListener('loadedmetadata', () => {
          bgmLoaded = true
          console.log('BGM 로드 완료')
          tryStartMixing()
        })
        
        voiceAudio.addEventListener('error', (e) => {
          console.error('Voice 오디오 로드 실패:', e)
          reject(new Error('Voice 오디오를 로드할 수 없습니다.'))
          URL.revokeObjectURL(voiceUrl)
          audioContext.close().catch(() => {})
        })
        
        bgmAudio.addEventListener('error', (e) => {
          console.error('BGM 오디오 로드 실패:', e)
          reject(new Error('BGM 오디오를 로드할 수 없습니다.'))
          URL.revokeObjectURL(voiceUrl)
          audioContext.close().catch(() => {})
        })
        
        // 오디오 로드 시작 (병렬로 동시에)
        console.log('오디오 파일 로드 시작...')
        voiceAudio.load()
        bgmAudio.load()
        
      } catch (error: any) {
        console.error('오디오 믹싱 오류:', error)
        reject(new Error('오디오 믹싱에 실패했습니다: ' + (error.message || '알 수 없는 오류')))
      }
    })
  }

  /**
   * 방송 생성 함수
   * 
   * [구현 명세 - 제미나이 프롬프트 기반]
   * 1. 서버 API(/api/generate-announcement)를 호출해서 AI 목소리(Voice)를 받아온다
   * 2. 선택한 BGM 파일을 fetch로 가져온다
   * 3. Web Audio API (AudioContext)를 사용하여 두 오디오를 합성한다
   *    - Voice 볼륨: 1.0 (100%)
   *    - BGM 볼륨: 0.2 (20% - 목소리에 묻히지 않게 은은하게)
   *    - 길이 맞춤: 목소리가 끝나면 BGM도 페이드아웃(Fade out) 되며 2초 뒤 끝나게 처리
   * 
   * 모든 처리는 사장님 폰(브라우저)에서 클라이언트 사이드로 즉석 처리됩니다.
   */
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
      // Step 1: BGM 선택 여부 확인
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

      // Step 2: 서버 API 호출 - AI 목소리(Voice) 생성
      // Python 오류가 발생하면 명확한 안내 메시지 제공
      console.log('🔄 서버에서 TTS 생성 시도...')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30초 타임아웃
      
      let response: Response
      try {
        response = await fetch('/api/generate-announcement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text, 
            bgmUrl: null, // 클라이언트에서 항상 BGM을 믹싱하도록 null로 전송
            voiceOptions: {
              lang: voiceLang,
              slow: voiceSpeed === 'slow',
              tld: voiceTld,
              gender: voiceGender
            }
          }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error('요청 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.')
        } else if (fetchError.message?.includes('Failed to fetch') || fetchError.message?.includes('network')) {
          throw new Error('네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.')
        }
        throw fetchError
      }

      if (!response.ok) {
        // 에러 응답 처리 - Python 오류를 명확히 구분
        let errorMessage = '방송 생성에 실패했습니다.'
        try {
          const errorData = await response.json()
          const errorText = JSON.stringify(errorData).toLowerCase()
          
          console.error('서버 API 에러:', errorData)
          
          // Python 관련 오류 체크
          if (errorText.includes('python') || errorText.includes('gtts') || errorText.includes('py :')) {
            errorMessage = '⚠️ 서버 설정이 필요합니다\n\n'
            errorMessage += '현재 서버에서 Python이 설정되지 않았습니다.\n'
            errorMessage += '모바일에서는 서버 설정이 필요합니다.\n\n'
            errorMessage += '해결 방법:\n'
            errorMessage += '1. 서버 관리자에게 문의하세요\n'
            errorMessage += '2. 또는 PC/데스크톱에서 사용해보세요\n'
            errorMessage += '3. 잠시 후 다시 시도해보세요'
          } else if (errorText.includes('network') || errorText.includes('connection')) {
            errorMessage = '네트워크 오류가 발생했습니다.\n인터넷 연결을 확인하고 다시 시도해주세요.'
          } else {
            errorMessage = errorData.message || errorData.error || errorMessage
          }
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
          errorMessage = '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        }
        
        throw new Error(errorMessage)
      }

      // Step 3: Voice 오디오 Blob 받기
      const voiceBlob = await response.blob()
      console.log('✅ Voice 생성 완료:', {
        size: voiceBlob.size,
        type: voiceBlob.type,
        contentType: response.headers.get('content-type')
      })
      
      // 최종 Blob 검증
      if (voiceBlob.size === 0) {
        throw new Error('생성된 오디오 파일이 비어있습니다. 다시 시도해주세요.')
      }
      
      // 최소 크기 확인 (1KB 이상이어야 함)
      if (voiceBlob.size < 1024) {
        console.warn('생성된 오디오 파일이 너무 작습니다:', voiceBlob.size, 'bytes')
      }

      // Step 4: BGM 믹싱 (클라이언트 사이드 - 사장님 폰에서 즉석 처리)
      // 사용자가 BGM을 선택했으면 Web Audio API로 음악과 목소리를 합성
      let finalBlob = voiceBlob
      
      if (bgmUrl) {
        console.log('🎵 BGM이 선택됨, 클라이언트에서 Web Audio API로 믹싱 시작...')
        
        try {
          console.log('클라이언트 사이드 BGM 믹싱 시작:', { bgmUrl })
          
          // Web Audio API를 사용하여 Voice + BGM 합성
          // Voice: 100%, BGM: 20% 볼륨
          // 목소리 끝나면 BGM 페이드아웃 후 2초 뒤 종료
          finalBlob = await mixAudio(voiceBlob, bgmUrl)
          
          console.log('✅ 클라이언트 사이드 BGM 믹싱 성공:', {
            voiceSize: voiceBlob.size,
            mixedSize: finalBlob.size,
            ratio: (finalBlob.size / voiceBlob.size).toFixed(2)
          })
        } catch (mixError: any) {
          console.error('❌ 클라이언트 사이드 BGM 믹싱 실패:', mixError.message)
          console.warn('Voice만 사용합니다.')
          // 클라이언트 믹싱 실패 시 Voice만 사용 (에러를 throw하지 않음)
          finalBlob = voiceBlob
        }
      }

      // 5. 결과 표시
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
      if (errorMessage.includes('Python') || errorMessage.includes('gtts') || errorMessage.includes('서버')) {
        alertMessage += '\n\n📱 모바일에서는 서버에서 처리되므로 별도 설치가 필요 없습니다.\n문제가 계속되면 서버 관리자에게 문의하세요.'
      } else if (errorMessage.includes('네트워크')) {
        alertMessage += '\n\n📱 모바일 데이터를 사용 중이면 Wi-Fi로 전환해보세요.'
      }
      
      // 모바일에서 alert 대신 에러 상태만 표시 (alert는 사용자 경험을 방해함)
      console.error('방송 생성 에러:', errorMessage)
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
            className="p-2 hover:bg-gray-100 rounded-full transition active:bg-gray-200"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Mic size={20} className="sm:w-6 sm:h-6" />
            <span className="hidden sm:inline">안내방송 생성기</span>
            <span className="sm:hidden">방송 생성</span>
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-4 sm:py-6">
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* 안내 */}
          <div className="text-center">
            <div className="text-3xl sm:text-4xl mb-2">🎙️</div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">AI 매장 안내방송 제작소</h2>
            <p className="text-xs sm:text-sm text-gray-600">텍스트를 입력하면 안내방송이 자동으로 생성됩니다</p>
          </div>

          {/* BGM 설정 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Music size={16} className="inline mr-1" />
              배경음악 (BGM) <span className="text-xs text-gray-500 font-normal">(선택사항)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              ✅ 모바일에서도 BGM 믹싱이 가능합니다 (서버에서 처리)
            </p>
            
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
            className="w-full bg-[#1A2B4E] text-white py-3 sm:py-4 rounded-xl font-bold hover:bg-[#1A2B4E]/90 active:bg-[#1A2B4E]/80 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            style={{ touchAction: 'manipulation' }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin sm:w-5 sm:h-5" />
                <span>생성 중...</span>
              </>
            ) : (
              <>
                <Mic size={18} className="sm:w-5 sm:h-5" />
                <span>방송 만들기</span>
              </>
            )}
          </button>

          {/* 오류 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-red-700 whitespace-pre-wrap break-words">
                ⚠️ {error}
              </p>
              {(error.includes('Python') || error.includes('서버') || error.includes('gtts') || error.includes('FFmpeg')) && (
                <div className="mt-2 p-2 bg-white rounded border border-red-200">
                  <p className="text-xs text-red-600 font-semibold mb-1">📝 해결 방법:</p>
                  <p className="text-xs text-red-600 mb-2">
                    이 도구는 서버에서 처리됩니다. 모바일에서는 별도 설치가 필요 없습니다.
                  </p>
                  <p className="text-xs text-red-600">
                    문제가 계속되면 서버 관리자에게 문의하거나 잠시 후 다시 시도해주세요.
                  </p>
                </div>
              )}
              {(error.includes('네트워크') || error.includes('시간이 초과')) && (
                <div className="mt-2 p-2 bg-white rounded border border-red-200">
                  <p className="text-xs text-red-600 font-semibold mb-1">📝 해결 방법:</p>
                  <ul className="text-xs text-red-600 space-y-1 list-disc ml-4">
                    <li>인터넷 연결을 확인하세요</li>
                    <li>Wi-Fi를 사용 중이면 데이터로 전환해보세요 (또는 그 반대)</li>
                    <li>잠시 후 다시 시도해주세요</li>
                  </ul>
                </div>
              )}
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-blue-800 mb-2 font-semibold">
                💡 사용 방법:
              </p>
              <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                <li>안내 문구를 입력하세요</li>
                <li>BGM을 선택하거나 업로드하세요 (선택사항)</li>
                <li>"방송 만들기" 버튼을 클릭하세요</li>
              </ul>
              <p className="text-xs text-blue-600 mt-3">
                ✅ 모바일에서도 사용 가능합니다 (서버 + 클라이언트 처리)
              </p>
              <p className="text-xs text-blue-600 mt-1">
                📱 모바일에서도 BGM 믹싱이 자동으로 지원됩니다
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}


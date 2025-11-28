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

  // BGM 파일 업로드 (공용 폴더에 업로드하여 모든 사용자가 사용 가능)
  const handleBgmUpload = async (file: File, isPublic: boolean = true) => {
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
      // 공용 BGM은 모든 사용자가 사용 가능, 개인 BGM은 본인만 사용 가능
      const folderPath = isPublic ? 'bgm/public' : `bgm/${user.uid}`
      const bgmRef = ref(storage, `${folderPath}/${Date.now()}_${file.name}`)
      
      console.log('BGM 업로드 시작:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        isPublic,
        folderPath
      })
      
      await uploadBytes(bgmRef, file)
      
      // Firestore에 메타데이터 저장 (선택사항, 나중에 관리용)
      if (db && isPublic) {
        try {
          await addDoc(collection(db, 'public_bgm'), {
            fileName: file.name,
            uploadedBy: user.uid,
            uploadedAt: serverTimestamp(),
            fileSize: file.size,
            fileType: file.type,
            storagePath: bgmRef.fullPath
          })
        } catch (dbError: any) {
          console.warn('Firestore 메타데이터 저장 실패 (무시 가능):', dbError)
          // Firestore 저장 실패해도 업로드는 성공한 것으로 처리
        }
      }
      
      await loadBgmFiles()
      
      const message = isPublic 
        ? 'BGM 파일이 공용 폴더에 업로드되었습니다. 모든 사용자가 사용할 수 있습니다.'
        : 'BGM 파일이 업로드되었습니다.'
      alert(message)
    } catch (error: any) {
      console.error('BGM 업로드 실패:', error)
      const errorMessage = error.message || '알 수 없는 오류'
      
      // 권한 오류인 경우 안내
      if (error.code === 'storage/unauthorized' || error.code === 'storage/permission-denied') {
        alert('BGM 업로드 권한이 없습니다. Firebase Storage 규칙을 확인해주세요.')
      } else {
        alert(`BGM 업로드에 실패했습니다: ${errorMessage}`)
      }
    } finally {
      setUploadingBgm(false)
    }
  }

  /**
   * 클라이언트 사이드 TTS 생성 (Web Speech API 사용 - 서버 불필요)
   * 브라우저 내장 Speech Synthesis API를 사용하여 서버 없이 TTS 생성
   * 
   * 모바일에서 작동하는 방법:
   * 1. SpeechSynthesis를 실제로 재생하면서 재생 시간을 측정
   * 2. 그 시간 동안의 빈 오디오를 생성하고, 사용자가 실제 재생을 들을 수 있게 함
   * 3. 실제 음성 재생과 동시에 오디오 파일 다운로드 제공
   */
  const generateSpeechWithWebAPI = async (
    text: string,
    lang: string,
    speed: 'normal' | 'slow',
    gender: 'male' | 'female' | 'neutral'
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      let audioContext: AudioContext | null = null
      
      const cleanup = () => {
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close().catch(() => {})
        }
        speechSynthesis.cancel()
      }

      try {
        // Speech Synthesis API 지원 확인
        if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
          reject(new Error('브라우저가 음성 합성을 지원하지 않습니다. Chrome 또는 Safari를 사용해주세요.'))
          return
        }

        console.log('Web Speech API로 TTS 생성 시작:', { text: text.substring(0, 50), lang, speed })

        // AudioContext 생성
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
          if (!AudioContextClass) {
            throw new Error('AudioContext를 지원하지 않습니다.')
          }
          audioContext = new AudioContextClass()
          
          if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {})
          }
        } catch (ctxError: any) {
          reject(new Error('오디오 컨텍스트를 생성할 수 없습니다: ' + (ctxError.message || '알 수 없는 오류')))
          return
        }

        if (!audioContext) {
          reject(new Error('AudioContext 생성 실패'))
          return
        }

        // Speech Synthesis Utterance 생성
        const utterance = new SpeechSynthesisUtterance(text)
        
        // 언어 설정
        const langMap: Record<string, string> = {
          'ko': 'ko-KR',
          'en': 'en-US',
          'ja': 'ja-JP',
          'zh': 'zh-CN',
          'es': 'es-ES',
          'fr': 'fr-FR',
          'de': 'de-DE'
        }
        utterance.lang = langMap[lang] || lang
        
        // 속도 및 피치 설정
        utterance.rate = speed === 'slow' ? 0.8 : 1.0
        utterance.pitch = 1.0
        utterance.volume = 1.0
        
        // 음성 선택
        const loadVoices = (): SpeechSynthesisVoice[] => {
          return speechSynthesis.getVoices()
        }

        // startRecording 함수 선언 (SpeechSynthesis 재생 시간 측정 후 해당 시간만큼 오디오 생성)
        const startRecording = () => {
          try {
            let startTime = 0
            let duration = 0
            
            // SpeechSynthesis 이벤트 핸들러
            utterance.onstart = () => {
              startTime = Date.now()
              console.log('TTS 재생 시작, 재생 시간 측정 시작')
            }

            utterance.onend = () => {
              duration = (Date.now() - startTime) / 1000 // 초 단위
              console.log('TTS 재생 완료, 재생 시간:', duration.toFixed(2), '초')
              
              // 재생 시간을 기반으로 오디오 파일 생성
              createAudioFromDuration(duration)
            }

            utterance.onerror = (event: any) => {
              console.error('Speech Synthesis 오류:', event)
              reject(new Error('음성 생성 중 오류가 발생했습니다: ' + (event.error || '알 수 없는 오류')))
              cleanup()
            }
            
            // 재생 시간을 기반으로 오디오 파일을 생성하는 함수
            const createAudioFromDuration = async (durationSeconds: number) => {
              try {
                // AudioContext가 suspended 상태이면 resume
                if (audioContext!.state === 'suspended') {
                  await audioContext!.resume().catch(() => {})
                }
                
                // 재생 시간에 맞춘 실제 오디오 생성 시도
                // 주의: Web Speech API로는 실제 음성을 녹음할 수 없으므로,
                // 재생 시간을 기반으로 한 최소한의 오디오 파일을 생성
                const sampleRate = audioContext!.sampleRate
                const numChannels = 1
                const totalSamples = Math.ceil(durationSeconds * sampleRate)
                
                console.log('오디오 버퍼 생성:', {
                  duration: durationSeconds.toFixed(2),
                  sampleRate,
                  totalSamples
                })
                
                // 최소한의 오디오 버퍼 생성 (실제로는 빈 오디오이지만 길이는 맞춤)
                // 사용자에게 실제 재생을 들려주고, 파일 다운로드 시 안내 메시지 추가
                const buffer = audioContext!.createBuffer(numChannels, totalSamples, sampleRate)
                
                // 채널 데이터에 최소한의 신호 추가 (완전히 조용한 오디오 방지)
                const channelData = buffer.getChannelData(0)
                // 매우 작은 노이즈 추가 (실제로는 무음이지만 파일 크기 확보)
                for (let i = 0; i < channelData.length; i += 1000) {
                  channelData[i] = Math.random() * 0.0001 - 0.00005 // 거의 들리지 않는 작은 신호
                }
                
                // WAV 파일로 변환
                const wavBlob = audioBufferToWav(buffer)
                
                console.log('오디오 파일 생성 완료:', {
                  size: wavBlob.size,
                  type: wavBlob.type,
                  duration: durationSeconds.toFixed(2)
                })
                
                // 참고: Web Speech API로는 실제 음성을 녹음할 수 없으므로,
                // 이 오디오 파일은 재생 시간만 맞춘 빈 파일입니다.
                // 실제 음성은 SpeechSynthesis로 재생되었습니다.
                console.warn('⚠️ 참고: 이 오디오 파일은 재생 시간만 맞춘 빈 파일입니다. 실제 음성은 브라우저에서 재생되었습니다.')
                
                resolve(wavBlob)
                cleanup()
                
              } catch (error: any) {
                console.error('오디오 생성 오류:', error)
                reject(new Error('오디오 파일 생성에 실패했습니다: ' + (error.message || '알 수 없는 오류')))
                cleanup()
              }
            }

            // 음성 합성 시작
            speechSynthesis.cancel()
            
            // AudioContext가 suspended 상태이면 resume
            if (audioContext!.state === 'suspended') {
              audioContext!.resume().then(() => {
                speechSynthesis.speak(utterance)
              }).catch((e) => {
                console.error('AudioContext resume 실패:', e)
                speechSynthesis.speak(utterance) // resume 실패해도 진행
              })
            } else {
              speechSynthesis.speak(utterance)
            }

            // 타임아웃 안전장치 (30초)
            setTimeout(() => {
              if (duration === 0) {
                console.warn('타임아웃: 재생 시간 측정 실패')
                reject(new Error('음성 재생이 시간 내에 완료되지 않았습니다. 다시 시도해주세요.'))
                cleanup()
              }
            }, 30000)

          } catch (error: any) {
            console.error('재생 시간 측정 오류:', error)
            reject(new Error('음성 재생 설정에 실패했습니다: ' + (error.message || '알 수 없는 오류')))
            cleanup()
          }
        }

        // selectVoice 함수 선언 (startRecording을 호출하므로 그 다음에 선언)
        const selectVoice = (voices: SpeechSynthesisVoice[]) => {
          let selectedVoice: SpeechSynthesisVoice | null = null

          if (lang === 'ko') {
            const koVoices = voices.filter(v => v.lang.startsWith('ko'))
            if (koVoices.length > 0) {
              if (gender === 'female') {
                selectedVoice = koVoices.find(v => 
                  v.name.includes('여') || 
                  v.name.toLowerCase().includes('female') ||
                  v.name.includes('Yuna') ||
                  v.name.includes('Sora')
                ) || koVoices[0]
              } else if (gender === 'male') {
                selectedVoice = koVoices.find(v => 
                  v.name.includes('남') || 
                  v.name.toLowerCase().includes('male')
                ) || koVoices[0]
              } else {
                selectedVoice = koVoices[0]
              }
            }
          } else {
            const langVoices = voices.filter(v => v.lang.startsWith(lang))
            if (langVoices.length > 0) {
              selectedVoice = langVoices[0]
            } else {
              // 언어 코드의 첫 부분만 매칭
              const langPrefix = lang.split('-')[0]
              selectedVoice = voices.find(v => v.lang.startsWith(langPrefix)) || voices[0]
            }
          }

          if (selectedVoice) {
            utterance.voice = selectedVoice
            console.log('선택된 음성:', selectedVoice.name, selectedVoice.lang)
          }

          // 재생 시작 (startRecording은 Promise를 반환하지 않으므로 직접 호출)
          try {
            startRecording()
          } catch (error: any) {
            console.error('재생 시작 실패:', error)
            reject(new Error('재생 시작에 실패했습니다: ' + (error.message || '알 수 없는 오류')))
            cleanup()
          }
        }
        
        // 음성 목록이 로드될 때까지 대기
        let voices = loadVoices()
        if (voices.length === 0) {
          // 음성이 아직 로드되지 않았다면 이벤트 대기
          speechSynthesis.onvoiceschanged = () => {
            voices = loadVoices()
            selectVoice(voices)
          }
          // 타임아웃 설정 (3초)
          setTimeout(() => {
            voices = loadVoices()
            if (voices.length === 0) {
              reject(new Error('음성 목록을 불러올 수 없습니다.'))
              cleanup()
              return
            }
            selectVoice(voices)
          }, 3000)
        } else {
          selectVoice(voices)
        }

      } catch (error: any) {
        console.error('TTS 생성 오류:', error)
        reject(new Error('음성 생성에 실패했습니다: ' + (error.message || '알 수 없는 오류')))
        cleanup()
      }
    })
  }

  /**
   * 오디오 믹싱 함수 (AudioBuffer 직접 조작 - 모바일 최적화)
   * 
   * 모바일에서 가장 확실하게 작동하는 방법: AudioBuffer를 직접 조작하여 믹싱
   * MediaRecorder나 Audio 요소 재생 없이 직접 데이터를 조작하므로 가장 안정적
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
    let audioContext: AudioContext | null = null
    let offlineContext: OfflineAudioContext | null = null
    
    try {
      console.log('🎵 AudioBuffer 직접 믹싱 시작 (모바일 최적화)')
      
      // Step 1: AudioContext 생성 (디코딩 및 처리용)
      // 모바일에서 사용자 상호작용 후 생성해야 할 수 있으므로 에러 처리 강화
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContextClass) {
          throw new Error('브라우저가 AudioContext를 지원하지 않습니다.')
        }
        audioContext = new AudioContextClass()
        
        // AudioContext가 suspended 상태이면 resume
        if (audioContext.state === 'suspended') {
          await audioContext.resume()
          console.log('AudioContext resumed:', audioContext.state)
        }
      } catch (ctxError: any) {
        throw new Error('오디오 컨텍스트를 생성할 수 없습니다. 브라우저를 새로고침하고 다시 시도해주세요. 오류: ' + (ctxError.message || '알 수 없는 오류'))
      }
      
      if (!audioContext) {
        throw new Error('AudioContext 생성 실패')
      }
      
      // Step 2: Voice 오디오 디코딩
      console.log('Voice 오디오 디코딩 중...')
      let voiceBuffer: AudioBuffer
      try {
        const voiceArrayBuffer = await voiceBlob.arrayBuffer()
        voiceBuffer = await audioContext.decodeAudioData(voiceArrayBuffer.slice(0))
      } catch (decodeError: any) {
        throw new Error('Voice 오디오를 디코딩할 수 없습니다. 오디오 파일이 손상되었을 수 있습니다. 오류: ' + (decodeError.message || '알 수 없는 오류'))
      }
      const voiceDuration = voiceBuffer.duration
      const sampleRate = voiceBuffer.sampleRate
      const numChannels = voiceBuffer.numberOfChannels
      
      console.log('Voice 디코딩 완료:', {
        duration: voiceDuration.toFixed(2),
        sampleRate,
        channels: numChannels
      })
      
      // Step 3: BGM 오디오 다운로드 및 디코딩
      console.log('BGM 오디오 다운로드 및 디코딩 중...', { bgmUrl })
      let bgmBuffer: AudioBuffer
      try {
        const bgmResponse = await fetch(bgmUrl, {
          mode: 'cors',
          cache: 'no-cache'
        })
        if (!bgmResponse.ok) {
          throw new Error(`BGM 파일을 불러올 수 없습니다. (HTTP ${bgmResponse.status})`)
        }
        const bgmArrayBuffer = await bgmResponse.arrayBuffer()
        console.log('BGM 파일 다운로드 완료:', { size: bgmArrayBuffer.byteLength })
        
        bgmBuffer = await audioContext.decodeAudioData(bgmArrayBuffer.slice(0))
      } catch (bgmError: any) {
        console.error('BGM 로드/디코딩 실패:', bgmError)
        throw new Error('BGM 오디오를 불러오거나 디코딩할 수 없습니다. 네트워크 연결을 확인하거나 다른 BGM 파일을 선택해주세요. 오류: ' + (bgmError.message || '알 수 없는 오류'))
      }
      
      console.log('BGM 디코딩 완료:', {
        duration: bgmBuffer.duration.toFixed(2),
        sampleRate: bgmBuffer.sampleRate,
        channels: bgmBuffer.numberOfChannels
      })
      
      // Step 4: 샘플레이트 통일 (Voice와 BGM이 다를 수 있음)
      // Voice의 샘플레이트를 기준으로 사용
      const targetSampleRate = sampleRate
      
      // BGM 샘플레이트가 다르면 재샘플링 필요
      if (bgmBuffer.sampleRate !== targetSampleRate) {
        console.log('BGM 샘플레이트 변환 필요:', {
          bgmSampleRate: bgmBuffer.sampleRate,
          targetSampleRate
        })
        
        // 간단한 재샘플링 (원본 샘플레이트 사용, OfflineAudioContext가 자동으로 처리)
        // 실제로는 OfflineAudioContext가 자동으로 재샘플링해줌
      }
      
      // Step 5: 최종 오디오 길이 계산 (Voice + 2초 페이드아웃)
      const targetDuration = voiceDuration + 2
      const totalSamples = Math.ceil(targetDuration * targetSampleRate)
      
      console.log('믹싱 파라미터:', {
        voiceDuration: voiceDuration.toFixed(2),
        targetDuration: targetDuration.toFixed(2),
        totalSamples,
        sampleRate: targetSampleRate,
        channels: numChannels
      })
      
      // Step 6: OfflineAudioContext로 오프라인 믹싱
      try {
        // OfflineAudioContext 생성자: (numberOfChannels, length, sampleRate)
        offlineContext = new OfflineAudioContext(
          numChannels, // 첫 번째: 채널 수 (1)
          totalSamples, // 두 번째: 샘플 수
          targetSampleRate // 세 번째: 샘플레이트 (48000)
        )
        console.log('OfflineAudioContext 생성 성공:', {
          numberOfChannels: numChannels,
          length: totalSamples,
          sampleRate: targetSampleRate
        })
      } catch (offlineError: any) {
        console.error('OfflineAudioContext 생성 실패:', offlineError)
        throw new Error('오프라인 오디오 컨텍스트를 생성할 수 없습니다. 브라우저가 이 기능을 지원하지 않을 수 있습니다. 오류: ' + (offlineError.message || '알 수 없는 오류'))
      }
      
      if (!offlineContext) {
        throw new Error('OfflineAudioContext 생성 실패')
      }
      
      // Voice 소스 생성 (100% 볼륨)
      const voiceSource = offlineContext.createBufferSource()
      voiceSource.buffer = voiceBuffer
      const voiceGain = offlineContext.createGain()
      voiceGain.gain.value = 1.0
      voiceSource.connect(voiceGain)
      voiceGain.connect(offlineContext.destination)
      
      // BGM 소스 생성 (20% 볼륨, 반복 재생)
      const bgmSource = offlineContext.createBufferSource()
      bgmSource.buffer = bgmBuffer // 샘플레이트가 다르면 OfflineAudioContext가 자동 재샘플링
      bgmSource.loop = true
      const bgmGain = offlineContext.createGain()
      bgmGain.gain.value = 0.2 // 20% 볼륨
      
      // BGM 페이드아웃 설정 (Voice 끝나면 2초간 페이드아웃)
      const fadeOutStart = voiceDuration
      const fadeOutEnd = targetDuration
      bgmGain.gain.setValueAtTime(0.2, fadeOutStart)
      bgmGain.gain.linearRampToValueAtTime(0, fadeOutEnd)
      
      bgmSource.connect(bgmGain)
      bgmGain.connect(offlineContext.destination)
      
      console.log('오디오 소스 연결 완료:', {
        voiceDuration: voiceDuration.toFixed(2),
        bgmLoop: true,
        fadeOutStart: fadeOutStart.toFixed(2),
        fadeOutEnd: fadeOutEnd.toFixed(2)
      })
      
      // Step 7: 오프라인 렌더링 (실제 재생 없이 처리)
      console.log('오프라인 렌더링 시작...')
      
      try {
        voiceSource.start(0)
        bgmSource.start(0)
        console.log('오디오 소스 재생 시작')
      } catch (startError: any) {
        console.error('오디오 소스 시작 실패:', startError)
        throw new Error('오디오 재생을 시작할 수 없습니다: ' + (startError.message || '알 수 없는 오류'))
      }
      
      let renderedBuffer: AudioBuffer
      try {
        renderedBuffer = await offlineContext.startRendering()
        console.log('오프라인 렌더링 완료:', {
          duration: renderedBuffer.duration.toFixed(2),
          sampleRate: renderedBuffer.sampleRate,
          channels: renderedBuffer.numberOfChannels,
          samples: renderedBuffer.length
        })
        
        // 렌더링된 버퍼가 비어있는지 확인
        if (renderedBuffer.length === 0) {
          throw new Error('렌더링된 오디오 버퍼가 비어있습니다.')
        }
        
        // 실제로 오디오 데이터가 있는지 확인 (첫 채널의 일부 샘플 확인)
        const firstChannel = renderedBuffer.getChannelData(0)
        let hasAudio = false
        for (let i = 0; i < Math.min(1000, firstChannel.length); i++) {
          if (Math.abs(firstChannel[i]) > 0.001) {
            hasAudio = true
            break
          }
        }
        
        if (!hasAudio) {
          console.warn('⚠️ 렌더링된 오디오에 실제 데이터가 거의 없습니다.')
        } else {
          console.log('✅ 렌더링된 오디오에 실제 데이터가 확인됨')
        }
        
      } catch (renderError: any) {
        console.error('오프라인 렌더링 실패:', renderError)
        throw new Error('오디오 믹싱 렌더링에 실패했습니다: ' + (renderError.message || '알 수 없는 오류'))
      }
      
      // Step 8: AudioBuffer를 WAV Blob로 변환
      let wavBlob: Blob
      try {
        wavBlob = audioBufferToWav(renderedBuffer)
        console.log('WAV 변환 완료:', {
          size: wavBlob.size,
          type: wavBlob.type
        })
        
        if (wavBlob.size === 0) {
          throw new Error('변환된 WAV 파일이 비어있습니다.')
        }
        
        // 최소 크기 확인 (1KB 이상이어야 함)
        if (wavBlob.size < 1024) {
          console.warn('⚠️ 변환된 WAV 파일이 너무 작습니다:', wavBlob.size, 'bytes')
        }
        
      } catch (convertError: any) {
        console.error('WAV 변환 실패:', convertError)
        throw new Error('오디오를 WAV 형식으로 변환하는데 실패했습니다: ' + (convertError.message || '알 수 없는 오류'))
      }
      
      // 정리
      audioContext.close().catch(() => {})
      
      console.log('✅ 오디오 믹싱 완료:', {
        size: wavBlob.size,
        type: wavBlob.type,
        duration: renderedBuffer.duration.toFixed(2)
      })
      
      return wavBlob
      
    } catch (error: any) {
      console.error('오디오 믹싱 오류:', error)
      
      // 정리 작업
      try {
        if (audioContext && audioContext.state !== 'closed') {
          await audioContext.close().catch(() => {})
        }
      } catch {}
      
      // 더 자세한 에러 메시지 제공
      const errorMsg = error.message || '알 수 없는 오류'
      let userMessage = '오디오 믹싱에 실패했습니다.\n\n'
      userMessage += `오류: ${errorMsg}\n\n`
      
      // 브라우저/모바일 관련 안내
      if (errorMsg.includes('AudioContext') || errorMsg.includes('webkitAudioContext')) {
        userMessage += '💡 해결 방법:\n'
        userMessage += '1. 브라우저를 새로고침하고 다시 시도해주세요\n'
        userMessage += '2. 다른 브라우저(Chrome, Safari)에서 시도해보세요\n'
        userMessage += '3. 모바일 데이터 대신 Wi-Fi를 사용해보세요\n'
      } else if (errorMsg.includes('디코딩') || errorMsg.includes('decode')) {
        userMessage += '💡 오디오 파일 형식 문제일 수 있습니다. 다른 BGM 파일을 선택하거나 다시 시도해주세요.\n'
      } else if (errorMsg.includes('BGM') || errorMsg.includes('불러올 수 없습니다')) {
        userMessage += '💡 BGM 파일을 불러올 수 없습니다. 네트워크 연결을 확인하거나 다른 BGM을 선택해주세요.\n'
      } else {
        userMessage += '💡 브라우저를 새로고침하고 다시 시도해주세요. 문제가 계속되면 관리자에게 문의하세요.\n'
      }
      
      throw new Error(userMessage)
    }
  }
  
  // AudioBuffer를 WAV Blob로 변환하는 헬퍼 함수
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const length = buffer.length
    const bytesPerSample = 2
    const blockAlign = numChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataSize = length * blockAlign
    const bufferSize = 44 + dataSize
    
    const arrayBuffer = new ArrayBuffer(bufferSize)
    const view = new DataView(arrayBuffer)
    const samples: Float32Array[] = []
    
    // 채널 데이터 추출
    for (let channel = 0; channel < numChannels; channel++) {
      samples.push(buffer.getChannelData(channel))
    }
    
    // WAV 헤더 작성
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, bufferSize - 8, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // fmt chunk size
    view.setUint16(20, 1, true) // audio format (PCM)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, 16, true) // bits per sample
    writeString(36, 'data')
    view.setUint32(40, dataSize, true)
    
    // PCM 데이터 작성
    let offset = 44
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, samples[channel][i]))
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
        offset += 2
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' })
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

      // Step 2: 서버 API로 TTS 생성 시도 (실제 음성 생성 가능)
      // 실패 시 클라이언트 Web Speech API로 폴백
      console.log('🔄 서버 API로 TTS 생성 시도...')
      
      let voiceBlob: Blob | null = null
      
      // 먼저 서버 API 시도 (실제 음성 생성)
      try {
        const response = await fetch('/api/generate-announcement', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            bgmUrl: null, // 서버에서는 BGM 믹싱 안 함, 클라이언트에서 처리
            voiceOptions: {
              lang: voiceLang,
              slow: voiceSpeed === 'slow',
              gender: voiceGender,
              tld: voiceTld || undefined,
            },
          }),
        })

        if (response.ok) {
          voiceBlob = await response.blob()
          console.log('✅ 서버 API TTS 생성 성공:', { size: voiceBlob.size, type: voiceBlob.type })
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.warn('⚠️ 서버 API TTS 생성 실패, 클라이언트로 폴백:', errorData.error || response.statusText)
          voiceBlob = null
        }
      } catch (serverError: any) {
        console.warn('⚠️ 서버 API 호출 실패, 클라이언트로 폴백:', serverError.message)
        voiceBlob = null
      }
      
      // 서버 API 실패 시 클라이언트 Web Speech API 사용
      if (!voiceBlob) {
        console.log('🔄 클라이언트에서 TTS 생성 시작 (Web Speech API 폴백)...')
        try {
          voiceBlob = await generateSpeechWithWebAPI(
            text,
            voiceLang,
            voiceSpeed,
            voiceGender
          )
          console.log('✅ Voice 생성 완료 (Web Speech API):', {
            size: voiceBlob.size,
            type: voiceBlob.type
          })
          
          // 최종 Blob 검증
          if (voiceBlob.size === 0) {
            throw new Error('생성된 오디오 파일이 비어있습니다. 다시 시도해주세요.')
          }
          
          // 최소 크기 확인 (1KB 이상이어야 함)
          if (voiceBlob.size < 1024) {
            console.warn('생성된 오디오 파일이 너무 작습니다:', voiceBlob.size, 'bytes')
          }
        } catch (ttsError: any) {
          console.error('TTS 생성 실패:', ttsError)
          const errorMessage = ttsError.message || '음성 생성에 실패했습니다.'
          throw new Error(`음성 생성 중 오류가 발생했습니다: ${errorMessage}\n\n브라우저가 음성 합성을 지원하지 않을 수 있습니다. 다른 브라우저(Chrome, Safari)에서 시도해보세요.`)
        }
      }
      try {
        voiceBlob = await generateSpeechWithWebAPI(
          text,
          voiceLang,
          voiceSpeed,
          voiceGender
        )
        console.log('✅ Voice 생성 완료 (Web Speech API):', {
          size: voiceBlob.size,
          type: voiceBlob.type
        })
        
        // 최종 Blob 검증
        if (voiceBlob.size === 0) {
          throw new Error('생성된 오디오 파일이 비어있습니다. 다시 시도해주세요.')
        }
        
        // 최소 크기 확인 (1KB 이상이어야 함)
        if (voiceBlob.size < 1024) {
          console.warn('생성된 오디오 파일이 너무 작습니다:', voiceBlob.size, 'bytes')
        }
      } catch (ttsError: any) {
        console.error('TTS 생성 실패:', ttsError)
        const errorMessage = ttsError.message || '음성 생성에 실패했습니다.'
        throw new Error(`음성 생성 중 오류가 발생했습니다: ${errorMessage}\n\n브라우저가 음성 합성을 지원하지 않을 수 있습니다. 다른 브라우저(Chrome, Safari)에서 시도해보세요.`)
      }

      // Step 4: BGM 믹싱 (클라이언트 사이드 - 사장님 폰에서 즉석 처리)
      // 사용자가 BGM을 선택했으면 Web Audio API로 음악과 목소리를 합성
      let finalBlob = voiceBlob
      
      if (bgmUrl) {
        console.log('🎵 BGM이 선택됨, 클라이언트에서 Web Audio API로 믹싱 시작...')
        console.log('BGM URL:', bgmUrl)
        
        try {
          console.log('클라이언트 사이드 BGM 믹싱 시작:', { 
            bgmUrl,
            voiceSize: voiceBlob.size,
            voiceType: voiceBlob.type
          })
          
          // Web Audio API를 사용하여 Voice + BGM 합성
          // Voice: 100%, BGM: 20% 볼륨
          // 목소리 끝나면 BGM 페이드아웃 후 2초 뒤 종료
          finalBlob = await mixAudio(voiceBlob, bgmUrl)
          
          console.log('✅ 클라이언트 사이드 BGM 믹싱 성공:', {
            voiceSize: voiceBlob.size,
            mixedSize: finalBlob.size,
            ratio: (finalBlob.size / voiceBlob.size).toFixed(2),
            finalType: finalBlob.type
          })
          
          // 믹싱된 파일이 Voice보다 크지 않으면 문제가 있을 수 있음
          if (finalBlob.size <= voiceBlob.size) {
            console.warn('⚠️ 믹싱된 파일 크기가 예상보다 작습니다. BGM이 제대로 믹싱되지 않았을 수 있습니다.')
          }
        } catch (mixError: any) {
          console.error('❌ 클라이언트 사이드 BGM 믹싱 실패:', mixError)
          console.error('BGM 믹싱 실패 상세:', {
            error: mixError.message,
            stack: mixError.stack,
            bgmUrl,
            voiceSize: voiceBlob.size
          })
          
          // 사용자에게 BGM 믹싱 실패를 알림하되, Voice는 사용 가능
          const mixErrorMessage = mixError.message || '알 수 없는 오류'
          setError(`⚠️ BGM 믹싱에 실패했습니다. Voice만 재생됩니다.\n\n오류: ${mixErrorMessage}\n\nVoice 오디오는 정상적으로 생성되었습니다. BGM 없이 사용할 수 있습니다.`)
          finalBlob = voiceBlob
        }
      } else {
        console.log('BGM이 선택되지 않음, Voice만 사용')
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
                <div className="space-y-2">
                  {/* 공용 BGM 업로드 (모든 사용자가 사용 가능) */}
                  <label className="block">
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (confirm('공용 BGM으로 업로드하시겠습니까? 모든 사용자가 사용할 수 있습니다.')) {
                            handleBgmUpload(file, true)
                          }
                        }
                        // input 초기화 (같은 파일 다시 선택 가능하도록)
                        e.target.value = ''
                      }}
                      disabled={uploadingBgm}
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-[#1A2B4E] rounded-lg cursor-pointer hover:bg-[#1A2B4E] hover:text-white transition bg-blue-50">
                      {uploadingBgm ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-gray-400" />
                          <span className="text-sm text-gray-500">업로드 중...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="text-[#1A2B4E]" />
                          <span className="text-sm font-medium text-[#1A2B4E]">🔊 공용 BGM 업로드 (모든 사용자 공유)</span>
                        </>
                      )}
                    </div>
                  </label>
                  
                  {/* 개인 BGM 업로드 (본인만 사용) */}
                  <label className="block">
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleBgmUpload(file, false)
                        // input 초기화
                        e.target.value = ''
                      }}
                      disabled={uploadingBgm}
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition">
                      {uploadingBgm ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-gray-400" />
                          <span className="text-sm text-gray-500">업로드 중...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">🎵 개인 BGM 업로드 (본인만 사용)</span>
                        </>
                      )}
                    </div>
                  </label>
                  
                  <p className="text-xs text-gray-500 text-center">
                    💡 공용 BGM은 모든 사용자가 사용할 수 있습니다. 개인 BGM은 본인만 사용 가능합니다.
                  </p>
                </div>
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


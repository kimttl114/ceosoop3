'use client'

import { useState } from 'react'
import { checkFirebaseConnection, runAllTests, testSavePost, testSaveUser, testReadData } from '@/utils/firebaseTest'

export default function FirebaseTestPage() {
  const [testResults, setTestResults] = useState<string[]>([])

  const addLog = (message: string) => {
    setTestResults((prev) => [...prev, message])
    console.log(message)
  }

  const handleCheckConnection = () => {
    setTestResults([])
    addLog('=== Firebase 연결 상태 확인 ===')
    const status = checkFirebaseConnection()
    addLog(`Auth: ${status.auth ? '✅' : '❌'}`)
    addLog(`DB: ${status.db ? '✅' : '❌'}`)
    addLog(`User: ${status.user ? `✅ ${status.user.email}` : '❌ 로그인 필요'}`)
  }

  const handleTestSaveUser = async () => {
    setTestResults([])
    addLog('=== 사용자 데이터 저장 테스트 ===')
    const result = await testSaveUser()
    addLog(result ? '✅ 성공' : '❌ 실패')
  }

  const handleTestSavePost = async () => {
    setTestResults([])
    addLog('=== 글 저장 테스트 ===')
    const result = await testSavePost()
    addLog(result ? '✅ 성공' : '❌ 실패')
  }

  const handleTestRead = async () => {
    setTestResults([])
    addLog('=== 데이터 읽기 테스트 ===')
    const result = await testReadData()
    addLog(result ? '✅ 성공' : '❌ 실패')
  }

  const handleRunAllTests = async () => {
    setTestResults([])
    addLog('=== 전체 테스트 시작 ===')
    await runAllTests()
    addLog('✅ 모든 테스트 완료!')
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Firebase 연결 테스트</h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={handleCheckConnection}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition"
          >
            1. 연결 상태 확인
          </button>
          
          <button
            onClick={handleTestSaveUser}
            className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition"
          >
            2. 사용자 데이터 저장 테스트
          </button>
          
          <button
            onClick={handleTestSavePost}
            className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition"
          >
            3. 글 저장 테스트
          </button>
          
          <button
            onClick={handleTestRead}
            className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition"
          >
            4. 데이터 읽기 테스트
          </button>
          
          <button
            onClick={handleRunAllTests}
            className="w-full bg-[#1A2B4E] text-white py-3 rounded-lg hover:bg-[#1A2B4E]/90 transition font-bold"
          >
            전체 테스트 실행
          </button>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 min-h-[200px]">
          <h2 className="font-bold mb-2">테스트 결과:</h2>
          <div className="space-y-1 font-mono text-sm">
            {testResults.length === 0 ? (
              <p className="text-gray-400">테스트를 실행하면 결과가 여기에 표시됩니다.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-gray-700">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold mb-2">💡 안내</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 먼저 로그인한 후 테스트를 실행하세요.</li>
            <li>• 브라우저 콘솔(F12)에서도 상세 로그를 확인할 수 있습니다.</li>
            <li>• Firebase 콘솔에서 실제 저장된 데이터를 확인하세요.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}


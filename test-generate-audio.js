// Simple test script to call /api/generate-audio and log full error message
// Run with: node test-generate-audio.js

async function main() {
  const url = 'http://localhost:3000/api/generate-audio'

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword: '테스트 방송',
        mood: '정중하게',
      }),
    })

    const text = await res.text()

    console.log('Status:', res.status)
    console.log('Content-Type:', res.headers.get('content-type'))
    console.log('Body:')
    console.log(text)
  } catch (err) {
    console.error('Request failed:', err)
  }
}

main()





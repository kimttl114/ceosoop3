import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 게시판별 프롬프트 템플릿
const categoryPrompts: Record<string, string> = {
  '대나무숲': `자영업자 커뮤니티 "대나무숲" 게시판에 올릴 글을 작성해주세요.
특징:
- 자영업자들의 일상적인 고민, 스트레스, 경험담
- 익명으로 솔직하게 털어놓는 내용
- 공감과 위로를 받고 싶은 글
- 실제 자영업자가 쓸 법한 자연스러운 톤
- 불필요한 미사여구 없이 진솔하게

형식: JSON으로 {"title": "제목", "content": "내용"} 반환`,
  
  '빌런박제소': `자영업자 커뮤니티 "빌런박제소" 게시판에 올릴 글을 작성해주세요.
특징:
- 불량 고객, 문제 고객에 대한 불만이나 경험담
- "빌런" 고객의 행동이나 말에 대한 분노나 당황
- 다른 자영업자들에게 경고하거나 공감을 구하는 내용
- 감정이 살아있는 표현
- 실제 경험한 것처럼 구체적으로

형식: JSON으로 {"title": "제목", "content": "내용"} 반환`,
  
  '유머 & 이슈': `자영업자 커뮤니티 "유머 & 이슈" 게시판에 올릴 글을 작성해주세요.
특징:
- 자영업자 관련 유머나 재미있는 일화
- 최근 이슈나 트렌드에 대한 자영업자 관점의 이야기
- 가볍고 재미있는 톤
- 공감대를 형성할 수 있는 내용

형식: JSON으로 {"title": "제목", "content": "내용"} 반환`,
  
  '비틱방(자랑방)': `자영업자 커뮤니티 "비틱방(자랑방)" 게시판에 올릴 글을 작성해주세요.
특징:
- 자영업 성공 경험, 좋은 일, 자랑하고 싶은 내용
- 긍정적이고 밝은 톤
- 다른 자영업자들에게 응원과 격려를 받고 싶은 내용
- 성취감이나 보람을 느낄 수 있는 이야기

형식: JSON으로 {"title": "제목", "content": "내용"} 반환`,
}

// 댓글 생성 프롬프트
const commentPrompt = (postTitle: string, postContent: string, category: string) => `다음 게시글에 달릴 댓글을 3~6개 생성해주세요.

게시판: ${category}
제목: ${postTitle}
내용: ${postContent}

요구사항:
- 게시판의 분위기에 맞는 댓글
- 공감, 위로, 격려, 조언 등 다양한 톤
- 자영업자들이 실제로 쓸 법한 자연스러운 표현
- 각 댓글은 1~3문장 정도
- JSON 배열로 반환: [{"content": "댓글 내용"}, ...]

형식: JSON 배열만 반환, 설명 없이`

interface GenerateDummyPostsRequest {
  category: string
  count: number
}

export async function POST(request: NextRequest) {
  try {
    // OpenAI API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // Firebase 초기화 확인
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase가 초기화되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = (await request.json()) as GenerateDummyPostsRequest
    const { category, count } = body

    if (!category || !count || count < 1 || count > 10) {
      return NextResponse.json(
        { error: '카테고리와 개수(1-10)를 올바르게 입력해주세요.' },
        { status: 400 }
      )
    }

    // 카테고리 유효성 검사
    if (!categoryPrompts[category]) {
      return NextResponse.json(
        { error: `지원하지 않는 카테고리입니다: ${category}` },
        { status: 400 }
      )
    }

    const prompt = categoryPrompts[category] || categoryPrompts['대나무숲']
    const results: Array<{ title: string; content: string; comments: string[] }> = []

    // 더미 사용자 정보 (익명 닉네임 생성)
    const dummyUsers = [
      { anonymousName: '지친 닭발', uid: 'dummy_user_1' },
      { anonymousName: '행복한 아메리카노', uid: 'dummy_user_2' },
      { anonymousName: '대박난 포스기', uid: 'dummy_user_3' },
      { anonymousName: '화난 마라탕', uid: 'dummy_user_4' },
      { anonymousName: '새벽의 사장님', uid: 'dummy_user_5' },
    ]

    for (let i = 0; i < count; i++) {
      try {
        // 글 생성
        let postCompletion
        try {
          postCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.8,
            max_tokens: 500,
          })
        } catch (openaiError: any) {
          console.error(`OpenAI API 오류 (글 생성 ${i + 1}):`, openaiError)
          throw new Error(`OpenAI API 오류: ${openaiError.message || '알 수 없는 오류'}`)
        }

        const postText = postCompletion.choices[0]?.message?.content?.trim() || ''
        if (!postText) {
          throw new Error('OpenAI가 빈 응답을 반환했습니다.')
        }

        let postData: { title: string; content: string }

        try {
          // JSON 파싱 시도
          const jsonMatch = postText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            postData = JSON.parse(jsonMatch[0])
          } else {
            // JSON이 아니면 첫 줄을 제목으로, 나머지를 내용으로
            const lines = postText.split('\n').filter(l => l.trim())
            postData = {
              title: lines[0]?.replace(/^["']|["']$/g, '').trim() || '더미 제목',
              content: lines.slice(1).join('\n').trim() || postText,
            }
          }
        } catch (parseError) {
          // 파싱 실패 시 기본값 사용
          const lines = postText.split('\n').filter(l => l.trim())
          postData = {
            title: lines[0]?.replace(/^["']|["']$/g, '').trim() || `${category} 더미 글 ${i + 1}`,
            content: lines.slice(1).join('\n').trim() || postText || '더미 내용입니다.',
          }
        }

        // 댓글 생성
        const commentCount = Math.floor(Math.random() * 4) + 3 // 3~6개
        let commentCompletion
        try {
          commentCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: commentPrompt(postData.title, postData.content, category),
              },
            ],
            temperature: 0.7,
            max_tokens: 300,
          })
        } catch (openaiError: any) {
          console.error(`OpenAI API 오류 (댓글 생성 ${i + 1}):`, openaiError)
          // 댓글 생성 실패해도 글은 저장
          commentCompletion = null
        }

        const commentText = commentCompletion?.choices[0]?.message?.content?.trim() || ''
        let comments: string[] = []

        try {
          const commentJsonMatch = commentText.match(/\[[\s\S]*\]/)
          if (commentJsonMatch) {
            const parsed = JSON.parse(commentJsonMatch[0])
            comments = parsed.map((c: any) => c.content || c).filter(Boolean)
          } else {
            // JSON이 아니면 줄바꿈으로 분리
            comments = commentText
              .split('\n')
              .map(l => l.trim())
              .filter(l => l && !l.match(/^[0-9]+[\.\)]/) && !l.startsWith('-'))
              .slice(0, commentCount)
          }
        } catch (parseError) {
          // 파싱 실패 시 기본 댓글 생성
          comments = [
            '공감합니다...',
            '힘내세요!',
            '저도 비슷한 경험이 있어요.',
          ].slice(0, commentCount)
        }

        // Firestore에 글 저장
        const randomUser = dummyUsers[Math.floor(Math.random() * dummyUsers.length)]
        let postRef
        try {
          postRef = await addDoc(collection(db, 'posts'), {
            title: postData.title,
            content: postData.content,
            category: category,
            businessType: '치킨',
            region: '서울',
            author: randomUser.anonymousName,
            uid: randomUser.uid,
            timestamp: serverTimestamp(),
            likes: 0,
            comments: comments.length,
            images: [],
            videos: [],
            isSimpleMode: false,
          })
        } catch (firestoreError: any) {
          console.error(`Firestore 저장 오류 (글 ${i + 1}):`, firestoreError)
          throw new Error(`Firestore 저장 실패: ${firestoreError.message || '알 수 없는 오류'}`)
        }

        // 댓글 저장
        if (comments.length > 0 && postRef) {
          for (const commentContent of comments) {
            try {
              const commentUser = dummyUsers[Math.floor(Math.random() * dummyUsers.length)]
              await addDoc(collection(db, 'posts', postRef.id, 'comments'), {
                content: commentContent,
                author: commentUser.anonymousName,
                uid: commentUser.uid,
                timestamp: serverTimestamp(),
              })
            } catch (commentError: any) {
              console.error(`댓글 저장 오류 (글 ${i + 1}):`, commentError)
              // 댓글 저장 실패해도 계속 진행
            }
          }
        }

        results.push({
          title: postData.title,
          content: postData.content,
          comments: comments,
        })

        // API 호출 제한을 고려한 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error: any) {
        console.error(`더미 글 ${i + 1} 생성 실패:`, error)
        // 개별 실패는 계속 진행하되, 에러 정보를 기록
        results.push({
          title: `[생성 실패] ${category} 더미 글 ${i + 1}`,
          content: `오류: ${error.message || '알 수 없는 오류'}`,
          comments: [],
        })
      }
    }

    // 결과 확인
    if (results.length === 0) {
      return NextResponse.json(
        { error: '더미 글 생성에 실패했습니다. 모든 시도가 실패했습니다.' },
        { status: 500 }
      )
    }

    const successCount = results.filter(r => !r.title.includes('[생성 실패]')).length
    const failCount = results.length - successCount

    return NextResponse.json({
      success: true,
      message: `${category} 게시판에 ${successCount}개의 더미 글이 생성되었습니다.${failCount > 0 ? ` (${failCount}개 실패)` : ''}`,
      results,
      successCount,
      failCount,
    })
  } catch (error: any) {
    console.error('더미 글 생성 오류:', error)
    return NextResponse.json(
      { error: error.message || '더미 글 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}



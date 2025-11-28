import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs/promises'
import * as path from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const { fileName } = await request.json()

    if (!fileName) {
      return NextResponse.json(
        { error: '파일명이 필요합니다.' },
        { status: 400 }
      )
    }

    // 로컬 BGM 파일 경로
    const localBgmPath = path.join(process.cwd(), 'bgm', fileName)

    // 파일 존재 확인
    if (!existsSync(localBgmPath)) {
      return NextResponse.json(
        { error: '파일을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 파일 읽기
    const fileBuffer = await fs.readFile(localBgmPath)

    // Base64로 인코딩하여 반환 (클라이언트에서 업로드)
    const base64 = fileBuffer.toString('base64')

    return NextResponse.json({
      success: true,
      fileName: fileName,
      base64: base64,
      contentType: 'audio/mpeg',
    })
  } catch (error: any) {
    console.error('공용 BGM 파일 읽기 오류:', error)
    return NextResponse.json(
      { error: error.message || '파일 읽기 실패' },
      { status: 500 }
    )
  }
}

// 모든 로컬 BGM 파일 목록 조회
export async function GET() {
  try {
    const bgmDir = path.join(process.cwd(), 'bgm')
    
    try {
      const files = await fs.readdir(bgmDir)
      const mp3Files = files.filter((file) => file.endsWith('.mp3'))

      return NextResponse.json({
        files: mp3Files,
      })
    } catch {
      return NextResponse.json(
        { error: 'BGM 폴더를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
  } catch (error: any) {
    console.error('BGM 파일 목록 조회 오류:', error)
    return NextResponse.json(
      { error: error.message || '조회 실패' },
      { status: 500 }
    )
  }
}


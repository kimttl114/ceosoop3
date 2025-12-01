import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import dynamic from 'next/dynamic'

// [수정] ssr: false 옵션을 줘서 클라이언트에서만 로드되게 함 (에러 방지)
const MusicPlayer = dynamic(() => import('@/components/global/MusicPlayer'), {
  ssr: false,
})

const notoSansKR = Noto_Sans_KR({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: '널자 - 자영업자를 위한 AI 도구 모음집',
  description: '7년 치킨집 사장이 만든 AI 도구 모음집. 내가 불편했던 것들을 AI로 해결했어요.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={notoSansKR.className}>
        {children}
        <MusicPlayer />
      </body>
    </html>
  )
}


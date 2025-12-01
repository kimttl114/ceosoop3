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
  title: '자영업자 놀이동산 - 재미와 유용함을 한 곳에',
  description: '자영업자를 위한 게임, 도구, 커뮤니티 - 스트레스 풀고, 재미있게, 유용하게!',
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


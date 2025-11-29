'use client'

import { useEffect, useRef } from 'react'

export default function GamesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 크기 설정
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 아기자기한 애니메이션 설정
    let time = 0
    const numPoints = 8
    const points: Array<{ x: number; y: number; vx: number; vy: number; size: number; hue: number }> = []

    // 초기 점 생성 (더 작고 부드러운 움직임)
    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 50 + Math.random() * 100,
        hue: Math.random() * 360,
      })
    }

    const animate = () => {
      time += 0.008
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 점 이동 (더 부드럽게)
      points.forEach((point, index) => {
        point.x += point.vx
        point.y += point.vy

        // 경계 처리
        if (point.x < 0 || point.x > canvas.width) point.vx *= -1
        if (point.y < 0 || point.y > canvas.height) point.vy *= -1

        point.x = Math.max(0, Math.min(canvas.width, point.x))
        point.y = Math.max(0, Math.min(canvas.height, point.y))

        // 색상 변화 (더 부드럽게)
        point.hue = (point.hue + 0.2) % 360
      })

      // 아기자기한 그라데이션 생성 (파스텔 톤)
      const gradient1 = ctx.createRadialGradient(
        points[0].x,
        points[0].y,
        0,
        points[0].x,
        points[0].y,
        points[0].size
      )
      gradient1.addColorStop(0, 'rgba(255, 182, 193, 0.2)') // 핑크
      gradient1.addColorStop(0.5, 'rgba(255, 192, 203, 0.1)')
      gradient1.addColorStop(1, 'transparent')

      const gradient2 = ctx.createRadialGradient(
        points[2].x,
        points[2].y,
        0,
        points[2].x,
        points[2].y,
        points[2].size
      )
      gradient2.addColorStop(0, 'rgba(221, 160, 221, 0.2)') // 자주색
      gradient2.addColorStop(0.5, 'rgba(221, 160, 221, 0.1)')
      gradient2.addColorStop(1, 'transparent')

      const gradient3 = ctx.createRadialGradient(
        points[4].x,
        points[4].y,
        0,
        points[4].x,
        points[4].y,
        points[4].size
      )
      gradient3.addColorStop(0, 'rgba(176, 224, 230, 0.2)') // 파랑
      gradient3.addColorStop(0.5, 'rgba(176, 224, 230, 0.1)')
      gradient3.addColorStop(1, 'transparent')

      const gradient4 = ctx.createRadialGradient(
        points[6].x,
        points[6].y,
        0,
        points[6].x,
        points[6].y,
        points[6].size
      )
      gradient4.addColorStop(0, 'rgba(255, 218, 185, 0.2)') // 복숭아
      gradient4.addColorStop(0.5, 'rgba(255, 218, 185, 0.1)')
      gradient4.addColorStop(1, 'transparent')

      // 그라데이션 그리기
      ctx.fillStyle = gradient1
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = gradient2
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = gradient3
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = gradient4
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 작은 별 그리기 (아기자기함 추가)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      for (let i = 0; i < 15; i++) {
        const x = (time * 20 + i * 100) % canvas.width
        const y = (Math.sin(time + i) * 50 + canvas.height / 2) % canvas.height
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      }

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'multiply' }}
    />
  )
}






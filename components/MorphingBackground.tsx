'use client'

import { useEffect, useRef } from 'react'

export default function MorphingBackground() {
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

    // 블러 모핑 설정
    let time = 0
    const numPoints = 6
    const points: Array<{ x: number; y: number; vx: number; vy: number }> = []

    // 초기 점 생성
    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      })
    }

    const animate = () => {
      time += 0.01
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 점 이동
      points.forEach((point) => {
        point.x += point.vx
        point.y += point.vy

        // 경계 처리
        if (point.x < 0 || point.x > canvas.width) point.vx *= -1
        if (point.y < 0 || point.y > canvas.height) point.vy *= -1

        point.x = Math.max(0, Math.min(canvas.width, point.x))
        point.y = Math.max(0, Math.min(canvas.height, point.y))
      })

      // 그라데이션 생성
      const gradient1 = ctx.createRadialGradient(
        points[0].x,
        points[0].y,
        0,
        points[0].x,
        points[0].y,
        canvas.width * 0.6
      )
      gradient1.addColorStop(0, 'rgba(76, 175, 80, 0.15)')
      gradient1.addColorStop(0.5, 'rgba(139, 195, 74, 0.08)')
      gradient1.addColorStop(1, 'transparent')

      const gradient2 = ctx.createRadialGradient(
        points[2].x,
        points[2].y,
        0,
        points[2].x,
        points[2].y,
        canvas.width * 0.5
      )
      gradient2.addColorStop(0, 'rgba(255, 193, 7, 0.12)')
      gradient2.addColorStop(0.5, 'rgba(255, 235, 59, 0.06)')
      gradient2.addColorStop(1, 'transparent')

      const gradient3 = ctx.createRadialGradient(
        points[4].x,
        points[4].y,
        0,
        points[4].x,
        points[4].y,
        canvas.width * 0.55
      )
      gradient3.addColorStop(0, 'rgba(104, 159, 56, 0.1)')
      gradient3.addColorStop(0.5, 'rgba(76, 175, 80, 0.05)')
      gradient3.addColorStop(1, 'transparent')

      // 그라데이션 그리기
      ctx.fillStyle = gradient1
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = gradient2
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = gradient3
      ctx.fillRect(0, 0, canvas.width, canvas.height)

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


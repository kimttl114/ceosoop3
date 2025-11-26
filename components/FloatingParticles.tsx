'use client'

import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
}

export default function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    // 떠다니는 파티클 생성 (20개)
    const newParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 3, // 2-5px
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: 0.3 + Math.random() * 0.4, // 0.3-0.7
    }))
    setParticles(newParticles)

    // 파티클 애니메이션
    const animate = () => {
      setParticles((prev) =>
        prev.map((particle) => {
          // 속도에 따라 새 위치 계산
          let newX = particle.x + particle.speedX
          let newY = particle.y + particle.speedY
          
          // 화면 밖으로 나가면 반대편에서 다시 시작
          if (newX > 100) newX = 0
          if (newX < 0) newX = 100
          if (newY > 100) newY = 0
          if (newY < 0) newY = 100
          
          return {
            ...particle,
            x: newX,
            y: newY,
          }
        })
      )
    }

    const interval = setInterval(animate, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full particle-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: `rgba(76, 175, 80, ${particle.opacity})`,
            boxShadow: `0 0 ${particle.size * 2}px rgba(76, 175, 80, ${particle.opacity * 0.8})`,
            transition: 'all 0.05s linear',
          }}
        />
      ))}
    </div>
  )
}


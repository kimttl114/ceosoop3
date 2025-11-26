'use client'

import { useEffect, useState } from 'react'

interface Leaf {
  id: number
  left: number
  delay: number
  duration: number
  size: number
  rotation: number
}

export default function FallingLeaves() {
  const [leaves, setLeaves] = useState<Leaf[]>([])

  useEffect(() => {
    // 떨어지는 잎 생성 (30개)
    const newLeaves: Leaf[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 20,
      duration: 15 + Math.random() * 10, // 15-25초
      size: 8 + Math.random() * 12, // 8-20px
      rotation: Math.random() * 360,
    }))
    setLeaves(newLeaves)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute top-0 leaf-fall"
          style={{
            left: `${leaf.left}%`,
            animationDelay: `${leaf.delay}s`,
            animationDuration: `${leaf.duration}s`,
            fontSize: `${leaf.size}px`,
            transform: `rotate(${leaf.rotation}deg)`,
          }}
        >
          🍃
        </div>
      ))}
    </div>
  )
}


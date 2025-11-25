'use client'

interface AvatarMiniProps {
  size?: number
  avatarUrl?: string | null
  userId?: string
}

export default function AvatarMini({ size = 32, avatarUrl, userId }: AvatarMiniProps) {
  if (avatarUrl) {
    return (
      <div
        className="rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-gray-300"
        style={{ width: size, height: size }}
      >
        <img
          src={avatarUrl}
          alt="아바타"
          className="w-full h-full object-cover"
          onError={(e) => {
            // 이미지 로드 실패 시 기본 아이콘 표시
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              parent.innerHTML = `<span class="text-gray-500" style="font-size: ${size * 0.5}px">👤</span>`
            }
          }}
        />
      </div>
    )
  }

  return (
    <div
      className="rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="text-gray-500" style={{ fontSize: size * 0.5 }}>
        👤
      </span>
    </div>
  )
}

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import BottomNav from '@/components/BottomNav'

const FabricEditor = dynamic(() => import('@/components/Editor/FabricEditor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={48} />
    </div>
  ),
})

export default function EditorPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-7xl mx-auto p-5">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Fabric 고급 에디터</h1>
        <FabricEditor />
      </div>
      <BottomNav />
    </div>
  )
}


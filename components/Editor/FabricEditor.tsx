'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas, IText, Rect, Circle, FabricImage, Object as FabricObject, Triangle, Line, Group } from 'fabric'
import { Undo2, Redo2, Copy, AlignLeft, AlignCenter, AlignRight, Layers, Save, FolderOpen, Image, Type, Square, Circle as CircleIcon, Triangle as TriangleIcon, Minus, MoveVertical, MoveHorizontal } from 'lucide-react'

interface HistoryState {
  objects: string
  version: number
}

export default function FabricEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<Canvas | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<FabricObject | null>(null)
  const [fillColor, setFillColor] = useState('#000000')
  const [fontFamily, setFontFamily] = useState('Arial')
  const [fontSize, setFontSize] = useState(32)
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showLayers, setShowLayers] = useState(false)
  const [shadowEnabled, setShadowEnabled] = useState(false)
  const [shadowColor, setShadowColor] = useState('#000000')
  const [shadowBlur, setShadowBlur] = useState(10)
  const [shadowOffsetX, setShadowOffsetX] = useState(5)
  const [shadowOffsetY, setShadowOffsetY] = useState(5)
  const [rotation, setRotation] = useState(0)
  const [textBold, setTextBold] = useState(false)
  const [textItalic, setTextItalic] = useState(false)
  const [textUnderline, setTextUnderline] = useState(false)
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(0)
  const [opacity, setOpacity] = useState(1)
  const [imageBrightness, setImageBrightness] = useState(0)
  const [imageContrast, setImageContrast] = useState(0)
  const [imageSaturation, setImageSaturation] = useState(0)
  const [imageBlur, setImageBlur] = useState(0)

  // 히스토리 저장
  const saveHistory = () => {
    const canvas = fabricRef.current
    if (!canvas) return

    const json = JSON.stringify(canvas.toJSON())
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ objects: json, version: Date.now() })
    
    if (newHistory.length > 50) {
      newHistory.shift()
    } else {
      setHistoryIndex(newHistory.length - 1)
    }
    
    setHistory(newHistory)
  }

  // Undo
  const handleUndo = () => {
    if (historyIndex <= 0) return
    
    const canvas = fabricRef.current
    if (!canvas) return

    const newIndex = historyIndex - 1
    const state = history[newIndex]
    
    canvas.loadFromJSON(state.objects, () => {
      canvas.renderAll()
      setHistoryIndex(newIndex)
      const activeObject = canvas.getActiveObject()
      setSelected(activeObject || null)
      if (activeObject) {
        updatePropertiesFromSelection(activeObject)
      }
    })
  }

  // Redo
  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return
    
    const canvas = fabricRef.current
    if (!canvas) return

    const newIndex = historyIndex + 1
    const state = history[newIndex]
    
    canvas.loadFromJSON(state.objects, () => {
      canvas.renderAll()
      setHistoryIndex(newIndex)
      const activeObject = canvas.getActiveObject()
      setSelected(activeObject || null)
      if (activeObject) {
        updatePropertiesFromSelection(activeObject)
      }
    })
  }

  // 복사
  const handleCopy = () => {
    const canvas = fabricRef.current
    if (!canvas || !selected) return

    const cloned = selected.clone() as FabricObject
    cloned.set({
      left: (selected.left || 0) + 20,
      top: (selected.top || 0) + 20,
    })
    canvas.add(cloned)
    canvas.setActiveObject(cloned)
    setSelected(cloned)
    canvas.renderAll()
    saveHistory()
  }

  // 정렬
  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const canvas = fabricRef.current
    if (!canvas || !selected) return

    const canvasWidth = canvas.getWidth()
    const canvasHeight = canvas.getHeight()
    const obj = selected

    switch (type) {
      case 'left':
        obj.set({ left: 0 })
        break
      case 'center':
        obj.set({ left: (canvasWidth - (obj.width || 0) * (obj.scaleX || 1)) / 2 })
        break
      case 'right':
        obj.set({ left: canvasWidth - (obj.width || 0) * (obj.scaleX || 1) })
        break
      case 'top':
        obj.set({ top: 0 })
        break
      case 'middle':
        obj.set({ top: (canvasHeight - (obj.height || 0) * (obj.scaleY || 1)) / 2 })
        break
      case 'bottom':
        obj.set({ top: canvasHeight - (obj.height || 0) * (obj.scaleY || 1) })
        break
    }
    canvas.renderAll()
    saveHistory()
  }

  // 그룹화
  const handleGroup = () => {
    const canvas = fabricRef.current
    if (!canvas) return

    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length < 2) return

    const group = new Group(activeObjects, {
      left: activeObjects[0].left || 0,
      top: activeObjects[0].top || 0,
    })
    canvas.remove(...activeObjects)
    canvas.add(group)
    canvas.setActiveObject(group)
    setSelected(group)
    canvas.renderAll()
    saveHistory()
  }

  // 그룹 해제
  const handleUngroup = () => {
    const canvas = fabricRef.current
    if (!canvas || !selected || !(selected instanceof Group)) return

    const objects = selected.getObjects()
    selected.getObjects().forEach((obj) => {
      obj.set({
        left: (obj.left || 0) + (selected.left || 0),
        top: (obj.top || 0) + (selected.top || 0),
      })
    })
    canvas.remove(selected)
    objects.forEach((obj) => canvas.add(obj))
    canvas.renderAll()
    setSelected(null)
    saveHistory()
  }

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 1000,
      backgroundColor: '#fff',
      preserveObjectStacking: true,
    })

    fabricRef.current = canvas

    canvas.on('selection:created', (e) => {
      const activeObject = canvas.getActiveObject()
      setSelected(activeObject || null)
      if (activeObject) {
        updatePropertiesFromSelection(activeObject)
      }
    })
    canvas.on('selection:updated', (e) => {
      const activeObject = canvas.getActiveObject()
      setSelected(activeObject || null)
      if (activeObject) {
        updatePropertiesFromSelection(activeObject)
      }
    })
    canvas.on('selection:cleared', () => {
      setSelected(null)
      resetProperties()
    })

    // 객체 변경 시 히스토리 저장
    canvas.on('object:added', () => saveHistory())
    canvas.on('object:removed', () => saveHistory())
    canvas.on('object:modified', () => saveHistory())

    // 초기 히스토리 저장
    saveHistory()

    // 키보드 단축키
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault()
        handleCopy()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      canvas.dispose()
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const resetProperties = () => {
    setFillColor('#000000')
    setFontFamily('Arial')
    setFontSize(32)
    setTextBold(false)
    setTextItalic(false)
    setTextUnderline(false)
    setShadowEnabled(false)
    setRotation(0)
    setStrokeWidth(0)
    setOpacity(1)
  }

  const updatePropertiesFromSelection = (obj: FabricObject | null) => {
    if (!obj) return

    if ('fill' in obj && typeof obj.fill === 'string') {
      setFillColor(obj.fill)
    }

    if ('fontFamily' in obj) {
      setFontFamily(obj.fontFamily as string || 'Arial')
    }

    if ('fontSize' in obj) {
      setFontSize(obj.fontSize as number || 32)
    }

    if ('fontWeight' in obj) {
      setTextBold(obj.fontWeight === 'bold' || obj.fontWeight === 700)
    }

    if ('fontStyle' in obj) {
      setTextItalic(obj.fontStyle === 'italic')
    }

    if ('underline' in obj) {
      setTextUnderline(obj.underline as boolean || false)
    }

    if ('shadow' in obj && obj.shadow) {
      setShadowEnabled(true)
      setShadowColor((obj.shadow as any).color || '#000000')
      setShadowBlur((obj.shadow as any).blur || 10)
      setShadowOffsetX((obj.shadow as any).offsetX || 5)
      setShadowOffsetY((obj.shadow as any).offsetY || 5)
    } else {
      setShadowEnabled(false)
    }

    if ('angle' in obj) {
      setRotation(obj.angle || 0)
    }

    if ('stroke' in obj && typeof obj.stroke === 'string') {
      setStrokeColor(obj.stroke)
      setStrokeWidth((obj.strokeWidth as number) || 0)
    }

    if ('opacity' in obj) {
      setOpacity(obj.opacity || 1)
    }
  }

  const updateSelectedObject = (updates: any) => {
    const canvas = fabricRef.current
    if (!canvas || !selected) return

    Object.assign(selected, updates)
    canvas.renderAll()
    saveHistory()
  }

  const handleColorChange = (color: string) => {
    setFillColor(color)
    updateSelectedObject({ fill: color })
  }

  const handleFontFamilyChange = (font: string) => {
    setFontFamily(font)
    if (selected && 'fontFamily' in selected) {
      updateSelectedObject({ fontFamily: font })
    }
  }

  const handleFontSizeChange = (size: number) => {
    setFontSize(size)
    if (selected && 'fontSize' in selected) {
      updateSelectedObject({ fontSize: size })
    }
  }

  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color)
    const canvas = fabricRef.current
    if (canvas) {
      canvas.setBackgroundColor(color, canvas.renderAll.bind(canvas))
      saveHistory()
    }
  }

  const handleShadowToggle = () => {
    const newShadowEnabled = !shadowEnabled
    setShadowEnabled(newShadowEnabled)
    
    if (newShadowEnabled) {
      updateSelectedObject({
        shadow: {
          color: shadowColor,
          blur: shadowBlur,
          offsetX: shadowOffsetX,
          offsetY: shadowOffsetY,
        }
      })
    } else {
      updateSelectedObject({ shadow: null })
    }
  }

  const handleRotationChange = (angle: number) => {
    setRotation(angle)
    updateSelectedObject({ angle: angle })
  }

  const handleTextStyleChange = (style: 'bold' | 'italic' | 'underline', value: boolean) => {
    if (!selected || !('fontWeight' in selected)) return

    switch (style) {
      case 'bold':
        setTextBold(value)
        updateSelectedObject({ fontWeight: value ? 'bold' : 'normal' })
        break
      case 'italic':
        setTextItalic(value)
        updateSelectedObject({ fontStyle: value ? 'italic' : 'normal' })
        break
      case 'underline':
        setTextUnderline(value)
        updateSelectedObject({ underline: value })
        break
    }
  }

  const handleStrokeChange = (width: number, color: string) => {
    setStrokeWidth(width)
    setStrokeColor(color)
    updateSelectedObject({ strokeWidth: width, stroke: width > 0 ? color : '' })
  }

  const handleOpacityChange = (value: number) => {
    setOpacity(value)
    updateSelectedObject({ opacity: value })
  }

  const addText = () => {
    const canvas = fabricRef.current
    if (!canvas) return

    const text = new IText('텍스트 입력', {
      left: 100,
      top: 100,
      fontSize: fontSize,
      fill: fillColor,
      fontFamily: fontFamily,
    })
    canvas.add(text)
    canvas.setActiveObject(text)
    setSelected(text)
    canvas.renderAll()
  }

  const addRect = () => {
    const canvas = fabricRef.current
    if (!canvas) return

    const rect = new Rect({
      width: 200,
      height: 100,
      fill: fillColor,
      left: 100,
      top: 150,
    })
    canvas.add(rect)
    canvas.setActiveObject(rect)
    setSelected(rect)
    canvas.renderAll()
  }

  const addCircle = () => {
    const canvas = fabricRef.current
    if (!canvas) return

    const circle = new Circle({
      radius: 60,
      fill: fillColor,
      left: 150,
      top: 250,
    })
    canvas.add(circle)
    canvas.setActiveObject(circle)
    setSelected(circle)
    canvas.renderAll()
  }

  const addTriangle = () => {
    const canvas = fabricRef.current
    if (!canvas) return

    const triangle = new Triangle({
      width: 100,
      height: 100,
      fill: fillColor,
      left: 150,
      top: 350,
    })
    canvas.add(triangle)
    canvas.setActiveObject(triangle)
    setSelected(triangle)
    canvas.renderAll()
  }

  const addLine = () => {
    const canvas = fabricRef.current
    if (!canvas) return

    const line = new Line([50, 50, 200, 50], {
      stroke: fillColor,
      strokeWidth: 3,
      left: 100,
      top: 450,
    })
    canvas.add(line)
    canvas.setActiveObject(line)
    setSelected(line)
    canvas.renderAll()
  }

  const uploadImage = () => {
    fileInputRef.current?.click()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const canvas = fabricRef.current
    if (!canvas) return

    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = function (f) {
      if (f.target?.result) {
        FabricImage.fromURL(f.target.result as string).then((img) => {
          const maxWidth = 400
          if (img.width && img.width > maxWidth) {
            const scale = maxWidth / img.width
            img.scale(scale)
          }
          canvas.add(img)
          canvas.setActiveObject(img)
          setSelected(img)
          canvas.renderAll()
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleImageResize = (width: number, height: number) => {
    const canvas = fabricRef.current
    if (!canvas || !selected) return

    if (selected instanceof FabricImage) {
      const scaleX = width / (selected.width || 1)
      const scaleY = height / (selected.height || 1)
      selected.scaleX = scaleX
      selected.scaleY = scaleY
      canvas.renderAll()
      saveHistory()
    }
  }

  const applyImageFilter = async (filterType: 'brightness' | 'contrast' | 'saturation' | 'blur', value: number) => {
    const canvas = fabricRef.current
    if (!canvas || !selected || !(selected instanceof FabricImage)) return

    try {
      // Fabric.js v6 필터 동적 로드
      const fabricModule = await import('fabric')
      const filters = (fabricModule as any).filters

      if (!selected.filters) {
        selected.filters = []
      }

      // 특정 타입의 필터만 제거
      selected.filters = selected.filters.filter((f: any) => {
        const filterName = f.constructor?.name || f.type || ''
        if (filterType === 'brightness' && (filterName.includes('Brightness') || filterName === 'Brightness')) return false
        if (filterType === 'contrast' && (filterName.includes('Contrast') || filterName === 'Contrast')) return false
        if (filterType === 'saturation' && (filterName.includes('Saturation') || filterName === 'Saturation')) return false
        if (filterType === 'blur' && (filterName.includes('Blur') || filterName === 'Blur')) return false
        return true
      })

      // 새 필터 추가
      if (value !== 0 && filters) {
        try {
          if (filterType === 'brightness' && filters.Brightness) {
            const filter = new filters.Brightness({ brightness: value / 100 })
            selected.filters.push(filter)
          } else if (filterType === 'contrast' && filters.Contrast) {
            const filter = new filters.Contrast({ contrast: value / 100 })
            selected.filters.push(filter)
          } else if (filterType === 'saturation' && filters.Saturation) {
            const filter = new filters.Saturation({ saturation: value / 100 })
            selected.filters.push(filter)
          } else if (filterType === 'blur' && filters.Blur) {
            const filter = new filters.Blur({ blur: value / 10 })
            selected.filters.push(filter)
          }
        } catch (filterError) {
          console.log('필터 생성 실패 (선택적 기능):', filterError)
        }
      }

      await selected.applyFilters()
      canvas.renderAll()
      saveHistory()
    } catch (error) {
      console.log('필터 적용 오류 (선택적 기능):', error)
      // 필터가 작동하지 않아도 계속 진행
      canvas.renderAll()
    }
  }

  const deleteObject = () => {
    const canvas = fabricRef.current
    if (!canvas || !selected) return

    canvas.remove(selected)
    canvas.renderAll()
    setSelected(null)
    saveHistory()
  }

  const bringForward = () => {
    if (!selected) return
    const canvas = fabricRef.current
    if (!canvas) return

    canvas.bringForward(selected)
    canvas.renderAll()
    saveHistory()
  }

  const sendBackward = () => {
    if (!selected) return
    const canvas = fabricRef.current
    if (!canvas) return

    canvas.sendBackwards(selected)
    canvas.renderAll()
    saveHistory()
  }

  const bringToFront = () => {
    if (!selected) return
    const canvas = fabricRef.current
    if (!canvas) return

    canvas.bringToFront(selected)
    canvas.renderAll()
    saveHistory()
  }

  const sendToBack = () => {
    if (!selected) return
    const canvas = fabricRef.current
    if (!canvas) return

    canvas.sendToBack(selected)
    canvas.renderAll()
    saveHistory()
  }

  const saveAsImage = () => {
    const canvas = fabricRef.current
    if (!canvas) return

    const dataURL = canvas.toDataURL({ format: 'png', quality: 1 })
    const link = document.createElement('a')
    link.href = dataURL
    link.download = 'design.png'
    link.click()
  }

  const saveProject = () => {
    const canvas = fabricRef.current
    if (!canvas) return

    const json = JSON.stringify(canvas.toJSON())
    const blob = new Blob([json], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `design-${Date.now()}.json`
    link.click()
  }

  const loadProject = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        const canvas = fabricRef.current
        if (!canvas) return

        try {
          const json = event.target?.result as string
          canvas.loadFromJSON(json, () => {
            canvas.renderAll()
            saveHistory()
          })
        } catch (error) {
          alert('프로젝트 파일을 불러올 수 없습니다.')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const applyTemplate = (template: any) => {
    const canvas = fabricRef.current
    if (!canvas) return

    canvas.loadFromJSON(JSON.stringify(template), () => {
      canvas.renderAll()
      saveHistory()
    })
  }

  const templates = [
    {
      name: '빈 캔버스',
      data: { version: '6.0.0', objects: [], background: '#ffffff' }
    },
    {
      name: '명함 템플릿',
      data: {
        version: '6.0.0',
        objects: [
          {
            type: 'rect',
            left: 50,
            top: 50,
            width: 300,
            height: 180,
            fill: '#f0f0f0',
          },
          {
            type: 'i-text',
            left: 100,
            top: 80,
            text: '회사명',
            fontSize: 24,
            fill: '#000000',
            fontFamily: 'Arial',
          },
        ],
        background: '#ffffff'
      }
    },
  ]

  const selectedImage = selected instanceof FabricImage ? selected : null
  const selectedText = selected && 'fontFamily' in selected ? selected : null
  const isGroup = selected instanceof Group
  const canvas = fabricRef.current
  const allObjects = canvas?.getObjects() || []

  return (
    <div className="flex gap-4 p-5 bg-gray-50 min-h-screen">
      <div className="w-72 p-4 bg-white rounded-lg shadow-lg space-y-4 overflow-y-auto max-h-screen">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Image size={20} />
          <span>도구</span>
        </h2>

        {/* Undo/Redo */}
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            title="되돌리기 (Ctrl+Z)"
          >
            <Undo2 size={16} />
            <span>실행취소</span>
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            title="다시하기 (Ctrl+Y)"
          >
            <Redo2 size={16} />
            <span>다시실행</span>
          </button>
        </div>

        {/* 복사 */}
        <button
          onClick={handleCopy}
          disabled={!selected}
          className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          title="복사 (Ctrl+C)"
        >
          <Copy size={16} />
          <span>복사</span>
        </button>

        <hr className="border-gray-300" />

        {/* 도형 추가 */}
        <div>
          <h3 className="font-semibold text-sm mb-2">도형 추가</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={addText}
              className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
            >
              <Type size={16} />
              <span>텍스트</span>
            </button>
            <button
              onClick={addRect}
              className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
            >
              <Square size={16} />
              <span>사각형</span>
            </button>
            <button
              onClick={addCircle}
              className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
            >
              <CircleIcon size={16} />
              <span>원</span>
            </button>
            <button
              onClick={addTriangle}
              className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
            >
              <TriangleIcon size={16} />
              <span>삼각형</span>
            </button>
            <button
              onClick={addLine}
              className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1 col-span-2"
            >
              <Minus size={16} />
              <span>선</span>
            </button>
          </div>
        </div>

        <button
          onClick={uploadImage}
          className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition"
        >
          이미지 업로드
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
          accept="image/*"
        />

        <hr className="border-gray-300" />

        {/* 배경 색상 */}
        <div>
          <h3 className="font-semibold text-sm mb-2">배경 색상</h3>
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => handleBackgroundColorChange(e.target.value)}
            className="w-full h-10 rounded-lg cursor-pointer border border-gray-300"
          />
        </div>

        {/* 색상 선택 */}
        {selected && (
          <div>
            <h3 className="font-semibold text-sm mb-2">색상</h3>
            <input
              type="color"
              value={fillColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-full h-10 rounded-lg cursor-pointer border border-gray-300"
            />
          </div>
        )}

        {/* 텍스트 설정 */}
        {selectedText && (
          <>
            <hr className="border-gray-300" />
            <div>
              <h3 className="font-semibold text-sm mb-2">글꼴</h3>
              <select
                value={fontFamily}
                onChange={(e) => handleFontFamilyChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm mb-2"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
                <option value="Impact">Impact</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
              </select>
              <div>
                <label className="text-xs text-gray-600">크기: {fontSize}</label>
                <input
                  type="range"
                  min="12"
                  max="200"
                  value={fontSize}
                  onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleTextStyleChange('bold', !textBold)}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition ${
                    textBold ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  굵게
                </button>
                <button
                  onClick={() => handleTextStyleChange('italic', !textItalic)}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition ${
                    textItalic ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  기울임
                </button>
                <button
                  onClick={() => handleTextStyleChange('underline', !textUnderline)}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition ${
                    textUnderline ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  밑줄
                </button>
              </div>
            </div>
          </>
        )}

        {/* 정렬 도구 */}
        {selected && (
          <>
            <hr className="border-gray-300" />
            <div>
              <h3 className="font-semibold text-sm mb-2">정렬</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleAlign('left')}
                  className="p-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                  title="좌측 정렬"
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onClick={() => handleAlign('center')}
                  className="p-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                  title="중앙 정렬"
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  onClick={() => handleAlign('right')}
                  className="p-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                  title="우측 정렬"
                >
                  <AlignRight size={16} />
                </button>
                <button
                  onClick={() => handleAlign('top')}
                  className="p-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                  title="상단 정렬"
                >
                  <MoveVertical size={16} />
                </button>
                <button
                  onClick={() => handleAlign('middle')}
                  className="p-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                  title="중앙 정렬"
                >
                  <MoveHorizontal size={16} />
                </button>
                <button
                  onClick={() => handleAlign('bottom')}
                  className="p-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                  title="하단 정렬"
                >
                  <MoveVertical size={16} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* 그룹화 */}
        {canvas && canvas.getActiveObjects().length >= 2 && (
          <>
            <hr className="border-gray-300" />
            <button
              onClick={handleGroup}
              className="w-full px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition"
            >
              그룹화
            </button>
          </>
        )}
        {isGroup && (
          <button
            onClick={handleUngroup}
            className="w-full px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition"
          >
            그룹 해제
          </button>
        )}

        {/* 이미지 크기 조정 */}
        {selectedImage && (
          <>
            <hr className="border-gray-300" />
            <div>
              <h3 className="font-semibold text-sm mb-2">이미지 크기</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600">너비</label>
                  <input
                    type="number"
                    value={Math.round((selectedImage.width || 0) * (selectedImage.scaleX || 1))}
                    onChange={(e) => {
                      const newWidth = Number(e.target.value)
                      const currentHeight = (selectedImage.height || 0) * (selectedImage.scaleY || 1)
                      handleImageResize(newWidth, currentHeight)
                    }}
                    className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-sm"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">높이</label>
                  <input
                    type="number"
                    value={Math.round((selectedImage.height || 0) * (selectedImage.scaleY || 1))}
                    onChange={(e) => {
                      const newHeight = Number(e.target.value)
                      const currentWidth = (selectedImage.width || 0) * (selectedImage.scaleX || 1)
                      handleImageResize(currentWidth, newHeight)
                    }}
                    className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-sm"
                    min="1"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* 이미지 필터 */}
        {selectedImage && (
          <>
            <hr className="border-gray-300" />
            <div>
              <h3 className="font-semibold text-sm mb-2">이미지 필터</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600">밝기: {imageBrightness}</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={imageBrightness}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      setImageBrightness(value)
                      applyImageFilter('brightness', value)
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">대비: {imageContrast}</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={imageContrast}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      setImageContrast(value)
                      applyImageFilter('contrast', value)
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">채도: {imageSaturation}</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={imageSaturation}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      setImageSaturation(value)
                      applyImageFilter('saturation', value)
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">흐림: {imageBlur}</label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={imageBlur}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      setImageBlur(value)
                      applyImageFilter('blur', value)
                    }}
                    className="w-full"
                  />
                </div>
                <button
                  onClick={() => {
                    setImageBrightness(0)
                    setImageContrast(0)
                    setImageSaturation(0)
                    setImageBlur(0)
                    if (selectedImage) {
                      selectedImage.filters = []
                      selectedImage.applyFilters()
                      fabricRef.current?.renderAll()
                      saveHistory()
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition"
                >
                  필터 초기화
                </button>
              </div>
            </div>
          </>
        )}

        {/* 그림자 효과 */}
        {selected && (
          <>
            <hr className="border-gray-300" />
            <div>
              <h3 className="font-semibold text-sm mb-2">그림자</h3>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={shadowEnabled}
                  onChange={handleShadowToggle}
                  className="w-4 h-4"
                />
                <label className="text-sm">그림자 사용</label>
              </div>
              {shadowEnabled && (
                <div className="space-y-2">
                  <input
                    type="color"
                    value={shadowColor}
                    onChange={(e) => {
                      setShadowColor(e.target.value)
                      updateSelectedObject({
                        shadow: {
                          color: e.target.value,
                          blur: shadowBlur,
                          offsetX: shadowOffsetX,
                          offsetY: shadowOffsetY,
                        }
                      })
                    }}
                    className="w-full h-8 rounded border border-gray-300"
                  />
                  <div>
                    <label className="text-xs text-gray-600">블러: {shadowBlur}</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={shadowBlur}
                      onChange={(e) => {
                        setShadowBlur(Number(e.target.value))
                        updateSelectedObject({
                          shadow: {
                            color: shadowColor,
                            blur: Number(e.target.value),
                            offsetX: shadowOffsetX,
                            offsetY: shadowOffsetY,
                          }
                        })
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* 회전 */}
        {selected && (
          <>
            <hr className="border-gray-300" />
            <div>
              <h3 className="font-semibold text-sm mb-2">회전: {Math.round(rotation)}°</h3>
              <input
                type="range"
                min="0"
                max="360"
                value={rotation}
                onChange={(e) => handleRotationChange(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleRotationChange(90)}
                  className="flex-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                >
                  90°
                </button>
                <button
                  onClick={() => handleRotationChange(180)}
                  className="flex-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                >
                  180°
                </button>
                <button
                  onClick={() => handleRotationChange(270)}
                  className="flex-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                >
                  270°
                </button>
              </div>
            </div>
          </>
        )}

        {/* 테두리 */}
        {selected && (
          <>
            <hr className="border-gray-300" />
            <div>
              <h3 className="font-semibold text-sm mb-2">테두리</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600">두께: {strokeWidth}</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={strokeWidth}
                    onChange={(e) => handleStrokeChange(Number(e.target.value), strokeColor)}
                    className="w-full"
                  />
                </div>
                {strokeWidth > 0 && (
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => handleStrokeChange(strokeWidth, e.target.value)}
                    className="w-full h-8 rounded border border-gray-300"
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* 투명도 */}
        {selected && (
          <>
            <hr className="border-gray-300" />
            <div>
              <h3 className="font-semibold text-sm mb-2">투명도: {Math.round(opacity * 100)}%</h3>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={(e) => handleOpacityChange(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </>
        )}

        <hr className="border-gray-300" />

        {/* 레이어 패널 */}
        <div>
          <button
            onClick={() => setShowLayers(!showLayers)}
            className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <Layers size={16} />
            <span>레이어 ({allObjects.length})</span>
          </button>
          {showLayers && (
            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
              {allObjects.map((obj, index) => (
                <div
                  key={index}
                  onClick={() => {
                    canvas?.setActiveObject(obj)
                    canvas?.renderAll()
                    setSelected(obj)
                    updatePropertiesFromSelection(obj)
                  }}
                  className={`p-2 rounded text-xs cursor-pointer transition ${
                    selected === obj ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {obj.type || 'Object'} {index + 1}
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="border-gray-300" />

        {/* 레이어 옵션 */}
        <div>
          <h3 className="font-semibold text-sm mb-2">레이어 옵션</h3>
          <div className="space-y-2">
            <button
              onClick={bringToFront}
              disabled={!selected}
              className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              맨 앞으로
            </button>
            <button
              onClick={bringForward}
              disabled={!selected}
              className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              앞으로
            </button>
            <button
              onClick={sendBackward}
              disabled={!selected}
              className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              뒤로
            </button>
            <button
              onClick={sendToBack}
              disabled={!selected}
              className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              맨 뒤로
            </button>
            <button
              onClick={deleteObject}
              disabled={!selected}
              className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              삭제
            </button>
          </div>
        </div>

        <hr className="border-gray-300" />

        {/* 저장 */}
        <div className="space-y-2">
          <button
            onClick={saveAsImage}
            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <Image size={16} />
            <span>PNG 저장</span>
          </button>
          <button
            onClick={saveProject}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <Save size={16} />
            <span>프로젝트 저장</span>
          </button>
          <button
            onClick={loadProject}
            className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <FolderOpen size={16} />
            <span>프로젝트 불러오기</span>
          </button>
        </div>

        {/* 템플릿 */}
        <hr className="border-gray-300" />
        <div>
          <h3 className="font-semibold text-sm mb-2">템플릿</h3>
          <div className="space-y-2">
            {templates.map((template, index) => (
              <button
                key={index}
                onClick={() => applyTemplate(template.data)}
                className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition text-left"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 캔버스 */}
      <div className="flex-1">
        <div className="border border-gray-300 shadow-lg rounded-lg overflow-hidden bg-white">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  )
}

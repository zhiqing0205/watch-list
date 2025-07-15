'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface FileUploadProps {
  onUpload: (url: string) => void
  currentImage?: string
  type: 'movie' | 'tv' | 'actor'
  id: string
  className?: string
}

export function FileUpload({ onUpload, currentImage, type, id, className = '' }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      formData.append('id', id)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('上传失败')
      }

      const { url } = await response.json()
      setPreview(url)
      onUpload(url)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const removeImage = () => {
    setPreview(null)
    onUpload('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-slate-800">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="aspect-[2/3] border-2 border-dashed border-slate-600 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer flex flex-col items-center justify-center"
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
              <p className="text-slate-400 text-sm">上传中...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-8 w-8 text-slate-400 mb-2" />
              <p className="text-slate-400 text-sm text-center">
                点击或拖拽图片到此处
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
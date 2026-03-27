import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'

interface LogoUploadProps {
  currentUrl: string | null
  schoolName?: string
  onUpload: (file: File) => void
  onRemove?: () => void
  isUploading?: boolean
}

export function LogoUpload({ currentUrl, schoolName, onUpload, onRemove, isUploading }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const displayUrl = preview ?? currentUrl

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    setPreview(URL.createObjectURL(file))
    onUpload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex items-center gap-6">
      {/* Preview circle */}
      <div className="relative h-20 w-20 shrink-0">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Logo"
            className="h-20 w-20 rounded-full border-2 border-gray-200 object-cover shadow"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600 shadow">
            {schoolName?.charAt(0)?.toUpperCase() ?? 'E'}
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div
        className={`flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 transition-colors cursor-pointer ${
          dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-5 w-5 text-gray-400 mb-1" />
        <p className="text-sm font-medium text-gray-600">Cliquer ou déposer une image</p>
        <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, SVG — max 2 Mo</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {onRemove && displayUrl && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
          title="Supprimer le logo"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

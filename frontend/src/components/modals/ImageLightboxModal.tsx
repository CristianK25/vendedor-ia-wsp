import React, { useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'

interface LightboxImage {
  id?: number | string
  ruta: string
}

interface ImageLightboxModalProps {
  isOpen: boolean
  onClose: () => void
  images: LightboxImage[]
  currentIndex: number
  onIndexChange: (index: number) => void
  title?: string
  onRotarImagen?: (imagenId: number) => void
  isRotating?: boolean
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onIndexChange,
  title,
  onRotarImagen,
  isRotating = false
}) => {
  const total = images.length

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (total <= 1) return
    onIndexChange(currentIndex === 0 ? total - 1 : currentIndex - 1)
  }, [currentIndex, total, onIndexChange])

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (total <= 1) return
    onIndexChange(currentIndex === total - 1 ? 0 : currentIndex + 1)
  }, [currentIndex, total, onIndexChange])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, handlePrev, handleNext])

  if (!isOpen || images.length === 0) return null

  const currentImage = images[currentIndex] || images[0]

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 backdrop-blur-md select-none animate-fade-in p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Barra Superior: Título, Contador y Botón Cerrar / Rotar */}
      <div 
        className="w-full flex items-center justify-between z-20 text-white pb-2 max-w-7xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          {title && (
            <span className="text-sm sm:text-base font-medium text-zinc-300 truncate max-w-[200px] sm:max-w-md">
              {title}
            </span>
          )}
          <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-zinc-200">
            {currentIndex + 1} / {total}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {currentImage.id && onRotarImagen && (
            <button
              onClick={() => typeof currentImage.id === 'number' && onRotarImagen(currentImage.id)}
              disabled={isRotating}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors duration-200"
              title="Rotar 90°"
            >
              <RotateCw size={18} className={isRotating ? 'animate-spin' : ''} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-200"
            title="Cerrar (Esc)"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Área Central: Imagen Principal y Flechas */}
      <div 
        className="relative w-full flex-1 flex items-center justify-center min-h-0 my-2 max-w-7xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Anterior */}
        {total > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 hover:scale-105 transition-all duration-200 backdrop-blur-sm shadow-lg border border-white/10"
            title="Anterior (←)"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Imagen */}
        <div className="w-full h-full flex items-center justify-center p-2">
          <img
            key={currentImage.ruta}
            src={currentImage.ruta}
            alt={title || `Imagen ${currentIndex + 1}`}
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-all duration-300"
          />
        </div>

        {/* Botón Siguiente */}
        {total > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 hover:scale-105 transition-all duration-200 backdrop-blur-sm shadow-lg border border-white/10"
            title="Siguiente (→)"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>

      {/* Barra Inferior: Miniaturas */}
      {total > 1 && (
        <div 
          className="w-full max-w-4xl mx-auto pt-2 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center gap-2 overflow-x-auto py-2 px-4 hide-scrollbar">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                onClick={() => onIndexChange(idx)}
                className={`relative flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 bg-zinc-900 ${
                  currentIndex === idx 
                    ? 'border-primary ring-2 ring-primary/40 scale-105 opacity-100' 
                    : 'border-white/10 opacity-50 hover:opacity-90 hover:border-white/30'
                }`}
              >
                <img
                  src={img.ruta}
                  alt={`miniatura ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
export default ImageLightboxModal

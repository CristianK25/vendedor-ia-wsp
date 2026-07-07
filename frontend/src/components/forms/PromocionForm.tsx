import React from 'react'
import { Megaphone } from 'lucide-react'

export default function PromocionForm() {
  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Megaphone size={20} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Registrar Nueva Promoción</h1>
      </div>
      <div className="bg-surface border border-outline-variant rounded-2xl p-6 text-on-surface-variant">
        Aquí irá el formulario de Promociones...
      </div>
    </div>
  )
}

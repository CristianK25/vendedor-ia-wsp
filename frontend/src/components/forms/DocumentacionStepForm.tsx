import React, { useState, useEffect } from 'react'
import { CheckCircle2, UploadCloud, FileText, Loader2, AlertTriangle, Eye, Image } from 'lucide-react'
import { vehiculosApi } from '../../api/vehiculos'
import type { Vehiculo, DocumentoVehiculo } from '../../types/models'

interface Props {
  vehiculoId?: number;
  isNewMode?: boolean;
  archivosPendientes?: Record<string, { file: File, etapa: string }>;
  onArchivoPendienteChange?: (tipo: string, file: File | null, etapa?: string) => void;
  localEtapaIndex?: number;
  onAvanzarEtapaLocal?: () => void;
}

const ETAPAS = [
  { id: 'pre_compra', label: 'Pre-compra' },
  { id: 'comprado', label: 'Comprado' },
  { id: 'en_stock', label: 'En Stock' },
  { id: 'vendido', label: 'Vendido' }
]

const DOCS_POR_ETAPA: Record<string, { id: string, label: string, optional?: boolean }[]> = {
  pre_compra: [
    { id: 'informe_dominio', label: 'Informe de Dominio' },
    { id: 'deuda_patentes', label: 'Deuda de Patentes' }
  ],
  comprado: [
    { id: 'boleto_compra', label: 'Boleto de Compra' },
    { id: 'dni_vendedor', label: 'DNI Vendedor' },
    { id: 'cedula_vehiculo', label: 'Cédula Vehículo' },
    { id: 'formulario_08', label: 'Formulario 08' }
  ],
  en_stock: [
    { id: 'contrato_consignacion', label: 'Contrato Consignación (Opcional)', optional: true }
  ],
  vendido: [
    { id: 'boleto_venta', label: 'Boleto de Venta' },
    { id: 'verificacion_policial', label: 'Verificación Policial' },
    { id: 'dni_comprador', label: 'DNI Comprador' },
    { id: 'formulario_08_12', label: 'Formulario 08/12' }
  ]
}

export default function DocumentacionStepForm({ vehiculoId, isNewMode = false, archivosPendientes = {}, onArchivoPendienteChange, localEtapaIndex = 0, onAvanzarEtapaLocal }: Props) {
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null)
  const [documentos, setDocumentos] = useState<DocumentoVehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (isNewMode) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      if (vehiculoId) {
        const [vData, docsData] = await Promise.all([
          vehiculosApi.getById(vehiculoId),
          vehiculosApi.getDocumentos(vehiculoId)
        ])
        setVehiculo(vData)
        setDocumentos(docsData)
      }
    } catch (err: any) {
      setError('Error al cargar la información: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [vehiculoId, isNewMode])

  const handleFileUpload = async (etapa: string, tipoDocumento: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (isNewMode && onArchivoPendienteChange) {
      onArchivoPendienteChange(tipoDocumento, file, etapa)
      return
    }

    setUploading(tipoDocumento)
    setError(null)
    
    try {
      if (vehiculoId) {
        await vehiculosApi.subirDocumento(vehiculoId, etapa, tipoDocumento, file)
        await fetchData()
      }
    } catch (err: any) {
      setError('Error al subir el documento: ' + (err.message || ''))
    } finally {
      setUploading(null)
    }
  }

  // Auto-avance en modo local (creación)
  useEffect(() => {
    if (isNewMode && onAvanzarEtapaLocal) {
      const etapaActual = ETAPAS[localEtapaIndex]
      if (!etapaActual) return

      const docsRequeridos = DOCS_POR_ETAPA[etapaActual.id]?.filter(d => !d.optional) || []
      const faltantes = docsRequeridos.filter(doc => !archivosPendientes[doc.id])
      
      // Si ya no hay faltantes, avanzamos automáticamente de etapa local
      if (faltantes.length === 0 && docsRequeridos.length > 0) {
        onAvanzarEtapaLocal()
      }
    }
  }, [archivosPendientes, isNewMode, localEtapaIndex, onAvanzarEtapaLocal])

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
  }

  if (!isNewMode && !vehiculo) {
    return <div className="text-center py-12 text-on-surface-variant">Vehículo no encontrado.</div>
  }

  const currentEtapaIndex = isNewMode ? localEtapaIndex : ETAPAS.findIndex(e => e.id === vehiculo?.etapa)

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium border border-error/20 shadow-sm flex items-start gap-3">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Stepper Horizontal */}
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-outline-variant rounded-full z-0"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500"
          style={{ width: `${Math.max(0, (currentEtapaIndex / (ETAPAS.length - 1)) * 100)}%` }}
        ></div>
        
        {ETAPAS.map((etapa, idx) => {
          const isCompleted = idx < currentEtapaIndex
          const isCurrent = idx === currentEtapaIndex
          
          return (
            <div key={etapa.id} className="relative z-10 flex flex-col items-center gap-2 bg-surface px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${
                isCompleted ? 'bg-primary border-primary text-on-primary' :
                isCurrent ? 'bg-primary-container border-primary text-on-primary-container ring-4 ring-primary/20' :
                'bg-surface border-outline-variant text-outline'
              }`}>
                {isCompleted ? <CheckCircle2 size={20} /> : (idx + 1)}
              </div>
              <span className={`text-xs font-semibold ${isCurrent ? 'text-primary' : 'text-on-surface-variant'}`}>
                {etapa.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Documentos de la etapa actual o las anteriores (solo lectura para anteriores) */}
      <div className="space-y-6">
        {ETAPAS.map((etapa, idx) => {
          const isLocked = idx > currentEtapaIndex
          const isCurrent = idx === currentEtapaIndex
          const isCompleted = idx < currentEtapaIndex
          
          if (isLocked) return null // No mostrar etapas futuras
          
          const docsParaEtapa = DOCS_POR_ETAPA[etapa.id] || []
          
          return (
            <div key={etapa.id} className={`bg-surface border ${isCurrent ? 'border-primary shadow-md ring-1 ring-primary/20' : 'border-outline-variant shadow-sm opacity-80'} rounded-2xl p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  {isCompleted ? <CheckCircle2 className="text-primary" size={20} /> : <FileText className="text-primary" size={20} />}
                  Etapa: {etapa.label}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docsParaEtapa.map(docType => {
                  const uploadedDoc = !isNewMode ? documentos.find(d => d.etapa === etapa.id && d.tipo_documento === docType.id) : undefined
                  const pendingFile = isNewMode ? archivosPendientes[docType.id] : undefined
                  const canUpload = isCurrent || isCompleted
                  const isUploadedOrPending = uploadedDoc || pendingFile;
                  const cardBorder = isUploadedOrPending ? 'border-solid border-outline-variant bg-background' : 'border-dashed border-outline-variant/60 bg-surface/50';

                  return (
                    <div key={docType.id} className={`flex flex-col p-4 border rounded-xl ${cardBorder} transition-colors`}>
                      <div className="flex flex-col mb-3">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          {uploadedDoc && <CheckCircle2 size={16} className="text-primary flex-shrink-0" />}
                          <span className="font-bold text-on-surface text-sm leading-tight">{docType.label.replace(' (Opcional)', '')}</span>
                          {docType.optional ? (
                            <span className="bg-surface-variant text-on-surface-variant text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1">Opcional</span>
                          ) : (
                            <span className="bg-error-container text-on-error-container text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1">Obligatorio</span>
                          )}
                        </div>
                        {uploadedDoc ? (
                          <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
                            {uploadedDoc.ruta_archivo.toLowerCase().endsWith('.pdf') ? <FileText size={14} className="text-error" /> : <Image size={14} className="text-primary" />}
                            Subido: {new Date(uploadedDoc.fecha_subida).toLocaleDateString()} {uploadedDoc.version ? `(v${uploadedDoc.version})` : ''}
                          </span>
                        ) : pendingFile ? (
                          <span className="text-xs text-primary font-medium">Seleccionado: {pendingFile.file.name}</span>
                        ) : (
                          <span className="text-xs text-outline font-medium">Pendiente</span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/30 mt-auto">
                        {uploadedDoc && (
                          <a 
                            href={(() => {
                              const apiUrl = import.meta.env.VITE_API_URL || '';
                              if (!apiUrl || apiUrl.includes('//backend')) return uploadedDoc.ruta_archivo;
                              return `${apiUrl}${uploadedDoc.ruta_archivo}`;
                            })()} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center justify-center flex-1 sm:flex-none gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/50 text-primary text-xs font-semibold hover:bg-primary/5 transition-colors"
                          >
                            <Eye size={16} />
                            Ver Archivo
                          </a>
                        )}
                        
                        {canUpload && (
                          <div className="relative flex-1 sm:flex-none">
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              onChange={(e) => handleFileUpload(etapa.id, docType.id, e)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                              disabled={uploading !== null && !isNewMode}
                            />
                            <button
                              type="button"
                              disabled={uploading !== null && !isNewMode}
                              className={`flex items-center justify-center w-full gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                uploadedDoc || pendingFile 
                                  ? 'bg-outline-variant/20 text-on-surface hover:bg-outline-variant/40' 
                                  : 'bg-primary-container text-on-primary-container hover:bg-primary/20'
                              } transition-colors`}
                            >
                              {uploading === docType.id ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : uploadedDoc || pendingFile ? (
                                <>
                                  <UploadCloud size={16} />
                                  <span>Reemplazar</span>
                                </>
                              ) : (
                                <>
                                  <UploadCloud size={16} />
                                  <span>Subir Archivo</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

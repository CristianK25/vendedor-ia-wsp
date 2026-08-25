import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, UploadCloud, FileText, Loader2, AlertTriangle, Eye, Image, X, FolderCheck } from 'lucide-react'
import { vehiculosApi } from '../../api/vehiculos'
import type { Vehiculo, DocumentoVehiculo } from '../../types/models'

interface Props {
  vehiculoId?: number;
  isNewMode?: boolean;
  archivosPendientes?: Record<string, { file: File, etapa: string }>;
  onArchivoPendienteChange?: (tipo: string, file: File | null, etapa?: string) => void;
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

export default function DocumentacionStepForm({ 
  vehiculoId, 
  isNewMode = false, 
  archivosPendientes = {}, 
  onArchivoPendienteChange 
}: Props) {
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null)
  const [documentos, setDocumentos] = useState<DocumentoVehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedEtapaTab, setSelectedEtapaTab] = useState<string>('todas')

  // Modal para confirmar reemplazo de documento
  const [pendingReplace, setPendingReplace] = useState<{
    file: File;
    etapa: string;
    tipoDocumento: string;
    existingDoc: DocumentoVehiculo;
    docLabel: string;
  } | null>(null)

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

  const ejecutarSubida = async (etapa: string, tipoDocumento: string, file: File) => {
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
      setPendingReplace(null)
    }
  }

  const handleFileUpload = async (etapa: string, tipoDocumento: string, docLabel: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Solo se admiten documentos en formato PDF (.pdf)')
      e.target.value = ''
      return
    }

    if (isNewMode && onArchivoPendienteChange) {
      onArchivoPendienteChange(tipoDocumento, file, etapa)
      e.target.value = ''
      return
    }

    const existingDoc = documentos.find(d => d.tipo_documento === tipoDocumento)
    if (existingDoc) {
      setPendingReplace({
        file,
        etapa,
        tipoDocumento,
        existingDoc,
        docLabel
      })
      e.target.value = ''
      return
    }

    await ejecutarSubida(etapa, tipoDocumento, file)
    e.target.value = ''
  }

  const handleRemovePending = (tipoDocumento: string) => {
    if (isNewMode && onArchivoPendienteChange) {
      onArchivoPendienteChange(tipoDocumento, null)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
  }

  if (!isNewMode && !vehiculo) {
    return <div className="text-center py-12 text-on-surface-variant">Vehículo no encontrado.</div>
  }

  // Filtrado de etapas a mostrar
  const etapasAMostrar = selectedEtapaTab === 'todas' 
    ? ETAPAS 
    : ETAPAS.filter(e => e.id === selectedEtapaTab)

  // Resumen total de documentos cargados
  const totalDocsEsperados = Object.values(DOCS_POR_ETAPA).flat().length
  const totalDocsCargados = isNewMode 
    ? Object.keys(archivosPendientes).length 
    : documentos.length

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium border border-error/20 shadow-sm flex items-start gap-3">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Header Resumen Informativo */}
      <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <FolderCheck size={20} />
          </div>
          <div>
            <h3 className="font-bold text-on-surface text-base">Checklist de Documentación Libre</h3>
            <p className="text-xs text-on-surface-variant">
              Puedes subir, consultar o reemplazar cualquier documento en cualquier etapa sin restricciones.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl border border-outline-variant/60 text-xs font-semibold text-on-surface">
          <span>Progreso:</span>
          <span className="text-primary font-bold">{totalDocsCargados} / {totalDocsEsperados}</span>
          <span className="text-on-surface-variant font-normal">archivos</span>
        </div>
      </div>

      {/* Selector de Pestañas de Etapas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-outline-variant">
        <button
          type="button"
          onClick={() => setSelectedEtapaTab('todas')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedEtapaTab === 'todas'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          Todas las Etapas
        </button>

        {ETAPAS.map((etapa) => {
          const docsEtapa = DOCS_POR_ETAPA[etapa.id] || []
          const cargadosEtapa = isNewMode
            ? docsEtapa.filter(d => !!archivosPendientes[d.id]).length
            : docsEtapa.filter(d => documentos.some(doc => doc.tipo_documento === d.id)).length

          const isSelected = selectedEtapaTab === etapa.id

          return (
            <button
              key={etapa.id}
              type="button"
              onClick={() => setSelectedEtapaTab(etapa.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span>{etapa.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                isSelected 
                  ? 'bg-on-primary/20 text-on-primary' 
                  : cargadosEtapa > 0 ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'
              }`}>
                {cargadosEtapa}/{docsEtapa.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Lista de Secciones por Etapa */}
      <div className="space-y-6">
        {etapasAMostrar.map((etapa) => {
          const docsParaEtapa = DOCS_POR_ETAPA[etapa.id] || []
          const cargadosEtapa = isNewMode
            ? docsParaEtapa.filter(d => !!archivosPendientes[d.id]).length
            : docsParaEtapa.filter(d => documentos.some(doc => doc.tipo_documento === d.id)).length
          const estaCompleta = cargadosEtapa === docsParaEtapa.length && docsParaEtapa.length > 0

          return (
            <div 
              key={etapa.id} 
              className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-outline-variant/60">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2.5">
                  {estaCompleta ? (
                    <CheckCircle2 className="text-primary shrink-0" size={20} />
                  ) : (
                    <FileText className="text-primary shrink-0" size={20} />
                  )}
                  Etapa: {etapa.label}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    estaCompleta 
                      ? 'bg-secondary-container text-secondary border-primary/20' 
                      : cargadosEtapa > 0 
                        ? 'bg-primary/10 text-primary border-primary/20' 
                        : 'bg-surface-container text-on-surface-variant border-outline-variant'
                  }`}>
                    {cargadosEtapa} de {docsParaEtapa.length} cargados
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docsParaEtapa.map(docType => {
                  const uploadedDoc = !isNewMode ? documentos.find(d => d.tipo_documento === docType.id) : undefined
                  const pendingFile = isNewMode ? archivosPendientes[docType.id] : undefined
                  const isUploadedOrPending = !!(uploadedDoc || pendingFile)
                  const cardBorder = isUploadedOrPending ? 'border-solid border-outline-variant bg-background' : 'border-dashed border-outline-variant/60 bg-surface/50';

                  return (
                    <div key={docType.id} className={`flex flex-col p-4 border rounded-xl ${cardBorder} transition-colors`}>
                      <div className="flex flex-col mb-3">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          {uploadedDoc && <CheckCircle2 size={16} className="text-primary flex-shrink-0" />}
                          <span className="font-bold text-on-surface text-sm leading-tight">{docType.label.replace(' (Opcional)', '')}</span>
                          {docType.optional && (
                            <span className="bg-surface-variant text-on-surface-variant text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1">Opcional</span>
                          )}
                        </div>
                        {uploadedDoc ? (
                          <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
                            {uploadedDoc.ruta_archivo.toLowerCase().endsWith('.pdf') ? <FileText size={14} className="text-error" /> : <Image size={14} className="text-primary" />}
                            Subido: {new Date(uploadedDoc.fecha_subida).toLocaleDateString()} {uploadedDoc.version ? `(v${uploadedDoc.version})` : ''}
                          </span>
                        ) : pendingFile ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-primary font-medium truncate">
                              Seleccionado: {pendingFile.file.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemovePending(docType.id)}
                              className="text-error hover:text-on-surface text-xs underline p-0.5 cursor-pointer"
                              title="Quitar archivo"
                            >
                              Quitar
                            </button>
                          </div>
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
                        
                        <div className="relative flex-1 sm:flex-none">
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={(e) => handleFileUpload(etapa.id, docType.id, docType.label, e)}
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
                            } transition-colors cursor-pointer`}
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
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de Confirmación para Reemplazo */}
      {pendingReplace && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={() => setPendingReplace(null)}>
          <div 
            className="bg-surface rounded-2xl shadow-2xl flex flex-col p-6 relative border border-outline-variant"
            style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setPendingReplace(null)}
              className="absolute top-4 right-4 text-outline hover:text-on-surface p-1 rounded-lg transition-colors cursor-pointer"
              disabled={uploading !== null}
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                <UploadCloud size={20} />
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-lg">Confirmar Reemplazo</h3>
                <p className="text-xs text-on-surface-variant">{pendingReplace.docLabel}</p>
              </div>
            </div>

            <div className="space-y-3 my-5 text-sm bg-background p-4 rounded-xl border border-outline-variant/50">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-outline-variant/30">
                <span className="text-outline">Archivo actual (v{pendingReplace.existingDoc.version || 1}):</span>
                <span className="font-medium text-on-surface truncate max-w-[180px]">{pendingReplace.existingDoc.nombre_original}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-primary font-semibold">Nuevo archivo (v{(pendingReplace.existingDoc.version || 1) + 1}):</span>
                <span className="font-bold text-primary truncate max-w-[180px]">{pendingReplace.file.name}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingReplace(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors text-on-surface cursor-pointer"
                disabled={uploading !== null}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => ejecutarSubida(pendingReplace.etapa, pendingReplace.tipoDocumento, pendingReplace.file)}
                disabled={uploading !== null}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors disabled:opacity-50 cursor-pointer"
              >
                {uploading !== null ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                Confirmar y Reemplazar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

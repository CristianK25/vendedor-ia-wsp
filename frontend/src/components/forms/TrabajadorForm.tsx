import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { UserCircle2, User, Phone, Briefcase, Loader2, Mail, Lock, Shield } from 'lucide-react'
import { trabajadoresApi } from '../../api/trabajadores'
import type { TrabajadorCreate } from '../../types/models'

export default function TrabajadorForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TrabajadorCreate>({
    defaultValues: {
      rol: 'STOCK'
    }
  })

  useEffect(() => {
    if (isEdit) {
      setLoading(true)
      trabajadoresApi.getById(Number(id))
        .then(data => {
          reset({
            nombre: data.nombre,
            apellido: data.apellido || '',
            email: data.email || '',
            rol: data.rol_sistema || 'STOCK',
            rol_trabajador: data.rol || '',
            telefono: data.telefono || '',
          })
        })
        .catch(err => {
          console.error('Error al cargar trabajador:', err)
          setError('Error al cargar los datos del trabajador')
        })
        .finally(() => setLoading(false))
    }
  }, [id, reset])

  const onSubmit = async (data: TrabajadorCreate) => {
    try {
      setLoading(true)
      setError(null)
      
      if (isEdit) {
        const updateData = { ...data }
        if (!updateData.password) {
          delete updateData.password
        }
        await trabajadoresApi.update(Number(id), updateData)
      } else {
        await trabajadoresApi.create(data)
      }
      navigate('/trabajadores')
    } catch (err: any) {
      console.error('Error al guardar trabajador:', err)
      setError(err.message || 'Ocurrió un error al guardar el trabajador')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <UserCircle2 size={20} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-on-surface">
          {isEdit ? 'Editar Trabajador / Usuario' : 'Registrar Nuevo Trabajador / Usuario'}
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant pb-2">Datos del Trabajador</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Nombre *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                  type="text"
                  {...register('nombre', { required: 'El nombre es requerido' })}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Ej: Juan"
                />
              </div>
              {errors.nombre && <p className="text-error text-xs mt-1 font-medium">{errors.nombre.message}</p>}
            </div>

            {/* Apellido */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Apellido *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                  type="text"
                  {...register('apellido', { required: 'El apellido es requerido' })}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Ej: Pérez"
                />
              </div>
              {errors.apellido && <p className="text-error text-xs mt-1 font-medium">{errors.apellido.message}</p>}
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Correo Electrónico *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                  type="email"
                  {...register('email', { 
                    required: 'El email es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Dirección de email inválida'
                    }
                  })}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Ej: juan@empresa.com"
                />
              </div>
              {errors.email && <p className="text-error text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-on-surface-variant mb-2">
                Contraseña {isEdit ? '(Opcional)' : 'Inicial *'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                  type="password"
                  {...register('password', { required: isEdit ? false : 'La contraseña es requerida', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder={isEdit ? "Dejar en blanco para no cambiar" : "Establecer contraseña inicial"}
                />
              </div>
              {errors.password && <p className="text-error text-xs mt-1 font-medium">{errors.password.message}</p>}
            </div>

            {/* Rol Sistema */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Rol en Sistema *</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <select 
                  {...register('rol', { required: 'El rol es requerido' })}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
                >
                  <option value="STOCK">Stock / Vendedor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              {errors.rol && <p className="text-error text-xs mt-1 font-medium">{errors.rol.message}</p>}
            </div>

            {/* Rol Trabajador */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Puesto (Rol Trabajador)</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                  type="text"
                  {...register('rol_trabajador')}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Ej: Mecánico, Asesor..."
                />
              </div>
            </div>

            {/* Teléfono */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                  type="text"
                  {...register('telefono', { 
                    pattern: {
                      value: /^[0-9+\-\s()]+$/,
                      message: 'Formato de teléfono inválido'
                    }
                  })}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Ej: +54 9 11 1234-5678"
                />
              </div>
              {errors.telefono && <p className="text-error text-xs mt-1 font-medium">{errors.telefono.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/trabajadores')}
            className="px-6 py-3 rounded-xl font-medium text-on-surface-variant hover:bg-surface-variant transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl font-medium bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Guardando...
              </>
            ) : (
              isEdit ? 'Actualizar Trabajador' : 'Guardar Trabajador'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

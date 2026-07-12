import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchApi } from '../api/client'

export interface Usuario {
  id: number
  nombre: string
  apellido: string
  email: string
  rol: string
  is_active: boolean
}

interface AuthState {
  usuario: Usuario | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  cargarPerfil: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await fetchApi('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          })
          
          set({
            refreshToken: res.refresh_token,
            isAuthenticated: true,
          })
          
          // Cargar perfil del usuario
          await get().cargarPerfil()
        } catch (err: any) {
          set({ error: err.message || 'Error al iniciar sesión', isAuthenticated: false })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        const { refreshToken } = get()
        try {
          if (refreshToken) {
            await fetchApi('/auth/logout', {
              method: 'POST',
              body: JSON.stringify({ refresh_token: refreshToken }),
            })
          }
        } catch {
          // Ignorar fallas al desloguearse en red
        } finally {
          set({ usuario: null, refreshToken: null, isAuthenticated: false, error: null })
          localStorage.removeItem('foodstore-auth')
        }
      },

      cargarPerfil: async () => {
        try {
          const user = await fetchApi('/auth/me')
          set({ usuario: user })
        } catch (err) {
          set({ usuario: null, isAuthenticated: false })
          throw err
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'foodstore-auth',
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        usuario: state.usuario,
      }),
    }
  )
)

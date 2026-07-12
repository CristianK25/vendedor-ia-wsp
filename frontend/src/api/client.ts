import { useAuthStore } from '../store/authStore'

const BASE_URL = '/api' // Redirigido por Nginx en prod o Vite en dev

interface FetchApiOptions extends RequestInit {
  _retry?: boolean;
}

export async function fetchApi(endpoint: string, options: FetchApiOptions = {}): Promise<any> {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      'X-VendedorIA-CRM-Vehiculos': 'true',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const isAuthRoute = endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh') || endpoint.includes('/auth/logout');
    
    // Interceptor: Si es 401, no se ha reintentado, y no es una ruta de autenticación
    if (response.status === 401 && !options._retry && !isAuthRoute) {
      options._retry = true;
      const { refreshToken, logout } = useAuthStore.getState();

      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-VendedorIA-CRM-Vehiculos': 'true'
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
            credentials: 'include'
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            // Actualizar tokens en Zustand
            useAuthStore.setState({
              refreshToken: data.refresh_token,
              isAuthenticated: true
            });
            // Re-intento recursivo de la petición original
            return fetchApi(endpoint, options);
          }
        } catch (error) {
          console.error("Error renovando token:", error);
        }
      }

      // Si no hay refresh token, falló la renovación, o el refresh token expiró
      await logout();
      window.location.href = '/login';
      const abortError: any = new Error('Sesión expirada');
      abortError.status = 401;
      throw abortError;
    }
    
    // Si no es un 401 renovable, o si es un error normal
    const errorBody = await response.json().catch(() => ({}));
    const error: any = new Error(errorBody.detail || 'Ocurrió un error en la petición');
    error.status = response.status;
    throw error;
  }

  // Si no hay contenido (ej: DELETE), retornamos null
  if (response.status === 204) return null;
  
  return response.json();
}

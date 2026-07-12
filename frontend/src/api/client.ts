const BASE_URL = '/api' // Redirigido por Nginx en prod o Vite en dev

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      // Limpiar local storage y redirigir
      localStorage.removeItem('foodstore-auth');
      window.location.href = '/login';
    }
    const errorBody = await response.json().catch(() => ({}));
    const error: any = new Error(errorBody.detail || 'Ocurrió un error en la petición');
    error.status = response.status;
    throw error;
  }

  // Si no hay contenido (ej: DELETE), retornamos null
  if (response.status === 204) return null;
  
  return response.json();
}

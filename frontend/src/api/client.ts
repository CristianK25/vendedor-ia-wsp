const BASE_URL = 'http://localhost:8000/api' // URL del Backend FastAPI

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.detail || 'Ocurrió un error en la petición')
  }

  // Si no hay contenido (ej: DELETE), retornamos null
  if (response.status === 204) return null
  
  return response.json()
}

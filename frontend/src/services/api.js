const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function request(path, options = {}) {
  const token = localStorage.getItem('nossavoz_token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const mensagem = data?.message ?? data?.erro ?? 'Erro desconhecido'
    throw new Error(mensagem)
  }

  return data
}

export const api = {
  post: (path, body) =>
    request(path, { method: 'POST', body: JSON.stringify(body) }),
  get: (path) =>
    request(path, { method: 'GET' }),
  patch: (path, body) =>
    request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) =>
    request(path, { method: 'DELETE' }),
}

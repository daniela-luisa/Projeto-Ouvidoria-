import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const PERFIL_ROTAS = {
  admin: '/admin',
  gestor: '/gestor',
  analista: '/analista',
  solicitante: '/solicitante',
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const salvo = localStorage.getItem('nossavoz_usuario')
      return salvo ? JSON.parse(salvo) : null
    } catch {
      return null
    }
  })

  const login = useCallback((dadosUsuario, token) => {
    localStorage.setItem('nossavoz_token', token)
    localStorage.setItem('nossavoz_usuario', JSON.stringify(dadosUsuario))
    setUsuario(dadosUsuario)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('nossavoz_token')
    localStorage.removeItem('nossavoz_usuario')
    setUsuario(null)
  }, [])

  const getToken = useCallback(() => {
    return localStorage.getItem('nossavoz_token')
  }, [])

  const rotaInicial = usuario ? (PERFIL_ROTAS[usuario.perfil] ?? '/') : '/login'

  return (
    <AuthContext.Provider value={{ usuario, login, logout, getToken, rotaInicial }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}

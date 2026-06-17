import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Protege rotas que exigem autenticação.
 * Se `perfisPermitidos` for informado, também valida o perfil do usuário.
 */
export function RotaProtegida({ perfisPermitidos }) {
  const { usuario } = useAuth()

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (perfisPermitidos && !perfisPermitidos.includes(usuario.perfil)) {
    return <Navigate to="/nao-autorizado" replace />
  }

  return <Outlet />
}

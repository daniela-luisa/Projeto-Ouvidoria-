import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export function Analista() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ padding: 32 }}>
      <h1>Painel do Analista</h1>
      <p>Bem-vindo, {usuario?.nome ?? usuario?.email}</p>
      <button onClick={handleLogout}>Sair</button>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'

export function NaoAutorizado() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h1>Acesso negado</h1>
      <p>Você não tem permissão para acessar esta página.</p>
      <button onClick={() => navigate(-1)}>Voltar</button>
    </div>
  )
}

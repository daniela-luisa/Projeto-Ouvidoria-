import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { RotaProtegida } from './components/RotaProtegida'
import { Login } from './pages/Login'
import { Admin } from './pages/Admin'
import { Gestor } from './pages/Gestor'
import { Analista } from './pages/Analista'
import { Solicitante } from './pages/Solicitante'
import { NaoAutorizado } from './pages/NaoAutorizado'

function RedirecionarPerfil() {
  const { usuario } = useAuth()

  const rotas = {
    admin: '/admin',
    gestor: '/gestor',
    analista: '/analista',
    solicitante: '/solicitante',
  }

  if (!usuario) return <Navigate to="/login" replace />
  return <Navigate to={rotas[usuario.perfil] ?? '/login'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<Login />} />
          <Route path="/nao-autorizado" element={<NaoAutorizado />} />

          {/* Rotas protegidas por perfil */}
          <Route element={<RotaProtegida perfisPermitidos={['admin']} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          <Route element={<RotaProtegida perfisPermitidos={['gestor']} />}>
            <Route path="/gestor" element={<Gestor />} />
          </Route>

          <Route element={<RotaProtegida perfisPermitidos={['analista']} />}>
            <Route path="/analista" element={<Analista />} />
          </Route>

          <Route element={<RotaProtegida perfisPermitidos={['solicitante']} />}>
            <Route path="/solicitante" element={<Solicitante />} />
          </Route>

          {/* Raiz: redireciona conforme perfil */}
          <Route path="/" element={<RedirecionarPerfil />} />

          {/* Qualquer rota desconhecida */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

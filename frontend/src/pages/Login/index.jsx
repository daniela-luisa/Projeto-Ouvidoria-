import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import styles from './Login.module.css'

const PERFIL_ROTAS = {
  admin: '/admin',
  gestor: '/gestor',
  analista: '/analista',
  solicitante: '/solicitante',
}

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (erro) setErro('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const emailTrimado = form.email.trim()
    const senha = form.senha

    if (!emailTrimado || !senha) {
      setErro('Preencha o e-mail e a senha.')
      return
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimado)
    if (!emailValido) {
      setErro('Informe um e-mail válido.')
      return
    }

    setCarregando(true)
    setErro('')

    try {
      const resposta = await api.post('/auth/login', {
        email: emailTrimado,
        senha,
      })

      login(resposta.usuario, resposta.token)

      const destino = PERFIL_ROTAS[resposta.usuario?.perfil] ?? '/'
      navigate(destino, { replace: true })
    } catch (err) {
      setErro(err.message ?? 'Não foi possível realizar o login. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className={styles.pagina}>

      {/* ── Coluna esquerda ── */}
      <aside className={styles.lateral} aria-hidden="true">
        <div className={styles.lateralConteudo}>
          <div className={styles.cadeadoWrapper}>
            <CadeadoIcon />
          </div>
          <span className={styles.lateralNome}>NossaVoz</span>
          <p className={styles.lateralSubtitulo}>
            Canal interno de solicitações sigilosas
          </p>
        </div>
      </aside>

      {/* ── Coluna direita ── */}
      <main className={styles.formularioColuna} role="main">
        <div className={styles.formularioInner}>

          {/* Cabeçalho do form */}
          <div className={styles.cabecalho}>
            <h1 className={styles.titulo}>Acesse sua conta</h1>
            <p className={styles.subtitulo}>
              Use o e-mail institucional para entrar
            </p>
          </div>

          {/* Erro — aparece logo abaixo do título */}
          {erro && (
            <p
              id="login-erro"
              className={styles.erro}
              role="alert"
              aria-live="assertive"
            >
              <ErroIcon />
              {erro}
            </p>
          )}

          <form
            className={styles.formulario}
            onSubmit={handleSubmit}
            noValidate
            aria-label="Formulário de login"
          >
            {/* Campo e-mail */}
            <div className={styles.campo}>
              <label htmlFor="email" className={styles.label}>
                E-MAIL
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={styles.input}
                value={form.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                autoComplete="email"
                autoFocus
                aria-required="true"
                aria-describedby={erro ? 'login-erro' : undefined}
                disabled={carregando}
              />
            </div>

            {/* Campo senha */}
            <div className={styles.campo}>
              <label htmlFor="senha" className={styles.label}>
                SENHA
              </label>
              <div className={styles.senhaWrapper}>
                <input
                  id="senha"
                  name="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  className={styles.input}
                  value={form.senha}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-required="true"
                  aria-describedby={erro ? 'login-erro' : undefined}
                  disabled={carregando}
                />
                <button
                  type="button"
                  className={styles.toggleSenha}
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit"
              className={styles.botao}
              disabled={carregando}
              aria-busy={carregando}
            >
              {carregando && (
                <span className={styles.spinner} aria-hidden="true" />
              )}
              {carregando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          {/* Rodapé */}
          <footer className={styles.rodape}>
            <a href="mailto:suporte@nossavoz.com" className={styles.linkSuporte}>
              Problemas com acesso? Fale com o suporte
            </a>
          </footer>
        </div>
      </main>
    </div>
  )
}

/* ── Ícones ─────────────────────────────────────────────────────────────── */

function CadeadoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function ErroIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

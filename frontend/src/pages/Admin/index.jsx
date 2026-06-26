import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import styles from './Admin.module.css'

// ─── Página principal ──────────────────────────────────────────────────────
export function Admin() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [abaAtiva, setAbaAtiva] = useState('gestores')

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.pagina}>

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTopo}>
          <div className={styles.sidebarNome}>NossaVoz</div>
          <div className={styles.sidebarPerfil}>Administrador</div>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.sidebarBotao} ${abaAtiva === 'gestores' ? styles.sidebarBotaoAtivo : ''}`}
            onClick={() => setAbaAtiva('gestores')}
          >
            <IconUsuarios />
            Gestores
          </button>
        </nav>

        <div className={styles.sidebarRodape}>
          <button className={styles.botaoSair} onClick={handleLogout}>
            <IconSair />
            Sair — {usuario?.nome ?? usuario?.email}
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className={styles.conteudo}>
        {abaAtiva === 'gestores' && <PainelGestores />}
      </main>

    </div>
  )
}

// ─── Painel de gestores ────────────────────────────────────────────────────
// Admin só pode criar gestores (conforme matriz de permissões do projeto)
function PainelGestores() {
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(null)

  async function carregarGestores() {
    try {
      setCarregando(true)
      setErro('')
      const resposta = await api.get('/usuarios/listar?perfil=gestor')
      setUsuarios(resposta.usuarios)
    } catch (err) {
      setErro(err.message ?? 'Erro ao carregar gestores.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    let ativo = true
    async function buscar() {
      try {
        setCarregando(true)
        setErro('')
        const resposta = await api.get('/usuarios/listar?perfil=gestor')
        if (ativo) setUsuarios(resposta.usuarios)
      } catch (err) {
        if (ativo) setErro(err.message ?? 'Erro ao carregar gestores.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }
    buscar()
    return () => { ativo = false }
  }, [])

  async function handleDesativar(id, nome) {
    if (!confirm(`Desativar a conta de "${nome}"?`)) return
    try {
      setAcaoEmAndamento(id)
      await api.patch(`/usuarios/desativar/${id}`)
      setSucesso(`Conta de "${nome}" desativada.`)
      await carregarGestores()
    } catch (err) {
      setErro(err.message ?? 'Erro ao desativar gestor.')
    } finally {
      setAcaoEmAndamento(null)
    }
  }

  async function handleReativar(id, nome) {
    if (!confirm(`Reativar a conta de "${nome}"?`)) return
    try {
      setAcaoEmAndamento(id)
      await api.patch(`/usuarios/reativar/${id}`)
      setSucesso(`Conta de "${nome}" reativada.`)
      await carregarGestores()
    } catch (err) {
      setErro(err.message ?? 'Erro ao reativar gestor.')
    } finally {
      setAcaoEmAndamento(null)
    }
  }

  function handleCriadoComSucesso(nome) {
    setSucesso(`Gestor "${nome}" criado com sucesso.`)
    setModalAberto(false)
    carregarGestores()
  }

  return (
    <>
      <div className={styles.cabecalho}>
        <h1 className={styles.titulo}>Gestores</h1>
        <button
          className={styles.botaoPrimario}
          onClick={() => { setErro(''); setSucesso(''); setModalAberto(true) }}
        >
          <IconMais />
          Novo gestor
        </button>
      </div>

      {erro    && <p className={styles.erro}>{erro}</p>}
      {sucesso && <p className={styles.sucesso}>{sucesso}</p>}

      <div className={styles.avisoAcesso}>
        <IconInfo />
        O administrador tem acesso exclusivo à criação de gestores.
        Gestores gerenciam usuários, categorias, solicitações e logs do sistema.
      </div>

      <div className={styles.card}>
        <div className={styles.tabelaWrapper}>
          {carregando ? (
            <div className={styles.estadoVazio}>Carregando...</div>
          ) : usuarios.length === 0 ? (
            <div className={styles.estadoVazio}>Nenhum gestor cadastrado ainda.</div>
          ) : (
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Status</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nome}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={u.ativo ? styles.ativo : styles.inativo}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(u.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <div className={styles.acoesCell}>
                        {u.ativo ? (
                          <button
                            className={`${styles.botaoAcao} ${styles.botaoDesativar}`}
                            onClick={() => handleDesativar(u.id, u.nome)}
                            disabled={acaoEmAndamento === u.id}
                          >
                            {acaoEmAndamento === u.id ? '...' : 'Desativar'}
                          </button>
                        ) : (
                          <button
                            className={`${styles.botaoAcao} ${styles.botaoReativar}`}
                            onClick={() => handleReativar(u.id, u.nome)}
                            disabled={acaoEmAndamento === u.id}
                          >
                            {acaoEmAndamento === u.id ? '...' : 'Reativar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalAberto && (
        <ModalCriarGestor
          onFechar={() => setModalAberto(false)}
          onSucesso={handleCriadoComSucesso}
        />
      )}
    </>
  )
}

// ─── Modal de criar gestor ─────────────────────────────────────────────────
function ModalCriarGestor({ onFechar, onSucesso }) {
  const [form, setForm] = useState({ nome: '', email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (erro) setErro('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome.trim())  { setErro('O nome é obrigatório.'); return }
    if (!form.email.trim()) { setErro('O e-mail é obrigatório.'); return }
    if (form.senha.length < 8) { setErro('A senha deve ter no mínimo 8 caracteres.'); return }

    try {
      setSalvando(true)
      await api.post('/usuarios/criar', {
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
        perfil: 'gestor',
      })
      onSucesso(form.nome.trim())
    } catch (err) {
      setErro(err.message ?? 'Erro ao criar gestor.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onFechar() }}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <h2 className={styles.modalTitulo}>Novo gestor</h2>

        {erro && <p className={styles.erro}>{erro}</p>}

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="g-nome">Nome completo</label>
            <input
              id="g-nome"
              name="nome"
              className={styles.input}
              value={form.nome}
              onChange={handleChange}
              placeholder="Ex: Maria Silva"
              disabled={salvando}
              autoFocus
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="g-email">E-mail</label>
            <input
              id="g-email"
              name="email"
              type="email"
              className={styles.input}
              value={form.email}
              onChange={handleChange}
              placeholder="gestor@empresa.com"
              disabled={salvando}
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="g-senha">Senha</label>
            <div className={styles.senhaWrapper}>
              <input
                id="g-senha"
                name="senha"
                type={mostrarSenha ? 'text' : 'password'}
                className={styles.input}
                value={form.senha}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                disabled={salvando}
              />
              <button
                type="button"
                className={styles.botaoVerSenha}
                onClick={() => setMostrarSenha((v) => !v)}
                tabIndex={-1}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarSenha ? <IconOlhoFechado /> : <IconOlho />}
              </button>
            </div>
          </div>

          <div className={styles.modalAcoes}>
            <button
              type="button"
              className={styles.botaoSecundario}
              onClick={onFechar}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.botaoPrimario}
              disabled={salvando}
            >
              {salvando && <span className={styles.spinner} aria-hidden="true" />}
              {salvando ? 'Criando...' : 'Criar gestor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Ícones SVG ────────────────────────────────────────────────────────────
function IconUsuarios() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function IconMais() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function IconSair() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  )
}

function IconOlho() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function IconOlhoFechado() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

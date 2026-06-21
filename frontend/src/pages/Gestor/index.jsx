import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import styles from './Gestor.module.css'

// ─── Página principal ──────────────────────────────────────────────────────
export function Gestor() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [abaAtiva, setAbaAtiva] = useState('usuarios')

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.pagina}>

      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTopo}>
          <div className={styles.sidebarNome}>NossaVoz</div>
          <div className={styles.sidebarPerfil}>Gestor</div>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.sidebarBotao} ${abaAtiva === 'usuarios' ? styles.sidebarBotaoAtivo : ''}`}
            onClick={() => setAbaAtiva('usuarios')}
          >
            <IconUsuarios />
            Usuários
          </button>
          <button
            className={`${styles.sidebarBotao} ${abaAtiva === 'categorias' ? styles.sidebarBotaoAtivo : ''}`}
            onClick={() => setAbaAtiva('categorias')}
          >
            <IconCategorias />
            Categorias
          </button>
        </nav>

        <div className={styles.sidebarRodape}>
          <button className={styles.botaoSair} onClick={handleLogout}>
            <IconSair />
            Sair — {usuario?.nome ?? usuario?.email}
          </button>
        </div>
      </aside>

      {/* ── Conteúdo ── */}
      <main className={styles.conteudo}>
        {abaAtiva === 'usuarios' && <PainelUsuarios />}
        {abaAtiva === 'categorias' && <PainelCategorias />}
      </main>

    </div>
  )
}

// ─── Painel de usuários ────────────────────────────────────────────────────
function PainelUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(null)

  async function carregarUsuarios() {
    try {
      setCarregando(true)
      setErro('')
      const resposta = await api.get('/usuarios/listar')
      setUsuarios(resposta.usuarios)
    } catch (err) {
      setErro(err.message ?? 'Erro ao carregar usuários.')
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
        const resposta = await api.get('/usuarios/listar')
        if (ativo) setUsuarios(resposta.usuarios)
      } catch (err) {
        if (ativo) setErro(err.message ?? 'Erro ao carregar usuários.')
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
      await carregarUsuarios()
    } catch (err) {
      setErro(err.message ?? 'Erro ao desativar usuário.')
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
      await carregarUsuarios()
    } catch (err) {
      setErro(err.message ?? 'Erro ao reativar usuário.')
    } finally {
      setAcaoEmAndamento(null)
    }
  }

  function handleCriadoComSucesso(nome) {
    setSucesso(`Usuário "${nome}" criado com sucesso.`)
    setModalAberto(false)
    carregarUsuarios()
  }

  return (
    <>
      <div className={styles.cabecalho}>
        <h1 className={styles.titulo}>Usuários</h1>
        <button className={styles.botaoPrimario} onClick={() => {
          setErro('')
          setSucesso('')
          setModalAberto(true)
        }}>
          <IconMais />
          Novo usuário
        </button>
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}
      {sucesso && <p className={styles.sucesso}>{sucesso}</p>}

      <div className={styles.card}>
        <div className={styles.tabelaWrapper}>
          {carregando ? (
            <div className={styles.estadoVazio}>Carregando...</div>
          ) : usuarios.length === 0 ? (
            <div className={styles.estadoVazio}>Nenhum usuário cadastrado.</div>
          ) : (
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nome}</td>
                    <td>{u.email}</td>
                    <td><BadgePerfil perfil={u.perfil} /></td>
                    <td>
                      <span className={u.ativo ? styles.ativo : styles.inativo}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
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
        <ModalCriarUsuario
          onFechar={() => setModalAberto(false)}
          onSucesso={handleCriadoComSucesso}
        />
      )}
    </>
  )
}

// ─── Painel de categorias ──────────────────────────────────────────────────
function PainelCategorias() {
  const [categorias, setCategorias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState(null)
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(null)

  async function carregarCategorias() {
    try {
      setCarregando(true)
      setErro('')
      const resposta = await api.get('/categorias/listar')
      setCategorias(resposta.categorias)
    } catch (err) {
      setErro(err.message ?? 'Erro ao carregar categorias.')
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
        const resposta = await api.get('/categorias/listar')
        if (ativo) setCategorias(resposta.categorias)
      } catch (err) {
        if (ativo) setErro(err.message ?? 'Erro ao carregar categorias.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    buscar()
    return () => { ativo = false }
  }, [])

  async function handleExcluir(id, nome) {
    if (!confirm(`Excluir a categoria "${nome}"? Esta ação não pode ser desfeita.`)) return
    try {
      setAcaoEmAndamento(id)
      await api.delete(`/categorias/excluir/${id}`)
      setSucesso(`Categoria "${nome}" excluída.`)
      await carregarCategorias()
    } catch (err) {
      setErro(err.message ?? 'Erro ao excluir categoria.')
    } finally {
      setAcaoEmAndamento(null)
    }
  }

  function handleCriadoComSucesso(nome) {
    setSucesso(`Categoria "${nome}" criada com sucesso.`)
    setModalAberto(false)
    carregarCategorias()
  }

  function handleEditadoComSucesso(nome) {
    setSucesso(`Categoria "${nome}" atualizada.`)
    setCategoriaEditando(null)
    carregarCategorias()
  }

  return (
    <>
      <div className={styles.cabecalho}>
        <h1 className={styles.titulo}>Categorias</h1>
        <button className={styles.botaoPrimario} onClick={() => {
          setErro('')
          setSucesso('')
          setModalAberto(true)
        }}>
          <IconMais />
          Nova categoria
        </button>
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}
      {sucesso && <p className={styles.sucesso}>{sucesso}</p>}

      <div className={styles.card}>
        <div className={styles.tabelaWrapper}>
          {carregando ? (
            <div className={styles.estadoVazio}>Carregando...</div>
          ) : categorias.length === 0 ? (
            <div className={styles.estadoVazio}>Nenhuma categoria cadastrada.</div>
          ) : (
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nome}</td>
                    <td>{c.descricao ?? '—'}</td>
                    <td>
                      <div className={styles.acoesCell}>
                        <button
                          className={`${styles.botaoAcao} ${styles.botaoReativar}`}
                          onClick={() => {
                            setErro('')
                            setSucesso('')
                            setCategoriaEditando(c)
                          }}
                          disabled={acaoEmAndamento === c.id}
                        >
                          Editar
                        </button>
                        <button
                          className={`${styles.botaoAcao} ${styles.botaoDesativar}`}
                          onClick={() => handleExcluir(c.id, c.nome)}
                          disabled={acaoEmAndamento === c.id}
                        >
                          {acaoEmAndamento === c.id ? '...' : 'Excluir'}
                        </button>
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
        <ModalCategoria
          onFechar={() => setModalAberto(false)}
          onSucesso={handleCriadoComSucesso}
        />
      )}

      {categoriaEditando && (
        <ModalCategoria
          categoria={categoriaEditando}
          onFechar={() => setCategoriaEditando(null)}
          onSucesso={handleEditadoComSucesso}
        />
      )}
    </>
  )
}

// ─── Modal de criar/editar categoria ──────────────────────────────────────
function ModalCategoria({ categoria, onFechar, onSucesso }) {
  const editando = !!categoria
  const [form, setForm] = useState({
    nome: categoria?.nome ?? '',
    descricao: categoria?.descricao ?? '',
  })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (erro) setErro('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.nome.trim()) {
      setErro('O nome da categoria é obrigatório.')
      return
    }

    try {
      setSalvando(true)
      if (editando) {
        await api.patch(`/categorias/editar/${categoria.id}`, {
          nome: form.nome.trim(),
          descricao: form.descricao.trim(),
        })
      } else {
        await api.post('/categorias/criar', {
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || null,
        })
      }
      onSucesso(form.nome.trim())
    } catch (err) {
      setErro(err.message ?? 'Erro ao salvar categoria.')
    } finally {
      setSalvando(false)
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onFechar()
  }

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-cat-titulo">
        <h2 className={styles.modalTitulo} id="modal-cat-titulo">
          {editando ? 'Editar categoria' : 'Nova categoria'}
        </h2>

        {erro && <p className={styles.erro}>{erro}</p>}

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="cat-nome">Nome</label>
            <input
              id="cat-nome"
              name="nome"
              className={styles.input}
              value={form.nome}
              onChange={handleChange}
              placeholder="Ex: Reclamação, Sugestão, Elogio"
              disabled={salvando}
              autoFocus
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="cat-descricao">Descrição (opcional)</label>
            <input
              id="cat-descricao"
              name="descricao"
              className={styles.input}
              value={form.descricao}
              onChange={handleChange}
              placeholder="Breve descrição da categoria"
              disabled={salvando}
            />
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
              {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Criar categoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal de criação de usuário ───────────────────────────────────────────
function ModalCriarUsuario({ onFechar, onSucesso }) {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: 'gestor',
    categoriasSelecionadas: [],
  })
  const [categorias, setCategorias] = useState([])
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Carrega categorias disponíveis para vincular ao analista
  useEffect(() => {
    let ativo = true
    async function buscar() {
      try {
        const resposta = await api.get('/categorias/listar')
        if (ativo) setCategorias(resposta.categorias)
      } catch {
        // silencioso — se falhar, o campo simplesmente fica vazio
      }
    }
    buscar()
    return () => { ativo = false }
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (erro) setErro('')
  }

  function handleCategoriasChange(e) {
    const opcoes = Array.from(e.target.selectedOptions).map((o) => o.value)
    setForm((prev) => ({ ...prev, categoriasSelecionadas: opcoes }))
    if (erro) setErro('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.nome.trim() || !form.email.trim() || !form.senha || !form.perfil) {
      setErro('Preencha todos os campos.')
      return
    }

    if (form.senha.length < 8) {
      setErro('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (form.perfil === 'analista' && form.categoriasSelecionadas.length === 0) {
      setErro('Selecione ao menos uma categoria para o analista.')
      return
    }

    try {
      setSalvando(true)
      await api.post('/usuarios/criar', {
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
        perfil: form.perfil,
        categorias: form.perfil === 'analista' ? form.categoriasSelecionadas : undefined,
      })
      onSucesso(form.nome.trim())
    } catch (err) {
      setErro(err.message ?? 'Erro ao criar usuário.')
    } finally {
      setSalvando(false)
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onFechar()
  }

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <h2 className={styles.modalTitulo} id="modal-titulo">Novo usuário</h2>

        {erro && <p className={styles.erro}>{erro}</p>}

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="nome">Nome</label>
            <input
              id="nome"
              name="nome"
              className={styles.input}
              value={form.nome}
              onChange={handleChange}
              placeholder="Nome completo"
              disabled={salvando}
              autoFocus
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              className={styles.input}
              value={form.email}
              onChange={handleChange}
              placeholder="email@instituicao.com"
              disabled={salvando}
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              className={styles.input}
              value={form.senha}
              onChange={handleChange}
              placeholder="Mínimo 8 caracteres"
              disabled={salvando}
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="perfil">Perfil</label>
            <select
              id="perfil"
              name="perfil"
              className={styles.select}
              value={form.perfil}
              onChange={handleChange}
              disabled={salvando}
            >
              <option value="gestor">Gestor</option>
              <option value="analista">Analista</option>
            </select>
          </div>

          {/* Campo de categorias — só aparece quando perfil é analista */}
          {form.perfil === 'analista' && (
            <div className={styles.campo}>
              <label className={styles.label} htmlFor="categorias">
                Categorias — segure Ctrl para selecionar mais de uma
              </label>
              {categorias.length === 0 ? (
                <p className={styles.avisoCategoria}>
                  Nenhuma categoria cadastrada. Crie categorias antes de cadastrar um analista.
                </p>
              ) : (
                <select
                  id="categorias"
                  className={styles.select}
                  multiple
                  size={Math.min(categorias.length, 5)}
                  value={form.categoriasSelecionadas}
                  onChange={handleCategoriasChange}
                  disabled={salvando}
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              )}
            </div>
          )}

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
              {salvando ? 'Salvando…' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Badge de perfil ───────────────────────────────────────────────────────
function BadgePerfil({ perfil }) {
  const classe = {
    admin: styles.badgeAdmin,
    gestor: styles.badgeGestor,
    analista: styles.badgeAnalista,
    solicitante: styles.badgeSolicitante,
  }[perfil] ?? ''

  return <span className={`${styles.badge} ${classe}`}>{perfil}</span>
}

// ─── Ícones ────────────────────────────────────────────────────────────────
function IconUsuarios() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconCategorias() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconSair() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function IconMais() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
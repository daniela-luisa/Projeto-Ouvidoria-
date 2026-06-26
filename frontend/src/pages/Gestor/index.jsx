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

      {/* Sidebar */}
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
          <button
            className={`${styles.sidebarBotao} ${abaAtiva === 'solicitacoes' ? styles.sidebarBotaoAtivo : ''}`}
            onClick={() => setAbaAtiva('solicitacoes')}
          >
            <IconSolicitacoes />
            Solicitações
          </button>
          <button
            className={`${styles.sidebarBotao} ${abaAtiva === 'logs' ? styles.sidebarBotaoAtivo : ''}`}
            onClick={() => setAbaAtiva('logs')}
          >
            <IconLogs />
            Logs
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
        {abaAtiva === 'usuarios'     && <PainelUsuarios />}
        {abaAtiva === 'categorias'   && <PainelCategorias />}
        {abaAtiva === 'solicitacoes' && <PainelSolicitacoes />}
        {abaAtiva === 'logs'         && <PainelLogs />}
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
        <button className={styles.botaoPrimario} onClick={() => { setErro(''); setSucesso(''); setModalAberto(true) }}>
          <IconMais />
          Novo usuário
        </button>
      </div>

      {erro    && <p className={styles.erro}>{erro}</p>}
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
                  <th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.filter(u => u.perfil !== 'solicitante').map((u) => (
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
        <ModalCriarUsuario onFechar={() => setModalAberto(false)} onSucesso={handleCriadoComSucesso} />
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

  return (
    <>
      <div className={styles.cabecalho}>
        <h1 className={styles.titulo}>Categorias</h1>
        <button className={styles.botaoPrimario} onClick={() => { setErro(''); setSucesso(''); setModalAberto(true) }}>
          <IconMais />
          Nova categoria
        </button>
      </div>

      {erro    && <p className={styles.erro}>{erro}</p>}
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
                <tr><th>Nome</th><th>Descrição</th><th>Ações</th></tr>
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
                          onClick={() => { setErro(''); setSucesso(''); setCategoriaEditando(c) }}
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
          onSucesso={(nome) => { setSucesso(`Categoria "${nome}" criada.`); setModalAberto(false); carregarCategorias() }}
        />
      )}
      {categoriaEditando && (
        <ModalCategoria
          categoria={categoriaEditando}
          onFechar={() => setCategoriaEditando(null)}
          onSucesso={(nome) => { setSucesso(`Categoria "${nome}" atualizada.`); setCategoriaEditando(null); carregarCategorias() }}
        />
      )}
    </>
  )
}

// ─── Painel de solicitações ────────────────────────────────────────────────
function PainelSolicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [solicitacaoAberta, setSolicitacaoAberta] = useState(null)
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(null)

  async function carregarSolicitacoes() {
    try {
      setCarregando(true)
      setErro('')
      const query = filtroStatus ? `?status=${filtroStatus}` : ''
      const resposta = await api.get(`/solicitacoes/listar${query}`)
      setSolicitacoes(resposta.solicitacoes)
    } catch (err) {
      setErro(err.message ?? 'Erro ao carregar solicitações.')
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
        const query = filtroStatus ? `?status=${filtroStatus}` : ''
        const resposta = await api.get(`/solicitacoes/listar${query}`)
        if (ativo) setSolicitacoes(resposta.solicitacoes)
      } catch (err) {
        if (ativo) setErro(err.message ?? 'Erro ao carregar solicitações.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }
    buscar()
    return () => { ativo = false }
  }, [filtroStatus])

  async function handleEncerrar(id) {
    if (!confirm('Encerrar esta solicitação?')) return
    try {
      setAcaoEmAndamento(id)
      await api.patch(`/solicitacoes/encerrar/${id}`)
      setSucesso('Solicitação encerrada.')
      await carregarSolicitacoes()
    } catch (err) {
      setErro(err.message ?? 'Erro ao encerrar solicitação.')
    } finally {
      setAcaoEmAndamento(null)
    }
  }

  return (
    <>
      <div className={styles.cabecalho}>
        <h1 className={styles.titulo}>Solicitações</h1>
        <select
          className={styles.selectFiltro}
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="aberta">Aberta</option>
          <option value="em_analise">Em análise</option>
          <option value="respondida">Respondida</option>
          <option value="encerrada">Encerrada</option>
        </select>
      </div>

      {erro    && <p className={styles.erro}>{erro}</p>}
      {sucesso && <p className={styles.sucesso}>{sucesso}</p>}

      <div className={styles.card}>
        <div className={styles.tabelaWrapper}>
          {carregando ? (
            <div className={styles.estadoVazio}>Carregando...</div>
          ) : solicitacoes.length === 0 ? (
            <div className={styles.estadoVazio}>Nenhuma solicitação encontrada.</div>
          ) : (
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Título</th><th>Categoria</th><th>Solicitante</th><th>Status</th><th>Data</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {solicitacoes.map((s) => (
                  <tr key={s.id}>
                    <td>{s.titulo}</td>
                    <td>{s.categoria}</td>
                    <td>{s.solicitante}</td>
                    <td><BadgeStatus status={s.status} /></td>
                    <td>{new Date(s.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <div className={styles.acoesCell}>
                        <button
                          className={`${styles.botaoAcao} ${styles.botaoReativar}`}
                          onClick={() => { setErro(''); setSucesso(''); setSolicitacaoAberta(s) }}
                        >
                          Ver
                        </button>
                        {s.status !== 'encerrada' && (
                          <button
                            className={`${styles.botaoAcao} ${styles.botaoDesativar}`}
                            onClick={() => handleEncerrar(s.id)}
                            disabled={acaoEmAndamento === s.id}
                          >
                            {acaoEmAndamento === s.id ? '...' : 'Encerrar'}
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

      {solicitacaoAberta && (
        <ModalSolicitacao
          solicitacao={solicitacaoAberta}
          onFechar={() => setSolicitacaoAberta(null)}
          onAtualizado={() => { setSolicitacaoAberta(null); carregarSolicitacoes() }}
        />
      )}
    </>
  )
}

// ─── Modal de detalhes da solicitação ─────────────────────────────────────
function ModalSolicitacao({ solicitacao, onFechar, onAtualizado }) {
  const [detalhe, setDetalhe] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [comentario, setComentario] = useState('')
  const [visivelSolicitante, setVisivelSolicitante] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [novoStatus, setNovoStatus] = useState('')
  const [salvandoStatus, setSalvandoStatus] = useState(false)

  useEffect(() => {
    let ativo = true
    async function buscar() {
      try {
        const resposta = await api.get(`/solicitacoes/buscar/${solicitacao.id}`)
        if (ativo) {
          setDetalhe(resposta.solicitacao)
          setNovoStatus(resposta.solicitacao.status)
        }
      } catch (err) {
        if (ativo) setErro(err.message ?? 'Erro ao carregar solicitação.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }
    buscar()
    return () => { ativo = false }
  }, [solicitacao.id])

  async function handleAlterarStatus() {
    if (novoStatus === detalhe.status) return
    try {
      setSalvandoStatus(true)
      await api.patch(`/solicitacoes/status/${solicitacao.id}`, { status: novoStatus })
      onAtualizado()
    } catch (err) {
      setErro(err.message ?? 'Erro ao alterar status.')
      setSalvandoStatus(false)
    }
  }

  async function handleEnviarComentario(e) {
    e.preventDefault()
    if (!comentario.trim()) return
    try {
      setEnviando(true)
      setErro('')
      await api.post('/comentarios/criar', {
        solicitacao_id: solicitacao.id,
        conteudo: comentario.trim(),
        visivel_solicitante: visivelSolicitante,
      })
      setComentario('')
      setVisivelSolicitante(false)
      // Recarrega os detalhes para mostrar o novo comentário
      const resposta = await api.get(`/solicitacoes/buscar/${solicitacao.id}`)
      setDetalhe(resposta.solicitacao)
    } catch (err) {
      setErro(err.message ?? 'Erro ao enviar comentário.')
    } finally {
      setEnviando(false)
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onFechar()
  }

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalGrande} role="dialog" aria-modal="true">
        <div className={styles.modalGrandeCabecalho}>
          <h2 className={styles.modalTitulo}>{solicitacao.titulo}</h2>
          <button className={styles.botaoFechar} onClick={onFechar} aria-label="Fechar">✕</button>
        </div>

        {erro && <p className={styles.erro}>{erro}</p>}

        {carregando ? (
          <div className={styles.estadoVazio}>Carregando...</div>
        ) : detalhe ? (
          <>
            {/* Metadados */}
            <div className={styles.metadados}>
              <span><strong>Categoria:</strong> {detalhe.categoria}</span>
              <span><strong>Solicitante:</strong> {detalhe.solicitante}</span>
              <span><strong>Aberta em:</strong> {new Date(detalhe.criado_em).toLocaleDateString('pt-BR')}</span>
            </div>

            {/* Descrição */}
            <div className={styles.descricaoBox}>
              <p className={styles.label}>Descrição</p>
              <p className={styles.descricaoTexto}>{detalhe.descricao}</p>
            </div>

            {/* Alterar status */}
            {detalhe.status !== 'encerrada' && (
              <div className={styles.statusBar}>
                <select
                  className={styles.select}
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value)}
                  disabled={salvandoStatus}
                >
                  <option value="aberta">Aberta</option>
                  <option value="em_analise">Em análise</option>
                  <option value="respondida">Respondida</option>
                  <option value="encerrada">Encerrada</option>
                </select>
                <button
                  className={styles.botaoPrimario}
                  onClick={handleAlterarStatus}
                  disabled={salvandoStatus || novoStatus === detalhe.status}
                >
                  {salvandoStatus ? 'Salvando...' : 'Salvar status'}
                </button>
              </div>
            )}

            {/* Comentários */}
            <div className={styles.comentariosLista}>
              <p className={styles.label}>Comentários ({detalhe.comentarios.length})</p>
              {detalhe.comentarios.length === 0 ? (
                <p className={styles.estadoVazio}>Nenhum comentário ainda.</p>
              ) : (
                detalhe.comentarios.map((c) => (
                  <div key={c.id} className={`${styles.comentario} ${c.visivel_solicitante ? styles.comentarioVisivel : styles.comentarioInterno}`}>
                    <div className={styles.comentarioCabecalho}>
                      <strong>{c.autor}</strong>
                      <span className={styles.comentarioMeta}>
                        {c.visivel_solicitante ? '👁 Visível ao solicitante' : '🔒 Interno'}
                        {' · '}
                        {new Date(c.criado_em).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className={styles.comentarioTexto}>{c.conteudo}</p>
                  </div>
                ))
              )}
            </div>

            {/* Adicionar comentário */}
            {detalhe.status !== 'encerrada' && (
              <form className={styles.comentarioForm} onSubmit={handleEnviarComentario}>
                <textarea
                  className={styles.textarea}
                  placeholder="Escreva um comentário..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  disabled={enviando}
                  rows={3}
                />
                <div className={styles.comentarioAcoes}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={visivelSolicitante}
                      onChange={(e) => setVisivelSolicitante(e.target.checked)}
                      disabled={enviando}
                    />
                    Visível ao solicitante
                  </label>
                  <button
                    type="submit"
                    className={styles.botaoPrimario}
                    disabled={enviando || !comentario.trim()}
                  >
                    {enviando ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

// ─── Painel de logs ────────────────────────────────────────────────────────
function PainelLogs() {
  const [logs, setLogs] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [filtroAcao, setFiltroAcao] = useState('')

  useEffect(() => {
    let ativo = true
    async function buscar() {
      try {
        setCarregando(true)
        setErro('')
        const query = filtroAcao ? `?acao=${filtroAcao}` : ''
        const resposta = await api.get(`/logs/listar${query}`)
        if (ativo) setLogs(resposta.logs)
      } catch (err) {
        if (ativo) setErro(err.message ?? 'Erro ao carregar logs.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }
    buscar()
    return () => { ativo = false }
  }, [filtroAcao])

  const acoesDisponiveis = [
    'LOGIN', 'LOGIN_FALHA', 'CADASTRO_USUARIO', 'DESATIVACAO_USUARIO', 'REATIVACAO_USUARIO',
    'CADASTRO_CATEGORIA', 'EDICAO_CATEGORIA', 'EXCLUSAO_CATEGORIA',
    'CRIACAO_SOLICITACAO', 'ALTERACAO_STATUS', 'ENCERRAMENTO_SOLICITACAO',
    'CRIACAO_COMENTARIO', 'ALTERACAO_VISIBILIDADE_COMENTARIO', 'ACESSO_NEGADO',
  ]

  return (
    <>
      <div className={styles.cabecalho}>
        <h1 className={styles.titulo}>Logs de auditoria</h1>
        <select
          className={styles.selectFiltro}
          value={filtroAcao}
          onChange={(e) => setFiltroAcao(e.target.value)}
        >
          <option value="">Todas as ações</option>
          {acoesDisponiveis.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}

      <div className={styles.card}>
        <div className={styles.tabelaWrapper}>
          {carregando ? (
            <div className={styles.estadoVazio}>Carregando...</div>
          ) : logs.length === 0 ? (
            <div className={styles.estadoVazio}>Nenhum log encontrado.</div>
          ) : (
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Data/Hora</th><th>Ação</th><th>Usuário</th><th>Perfil</th><th>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(l.criado_em).toLocaleString('pt-BR')}
                    </td>
                    <td><BadgeAcao acao={l.acao} /></td>
                    <td>{l.usuario_nome ?? '—'}</td>
                    <td>{l.usuario_perfil ?? '—'}</td>
                    <td style={{ fontSize: 12, color: '#6b7280', maxWidth: 320 }}>{l.detalhes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Modal de criar/editar categoria ──────────────────────────────────────
function ModalCategoria({ categoria, onFechar, onSucesso }) {
  const editando = !!categoria
  const [form, setForm] = useState({ nome: categoria?.nome ?? '', descricao: categoria?.descricao ?? '' })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (erro) setErro('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('O nome da categoria é obrigatório.'); return }
    try {
      setSalvando(true)
      if (editando) {
        await api.patch(`/categorias/editar/${categoria.id}`, { nome: form.nome.trim(), descricao: form.descricao.trim() })
      } else {
        await api.post('/categorias/criar', { nome: form.nome.trim(), descricao: form.descricao.trim() || null })
      }
      onSucesso(form.nome.trim())
    } catch (err) {
      setErro(err.message ?? 'Erro ao salvar categoria.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onFechar() }}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <h2 className={styles.modalTitulo}>{editando ? 'Editar categoria' : 'Nova categoria'}</h2>
        {erro && <p className={styles.erro}>{erro}</p>}
        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="cat-nome">Nome</label>
            <input id="cat-nome" name="nome" className={styles.input} value={form.nome} onChange={handleChange} placeholder="Ex: Reclamação, Sugestão, Elogio" disabled={salvando} autoFocus />
          </div>
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="cat-descricao">Descrição (opcional)</label>
            <input id="cat-descricao" name="descricao" className={styles.input} value={form.descricao} onChange={handleChange} placeholder="Breve descrição" disabled={salvando} />
          </div>
          <div className={styles.modalAcoes}>
            <button type="button" className={styles.botaoSecundario} onClick={onFechar} disabled={salvando}>Cancelar</button>
            <button type="submit" className={styles.botaoPrimario} disabled={salvando}>
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
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: 'gestor', categoriasSelecionadas: [] })
  const [categorias, setCategorias] = useState([])
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let ativo = true
    async function buscar() {
      try {
        const resposta = await api.get('/categorias/listar')
        if (ativo) setCategorias(resposta.categorias)
      } catch { /* silencioso */ }
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
    if (!form.nome.trim() || !form.email.trim() || !form.senha || !form.perfil) { setErro('Preencha todos os campos.'); return }
    if (form.senha.length < 8) { setErro('A senha deve ter no mínimo 8 caracteres.'); return }
    if (form.perfil === 'analista' && form.categoriasSelecionadas.length === 0) { setErro('Selecione ao menos uma categoria para o analista.'); return }
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

  return (
    <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onFechar() }}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <h2 className={styles.modalTitulo}>Novo usuário</h2>
        {erro && <p className={styles.erro}>{erro}</p>}
        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="nome">Nome</label>
            <input id="nome" name="nome" className={styles.input} value={form.nome} onChange={handleChange} placeholder="Nome completo" disabled={salvando} autoFocus />
          </div>
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" className={styles.input} value={form.email} onChange={handleChange} placeholder="email@instituicao.com" disabled={salvando} />
          </div>
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="senha">Senha</label>
            <input id="senha" name="senha" type="password" className={styles.input} value={form.senha} onChange={handleChange} placeholder="Mínimo 8 caracteres" disabled={salvando} />
          </div>
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="perfil">Perfil</label>
            <select id="perfil" name="perfil" className={styles.select} value={form.perfil} onChange={handleChange} disabled={salvando}>
              <option value="gestor">Gestor</option>
              <option value="analista">Analista</option>
            </select>
          </div>
          {form.perfil === 'analista' && (
            <div className={styles.campo}>
              <label className={styles.label} htmlFor="categorias">Categorias — segure Ctrl para selecionar mais de uma</label>
              {categorias.length === 0 ? (
                <p className={styles.avisoCategoria}>Nenhuma categoria cadastrada. Crie categorias antes de cadastrar um analista.</p>
              ) : (
                <select id="categorias" className={styles.select} multiple size={Math.min(categorias.length, 5)} value={form.categoriasSelecionadas} onChange={handleCategoriasChange} disabled={salvando}>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              )}
            </div>
          )}
          <div className={styles.modalAcoes}>
            <button type="button" className={styles.botaoSecundario} onClick={onFechar} disabled={salvando}>Cancelar</button>
            <button type="submit" className={styles.botaoPrimario} disabled={salvando}>
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
  const classe = { admin: styles.badgeAdmin, gestor: styles.badgeGestor, analista: styles.badgeAnalista, solicitante: styles.badgeSolicitante }[perfil] ?? ''
  return <span className={`${styles.badge} ${classe}`}>{perfil}</span>
}

// ─── Badge de status ───────────────────────────────────────────────────────
function BadgeStatus({ status }) {
  const classe = {
    aberta:     styles.badgeAberta,
    em_analise: styles.badgeEmAnalise,
    respondida: styles.badgeRespondida,
    encerrada:  styles.badgeEncerrada,
  }[status] ?? ''
  const label = { aberta: 'Aberta', em_analise: 'Em análise', respondida: 'Respondida', encerrada: 'Encerrada' }[status] ?? status
  return <span className={`${styles.badge} ${classe}`}>{label}</span>
}

// ─── Badge de ação (logs) ──────────────────────────────────────────────────
function BadgeAcao({ acao }) {
  const erros = ['LOGIN_FALHA', 'ACESSO_NEGADO']
  const classe = erros.includes(acao) ? styles.badgeDesativar : styles.badgeGestor
  return <span className={`${styles.badge} ${classe}`} style={{ fontSize: 11 }}>{acao}</span>
}

// ─── Ícones ────────────────────────────────────────────────────────────────
function IconUsuarios() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function IconCategorias() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
function IconSolicitacoes() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function IconLogs() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  )
}
function IconSair() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
function IconMais() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
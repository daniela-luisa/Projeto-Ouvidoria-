import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import styles from './Analista.module.css'

// ─── Página principal ──────────────────────────────────────────────────────
export function Analista() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [abaAtiva, setAbaAtiva] = useState('solicitacoes')

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
          <div className={styles.sidebarPerfil}>Analista</div>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.sidebarBotao} ${abaAtiva === 'solicitacoes' ? styles.sidebarBotaoAtivo : ''}`}
            onClick={() => setAbaAtiva('solicitacoes')}
          >
            <IconSolicitacoes />
            Solicitações
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
        {abaAtiva === 'solicitacoes' && <PainelSolicitacoes />}
      </main>

    </div>
  )
}

// ─── Painel de solicitações ────────────────────────────────────────────────
// Analista vê apenas solicitações da sua categoria (filtrado no backend)
function PainelSolicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [solicitacaoAberta, setSolicitacaoAberta] = useState(null)

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

  return (
    <>
      <div className={styles.cabecalho}>
        <h1 className={styles.titulo}>Solicitações</h1>
        <select
          className={styles.selectFiltro}
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          aria-label="Filtrar por status"
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
                  <th>Título</th>
                  <th>Categoria</th>
                  <th>Solicitante</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {solicitacoes.map((s) => (
                  <tr key={s.id}>
                    <td>{s.titulo}</td>
                    <td>{s.categoria}</td>
                    <td>{s.solicitante}</td>
                    <td><BadgeStatus status={s.status} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(s.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <div className={styles.acoesCell}>
                        <button
                          className={`${styles.botaoAcao} ${styles.botaoReativar}`}
                          onClick={() => { setErro(''); setSucesso(''); setSolicitacaoAberta(s) }}
                        >
                          Ver
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

      {solicitacaoAberta && (
        <ModalSolicitacao
          solicitacao={solicitacaoAberta}
          onFechar={() => setSolicitacaoAberta(null)}
          onAtualizado={(msg) => {
            setSucesso(msg ?? 'Solicitação atualizada.')
            setSolicitacaoAberta(null)
            carregarSolicitacoes()
          }}
        />
      )}
    </>
  )
}

// ─── Modal de atendimento ──────────────────────────────────────────────────
// Permissões do analista (conforme backend):
//   - Ver descrição e todos os comentários (incluindo internos)
//   - Alterar status: aberta, em_analise, respondida (NÃO encerrada)
//   - Criar comentários com visibilidade controlada (padrão: interno)
//   - Alterar visibilidade apenas dos próprios comentários
function ModalSolicitacao({ solicitacao, onFechar, onAtualizado }) {
  const { usuario } = useAuth()
  const [detalhe, setDetalhe] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [comentario, setComentario] = useState('')
  const [visivelSolicitante, setVisivelSolicitante] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [novoStatus, setNovoStatus] = useState('')
  const [salvandoStatus, setSalvandoStatus] = useState(false)
  const [alterandoVisibilidade, setAlterandoVisibilidade] = useState(null)

  async function carregarDetalhe() {
    try {
      const resposta = await api.get(`/solicitacoes/buscar/${solicitacao.id}`)
      setDetalhe(resposta.solicitacao)
      setNovoStatus(resposta.solicitacao.status)
    } catch (err) {
      setErro(err.message ?? 'Erro ao carregar solicitação.')
    } finally {
      setCarregando(false)
    }
  }

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
      setErro('')
      await api.patch(`/solicitacoes/status/${solicitacao.id}`, { status: novoStatus })
      onAtualizado(`Status alterado para "${labelStatus(novoStatus)}".`)
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
      await carregarDetalhe()
    } catch (err) {
      setErro(err.message ?? 'Erro ao enviar comentário.')
    } finally {
      setEnviando(false)
    }
  }

  async function handleAlterarVisibilidade(comentarioId, valorAtual) {
    try {
      setAlterandoVisibilidade(comentarioId)
      setErro('')
      await api.patch(`/comentarios/visibilidade/${comentarioId}`, {
        visivel_solicitante: !valorAtual,
      })
      await carregarDetalhe()
    } catch (err) {
      setErro(err.message ?? 'Erro ao alterar visibilidade.')
    } finally {
      setAlterandoVisibilidade(null)
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
              <span><strong>Status:</strong> <BadgeStatus status={detalhe.status} /></span>
            </div>

            {/* Descrição */}
            <div className={styles.descricaoBox}>
              <p className={styles.label}>Descrição</p>
              <p className={styles.descricaoTexto}>{detalhe.descricao}</p>
            </div>

            {/* Alterar status — analista NÃO pode encerrar */}
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
                </select>
                <button
                  className={styles.botaoPrimario}
                  onClick={handleAlterarStatus}
                  disabled={salvandoStatus || novoStatus === detalhe.status}
                >
                  {salvandoStatus
                    ? <><span className={styles.spinner} aria-hidden="true" /> Salvando...</>
                    : 'Salvar status'
                  }
                </button>
              </div>
            )}

            {/* Comentários */}
            <div className={styles.comentariosLista}>
              <p className={styles.label}>
                Comentários ({detalhe.comentarios.length})
                <span className={styles.labelHint}> — internos não são visíveis ao solicitante</span>
              </p>
              {detalhe.comentarios.length === 0 ? (
                <p className={styles.estadoVazio}>Nenhum comentário ainda.</p>
              ) : (
                detalhe.comentarios.map((c) => (
                  <div
                    key={c.id}
                    className={`${styles.comentario} ${c.visivel_solicitante ? styles.comentarioVisivel : styles.comentarioInterno}`}
                  >
                    <div className={styles.comentarioCabecalho}>
                      <strong>
                        {c.autor}
                        {c.autor_perfil === 'analista' && (
                          <span className={styles.badgeAutorAnalista}>Analista</span>
                        )}
                        {c.autor_perfil === 'gestor' && (
                          <span className={styles.badgeAutorGestor}>Gestor</span>
                        )}
                      </strong>
                      <div className={styles.comentarioMetaGroup}>
                        <span className={styles.comentarioMeta}>
                          {c.visivel_solicitante ? '👁 Visível ao solicitante' : '🔒 Interno'}
                          {' · '}
                          {new Date(c.criado_em).toLocaleString('pt-BR')}
                        </span>
                        {/* Só pode alterar visibilidade do próprio comentário */}
                        {c.autor === usuario?.nome && c.autor_perfil === 'analista' && (
                          <button
                            className={styles.botaoVisibilidade}
                            onClick={() => handleAlterarVisibilidade(c.id, c.visivel_solicitante)}
                            disabled={alterandoVisibilidade === c.id}
                            title={c.visivel_solicitante ? 'Tornar interno' : 'Tornar visível ao solicitante'}
                          >
                            {alterandoVisibilidade === c.id
                              ? '...'
                              : c.visivel_solicitante ? 'Tornar interno' : 'Tornar visível'
                            }
                          </button>
                        )}
                      </div>
                    </div>
                    <p className={styles.comentarioTexto}>{c.conteudo}</p>
                  </div>
                ))
              )}
            </div>

            {/* Formulário de novo comentário */}
            {detalhe.status !== 'encerrada' && (
              <form className={styles.comentarioForm} onSubmit={handleEnviarComentario} noValidate>
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
                    {enviando
                      ? <><span className={styles.spinner} aria-hidden="true" /> Enviando...</>
                      : 'Enviar'
                    }
                  </button>
                </div>
                {!visivelSolicitante && (
                  <p className={styles.avisoInterno}>
                    🔒 Este comentário ficará <strong>interno</strong> — o solicitante não verá.
                  </p>
                )}
              </form>
            )}

            {detalhe.status === 'encerrada' && (
              <div className={styles.avisoEncerrada}>
                Esta solicitação está encerrada e não aceita mais alterações.
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function labelStatus(status) {
  const labels = {
    aberta:     'Aberta',
    em_analise: 'Em análise',
    respondida: 'Respondida',
    encerrada:  'Encerrada',
  }
  return labels[status] ?? status
}

function BadgeStatus({ status }) {
  const classMap = {
    aberta:     styles.badgeAberta,
    em_analise: styles.badgeEmAnalise,
    respondida: styles.badgeRespondida,
    encerrada:  styles.badgeEncerrada,
  }
  return (
    <span className={`${styles.badge} ${classMap[status] ?? ''}`}>
      {labelStatus(status)}
    </span>
  )
}

// ─── Ícones SVG ────────────────────────────────────────────────────────────
function IconSolicitacoes() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
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

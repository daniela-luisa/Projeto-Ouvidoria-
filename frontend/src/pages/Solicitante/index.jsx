import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import styles from './Solicitante.module.css'

// ─── Página principal ──────────────────────────────────────────────────────
export function Solicitante() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [abaAtiva, setAbaAtiva] = useState('nova')

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
          <div className={styles.sidebarPerfil}>Solicitante</div>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.sidebarBotao} ${abaAtiva === 'nova' ? styles.sidebarBotaoAtivo : ''}`}
            onClick={() => setAbaAtiva('nova')}
          >
            <IconNova />
            Nova solicitação
          </button>
          <button
            className={`${styles.sidebarBotao} ${abaAtiva === 'minhas' ? styles.sidebarBotaoAtivo : ''}`}
            onClick={() => setAbaAtiva('minhas')}
          >
            <IconLista />
            Minhas solicitações
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
        {abaAtiva === 'nova'    && <PainelNovaSolicitacao onSucesso={() => setAbaAtiva('minhas')} />}
        {abaAtiva === 'minhas' && <PainelMinhasSolicitacoes />}
      </main>

    </div>
  )
}

// ─── Painel: nova solicitação ──────────────────────────────────────────────
function PainelNovaSolicitacao({ onSucesso }) {
  const [categorias, setCategorias] = useState([])
  const [carregandoCats, setCarregandoCats] = useState(true)
  const [form, setForm] = useState({
    titulo: '',
    categoria_id: '',
    anonima: false,
    descricao: '',
  })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmacao, setConfirmacao] = useState(null)

  useEffect(() => {
    let ativo = true
    async function buscar() {
      try {
        setCarregandoCats(true)
        const resposta = await api.get('/categorias/listar')
        if (ativo) setCategorias(resposta.categorias)
      } catch { /* silencioso */ } finally {
        if (ativo) setCarregandoCats(false)
      }
    }
    buscar()
    return () => { ativo = false }
  }, [])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (erro) setErro('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.titulo.trim()) { setErro('Informe um título para a solicitação.'); return }
    if (!form.categoria_id) { setErro('Selecione uma categoria.'); return }
    if (!form.descricao.trim()) { setErro('Descreva sua solicitação.'); return }
    if (form.descricao.trim().length < 20) { setErro('A descrição deve ter ao menos 20 caracteres.'); return }

    try {
      setEnviando(true)
      const resposta = await api.post('/solicitacoes/criar', {
        titulo: form.titulo.trim(),
        categoria_id: form.categoria_id,
        anonima: form.anonima,
        descricao: form.descricao.trim(),
      })
      setConfirmacao({ protocolo: resposta.protocolo, anonima: form.anonima })
    } catch (err) {
      setErro(err.message ?? 'Erro ao enviar solicitação. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  function handleNova() {
    setForm({ titulo: '', categoria_id: '', anonima: false, descricao: '' })
    setErro('')
    setConfirmacao(null)
  }

  // ── Tela de confirmação ────────────────────────────────────────────────
  if (confirmacao) {
    return (
      <div className={styles.confirmacaoWrapper}>
        <div className={styles.confirmacaoCard}>
          <div className={styles.confirmacaoIcone}>
            <IconCheck />
          </div>
          <h1 className={styles.confirmacaoTitulo}>Solicitação enviada!</h1>
          <p className={styles.confirmacaoTexto}>
            Sua solicitação foi registrada com sucesso.
            {confirmacao.anonima
              ? ' Como você optou pelo envio anônimo, não constará sua identificação no processo.'
              : ' Nossa equipe analisará em breve e você será notificado.'}
          </p>

          <div className={styles.protocoloBox}>
            <span className={styles.protocoloLabel}>Número de protocolo</span>
            <span className={styles.protocoloNumero}>{confirmacao.protocolo}</span>
            <span className={styles.protocoloDica}>Guarde este número para acompanhar sua solicitação.</span>
          </div>

          <div className={styles.confirmacaoAcoes}>
            <button className={styles.botaoSecundario} onClick={handleNova}>
              Nova solicitação
            </button>
            <button className={styles.botaoPrimario} onClick={onSucesso}>
              Ver minhas solicitações
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Formulário ─────────────────────────────────────────────────────────
  return (
    <>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Nova solicitação</h1>
          <p className={styles.subtitulo}>Preencha os campos abaixo para registrar sua solicitação à ouvidoria.</p>
        </div>
      </div>

      {erro && (
        <p className={styles.erro}>
          <IconAlerta />
          {erro}
        </p>
      )}

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit} noValidate>

          {/* Título */}
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="titulo">
              Título <span className={styles.obrigatorio}>*</span>
            </label>
            <input
              id="titulo"
              name="titulo"
              className={styles.input}
              value={form.titulo}
              onChange={handleChange}
              placeholder="Ex.: Problemas com a cantina escolar"
              maxLength={120}
              disabled={enviando}
              autoFocus
            />
            <span className={styles.contador}>{form.titulo.length}/120</span>
          </div>

          {/* Categoria */}
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="categoria_id">
              Categoria <span className={styles.obrigatorio}>*</span>
            </label>
            {carregandoCats ? (
              <div className={styles.carregandoSelect}>Carregando categorias...</div>
            ) : categorias.length === 0 ? (
              <p className={styles.avisoCategoria}>
                Nenhuma categoria disponível no momento. Entre em contato com a secretaria.
              </p>
            ) : (
              <select
                id="categoria_id"
                name="categoria_id"
                className={styles.select}
                value={form.categoria_id}
                onChange={handleChange}
                disabled={enviando}
              >
                <option value="">Selecione uma categoria…</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            )}
          </div>

          {/* Descrição */}
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="descricao">
              Descrição <span className={styles.obrigatorio}>*</span>
            </label>
            <textarea
              id="descricao"
              name="descricao"
              className={styles.textarea}
              value={form.descricao}
              onChange={handleChange}
              placeholder="Descreva sua solicitação com o máximo de detalhes possível: o que aconteceu, quando, onde e quem estava envolvido."
              rows={6}
              maxLength={2000}
              disabled={enviando}
            />
            <span className={styles.contador}>{form.descricao.length}/2000</span>
          </div>

          {/* Divisor + opção anônima */}
          <div className={styles.divisor} />

          <div className={styles.anonimidadeBox}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="anonima"
                checked={form.anonima}
                onChange={handleChange}
                disabled={enviando}
                className={styles.checkbox}
              />
              <span>
                <strong>Enviar de forma anônima</strong>
                <span className={styles.checkboxDescricao}>
                  {' '}— sua identidade não será revelada aos analistas. Você ainda receberá o número de protocolo.
                </span>
              </span>
            </label>

            {form.anonima && (
              <p className={styles.avisoAnonimo}>
                <IconInfo />
                Solicitações anônimas limitam nossa capacidade de solicitar esclarecimentos adicionais. Forneça o máximo de detalhes possível.
              </p>
            )}
          </div>

          <div className={styles.formAcoes}>
            <button
              type="button"
              className={styles.botaoSecundario}
              disabled={enviando}
              onClick={() => {
                if (form.titulo || form.descricao) {
                  if (!confirm('Descartar o rascunho?')) return
                }
                setForm({ titulo: '', categoria_id: '', anonima: false, descricao: '' })
                setErro('')
              }}
            >
              Limpar
            </button>
            <button type="submit" className={styles.botaoPrimario} disabled={enviando}>
              {enviando && <span className={styles.spinner} aria-hidden="true" />}
              {enviando ? 'Enviando…' : 'Enviar solicitação'}
            </button>
          </div>

        </form>
      </div>
    </>
  )
}

// ─── Painel: minhas solicitações ───────────────────────────────────────────
function PainelMinhasSolicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [detalhe, setDetalhe] = useState(null)

  useEffect(() => {
    let ativo = true
    async function buscar() {
      try {
        setCarregando(true)
        setErro('')
        const resposta = await api.get('/solicitacoes/listar')
        if (ativo) setSolicitacoes(resposta.solicitacoes)
      } catch (err) {
        if (ativo) setErro(err.message ?? 'Erro ao carregar solicitações.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }
    buscar()
    return () => { ativo = false }
  }, [])

  const lista = filtro === 'todas'
    ? solicitacoes
    : solicitacoes.filter((s) => s.status === filtro)

  return (
    <>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Minhas solicitações</h1>
          <p className={styles.subtitulo}>Acompanhe o andamento das suas solicitações registradas.</p>
        </div>
        <select
          className={styles.selectFiltro}
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option value="todas">Todos os status</option>
          <option value="aberta">Aberta</option>
          <option value="em_analise">Em análise</option>
          <option value="respondida">Respondida</option>
          <option value="encerrada">Encerrada</option>
        </select>
      </div>

      {erro && <p className={styles.erro}><IconAlerta />{erro}</p>}

      <div className={styles.card}>
        <div className={styles.tabelaWrapper}>
          {carregando ? (
            <div className={styles.estadoVazio}>Carregando suas solicitações...</div>
          ) : lista.length === 0 ? (
            <div className={styles.estadoVazio}>
              {filtro === 'todas'
                ? 'Você ainda não tem solicitações registradas.'
                : `Nenhuma solicitação com status "${labelStatus(filtro)}".`}
            </div>
          ) : (
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Título</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className={styles.protocolo}>{s.protocolo}</span>
                    </td>
                    <td>{s.titulo}</td>
                    <td>{s.categoria}</td>
                    <td><BadgeStatus status={s.status} /></td>
                    <td>{formatarData(s.criado_em)}</td>
                    <td>
                      <button
                        className={`${styles.botaoAcao} ${styles.botaoVer}`}
                        onClick={() => setDetalhe(s)}
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {detalhe && (
        <ModalDetalhe solicitacao={detalhe} onFechar={() => setDetalhe(null)} />
      )}
    </>
  )
}

// ─── Modal de detalhes (visão do solicitante) ──────────────────────────────
function ModalDetalhe({ solicitacao: s, onFechar }) {
  const [detalheCompleto, setDetalheCompleto] = useState(null)
  const [comentarios, setComentarios] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    async function buscar() {
      try {
        setCarregando(true)
        const resposta = await api.get(`/solicitacoes/buscar/${s.id}`)
        if (ativo) {
          setDetalheCompleto(resposta.solicitacao)
          setComentarios(
            resposta.solicitacao.comentarios.filter((c) => c.visivel_solicitante)
          )
        }
      } catch { /* silencioso */ } finally {
        if (ativo) setCarregando(false)
      }
    }
    buscar()
    return () => { ativo = false }
  }, [s.id])

  return (
    <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onFechar() }}>
      <div className={styles.modalGrande} role="dialog" aria-modal="true">

        <div className={styles.modalGrandeCabecalho}>
          <div>
            <h2 className={styles.modalTitulo}>{s.titulo}</h2>
            <div className={styles.metadados}>
              <span><strong>Protocolo:</strong> {s.protocolo ?? '—'}</span>
              <span><strong>Categoria:</strong> {s.categoria ?? '—'}</span>
              <span><strong>Enviada em:</strong> {formatarData(s.criado_em)}</span>
              {s.anonima && <span className={styles.tagAnonima}>Anônima</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0 }}>
            <BadgeStatus status={s.status} />
            <button className={styles.botaoFechar} onClick={onFechar} aria-label="Fechar">✕</button>
          </div>
        </div>

        <div className={styles.descricaoBox}>
          <span className={styles.label}>Descrição</span>
          <p className={styles.descricaoTexto}>
            {carregando ? 'Carregando...' : (detalheCompleto?.descricao ?? '—')}
          </p>
        </div>

        <div>
          <span className={styles.label} style={{ display: 'block', marginBottom: 10 }}>
            Respostas da ouvidoria
          </span>
          {carregando ? (
            <div className={styles.estadoVazio} style={{ padding: '24px 0' }}>Carregando...</div>
          ) : comentarios.length === 0 ? (
            <div className={styles.semResposta}>
              <IconRelogio />
              Aguardando análise — você será notificado quando houver uma resposta.
            </div>
          ) : (
            <div className={styles.comentariosLista}>
              {comentarios.map((c) => (
                <div key={c.id} className={`${styles.comentario} ${styles.comentarioVisivel}`}>
                  <div className={styles.comentarioCabecalho}>
                    <strong>{c.autor_nome}</strong>
                    <span className={styles.comentarioMeta}>{formatarDataHora(c.criado_em)}</span>
                  </div>
                  <p className={styles.comentarioTexto}>{c.conteudo}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.modalRodape}>
          <button className={styles.botaoSecundario} onClick={onFechar}>Fechar</button>
        </div>

      </div>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function labelStatus(status) {
  return { aberta: 'Aberta', em_analise: 'Em análise', respondida: 'Respondida', encerrada: 'Encerrada' }[status] ?? status
}

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatarDataHora(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

// ─── Badge de status ───────────────────────────────────────────────────────
function BadgeStatus({ status }) {
  const classe = {
    aberta:     styles.badgeAberta,
    em_analise: styles.badgeEmAnalise,
    respondida: styles.badgeRespondida,
    encerrada:  styles.badgeEncerrada,
  }[status] ?? ''
  return <span className={`${styles.badge} ${classe}`}>{labelStatus(status)}</span>
}

// ─── Ícones ────────────────────────────────────────────────────────────────
function IconNova() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}
function IconLista() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
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
function IconAlerta() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
function IconInfo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}
function IconRelogio() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
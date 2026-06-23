'use strict'

const db = require('../db')

// ─── Criar solicitação ─────────────────────────────────────────────────────
// POST /solicitacoes/criar
// Apenas solicitante.
// Body: { titulo, descricao, categoria_id }
async function criarSolicitacao(req, res, next) {
  try {
    const { titulo, descricao, categoria_id } = req.body
    const solicitante = req.usuario

    if (!titulo || !String(titulo).trim()) {
      return res.status(400).json({ erro: 'O título é obrigatório.' })
    }

    if (!descricao || !String(descricao).trim()) {
      return res.status(400).json({ erro: 'A descrição é obrigatória.' })
    }

    if (!categoria_id) {
      return res.status(400).json({ erro: 'A categoria é obrigatória.' })
    }

    // Verifica se a categoria existe
    const categoria = await db.query(
      'SELECT id FROM categorias WHERE id = $1 LIMIT 1',
      [categoria_id]
    )

    if (categoria.rows.length === 0) {
      return res.status(404).json({ erro: 'Categoria não encontrada.' })
    }

    const resultado = await db.query(
      `INSERT INTO solicitacoes (solicitante_id, categoria_id, titulo, descricao)
       VALUES ($1, $2, $3, $4)
       RETURNING id, titulo, descricao, status, criado_em`,
      [
        solicitante.id,
        categoria_id,
        String(titulo).trim(),
        String(descricao).trim(),
      ]
    )

    const nova = resultado.rows[0]

    await registrarLog({
      usuario_id: solicitante.id,
      acao: 'CRIACAO_SOLICITACAO',
      entidade: 'solicitacoes',
      entidade_id: nova.id,
      detalhes: `Solicitação "${nova.titulo}" criada pelo solicitante ${solicitante.email}`,
    })

    return res.status(201).json({ solicitacao: nova })
  } catch (err) {
    next(err)
  }
}

// ─── Listar solicitações ───────────────────────────────────────────────────
// GET /solicitacoes/listar
// Gestor/admin: vê todas.
// Analista: vê só as da sua categoria.
// Solicitante: vê só as próprias.
// Query params opcionais: ?status=aberta&categoria_id=...
async function listarSolicitacoes(req, res, next) {
  try {
    const usuario = req.usuario
    const { status, categoria_id } = req.query

    let sql = `
      SELECT
        s.id,
        s.titulo,
        s.status,
        s.criado_em,
        s.atualizado_em,
        c.nome AS categoria,
        u.nome AS solicitante
      FROM solicitacoes s
      JOIN categorias c ON c.id = s.categoria_id
      JOIN usuarios u ON u.id = s.solicitante_id
      WHERE 1=1
    `
    const params = []

    // Restrição por perfil
    if (usuario.perfil === 'solicitante') {
      params.push(usuario.id)
      sql += ` AND s.solicitante_id = $${params.length}`
    }

    if (usuario.perfil === 'analista') {
      params.push(usuario.id)
      sql += ` AND s.categoria_id IN (
        SELECT categoria_id FROM analista_categorias WHERE usuario_id = $${params.length}
      )`
    }

    // Filtros opcionais
    if (status) {
      params.push(status)
      sql += ` AND s.status = $${params.length}`
    }

    if (categoria_id) {
      params.push(categoria_id)
      sql += ` AND s.categoria_id = $${params.length}`
    }

    sql += ' ORDER BY s.criado_em DESC'

    const resultado = await db.query(sql, params)

    return res.status(200).json({ solicitacoes: resultado.rows })
  } catch (err) {
    next(err)
  }
}

// ─── Buscar solicitação por ID ─────────────────────────────────────────────
// GET /solicitacoes/buscar/:id
// Retorna a solicitação com seus comentários.
// Solicitante só vê comentários com visivel_solicitante = true.
async function buscarSolicitacao(req, res, next) {
  try {
    const { id } = req.params
    const usuario = req.usuario

    // Busca a solicitação
    const resultado = await db.query(
      `SELECT
         s.id,
         s.titulo,
         s.descricao,
         s.status,
         s.criado_em,
         s.atualizado_em,
         s.solicitante_id,
         c.id AS categoria_id,
         c.nome AS categoria,
         u.nome AS solicitante
       FROM solicitacoes s
       JOIN categorias c ON c.id = s.categoria_id
       JOIN usuarios u ON u.id = s.solicitante_id
       WHERE s.id = $1
       LIMIT 1`,
      [id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Solicitação não encontrada.' })
    }

    const solicitacao = resultado.rows[0]

    // Verifica acesso
    if (usuario.perfil === 'solicitante' && solicitacao.solicitante_id !== usuario.id) {
      return res.status(403).json({ erro: 'Acesso negado.' })
    }

    if (usuario.perfil === 'analista') {
      const temAcesso = await db.query(
        `SELECT 1 FROM analista_categorias
         WHERE usuario_id = $1 AND categoria_id = $2 LIMIT 1`,
        [usuario.id, solicitacao.categoria_id]
      )
      if (temAcesso.rows.length === 0) {
        return res.status(403).json({ erro: 'Você não tem acesso a esta solicitação.' })
      }
    }

    // Busca comentários — solicitante só vê os visíveis
    let sqlComentarios = `
      SELECT
        co.id,
        co.conteudo,
        co.visivel_solicitante,
        co.criado_em,
        u.nome AS autor,
        u.perfil AS autor_perfil
      FROM comentarios co
      JOIN usuarios u ON u.id = co.autor_id
      WHERE co.solicitacao_id = $1
    `

    if (usuario.perfil === 'solicitante') {
      sqlComentarios += ' AND co.visivel_solicitante = true'
    }

    sqlComentarios += ' ORDER BY co.criado_em ASC'

    const comentarios = await db.query(sqlComentarios, [id])

    return res.status(200).json({
      solicitacao: {
        ...solicitacao,
        comentarios: comentarios.rows,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ─── Alterar status ────────────────────────────────────────────────────────
// PATCH /solicitacoes/status/:id
// Gestor: pode alterar para qualquer status, incluindo encerrada.
// Analista: pode alterar para em_analise e respondida (não pode encerrar).
// Body: { status }
async function alterarStatus(req, res, next) {
  try {
    const { id } = req.params
    const { status } = req.body
    const usuario = req.usuario

    const statusValidos = ['aberta', 'em_analise', 'respondida', 'encerrada']

    if (!status || !statusValidos.includes(status)) {
      return res.status(400).json({
        erro: `Status inválido. Use: ${statusValidos.join(', ')}.`,
      })
    }

    // Analista não pode encerrar
    if (usuario.perfil === 'analista' && status === 'encerrada') {
      return res.status(403).json({ erro: 'Analistas não podem encerrar solicitações.' })
    }

    // Busca a solicitação para verificar acesso
    const solicitacao = await db.query(
      'SELECT id, status, categoria_id FROM solicitacoes WHERE id = $1 LIMIT 1',
      [id]
    )

    if (solicitacao.rows.length === 0) {
      return res.status(404).json({ erro: 'Solicitação não encontrada.' })
    }

    // Analista verifica se a categoria é dele
    if (usuario.perfil === 'analista') {
      const temAcesso = await db.query(
        `SELECT 1 FROM analista_categorias
         WHERE usuario_id = $1 AND categoria_id = $2 LIMIT 1`,
        [usuario.id, solicitacao.rows[0].categoria_id]
      )
      if (temAcesso.rows.length === 0) {
        return res.status(403).json({ erro: 'Você não tem acesso a esta solicitação.' })
      }
    }

    const statusAnterior = solicitacao.rows[0].status

    await db.query(
      `UPDATE solicitacoes
       SET status = $1, atualizado_em = NOW()
       WHERE id = $2`,
      [status, id]
    )

    await registrarLog({
      usuario_id: usuario.id,
      acao: 'ALTERACAO_STATUS',
      entidade: 'solicitacoes',
      entidade_id: id,
      detalhes: `Status alterado de "${statusAnterior}" para "${status}" por ${usuario.email}`,
    })

    return res.status(200).json({ mensagem: 'Status atualizado com sucesso.', status })
  } catch (err) {
    next(err)
  }
}

// ─── Encerrar solicitação ──────────────────────────────────────────────────
// PATCH /solicitacoes/encerrar/:id
// Apenas gestor e admin.
async function encerrarSolicitacao(req, res, next) {
  try {
    const { id } = req.params
    const usuario = req.usuario

    const solicitacao = await db.query(
      'SELECT id, status FROM solicitacoes WHERE id = $1 LIMIT 1',
      [id]
    )

    if (solicitacao.rows.length === 0) {
      return res.status(404).json({ erro: 'Solicitação não encontrada.' })
    }

    if (solicitacao.rows[0].status === 'encerrada') {
      return res.status(400).json({ erro: 'Solicitação já está encerrada.' })
    }

    await db.query(
      `UPDATE solicitacoes
       SET status = 'encerrada', atualizado_em = NOW()
       WHERE id = $1`,
      [id]
    )

    await registrarLog({
      usuario_id: usuario.id,
      acao: 'ENCERRAMENTO_SOLICITACAO',
      entidade: 'solicitacoes',
      entidade_id: id,
      detalhes: `Solicitação encerrada por ${usuario.email}`,
    })

    return res.status(200).json({ mensagem: 'Solicitação encerrada com sucesso.' })
  } catch (err) {
    next(err)
  }
}

// ─── Helper de log ─────────────────────────────────────────────────────────
async function registrarLog({ usuario_id, acao, entidade, entidade_id, detalhes }) {
  try {
    await db.query(
      `INSERT INTO logs (usuario_id, acao, entidade, entidade_id, detalhes)
       VALUES ($1, $2, $3, $4, $5)`,
      [usuario_id, acao, entidade ?? null, entidade_id ?? null, detalhes]
    )
  } catch (err) {
    console.error('[LOG] Falha ao registrar log:', err.message)
  }
}

module.exports = {
  criarSolicitacao,
  listarSolicitacoes,
  buscarSolicitacao,
  alterarStatus,
  encerrarSolicitacao,
}
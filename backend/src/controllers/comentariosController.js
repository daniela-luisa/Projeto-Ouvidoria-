'use strict'

const db = require('../db')

// ─── Criar comentário ──────────────────────────────────────────────────────
// POST /comentarios/criar
// Gestor e analista podem comentar.
// Gestor pode comentar em qualquer solicitação.
// Analista só pode comentar em solicitações da sua categoria.
// Body: { solicitacao_id, conteudo, visivel_solicitante }
async function criarComentario(req, res, next) {
  try {
    const { solicitacao_id, conteudo, visivel_solicitante } = req.body
    const usuario = req.usuario

    if (!solicitacao_id) {
      return res.status(400).json({ erro: 'O ID da solicitação é obrigatório.' })
    }

    if (!conteudo || !String(conteudo).trim()) {
      return res.status(400).json({ erro: 'O conteúdo do comentário é obrigatório.' })
    }

    // Busca a solicitação
    const solicitacao = await db.query(
      'SELECT id, status, categoria_id FROM solicitacoes WHERE id = $1 LIMIT 1',
      [solicitacao_id]
    )

    if (solicitacao.rows.length === 0) {
      return res.status(404).json({ erro: 'Solicitação não encontrada.' })
    }

    // Não permite comentar em solicitação encerrada
    if (solicitacao.rows[0].status === 'encerrada') {
      return res.status(400).json({ erro: 'Não é possível comentar em uma solicitação encerrada.' })
    }

    // Analista só comenta em solicitações da sua categoria
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

    const visivelParaSolicitante = visivel_solicitante === true || visivel_solicitante === 'true'

    const resultado = await db.query(
      `INSERT INTO comentarios (solicitacao_id, autor_id, conteudo, visivel_solicitante)
       VALUES ($1, $2, $3, $4)
       RETURNING id, conteudo, visivel_solicitante, criado_em`,
      [solicitacao_id, usuario.id, String(conteudo).trim(), visivelParaSolicitante]
    )

    const novoComentario = resultado.rows[0]

    // Atualiza atualizado_em da solicitação
    await db.query(
      'UPDATE solicitacoes SET atualizado_em = NOW() WHERE id = $1',
      [solicitacao_id]
    )

    await registrarLog({
      usuario_id: usuario.id,
      acao: 'CRIACAO_COMENTARIO',
      entidade: 'comentarios',
      entidade_id: novoComentario.id,
      detalhes: `Comentário adicionado à solicitação ${solicitacao_id} por ${usuario.email}. Visível ao solicitante: ${visivelParaSolicitante}`,
    })

    return res.status(201).json({ comentario: novoComentario })
  } catch (err) {
    next(err)
  }
}

// ─── Alterar visibilidade do comentário ───────────────────────────────────
// PATCH /comentarios/visibilidade/:id
// Gestor e analista (só seus próprios comentários).
// Body: { visivel_solicitante }
async function alterarVisibilidade(req, res, next) {
  try {
    const { id } = req.params
    const { visivel_solicitante } = req.body
    const usuario = req.usuario

    if (visivel_solicitante === undefined) {
      return res.status(400).json({ erro: 'Informe o campo visivel_solicitante.' })
    }

    // Busca o comentário
    const comentario = await db.query(
      'SELECT id, autor_id, visivel_solicitante FROM comentarios WHERE id = $1 LIMIT 1',
      [id]
    )

    if (comentario.rows.length === 0) {
      return res.status(404).json({ erro: 'Comentário não encontrado.' })
    }

    // Analista só pode alterar visibilidade dos próprios comentários
    if (usuario.perfil === 'analista' && comentario.rows[0].autor_id !== usuario.id) {
      return res.status(403).json({ erro: 'Você só pode alterar a visibilidade dos seus próprios comentários.' })
    }

    const novaVisibilidade = visivel_solicitante === true || visivel_solicitante === 'true'

    await db.query(
      'UPDATE comentarios SET visivel_solicitante = $1 WHERE id = $2',
      [novaVisibilidade, id]
    )

    await registrarLog({
      usuario_id: usuario.id,
      acao: 'ALTERACAO_VISIBILIDADE_COMENTARIO',
      entidade: 'comentarios',
      entidade_id: id,
      detalhes: `Visibilidade do comentário ${id} alterada para ${novaVisibilidade} por ${usuario.email}`,
    })

    return res.status(200).json({
      mensagem: 'Visibilidade atualizada.',
      visivel_solicitante: novaVisibilidade,
    })
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
  criarComentario,
  alterarVisibilidade,
}
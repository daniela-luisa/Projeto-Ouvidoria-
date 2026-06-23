'use strict'

const db = require('../db')

// ─── Listar logs ───────────────────────────────────────────────────────────
// GET /logs/listar
// Apenas gestor e admin.
// Query params opcionais: ?acao=LOGIN&usuario_id=...&de=2026-01-01&ate=2026-12-31
async function listarLogs(req, res, next) {
  try {
    const { acao, usuario_id, de, ate } = req.query

    let sql = `
      SELECT
        l.id,
        l.acao,
        l.entidade,
        l.entidade_id,
        l.detalhes,
        l.criado_em,
        u.nome AS usuario_nome,
        u.email AS usuario_email,
        u.perfil AS usuario_perfil
      FROM logs l
      LEFT JOIN usuarios u ON u.id = l.usuario_id
      WHERE 1=1
    `
    const params = []

    if (acao) {
      params.push(acao)
      sql += ` AND l.acao = $${params.length}`
    }

    if (usuario_id) {
      params.push(usuario_id)
      sql += ` AND l.usuario_id = $${params.length}`
    }

    if (de) {
      params.push(de)
      sql += ` AND l.criado_em >= $${params.length}`
    }

    if (ate) {
      params.push(ate)
      sql += ` AND l.criado_em <= $${params.length}`
    }

    sql += ' ORDER BY l.criado_em DESC LIMIT 200'

    const resultado = await db.query(sql, params)

    return res.status(200).json({ logs: resultado.rows })
  } catch (err) {
    next(err)
  }
}

module.exports = { listarLogs }
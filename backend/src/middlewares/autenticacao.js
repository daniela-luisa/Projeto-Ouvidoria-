'use strict'

const jwt = require('jsonwebtoken')
const db = require('../db')

/**
 * Middleware de autenticação.
 *
 * Verifica o token JWT no header Authorization: Bearer <token>
 * e injeta os dados do usuário em req.usuario.
 *
 * Se o token for inválido ou o usuário não existir, retorna 401.
 */
async function autenticar(req, res, next) {
  try {
    const authHeader = req.headers['authorization']

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ erro: 'Token de autenticação não fornecido.' })
    }

    const token = authHeader.slice(7) // remove "Bearer "

    let payload
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      const mensagem =
        err.name === 'TokenExpiredError'
          ? 'Sessão expirada. Faça login novamente.'
          : 'Token inválido.'
      return res.status(401).json({ erro: mensagem })
    }

    // Confirma que o usuário ainda existe e está ativo no banco
    const resultado = await db.query(
      `SELECT id, nome, email, perfil, ativo
       FROM usuarios
       WHERE id = $1
       LIMIT 1`,
      [payload.id]
    )

    const usuario = resultado.rows[0]

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ erro: 'Usuário não encontrado ou desativado.' })
    }

    // Injeta os dados do usuário para uso nos controllers
    req.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    }

    next()
  } catch (err) {
    next(err)
  }
}

module.exports = { autenticar }
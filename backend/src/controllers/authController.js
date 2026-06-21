'use strict'

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')

/**
 * POST /auth/login
 * Body: { email, senha }
 *
 * Retorna: { token, usuario: { id, nome, email, perfil } }
 */
async function login(req, res, next) {
  try {
    const { email, senha } = req.body

    // ── Validação básica dos campos ────────────────────────────────────────
    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' })
    }

    const emailTrimado = String(email).trim().toLowerCase()
    const senhaStr = String(senha)

    // ── Busca o usuário pelo e-mail ────────────────────────────────────────
    const resultado = await db.query(
      `SELECT id, nome, email, senha_hash, perfil, ativo
       FROM usuarios
       WHERE email = $1
       LIMIT 1`,
      [emailTrimado]
    )

    const usuario = resultado.rows[0]

    // Mesmo que o usuário não exista, compara um hash fictício para evitar
    // timing attacks que revelam se o e-mail está cadastrado.
    const hashFicticio = '$2a$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const hashParaComparar = usuario?.senha_hash ?? hashFicticio

    const senhaCorreta = await bcrypt.compare(senhaStr, hashParaComparar)

    if (!usuario || !senhaCorreta) {
      // Registra tentativa de login falha (sem revelar qual campo errou)
      await registrarLog({
        usuario_id: usuario?.id ?? null,
        acao: 'LOGIN_FALHA',
        detalhes: `Tentativa de login com e-mail: ${emailTrimado}`,
      })

      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' })
    }

    // ── Verifica se a conta está ativa ────────────────────────────────────
    if (!usuario.ativo) {
      return res.status(403).json({ erro: 'Conta desativada. Entre em contato com o suporte.' })
    }

    // ── Gera o token JWT ──────────────────────────────────────────────────
    const payload = {
      id: usuario.id,
      perfil: usuario.perfil,
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
    })

    // ── Registra login bem-sucedido no log de auditoria ───────────────────
    await registrarLog({
      usuario_id: usuario.id,
      acao: 'LOGIN',
      detalhes: `Login realizado com sucesso. Perfil: ${usuario.perfil}`,
    })

    // ── Responde com token e dados públicos do usuário ────────────────────
    return res.status(200).json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Grava um evento no log de auditoria.
 * Falhas aqui não derrubam a requisição principal.
 */
async function registrarLog({ usuario_id, acao, detalhes }) {
  try {
    await db.query(
      `INSERT INTO logs (usuario_id, acao, detalhes)
       VALUES ($1, $2, $3)`,
      [usuario_id, acao, detalhes]
    )
  } catch (err) {
    console.error('[LOG] Falha ao registrar log:', err.message)
  }
}

module.exports = { login }
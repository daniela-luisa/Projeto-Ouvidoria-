'use strict'

const bcrypt = require('bcryptjs')
const db = require('../db')

// ─── Criar usuário ─────────────────────────────────────────────────────────
// POST /usuarios
// Apenas gestor e admin podem criar usuários.
// Gestor pode criar: gestor, analista
// Admin pode criar: gestor (só o primeiro uso; depois o gestor opera o sistema)
//
// Body: { nome, email, senha, perfil, categorias? }
// categorias: array de UUIDs — obrigatório quando perfil === 'analista'
async function criarUsuario(req, res, next) {
  try {
    const { nome, email, senha, perfil, categorias } = req.body
    const criador = req.usuario

    // ── Validação dos campos obrigatórios ──────────────────────────────────
    if (!nome || !email || !senha || !perfil) {
      return res.status(400).json({ erro: 'Nome, e-mail, senha e perfil são obrigatórios.' })
    }

    const emailTrimado = String(email).trim().toLowerCase()
    const nomeTrimado = String(nome).trim()

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimado)
    if (!emailValido) {
      return res.status(400).json({ erro: 'Informe um e-mail válido.' })
    }

    if (String(senha).length < 8) {
      return res.status(400).json({ erro: 'A senha deve ter no mínimo 8 caracteres.' })
    }

    // ── Perfis que cada criador pode cadastrar ─────────────────────────────
    const perfisPermitidos = {
      admin: ['gestor'],
      gestor: ['gestor', 'analista'],
    }

    if (!perfisPermitidos[criador.perfil]?.includes(perfil)) {
      return res.status(403).json({
        erro: `Seu perfil não pode criar usuários do tipo "${perfil}".`,
      })
    }

    // ── Analista precisa ter ao menos uma categoria vinculada ──────────────
    if (perfil === 'analista') {
      if (!Array.isArray(categorias) || categorias.length === 0) {
        return res.status(400).json({
          erro: 'Informe ao menos uma categoria para o analista.',
        })
      }
    }

    // ── Verifica se o e-mail já está em uso ───────────────────────────────
    const emailExiste = await db.query(
      'SELECT id FROM usuarios WHERE email = $1 LIMIT 1',
      [emailTrimado]
    )

    if (emailExiste.rows.length > 0) {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' })
    }

    // ── Gera o hash da senha (custo 12) ───────────────────────────────────
    const senha_hash = await bcrypt.hash(String(senha), 12)

    // ── Insere o usuário no banco ──────────────────────────────────────────
    const resultado = await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, email, perfil, ativo, criado_em`,
      [nomeTrimado, emailTrimado, senha_hash, perfil]
    )

    const novoUsuario = resultado.rows[0]

    // ── Se for analista, vincula às categorias informadas ─────────────────
    if (perfil === 'analista' && Array.isArray(categorias)) {
      for (const categoriaId of categorias) {
        // Verifica se a categoria existe antes de vincular
        const categoriaExiste = await db.query(
          'SELECT id FROM categorias WHERE id = $1 LIMIT 1',
          [categoriaId]
        )

        if (categoriaExiste.rows.length === 0) {
          // Categoria inválida — ignora silenciosamente em vez de abortar tudo
          console.warn(`[WARN] Categoria ${categoriaId} não encontrada ao vincular analista.`)
          continue
        }

        await db.query(
          `INSERT INTO analista_categorias (usuario_id, categoria_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [novoUsuario.id, categoriaId]
        )
      }
    }

    // ── Registra no log de auditoria ──────────────────────────────────────
    await registrarLog({
      usuario_id: criador.id,
      acao: 'CADASTRO_USUARIO',
      entidade: 'usuarios',
      entidade_id: novoUsuario.id,
      detalhes: `Usuário "${nomeTrimado}" (${perfil}) cadastrado por ${criador.email}`,
    })

    return res.status(201).json({ usuario: novoUsuario })
  } catch (err) {
    next(err)
  }
}

// ─── Listar usuários ───────────────────────────────────────────────────────
// GET /usuarios
// Apenas gestor e admin.
// Query params opcionais: ?perfil=analista&ativo=true
async function listarUsuarios(req, res, next) {
  try {
    const { perfil, ativo } = req.query
    const executor = req.usuario

    let sql = `
      SELECT id, nome, email, perfil, ativo, criado_em
      FROM usuarios
      WHERE 1=1
    `
    const params = []

    // Gestor não vê solicitantes — apenas admin, gestores e analistas
    if (executor.perfil === 'gestor') {
      sql += ` AND perfil IN ('admin', 'gestor', 'analista')`
    }

    if (perfil) {
      params.push(perfil)
      sql += ` AND perfil = $${params.length}`
    }

    if (ativo !== undefined) {
      params.push(ativo === 'true')
      sql += ` AND ativo = $${params.length}`
    }

    sql += ' ORDER BY criado_em DESC'

    const resultado = await db.query(sql, params)

    return res.status(200).json({ usuarios: resultado.rows })
  } catch (err) {
    next(err)
  }
}

// ─── Buscar usuário por ID ─────────────────────────────────────────────────
// GET /usuarios/:id
// Apenas gestor e admin.
async function buscarUsuario(req, res, next) {
  try {
    const { id } = req.params

    const resultado = await db.query(
      `SELECT u.id, u.nome, u.email, u.perfil, u.ativo, u.criado_em,
              COALESCE(
                json_agg(
                  json_build_object('id', c.id, 'nome', c.nome)
                ) FILTER (WHERE c.id IS NOT NULL),
                '[]'
              ) AS categorias
       FROM usuarios u
       LEFT JOIN analista_categorias ac ON ac.usuario_id = u.id
       LEFT JOIN categorias c ON c.id = ac.categoria_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' })
    }

    return res.status(200).json({ usuario: resultado.rows[0] })
  } catch (err) {
    next(err)
  }
}

// ─── Desativar usuário ─────────────────────────────────────────────────────
// PATCH /usuarios/:id/desativar
// Apenas gestor e admin.
// Não deleta — apenas marca ativo = false.
async function desativarUsuario(req, res, next) {
  try {
    const { id } = req.params
    const executor = req.usuario

    // Não pode desativar a si mesmo
    if (id === executor.id) {
      return res.status(400).json({ erro: 'Você não pode desativar sua própria conta.' })
    }

    // Gestor não pode desativar solicitante
    if (executor.perfil === 'gestor') {
      const alvo = await db.query('SELECT perfil FROM usuarios WHERE id = $1 LIMIT 1', [id])
      if (alvo.rows[0]?.perfil === 'solicitante') {
        return res.status(403).json({ erro: 'Gestores não podem desativar solicitantes.' })
      }
    }

    const resultado = await db.query(
      `UPDATE usuarios
       SET ativo = false
       WHERE id = $1 AND ativo = true
       RETURNING id, nome, email, perfil`,
      [id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado ou já está desativado.' })
    }

    const desativado = resultado.rows[0]

    await registrarLog({
      usuario_id: executor.id,
      acao: 'DESATIVACAO_USUARIO',
      entidade: 'usuarios',
      entidade_id: desativado.id,
      detalhes: `Usuário "${desativado.nome}" (${desativado.perfil}) desativado por ${executor.email}`,
    })

    return res.status(200).json({
      mensagem: 'Usuário desativado com sucesso.',
      usuario: desativado,
    })
  } catch (err) {
    next(err)
  }
}

// ─── Reativar usuário ──────────────────────────────────────────────────────
// PATCH /usuarios/:id/reativar
// Apenas gestor e admin.
async function reativarUsuario(req, res, next) {
  try {
    const { id } = req.params
    const executor = req.usuario

    const resultado = await db.query(
      `UPDATE usuarios
       SET ativo = true
       WHERE id = $1 AND ativo = false
       RETURNING id, nome, email, perfil`,
      [id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado ou já está ativo.' })
    }

    const reativado = resultado.rows[0]

    await registrarLog({
      usuario_id: executor.id,
      acao: 'REATIVACAO_USUARIO',
      entidade: 'usuarios',
      entidade_id: reativado.id,
      detalhes: `Usuário "${reativado.nome}" (${reativado.perfil}) reativado por ${executor.email}`,
    })

    return res.status(200).json({
      mensagem: 'Usuário reativado com sucesso.',
      usuario: reativado,
    })
  } catch (err) {
    next(err)
  }
}

// ─── Alterar senha ─────────────────────────────────────────────────────────
// PATCH /usuarios/minha-senha
// Qualquer usuário autenticado pode alterar a própria senha.
// Body: { senhaAtual, novaSenha }
async function alterarSenha(req, res, next) {
  try {
    const { senhaAtual, novaSenha } = req.body
    const usuario = req.usuario

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ erro: 'Informe a senha atual e a nova senha.' })
    }

    if (String(novaSenha).length < 8) {
      return res.status(400).json({ erro: 'A nova senha deve ter no mínimo 8 caracteres.' })
    }

    // Busca o hash atual do banco
    const resultado = await db.query(
      'SELECT senha_hash FROM usuarios WHERE id = $1 LIMIT 1',
      [usuario.id]
    )

    const senhaCorreta = await bcrypt.compare(String(senhaAtual), resultado.rows[0].senha_hash)

    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Senha atual incorreta.' })
    }

    const novo_hash = await bcrypt.hash(String(novaSenha), 12)

    await db.query(
      'UPDATE usuarios SET senha_hash = $1 WHERE id = $2',
      [novo_hash, usuario.id]
    )

    await registrarLog({
      usuario_id: usuario.id,
      acao: 'ALTERACAO_SENHA',
      entidade: 'usuarios',
      entidade_id: usuario.id,
      detalhes: `Usuário "${usuario.email}" alterou a própria senha.`,
    })

    return res.status(200).json({ mensagem: 'Senha alterada com sucesso.' })
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
  criarUsuario,
  listarUsuarios,
  buscarUsuario,
  desativarUsuario,
  reativarUsuario,
  alterarSenha,
}
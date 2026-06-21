'use strict'

const db = require('../db')

// ─── Criar categoria ───────────────────────────────────────────────────────
// POST /categorias/criar
// Apenas gestor e admin.
// Body: { nome, descricao? }
async function criarCategoria(req, res, next) {
  try {
    const { nome, descricao } = req.body
    const criador = req.usuario

    if (!nome || !String(nome).trim()) {
      return res.status(400).json({ erro: 'O nome da categoria é obrigatório.' })
    }

    const nomeTrimado = String(nome).trim()
    const descricaoTrimada = descricao ? String(descricao).trim() : null

    // Verifica se já existe categoria com esse nome
    const existe = await db.query(
      'SELECT id FROM categorias WHERE nome = $1 LIMIT 1',
      [nomeTrimado]
    )

    if (existe.rows.length > 0) {
      return res.status(409).json({ erro: 'Já existe uma categoria com esse nome.' })
    }

    const resultado = await db.query(
      `INSERT INTO categorias (nome, descricao)
       VALUES ($1, $2)
       RETURNING id, nome, descricao`,
      [nomeTrimado, descricaoTrimada]
    )

    const novaCategoria = resultado.rows[0]

    await registrarLog({
      usuario_id: criador.id,
      acao: 'CADASTRO_CATEGORIA',
      entidade: 'categorias',
      entidade_id: novaCategoria.id,
      detalhes: `Categoria "${nomeTrimado}" criada por ${criador.email}`,
    })

    return res.status(201).json({ categoria: novaCategoria })
  } catch (err) {
    next(err)
  }
}

// ─── Listar categorias ─────────────────────────────────────────────────────
// GET /categorias/listar
// Qualquer usuário autenticado pode listar (analista precisa ver as categorias)
async function listarCategorias(req, res, next) {
  try {
    const resultado = await db.query(
      `SELECT id, nome, descricao
       FROM categorias
       ORDER BY nome ASC`
    )

    return res.status(200).json({ categorias: resultado.rows })
  } catch (err) {
    next(err)
  }
}

// ─── Buscar categoria por ID ───────────────────────────────────────────────
// GET /categorias/buscar/:id
async function buscarCategoria(req, res, next) {
  try {
    const { id } = req.params

    const resultado = await db.query(
      `SELECT c.id, c.nome, c.descricao,
              COALESCE(
                json_agg(
                  json_build_object('id', u.id, 'nome', u.nome, 'email', u.email)
                ) FILTER (WHERE u.id IS NOT NULL),
                '[]'
              ) AS analistas
       FROM categorias c
       LEFT JOIN analista_categorias ac ON ac.categoria_id = c.id
       LEFT JOIN usuarios u ON u.id = ac.usuario_id AND u.ativo = true
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Categoria não encontrada.' })
    }

    return res.status(200).json({ categoria: resultado.rows[0] })
  } catch (err) {
    next(err)
  }
}

// ─── Editar categoria ──────────────────────────────────────────────────────
// PATCH /categorias/editar/:id
// Apenas gestor e admin.
// Body: { nome?, descricao? }
async function editarCategoria(req, res, next) {
  try {
    const { id } = req.params
    const { nome, descricao } = req.body
    const editor = req.usuario

    if (!nome && descricao === undefined) {
      return res.status(400).json({ erro: 'Informe ao menos um campo para atualizar.' })
    }

    // Busca a categoria atual
    const atual = await db.query(
      'SELECT id, nome, descricao FROM categorias WHERE id = $1 LIMIT 1',
      [id]
    )

    if (atual.rows.length === 0) {
      return res.status(404).json({ erro: 'Categoria não encontrada.' })
    }

    const nomeFinal = nome ? String(nome).trim() : atual.rows[0].nome
    const descricaoFinal = descricao !== undefined ? String(descricao).trim() : atual.rows[0].descricao

    // Verifica conflito de nome com outra categoria
    if (nome) {
      const conflito = await db.query(
        'SELECT id FROM categorias WHERE nome = $1 AND id != $2 LIMIT 1',
        [nomeFinal, id]
      )
      if (conflito.rows.length > 0) {
        return res.status(409).json({ erro: 'Já existe outra categoria com esse nome.' })
      }
    }

    const resultado = await db.query(
      `UPDATE categorias
       SET nome = $1, descricao = $2
       WHERE id = $3
       RETURNING id, nome, descricao`,
      [nomeFinal, descricaoFinal, id]
    )

    await registrarLog({
      usuario_id: editor.id,
      acao: 'EDICAO_CATEGORIA',
      entidade: 'categorias',
      entidade_id: id,
      detalhes: `Categoria "${nomeFinal}" editada por ${editor.email}`,
    })

    return res.status(200).json({ categoria: resultado.rows[0] })
  } catch (err) {
    next(err)
  }
}

// ─── Excluir categoria ─────────────────────────────────────────────────────
// DELETE /categorias/excluir/:id
// Apenas gestor e admin.
// Bloqueia exclusão se houver solicitações ou analistas vinculados.
async function excluirCategoria(req, res, next) {
  try {
    const { id } = req.params
    const executor = req.usuario

    // Verifica se existe
    const categoria = await db.query(
      'SELECT id, nome FROM categorias WHERE id = $1 LIMIT 1',
      [id]
    )

    if (categoria.rows.length === 0) {
      return res.status(404).json({ erro: 'Categoria não encontrada.' })
    }

    // Bloqueia se houver analistas vinculados
    const analistas = await db.query(
      'SELECT 1 FROM analista_categorias WHERE categoria_id = $1 LIMIT 1',
      [id]
    )

    if (analistas.rows.length > 0) {
      return res.status(409).json({
        erro: 'Não é possível excluir uma categoria com analistas vinculados.',
      })
    }

    // Bloqueia se houver solicitações vinculadas
    const solicitacoes = await db.query(
      'SELECT 1 FROM solicitacoes WHERE categoria_id = $1 LIMIT 1',
      [id]
    )

    if (solicitacoes.rows.length > 0) {
      return res.status(409).json({
        erro: 'Não é possível excluir uma categoria que possui solicitações.',
      })
    }

    await db.query('DELETE FROM categorias WHERE id = $1', [id])

    await registrarLog({
      usuario_id: executor.id,
      acao: 'EXCLUSAO_CATEGORIA',
      entidade: 'categorias',
      entidade_id: id,
      detalhes: `Categoria "${categoria.rows[0].nome}" excluída por ${executor.email}`,
    })

    return res.status(200).json({ mensagem: 'Categoria excluída com sucesso.' })
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
  criarCategoria,
  listarCategorias,
  buscarCategoria,
  editarCategoria,
  excluirCategoria,
}
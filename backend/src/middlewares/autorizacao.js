'use strict'

const db = require('../db')

/**
 * Middleware de autorização por perfil.
 *
 * Uso: autorizar('gestor', 'admin')
 * Permite a rota apenas para os perfis listados.
 *
 * Deve ser usado DEPOIS do middleware autenticar().
 *
 * Exemplo:
 *   router.get('/usuarios', autenticar, autorizar('gestor', 'admin'), listarUsuarios)
 */
function autorizar(...perfisPermitidos) {
  return async (req, res, next) => {
    try {
      const usuario = req.usuario

      if (!usuario) {
        return res.status(401).json({ erro: 'Usuário não autenticado.' })
      }

      if (!perfisPermitidos.includes(usuario.perfil)) {
        // Registra tentativa de acesso negado no log de auditoria
        await registrarAcessoNegado({
          usuario_id: usuario.id,
          rota: req.originalUrl,
          perfil: usuario.perfil,
          perfisExigidos: perfisPermitidos,
        })

        return res.status(403).json({ erro: 'Acesso negado. Você não tem permissão para esta ação.' })
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}

/**
 * Middleware de autorização por categoria (para analistas).
 *
 * Verifica se o analista autenticado tem acesso à categoria
 * informada em req.params.categoriaId ou req.body.categoria_id.
 *
 * Deve ser usado DEPOIS do middleware autenticar().
 */
function autorizarCategoria() {
  return async (req, res, next) => {
    try {
      const usuario = req.usuario

      if (!usuario) {
        return res.status(401).json({ erro: 'Usuário não autenticado.' })
      }

      // Gestores e admins passam direto — sem restrição de categoria
      if (usuario.perfil === 'gestor' || usuario.perfil === 'admin') {
        return next()
      }

      // Para analistas, verifica se a categoria da solicitação está vinculada ao seu cadastro
      if (usuario.perfil === 'analista') {
        const categoriaId =
          req.params.categoriaId ??
          req.body.categoria_id ??
          req.query.categoria_id

        if (!categoriaId) {
          return next() // sem categoria para verificar, deixa o controller decidir
        }

        const resultado = await db.query(
          `SELECT 1
           FROM analista_categorias
           WHERE usuario_id = $1 AND categoria_id = $2
           LIMIT 1`,
          [usuario.id, categoriaId]
        )

        if (resultado.rows.length === 0) {
          await registrarAcessoNegado({
            usuario_id: usuario.id,
            rota: req.originalUrl,
            perfil: usuario.perfil,
            perfisExigidos: ['categoria vinculada'],
          })

          return res.status(403).json({ erro: 'Você não tem acesso a esta categoria.' })
        }

        return next()
      }

      // Outros perfis não têm acesso a rotas de categoria
      return res.status(403).json({ erro: 'Acesso negado.' })
    } catch (err) {
      next(err)
    }
  }
}

/**
 * Grava um evento de acesso negado no log de auditoria.
 */
async function registrarAcessoNegado({ usuario_id, rota, perfil, perfisExigidos }) {
  try {
    await db.query(
      `INSERT INTO logs (usuario_id, acao, detalhes)
       VALUES ($1, $2, $3)`,
      [
        usuario_id,
        'ACESSO_NEGADO',
        `Perfil "${perfil}" tentou acessar "${rota}". Perfis exigidos: ${perfisExigidos.join(', ')}`,
      ]
    )
  } catch (err) {
    console.error('[LOG] Falha ao registrar acesso negado:', err.message)
  }
}

module.exports = { autorizar, autorizarCategoria }
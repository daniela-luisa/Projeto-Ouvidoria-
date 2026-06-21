'use strict'

const { Router } = require('express')
const { autenticar } = require('../middlewares/autenticacao')
const { autorizar } = require('../middlewares/autorizacao')
const {
  criarCategoria,
  listarCategorias,
  buscarCategoria,
  editarCategoria,
  excluirCategoria,
} = require('../controllers/categoriasController')

const router = Router()

router.use(autenticar)

// POST /categorias/criar — cria categoria (gestor e admin)
router.post('/criar', autorizar('admin', 'gestor'), criarCategoria)

// GET /categorias/listar — lista todas (qualquer autenticado)
router.get('/listar', listarCategorias)

// GET /categorias/buscar/:id — busca uma com analistas vinculados
router.get('/buscar/:id', autorizar('admin', 'gestor'), buscarCategoria)

// PATCH /categorias/editar/:id — edita nome/descrição (gestor e admin)
router.patch('/editar/:id', autorizar('admin', 'gestor'), editarCategoria)

// DELETE /categorias/excluir/:id — exclui se não tiver vínculos (gestor e admin)
router.delete('/excluir/:id', autorizar('admin', 'gestor'), excluirCategoria)

module.exports = router
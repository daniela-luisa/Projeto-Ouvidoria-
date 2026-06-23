'use strict'

const { Router } = require('express')
const { autenticar } = require('../middlewares/autenticacao')
const { autorizar } = require('../middlewares/autorizacao')
const { criarComentario, alterarVisibilidade } = require('../controllers/comentariosController')

const router = Router()

router.use(autenticar)

// POST /comentarios/criar — gestor e analista
router.post('/criar', autorizar('gestor', 'admin', 'analista'), criarComentario)

// PATCH /comentarios/visibilidade/:id — gestor e analista
router.patch('/visibilidade/:id', autorizar('gestor', 'admin', 'analista'), alterarVisibilidade)

module.exports = router
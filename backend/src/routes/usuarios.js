'use strict'

const { Router } = require('express')
const { autenticar } = require('../middlewares/autenticacao')
const { autorizar } = require('../middlewares/autorizacao')
const {
  criarUsuario,
  listarUsuarios,
  buscarUsuario,
  desativarUsuario,
  reativarUsuario,
  alterarSenha,
} = require('../controllers/usuariosController')

const router = Router()

// Todas as rotas abaixo exigem autenticação
router.use(autenticar)

// POST /usuarios/criar — cria gestor ou analista (gestor e admin)
router.post('/criar', autorizar('admin', 'gestor'), criarUsuario)

// GET /usuarios/listar — lista todos os usuários (gestor e admin)
router.get('/listar', autorizar('admin', 'gestor'), listarUsuarios)

// GET /usuarios/buscar/:id — busca um usuário com suas categorias (gestor e admin)
router.get('/buscar/:id', autorizar('admin', 'gestor'), buscarUsuario)

// PATCH /usuarios/alterar-senha — qualquer usuário autenticado altera a própria senha
router.patch('/alterar-senha', alterarSenha)

// PATCH /usuarios/desativar/:id — desativa conta (gestor e admin)
router.patch('/desativar/:id', autorizar('admin', 'gestor'), desativarUsuario)

// PATCH /usuarios/reativar/:id — reativa conta (gestor e admin)
router.patch('/reativar/:id', autorizar('admin', 'gestor'), reativarUsuario)

module.exports = router
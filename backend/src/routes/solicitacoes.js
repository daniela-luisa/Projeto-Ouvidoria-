'use strict'

// ─── solicitacoes.js ───────────────────────────────────────────────────────
const { Router: RouterSol } = require('express')
const { autenticar } = require('../middlewares/autenticacao')
const { autorizar } = require('../middlewares/autorizacao')
const {
  criarSolicitacao,
  listarSolicitacoes,
  buscarSolicitacao,
  alterarStatus,
  encerrarSolicitacao,
} = require('../controllers/solicitacoesController')

const solicitacoesRouter = RouterSol()

solicitacoesRouter.use(autenticar)

// POST /solicitacoes/criar — apenas solicitante
solicitacoesRouter.post('/criar', autorizar('solicitante'), criarSolicitacao)

// GET /solicitacoes/listar — todos os perfis (filtrado por perfil no controller)
solicitacoesRouter.get('/listar', listarSolicitacoes)

// GET /solicitacoes/buscar/:id — todos os perfis (acesso verificado no controller)
solicitacoesRouter.get('/buscar/:id', buscarSolicitacao)

// PATCH /solicitacoes/status/:id — gestor e analista
solicitacoesRouter.patch('/status/:id', autorizar('gestor', 'admin', 'analista'), alterarStatus)

// PATCH /solicitacoes/encerrar/:id — apenas gestor e admin
solicitacoesRouter.patch('/encerrar/:id', autorizar('gestor', 'admin'), encerrarSolicitacao)

module.exports = solicitacoesRouter
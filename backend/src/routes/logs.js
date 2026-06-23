'use strict'

const { Router } = require('express')
const { autenticar } = require('../middlewares/autenticacao')
const { autorizar } = require('../middlewares/autorizacao')
const { listarLogs } = require('../controllers/logsController')

const router = Router()

router.use(autenticar)

// GET /logs/listar — apenas gestor e admin
router.get('/listar', autorizar('gestor', 'admin'), listarLogs)

module.exports = router
'use strict'

const { Router } = require('express')
const { login } = require('../controllers/authController')

const router = Router()

// POST /auth/login
router.post('/login', login)

module.exports = router
'use strict'

require('dotenv').config()

const pool = require('./db')
const express = require('express')
const cors = require('cors')
// const authRoutes = require('./routes/auth')
// const solicitacoesRoutes = require('./routes/solicitacoes')
// const comentariosRoutes = require('./routes/comentarios')
// const usuariosRoutes = require('./routes/usuarios')
// const categoriasRoutes = require('./routes/categorias')
// const logsRoutes = require('./routes/logs')

const app = express()

// ─── Middlewares globais ───────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// ─── Rotas ────────────────────────────────────────────────────────────────
// app.use('/auth', authRoutes)
// app.use('/solicitacoes', solicitacoesRoutes)
// app.use('/comentarios', comentariosRoutes)
// app.use('/usuarios', usuariosRoutes)
// app.use('/categorias', categoriasRoutes)
// app.use('/logs', logsRoutes)

// ─── Health check ─────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// ─── Handler de rota não encontrada ───────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' })
})

// ─── Handler de erros globais ─────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERRO]', err)
  const status = err.status ?? err.statusCode ?? 500
  res.status(status).json({ erro: err.message ?? 'Erro interno do servidor' })
})

// ─── Inicialização ────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3000

async function startServer() {
  try {
    const result = await pool.query('SELECT NOW()')

    console.log('✅ Banco conectado com sucesso!')
    console.log('🕒 Horário do banco:', result.rows[0].now)

    app.listen(PORT, () => {
      console.log(`🚀 NossaVoz API rodando na porta ${PORT}`)
    })
  } catch (error) {
    console.error('❌ Erro ao conectar no banco:')
    console.error(error.message)
    process.exit(1)
  }
}

startServer()
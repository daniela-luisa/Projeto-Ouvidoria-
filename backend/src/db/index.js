'use strict'

const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Limita conexões abertas simultaneamente
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on('error', (err) => {
  console.error('[DB] Erro inesperado no pool de conexões:', err)
})

/**
 * Executa uma query com parâmetros.
 * Usa parâmetros posicionais ($1, $2...) para prevenir SQL injection.
 *
 * @param {string} text   - Query SQL
 * @param {any[]}  params - Valores dos parâmetros
 */
async function query(text, params) {
  const client = await pool.connect()
  try {
    const resultado = await client.query(text, params)
    return resultado
  } finally {
    client.release()
  }
}



module.exports = { query, pool }

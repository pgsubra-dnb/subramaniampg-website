import { Pool } from 'pg'

let pool: Pool | undefined

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL (or POSTGRES_URL) is not set — the worklife survey Neon database is not configured')
    }
    pool = new Pool({ connectionString })
  }
  return pool
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
) {
  return getPool().query<T>(text, params)
}

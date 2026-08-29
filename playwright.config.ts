import { defineConfig } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Playwright E2E config. Currently exercises the OKR Ally flow (e2e/okr-ally.spec.ts).
 *
 * Two dev servers:
 *   :3200  — full env (ANTHROPIC_API_KEY passed through) → happy path, ownership, rating
 *   :3201  — ANTHROPIC_API_KEY deliberately blanked → forced-failure / refund path
 *
 * Requirements to run:
 *   - ANTHROPIC_API_KEY set in the environment (real key — the happy-path test
 *     makes a live Claude review call, ~60s)
 *   - .env.local present with DATABASE_URL + SANITY_* + BLOB_READ_WRITE_TOKEN
 *     (the helpers read it directly for DB setup/teardown and magic-token minting)
 *
 *   ANTHROPIC_API_KEY=sk-ant-... npx playwright test
 */

// Load .env.local into process.env so the config + helpers can see it.
const envLocal = path.join(__dirname, '.env.local')
if (fs.existsSync(envLocal)) {
  for (const line of fs.readFileSync(envLocal, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!(m[1] in process.env)) process.env[m[1]] = v
  }
}

const HAPPY_PORT = 3200
const FAIL_PORT = 3201

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${HAPPY_PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: `npx next dev -p ${HAPPY_PORT}`,
      port: HAPPY_PORT,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
      env: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '' },
    },
    {
      command: `npx next dev -p ${FAIL_PORT}`,
      port: FAIL_PORT,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
      // deliberately no ANTHROPIC_API_KEY → runReview() fails fast → refund path
      env: { ANTHROPIC_API_KEY: '' },
    },
  ],
})

export const FAIL_BASE_URL = `http://localhost:${FAIL_PORT}`

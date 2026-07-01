import { readFileSync } from 'fs'
try {
  const env = readFileSync('.env.local', 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
} catch {}
import { createClient } from '@sanity/client'
const client = createClient({ projectId: 'vpwi5zan', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_API_TOKEN, useCdn: false })
await client.patch('raci-decoded-course').set({ price: 1999 }).commit()
console.log('Done — RACI Decoded price set to ₹1999')

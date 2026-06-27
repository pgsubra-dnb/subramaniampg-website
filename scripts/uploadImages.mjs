import { readFileSync } from 'fs'
import https from 'https'

const SANITY_TOKEN = 'sk68bwjP7UA0F0smYMrminHLuxx82GlWmNn3sVEJXwk0X3mebvJDAB1W6SzGGBSzHjUlwJnMtBvosoHqhqagzMcnmUBDNymV4p3AnMXeQhWTGVpEmRanbOQ8QaeQ3RTjzueHl4NRosOL9d1EO60vZxXo0l0YbXNDtbSqvS9Y28EMSnkb1wfr'
const PROJECT_ID = 'vpwi5zan'
const DATASET = 'production'

const SESSION_FILE = 'C:\\Users\\subra\\.claude\\projects\\C--PGS-KnowledgeAgent-Scripts-Website-subramaniampg-website\\495a292b-5dab-4eb1-9701-437f353b0bb8.jsonl'

function uploadToSanity(imageBuffer, mediaType, label) {
  return new Promise((resolve, reject) => {
    const ext = mediaType.split('/')[1].replace('jpeg', 'jpg')
    const options = {
      hostname: `${PROJECT_ID}.api.sanity.io`,
      path: `/v2024-01-01/assets/images/${DATASET}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SANITY_TOKEN}`,
        'Content-Type': mediaType,
        'Content-Length': imageBuffer.length,
      },
    }
    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => {
        const result = JSON.parse(body)
        if (result.document?._id) {
          console.log(`${label}: ${result.document._id}`)
          resolve(result.document._id)
        } else {
          console.error(`${label} upload failed:`, body)
          reject(new Error(body))
        }
      })
    })
    req.on('error', reject)
    req.write(imageBuffer)
    req.end()
  })
}

async function main() {
  const lines = readFileSync(SESSION_FILE, 'utf8').split('\n').filter(Boolean)

  const images = []
  for (const line of lines) {
    try {
      const entry = JSON.parse(line)
      // Look for user messages with image content
      const msg = entry.message || entry
      if (msg.role === 'user' && Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block.type === 'image' && block.source?.type === 'base64') {
            images.push({ data: block.source.data, mediaType: block.source.media_type })
          }
        }
      }
    } catch {}
  }

  console.log(`Found ${images.length} image(s) in session`)

  if (images.length < 2) {
    console.error('Expected 2 images, found', images.length)
    process.exit(1)
  }

  // First image = badge (OKR Foundation Graduate circular badge)
  // Second image = cover (course cover banner)
  const badgeBuffer = Buffer.from(images[0].data, 'base64')
  const coverBuffer = Buffer.from(images[1].data, 'base64')

  const badgeId = await uploadToSanity(badgeBuffer, images[0].mediaType, 'BADGE_COURSE_ID')
  const coverId = await uploadToSanity(coverBuffer, images[1].mediaType, 'COVER_IMAGE_ID')

  console.log('\nCopy these into scripts/seedAcademy.mjs:')
  console.log(`const COVER_IMAGE_ID = '${coverId}'`)
  console.log(`const BADGE_COURSE_ID = '${badgeId}'`)
}

main().catch(err => { console.error(err); process.exit(1) })

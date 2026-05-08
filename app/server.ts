import { createApp } from 'honox/server'
import fs from 'fs'
import path from 'path'

const app = createApp()

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

// Lambda上での静的ファイル配信
function serveFile(reqPath: string): Response | null {
  const filePath = path.join(process.cwd(), reqPath)
  try {
    const data = fs.readFileSync(filePath)
    const ext = path.extname(filePath)
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'
    return new Response(data, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000' },
    })
  } catch {
    return null
  }
}

app.use('/app/*', async (c, next) => {
  const res = serveFile(c.req.path)
  if (res) return res
  await next()
})

app.use('/static/*', async (c, next) => {
  const res = serveFile(c.req.path)
  if (res) return res
  await next()
})

export default app

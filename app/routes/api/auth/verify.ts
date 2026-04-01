import { Hono } from 'hono'
import { verifyWoffUser } from '../../../../lib/lineworks/verify-user'

const app = new Hono()

app.post('/', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)
  const user = await verifyWoffUser(token)

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json(user)
})

export default app

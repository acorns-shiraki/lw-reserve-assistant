import { Hono } from 'hono'
import { verifyWoffUser } from '../../../../lib/lineworks/verify-user'
import { getAllMembers } from '../../../../lib/db/members'
import { getEnv } from '../../../../lib/env'

const app = new Hono()

app.get('/', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)
  const user = await verifyWoffUser(token)
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const env = await getEnv()
  try {
    const allMembers = await getAllMembers(
      env.DYNAMO_TABLE_MEMBERS,
      env.DYNAMO_ENDPOINT
    )

    const members = allMembers.map((m) => ({
      userId: m.userId,
      name: m.name,
      email: m.email,
    }))

    return c.json({ members })
  } catch (e) {
    console.error('[members] error:', e)
    return c.json({ members: [], error: String(e) })
  }
})

export default app

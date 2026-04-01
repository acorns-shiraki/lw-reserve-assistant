import { Hono } from 'hono'
import { verifyWoffUser } from '../../../../lib/lineworks/verify-user'
import { getServiceAccountToken } from '../../../../lib/lineworks/auth'
import { fetchDomainUsers } from '../../../../lib/lineworks/users-api'
import { getEnv } from '../../../../lib/env'

const app = new Hono() // v2

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

  const env = getEnv()
  try {
    const saToken = await getServiceAccountToken(env)
    console.log('[members] SA token obtained, domainId:', env.LW_DOMAIN_ID)
    const users = await fetchDomainUsers(saToken, env.LW_DOMAIN_ID)
    console.log('[members] fetched users:', users.length)

    const members = users.map((u) => ({
      userId: u.userId,
      name: [u.userName.lastName, u.userName.firstName].filter(Boolean).join(' '),
    }))

    return c.json({ members })
  } catch (e) {
    console.error('[members] error:', e)
    return c.json({ members: [], error: String(e) })
  }
})

export default app

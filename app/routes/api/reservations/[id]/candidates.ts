import { Hono } from 'hono'
import { verifyWoffUser } from '../../../../../lib/lineworks/verify-user'
import { addCandidates } from '../../../../../lib/db/reservations'
import { getEnv } from '../../../../../lib/env'

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

  const id = c.req.param('id')!
  const body = await c.req.json<{
    slots: { date: string; start: string; end: string }[]
  }>()

  if (!body.slots) {
    return c.json({ error: 'slots is required' }, 400)
  }

  const env = await getEnv()

  try {
    await addCandidates(
      env.DYNAMO_TABLE_RESERVATIONS,
      id,
      {
        userId: user.userId,
        name: [user.userName.lastName, user.userName.firstName].filter(Boolean).join(' '),
        email: user.email,
        slots: body.slots,
      },
      env.DYNAMO_ENDPOINT
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'Reservation not found') {
      return c.json({ error: 'Not found' }, 404)
    }
    if (msg === 'Reservation already confirmed') {
      return c.json({ error: 'Already confirmed' }, 409)
    }
    throw e
  }

  return c.json({ ok: true })
})

export default app

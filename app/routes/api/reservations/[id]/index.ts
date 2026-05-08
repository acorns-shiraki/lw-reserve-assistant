import { Hono } from 'hono'
import { verifyWoffUser } from '../../../../../lib/lineworks/verify-user'
import { getReservation } from '../../../../../lib/db/reservations'
import { getEnv } from '../../../../../lib/env'

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

  const id = c.req.param('id')!
  const env = await getEnv()
  const reservation = await getReservation(
    env.DYNAMO_TABLE_RESERVATIONS,
    id,
    env.DYNAMO_ENDPOINT
  )

  if (!reservation) {
    return c.json({ error: 'Not found' }, 404)
  }

  return c.json({ reservation })
})

export default app

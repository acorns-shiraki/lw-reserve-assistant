import { Hono } from 'hono'
import { v4 as uuidv4 } from 'uuid'
import { verifyWoffUser } from '../../../../lib/lineworks/verify-user'
import { getServiceAccountToken } from '../../../../lib/lineworks/auth'
import { fetchMultipleUsersEvents } from '../../../../lib/lineworks/calendar-api'
import { computeFreeSlots } from '../../../../lib/calendar/free-slots'
import { createReservation, type Reservation } from '../../../../lib/db/reservations'
import { getEnv } from '../../../../lib/env'

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

  const body = await c.req.json<{
    title: string
    duration: number
    attendees: { userId: string; name: string; email: string }[]
    weekStart: string
  }>()

  if (!body.title || !body.attendees?.length || !body.weekStart) {
    return c.json({ error: 'title, attendees, weekStart are required' }, 400)
  }

  const duration = [30, 60, 90, 120].includes(body.duration) ? body.duration : 60

  const env = getEnv()
  const saToken = await getServiceAccountToken(env)

  // 出席メンバーの予定を取得して空き時間を算出
  const userIds = body.attendees.map((a) => a.userId)
  const startDate = new Date(body.weekStart + 'T00:00:00+09:00')
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 6)
  const weekEnd = endDate.toISOString().slice(0, 10)

  const allEvents = await fetchMultipleUsersEvents(saToken, userIds, body.weekStart, weekEnd)
  const freeSlots = computeFreeSlots(allEvents, body.weekStart)

  const reservation: Reservation = {
    id: uuidv4(),
    title: body.title,
    duration,
    creatorUserId: user.userId,
    attendees: body.attendees,
    weekStart: body.weekStart,
    freeSlots,
    candidates: [],
    status: 'open',
    createdAt: new Date().toISOString(),
  }

  await createReservation(env.DYNAMO_TABLE_RESERVATIONS, reservation, env.DYNAMO_ENDPOINT)

  return c.json({ id: reservation.id }, 201)
})

export default app

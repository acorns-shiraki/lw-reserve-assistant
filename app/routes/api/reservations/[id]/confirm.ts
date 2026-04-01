import { Hono } from 'hono'
import { verifyWoffUser } from '../../../../../lib/lineworks/verify-user'
import { getReservation, confirmReservation } from '../../../../../lib/db/reservations'
import { getServiceAccountToken } from '../../../../../lib/lineworks/auth'
import { createCalendarEvent } from '../../../../../lib/lineworks/calendar-create'
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
  const env = getEnv()

  const reservation = await getReservation(
    env.DYNAMO_TABLE_RESERVATIONS,
    id,
    env.DYNAMO_ENDPOINT
  )

  if (!reservation) {
    return c.json({ error: 'Not found' }, 404)
  }

  if (reservation.status === 'confirmed') {
    return c.json({ error: 'Already confirmed' }, 409)
  }

  if (reservation.candidates.length === 0) {
    return c.json({ error: 'No candidates yet' }, 400)
  }

  // 全候補の中から最も早い slot を選択
  const allSlots = reservation.candidates.flatMap((c) => c.slots)
  allSlots.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return a.start.localeCompare(b.start)
  })
  const earliestSlot = allSlots[0]

  // attendees = Page1メンバー + Page2候補入力者（重複排除）
  const attendeeEmails = new Set<string>()
  const attendees: { email: string; displayName: string }[] = []

  for (const a of reservation.attendees) {
    if (a.email && !attendeeEmails.has(a.email)) {
      attendeeEmails.add(a.email)
      attendees.push({ email: a.email, displayName: a.name })
    }
  }
  for (const c of reservation.candidates) {
    if (c.email && !attendeeEmails.has(c.email)) {
      attendeeEmails.add(c.email)
      attendees.push({ email: c.email, displayName: c.name })
    }
  }

  const saToken = await getServiceAccountToken(env)

  // 最初の出席メンバーのカレンダーに予定作成
  const calendarUserId = reservation.attendees[0].userId
  const eventId = await createCalendarEvent({
    accessToken: saToken,
    userId: calendarUserId,
    summary: reservation.title,
    start: { dateTime: `${earliestSlot.date}T${earliestSlot.start}:00`, timeZone: 'Asia/Tokyo' },
    end: { dateTime: `${earliestSlot.date}T${earliestSlot.end}:00`, timeZone: 'Asia/Tokyo' },
    attendees: attendees.map((a) => ({
      email: a.email,
      displayName: a.displayName,
      partstat: 'NEEDS-ACTION' as const,
    })),
  })

  await confirmReservation(
    env.DYNAMO_TABLE_RESERVATIONS,
    id,
    earliestSlot,
    eventId,
    env.DYNAMO_ENDPOINT
  )

  return c.json({ eventId, confirmedSlot: earliestSlot })
})

export default app

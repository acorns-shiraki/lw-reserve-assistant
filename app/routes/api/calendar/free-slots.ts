import { Hono } from 'hono'
import { verifyWoffUser } from '../../../../lib/lineworks/verify-user'
import { getServiceAccountToken } from '../../../../lib/lineworks/auth'
import { fetchMultipleUsersEvents } from '../../../../lib/lineworks/calendar-api'
import { computeFreeSlots } from '../../../../lib/calendar/free-slots'
import { getEnv } from '../../../../lib/env'

const app = new Hono()

app.get('/', async (c) => {
  // 認証チェック
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)
  const user = await verifyWoffUser(token)
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // パラメータバリデーション
  const userIdsParam = c.req.query('userIds')
  const weekStart = c.req.query('weekStart')

  if (!userIdsParam) {
    return c.json({ error: 'userIds is required' }, 400)
  }
  if (!weekStart) {
    return c.json({ error: 'weekStart is required' }, 400)
  }

  const userIds = userIdsParam.split(',').filter(Boolean)

  // Service Account トークンでカレンダーAPI呼び出し
  const env = await getEnv()
  const saToken = await getServiceAccountToken(env)

  // weekEnd = weekStart + 6日 (日〜土の7日間)
  const startDate = new Date(weekStart + 'T00:00:00+09:00')
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 6)
  const y = endDate.toLocaleString('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric' })
  const m = endDate.toLocaleString('en-CA', { timeZone: 'Asia/Tokyo', month: '2-digit' })
  const d = endDate.toLocaleString('en-CA', { timeZone: 'Asia/Tokyo', day: '2-digit' })
  const weekEnd = `${y}-${m}-${d}`

  const allEvents = await fetchMultipleUsersEvents(saToken, userIds, weekStart, weekEnd)
  const freeSlots = computeFreeSlots(allEvents, weekStart)

  return c.json({ freeSlots })
})

export default app

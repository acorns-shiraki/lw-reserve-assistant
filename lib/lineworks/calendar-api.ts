import type { CalendarEvent, CalendarEventsResponse } from './types'
import { expandRecurringEvents } from './expand-recurring'

const API_BASE = 'https://www.worksapis.com/v1.0'

export async function fetchUserEvents(
  accessToken: string,
  userId: string,
  fromDate: string,
  untilDate: string
): Promise<CalendarEvent[]> {
  try {
    const from = `${fromDate}T00:00:00+09:00`
    const until = `${untilDate}T23:59:59+09:00`
    const params = new URLSearchParams({
      fromDateTime: from,
      untilDateTime: until,
    })

    const url = `${API_BASE}/users/${encodeURIComponent(userId)}/calendar/events?${params}`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) return []

    const data = (await res.json()) as CalendarEventsResponse

    // 繰り返しイベントを展開して期間内のオカレンスに変換
    return expandRecurringEvents(data.events, fromDate, untilDate)
  } catch {
    return []
  }
}

export async function fetchMultipleUsersEvents(
  accessToken: string,
  userIds: string[],
  fromDate: string,
  untilDate: string
): Promise<Map<string, CalendarEvent[]>> {
  const result = new Map<string, CalendarEvent[]>()

  if (userIds.length === 0) return result

  const promises = userIds.map(async (userId) => {
    const events = await fetchUserEvents(accessToken, userId, fromDate, untilDate)
    return { userId, events }
  })

  const settled = await Promise.allSettled(promises)

  for (const entry of settled) {
    if (entry.status === 'fulfilled') {
      result.set(entry.value.userId, entry.value.events)
    }
  }

  return result
}

import type { Attendee } from './types'

const API_BASE = 'https://www.worksapis.com/v1.0'

interface CreateEventParams {
  accessToken: string
  userId: string
  summary: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  attendees: Attendee[]
}

interface CreateEventResponse {
  eventComponents: Array<{
    eventId: string
    summary: string
  }>
}

export async function createCalendarEvent(
  params: CreateEventParams
): Promise<string> {
  const url = `${API_BASE}/users/${encodeURIComponent(params.userId)}/calendar/events`

  const body = {
    eventComponents: [
      {
        summary: params.summary,
        start: params.start,
        end: params.end,
        attendees: params.attendees,
      },
    ],
    sendNotification: true,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Calendar event creation failed (${res.status}): ${errorText}`)
  }

  const data = (await res.json()) as CreateEventResponse
  return data.eventComponents[0].eventId
}

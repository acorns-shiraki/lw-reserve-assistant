import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCalendarEvent } from '../calendar-create'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
})

const baseParams = {
  accessToken: 'test-token',
  userId: 'user-1',
  summary: 'テスト会議',
  start: { dateTime: '2026-03-30T10:00:00', timeZone: 'Asia/Tokyo' },
  end: { dateTime: '2026-03-30T11:00:00', timeZone: 'Asia/Tokyo' },
  attendees: [
    { email: 'tanaka@example.com', displayName: '田中太郎', partstat: 'NEEDS-ACTION' as const },
    { email: 'suzuki@example.com', displayName: '鈴木花子', partstat: 'NEEDS-ACTION' as const },
  ],
}

describe('createCalendarEvent', () => {
  it('正しいURLとボディでPOSTする', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        eventComponents: [{ eventId: 'event-123', summary: 'テスト会議' }],
      }),
    })

    const eventId = await createCalendarEvent(baseParams)

    expect(eventId).toBe('event-123')
    expect(mockFetch).toHaveBeenCalledOnce()

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://www.worksapis.com/v1.0/users/user-1/calendar/events')
    expect(options.method).toBe('POST')
    expect(options.headers.Authorization).toBe('Bearer test-token')
    expect(options.headers['Content-Type']).toBe('application/json')

    const body = JSON.parse(options.body)
    expect(body.eventComponents[0].summary).toBe('テスト会議')
    expect(body.eventComponents[0].attendees).toHaveLength(2)
    expect(body.sendNotification).toBe(true)
  })

  it('userIdをURLエンコードする', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        eventComponents: [{ eventId: 'event-456' }],
      }),
    })

    await createCalendarEvent({ ...baseParams, userId: 'user@example.com' })

    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('user%40example.com')
  })

  it('APIエラー時に例外をスローする', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    })

    await expect(createCalendarEvent(baseParams)).rejects.toThrow(
      'Calendar event creation failed (403): Forbidden'
    )
  })
})

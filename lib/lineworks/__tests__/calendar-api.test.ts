import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchUserEvents, fetchMultipleUsersEvents } from '../calendar-api'
import type { CalendarEvent } from '../types'

describe('fetchUserEvents', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('正常レスポンスからイベント配列をフラット化して返す', async () => {
    const mockEvents: CalendarEvent[] = [
      {
        eventId: 'event-1',
        summary: 'Meeting A',
        start: { dateTime: '2025-04-07T10:00:00', timeZone: 'Asia/Tokyo' },
        end: { dateTime: '2025-04-07T11:00:00', timeZone: 'Asia/Tokyo' },
        transparency: 'OPAQUE',
      },
      {
        eventId: 'event-2',
        summary: 'Meeting B',
        start: { dateTime: '2025-04-07T14:00:00', timeZone: 'Asia/Tokyo' },
        end: { dateTime: '2025-04-07T15:00:00', timeZone: 'Asia/Tokyo' },
        transparency: 'OPAQUE',
      },
    ]

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        events: [
          {
            eventComponents: [mockEvents[0]],
            organizerCalendarId: 'cal-1',
          },
          {
            eventComponents: [mockEvents[1]],
            organizerCalendarId: 'cal-2',
          },
        ],
      }),
    }))

    const result = await fetchUserEvents('sa-token-123', 'user-abc', '2025-04-07', '2025-04-11')

    expect(result).toHaveLength(2)
    expect(result[0].eventId).toBe('event-1')
    expect(result[1].eventId).toBe('event-2')

    // fetchのURL検証
    expect(fetch).toHaveBeenCalledTimes(1)
    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(callUrl).toContain('/users/user-abc/calendar/events')
    expect(callUrl).toContain('fromDateTime=')
    expect(callUrl).toContain('untilDateTime=')

    // Authorization ヘッダー検証
    const callOpts = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]
    expect(callOpts.headers.Authorization).toBe('Bearer sa-token-123')
  })

  it('空のレスポンス (events=[]) → 空配列を返す', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ events: [] }),
    }))

    const result = await fetchUserEvents('sa-token', 'user-xyz', '2025-04-07', '2025-04-11')
    expect(result).toEqual([])
  })

  it('APIエラー (403) → 空配列を返す', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    }))

    const result = await fetchUserEvents('sa-token', 'user-forbidden', '2025-04-07', '2025-04-11')
    expect(result).toEqual([])
  })

  it('ネットワークエラー → 空配列を返す', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const result = await fetchUserEvents('sa-token', 'user-xyz', '2025-04-07', '2025-04-11')
    expect(result).toEqual([])
  })
})

describe('fetchMultipleUsersEvents', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('複数ユーザーの予定をMap形式で返す', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: [{
            eventComponents: [{
              eventId: 'ev-a1',
              summary: 'User A meeting',
              start: { dateTime: '2025-04-07T10:00:00', timeZone: 'Asia/Tokyo' },
              end: { dateTime: '2025-04-07T11:00:00', timeZone: 'Asia/Tokyo' },
            }],
            organizerCalendarId: 'cal-a',
          }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: [{
            eventComponents: [{
              eventId: 'ev-b1',
              summary: 'User B meeting',
              start: { dateTime: '2025-04-07T13:00:00', timeZone: 'Asia/Tokyo' },
              end: { dateTime: '2025-04-07T14:00:00', timeZone: 'Asia/Tokyo' },
            }],
            organizerCalendarId: 'cal-b',
          }],
        }),
      })

    vi.stubGlobal('fetch', mockFetch)

    const result = await fetchMultipleUsersEvents(
      'sa-token',
      ['user-a', 'user-b'],
      '2025-04-07',
      '2025-04-11'
    )

    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(2)
    expect(result.get('user-a')).toHaveLength(1)
    expect(result.get('user-a')![0].eventId).toBe('ev-a1')
    expect(result.get('user-b')).toHaveLength(1)
    expect(result.get('user-b')![0].eventId).toBe('ev-b1')
  })

  it('1ユーザー失敗しても他のユーザーのデータは返す (Promise.allSettled)', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: [{
            eventComponents: [{
              eventId: 'ev-ok',
              summary: 'OK meeting',
              start: { dateTime: '2025-04-07T10:00:00', timeZone: 'Asia/Tokyo' },
              end: { dateTime: '2025-04-07T11:00:00', timeZone: 'Asia/Tokyo' },
            }],
            organizerCalendarId: 'cal-ok',
          }],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
      })

    vi.stubGlobal('fetch', mockFetch)

    const result = await fetchMultipleUsersEvents(
      'sa-token',
      ['user-ok', 'user-fail'],
      '2025-04-07',
      '2025-04-11'
    )

    expect(result.size).toBe(2)
    expect(result.get('user-ok')).toHaveLength(1)
    expect(result.get('user-fail')).toEqual([]) // 失敗ユーザーは空配列
  })

  it('空のユーザーリスト → 空のMapを返す', async () => {
    const result = await fetchMultipleUsersEvents('sa-token', [], '2025-04-07', '2025-04-11')
    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(0)
  })
})

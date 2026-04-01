import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

const mockUser = {
  domainId: 10000001,
  userId: 'user-abc',
  email: 'taro@example.com',
  userName: { lastName: 'ワークス', firstName: '太郎' },
}

const mockEnv = {
  WOFF_ID: 'test-woff-id',
  LW_CLIENT_ID: 'test-client-id',
  LW_CLIENT_SECRET: 'test-secret',
  LW_SERVICE_ACCOUNT_ID: 'test-sa',
  LW_PRIVATE_KEY: 'test-key',
  LW_DOMAIN_ID: '10000001',
  DYNAMO_TABLE_MEMBERS: 'test-members',
  DYNAMO_TABLE_RESERVATIONS: 'test-reservations',
}

describe('POST /api/reservations', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  async function createApp() {
    const verifyMock = vi.fn()
    const getTokenMock = vi.fn()
    const fetchEventsMock = vi.fn()
    const createReservationMock = vi.fn()

    vi.doMock('../../../../lib/lineworks/verify-user', () => ({
      verifyWoffUser: verifyMock,
    }))
    vi.doMock('../../../../lib/lineworks/auth', () => ({
      getServiceAccountToken: getTokenMock,
    }))
    vi.doMock('../../../../lib/lineworks/calendar-api', () => ({
      fetchMultipleUsersEvents: fetchEventsMock,
    }))
    vi.doMock('../../../../lib/calendar/free-slots', () => ({
      computeFreeSlots: () => [{ date: '2026-03-30', start: '10:00', end: '19:00' }],
    }))
    vi.doMock('../../../../lib/db/reservations', () => ({
      createReservation: createReservationMock,
    }))
    vi.doMock('../../../../lib/env', () => ({ getEnv: () => mockEnv }))
    vi.doMock('uuid', () => ({ v4: () => 'test-uuid-1234' }))

    const mod = await import('../reservations/index')
    const app = new Hono()
    app.route('/api/reservations', mod.default)
    return { app, verifyMock, getTokenMock, fetchEventsMock, createReservationMock }
  }

  it('正常リクエスト → 201 + id', async () => {
    const { app, verifyMock, getTokenMock, fetchEventsMock, createReservationMock } =
      await createApp()

    verifyMock.mockResolvedValue(mockUser)
    getTokenMock.mockResolvedValue('sa-token')
    fetchEventsMock.mockResolvedValue(new Map())
    createReservationMock.mockResolvedValue(undefined)

    const res = await app.request('/api/reservations', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'テスト会議',
        duration: 90,
        attendees: [{ userId: 'user-1', name: '田中', email: 'tanaka@example.com' }],
        weekStart: '2026-03-30',
      }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('test-uuid-1234')
    expect(createReservationMock).toHaveBeenCalledOnce()
    const savedReservation = createReservationMock.mock.calls[0][1]
    expect(savedReservation.duration).toBe(90)
  })

  it('認証なし → 401', async () => {
    const { app } = await createApp()
    const res = await app.request('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'test', attendees: [], weekStart: '2026-03-30' }),
    })
    expect(res.status).toBe(401)
  })

  it('title未指定 → 400', async () => {
    const { app, verifyMock } = await createApp()
    verifyMock.mockResolvedValue(mockUser)

    const res = await app.request('/api/reservations', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ attendees: [{ userId: 'u1', name: 'a', email: 'a@b.com' }], weekStart: '2026-03-30' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/reservations/:id', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  async function createApp() {
    const verifyMock = vi.fn()
    const getReservationMock = vi.fn()

    vi.doMock('../../../../lib/lineworks/verify-user', () => ({
      verifyWoffUser: verifyMock,
    }))
    vi.doMock('../../../../lib/db/reservations', () => ({
      getReservation: getReservationMock,
    }))
    vi.doMock('../../../../lib/env', () => ({ getEnv: () => mockEnv }))

    const mod = await import('../reservations/[id]/index')
    const app = new Hono()
    app.route('/api/reservations/:id', mod.default)
    return { app, verifyMock, getReservationMock }
  }

  it('存在する予約を返す', async () => {
    const { app, verifyMock, getReservationMock } = await createApp()
    verifyMock.mockResolvedValue(mockUser)
    getReservationMock.mockResolvedValue({ id: 'abc', title: 'テスト', status: 'open' })

    const res = await app.request('/api/reservations/abc', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.reservation.id).toBe('abc')
  })

  it('存在しない予約 → 404', async () => {
    const { app, verifyMock, getReservationMock } = await createApp()
    verifyMock.mockResolvedValue(mockUser)
    getReservationMock.mockResolvedValue(null)

    const res = await app.request('/api/reservations/nonexistent', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(404)
  })
})

describe('POST /api/reservations/:id/candidates', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  async function createApp() {
    const verifyMock = vi.fn()
    const addCandidatesMock = vi.fn()

    vi.doMock('../../../../lib/lineworks/verify-user', () => ({
      verifyWoffUser: verifyMock,
    }))
    vi.doMock('../../../../lib/db/reservations', () => ({
      addCandidates: addCandidatesMock,
    }))
    vi.doMock('../../../../lib/env', () => ({ getEnv: () => mockEnv }))

    const mod = await import('../reservations/[id]/candidates')
    const app = new Hono()
    app.route('/api/reservations/:id/candidates', mod.default)
    return { app, verifyMock, addCandidatesMock }
  }

  it('候補を保存 → 200', async () => {
    const { app, verifyMock, addCandidatesMock } = await createApp()
    verifyMock.mockResolvedValue(mockUser)
    addCandidatesMock.mockResolvedValue(undefined)

    const res = await app.request('/api/reservations/abc/candidates', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slots: [{ date: '2026-03-30', start: '10:00', end: '11:00' }],
      }),
    })

    expect(res.status).toBe(200)
    expect(addCandidatesMock).toHaveBeenCalledOnce()
    const candidate = addCandidatesMock.mock.calls[0][2]
    expect(candidate.userId).toBe('user-abc')
    expect(candidate.email).toBe('taro@example.com')
  })

  it('存在しない予約 → 404', async () => {
    const { app, verifyMock, addCandidatesMock } = await createApp()
    verifyMock.mockResolvedValue(mockUser)
    addCandidatesMock.mockRejectedValue(new Error('Reservation not found'))

    const res = await app.request('/api/reservations/none/candidates', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slots: [] }),
    })

    expect(res.status).toBe(404)
  })

  it('確定済み予約 → 409', async () => {
    const { app, verifyMock, addCandidatesMock } = await createApp()
    verifyMock.mockResolvedValue(mockUser)
    addCandidatesMock.mockRejectedValue(new Error('Reservation already confirmed'))

    const res = await app.request('/api/reservations/done/candidates', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slots: [] }),
    })

    expect(res.status).toBe(409)
  })
})

describe('POST /api/reservations/:id/confirm', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  async function createApp() {
    const verifyMock = vi.fn()
    const getReservationMock = vi.fn()
    const confirmReservationMock = vi.fn()
    const getTokenMock = vi.fn()
    const createEventMock = vi.fn()

    vi.doMock('../../../../lib/lineworks/verify-user', () => ({
      verifyWoffUser: verifyMock,
    }))
    vi.doMock('../../../../lib/db/reservations', () => ({
      getReservation: getReservationMock,
      confirmReservation: confirmReservationMock,
    }))
    vi.doMock('../../../../lib/lineworks/auth', () => ({
      getServiceAccountToken: getTokenMock,
    }))
    vi.doMock('../../../../lib/lineworks/calendar-create', () => ({
      createCalendarEvent: createEventMock,
    }))
    vi.doMock('../../../../lib/env', () => ({ getEnv: () => mockEnv }))

    const mod = await import('../reservations/[id]/confirm')
    const app = new Hono()
    app.route('/api/reservations/:id/confirm', mod.default)
    return { app, verifyMock, getReservationMock, confirmReservationMock, getTokenMock, createEventMock }
  }

  it('最も早い候補で予約確定 → eventId を返す', async () => {
    const { app, verifyMock, getReservationMock, confirmReservationMock, getTokenMock, createEventMock } =
      await createApp()

    verifyMock.mockResolvedValue(mockUser)
    getReservationMock.mockResolvedValue({
      id: 'abc',
      title: 'テスト会議',
      status: 'open',
      attendees: [
        { userId: 'user-1', name: '田中', email: 'tanaka@example.com' },
      ],
      candidates: [
        {
          userId: 'user-2',
          name: '鈴木',
          email: 'suzuki@example.com',
          slots: [
            { date: '2026-03-31', start: '14:00', end: '15:00' },
            { date: '2026-03-30', start: '10:00', end: '11:00' },
          ],
        },
      ],
    })
    getTokenMock.mockResolvedValue('sa-token')
    createEventMock.mockResolvedValue('event-xyz')
    confirmReservationMock.mockResolvedValue(undefined)

    const res = await app.request('/api/reservations/abc/confirm', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.eventId).toBe('event-xyz')
    expect(body.confirmedSlot).toEqual({ date: '2026-03-30', start: '10:00', end: '11:00' })

    // カレンダーイベントに両方の参加者が含まれる
    const eventParams = createEventMock.mock.calls[0][0]
    const emails = eventParams.attendees.map((a: { email: string }) => a.email)
    expect(emails).toContain('tanaka@example.com')
    expect(emails).toContain('suzuki@example.com')
  })

  it('候補なし → 400', async () => {
    const { app, verifyMock, getReservationMock } = await createApp()
    verifyMock.mockResolvedValue(mockUser)
    getReservationMock.mockResolvedValue({
      id: 'abc',
      status: 'open',
      candidates: [],
      attendees: [],
    })

    const res = await app.request('/api/reservations/abc/confirm', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(400)
  })

  it('確定済み → 409', async () => {
    const { app, verifyMock, getReservationMock } = await createApp()
    verifyMock.mockResolvedValue(mockUser)
    getReservationMock.mockResolvedValue({ id: 'abc', status: 'confirmed' })

    const res = await app.request('/api/reservations/abc/confirm', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(409)
  })

  it('存在しない予約 → 404', async () => {
    const { app, verifyMock, getReservationMock } = await createApp()
    verifyMock.mockResolvedValue(mockUser)
    getReservationMock.mockResolvedValue(null)

    const res = await app.request('/api/reservations/none/confirm', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(404)
  })
})

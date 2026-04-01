import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

describe('GET /api/calendar/free-slots', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  async function createApp() {
    const verifyMock = vi.fn()
    const getTokenMock = vi.fn()
    const fetchEventsMock = vi.fn()

    vi.doMock('../../../../lib/lineworks/verify-user', () => ({
      verifyWoffUser: verifyMock,
    }))
    vi.doMock('../../../../lib/lineworks/auth', () => ({
      getServiceAccountToken: getTokenMock,
    }))
    vi.doMock('../../../../lib/lineworks/calendar-api', () => ({
      fetchMultipleUsersEvents: fetchEventsMock,
    }))
    vi.doMock('../../../../lib/env', () => ({
      getEnv: () => ({
        WOFF_ID: 'test-woff-id',
        LW_CLIENT_ID: 'test-client-id',
        LW_CLIENT_SECRET: 'test-secret',
        LW_SERVICE_ACCOUNT_ID: 'test-sa',
        LW_PRIVATE_KEY: 'test-key',
        LW_DOMAIN_ID: '10000001',
        DYNAMO_TABLE_MEMBERS: 'test-table',
      }),
    }))

    const mod = await import('../calendar/free-slots')
    const app = new Hono()
    app.route('/api/calendar/free-slots', mod.default)
    return { app, verifyMock, getTokenMock, fetchEventsMock }
  }

  it('正常リクエスト → 200 + freeSlots', async () => {
    const { app, verifyMock, getTokenMock, fetchEventsMock } = await createApp()

    verifyMock.mockResolvedValue({
      domainId: 10000001,
      userId: 'user-abc',
      email: 'taro@example.com',
      userName: { lastName: 'ワークス', firstName: '太郎' },
    })
    getTokenMock.mockResolvedValue('sa-access-token')
    fetchEventsMock.mockResolvedValue(new Map())

    const url = '/api/calendar/free-slots?userIds=user-a,user-b&weekStart=2025-04-07'
    const res = await app.request(url, {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.freeSlots).toBeDefined()
    expect(Array.isArray(body.freeSlots)).toBe(true)
    // 予定なし → 月〜日の営業時間すべてが空き（7日分）
    expect(body.freeSlots.length).toBe(7)
  })

  it('認証なし → 401', async () => {
    const { app } = await createApp()

    const res = await app.request('/api/calendar/free-slots?userIds=user-a&weekStart=2025-04-07')
    expect(res.status).toBe(401)
  })

  it('userIds未指定 → 400', async () => {
    const { app, verifyMock } = await createApp()
    verifyMock.mockResolvedValue({
      domainId: 10000001,
      userId: 'user-abc',
      email: 'taro@example.com',
      userName: { lastName: 'ワークス', firstName: '太郎' },
    })

    const res = await app.request('/api/calendar/free-slots?weekStart=2025-04-07', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(400)
  })

  it('weekStart未指定 → 400', async () => {
    const { app, verifyMock } = await createApp()
    verifyMock.mockResolvedValue({
      domainId: 10000001,
      userId: 'user-abc',
      email: 'taro@example.com',
      userName: { lastName: 'ワークス', firstName: '太郎' },
    })

    const res = await app.request('/api/calendar/free-slots?userIds=user-a', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(400)
  })
})

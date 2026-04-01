import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

describe('POST /api/auth/verify', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  async function createApp() {
    // verifyWoffUser をモック
    const verifyMock = vi.fn()
    vi.doMock('../../../../lib/lineworks/verify-user', () => ({
      verifyWoffUser: verifyMock,
    }))
    const mod = await import('../auth/verify')
    const app = new Hono()
    app.route('/api/auth/verify', mod.default)
    return { app, verifyMock }
  }

  it('有効なトークンで認証成功 → 200 + ユーザー情報', async () => {
    const { app, verifyMock } = await createApp()
    verifyMock.mockResolvedValue({
      domainId: 10000001,
      userId: 'user-abc',
      email: 'taro@example.com',
      userName: { lastName: 'ワークス', firstName: '太郎' },
    })

    const res = await app.request('/api/auth/verify', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token-123',
        'Content-Type': 'application/json',
      },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.userId).toBe('user-abc')
    expect(body.userName.lastName).toBe('ワークス')
    expect(verifyMock).toHaveBeenCalledWith('valid-token-123')
  })

  it('トークンなし → 401', async () => {
    const { app } = await createApp()

    const res = await app.request('/api/auth/verify', {
      method: 'POST',
    })

    expect(res.status).toBe(401)
  })

  it('無効なトークン (verifyWoffUser が null) → 401', async () => {
    const { app, verifyMock } = await createApp()
    verifyMock.mockResolvedValue(null)

    const res = await app.request('/api/auth/verify', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    })

    expect(res.status).toBe(401)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { verifyWoffUser } from '../verify-user'

describe('verifyWoffUser', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('有効なトークンでユーザー情報を返す', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        domainId: 10000001,
        userId: 'user-abc-123',
        email: 'taro@example.com',
        userName: {
          lastName: 'ワークス',
          firstName: '太郎',
        },
      }),
    }))

    const result = await verifyWoffUser('valid-token-123')

    expect(result).not.toBeNull()
    expect(result!.userId).toBe('user-abc-123')
    expect(result!.userName.lastName).toBe('ワークス')
    expect(result!.userName.firstName).toBe('太郎')
    expect(result!.domainId).toBe(10000001)

    expect(fetch).toHaveBeenCalledWith(
      'https://www.worksapis.com/v1.0/users/me',
      expect.objectContaining({
        headers: { Authorization: 'Bearer valid-token-123' },
      })
    )
  })

  it('無効なトークン (401) の場合 null を返す', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    }))

    const result = await verifyWoffUser('invalid-token')
    expect(result).toBeNull()
  })

  it('API障害 (500) の場合 null を返す', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }))

    const result = await verifyWoffUser('some-token')
    expect(result).toBeNull()
  })

  it('ネットワークエラーの場合 null を返す', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const result = await verifyWoffUser('some-token')
    expect(result).toBeNull()
  })
})

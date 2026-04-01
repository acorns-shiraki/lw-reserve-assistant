import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as jose from 'jose'

// auth モジュールは各テスト内で動的にインポート（キャッシュリセットのため）
const ENV = {
  LW_CLIENT_ID: 'test-client-id',
  LW_CLIENT_SECRET: 'test-client-secret',
  LW_SERVICE_ACCOUNT_ID: 'test-sa@example.com',
  LW_PRIVATE_KEY: '', // beforeAll で生成
}

let privateKeyPem: string

beforeEach(async () => {
  vi.restoreAllMocks()
  vi.resetModules()
  // テスト用のRSA鍵ペアを生成
  if (!privateKeyPem) {
    const { privateKey } = await jose.generateKeyPair('RS256', { extractable: true })
    privateKeyPem = await jose.exportPKCS8(privateKey)
  }
  ENV.LW_PRIVATE_KEY = privateKeyPem
})

describe('getServiceAccountToken', () => {
  it('正しいクレームでJWTを生成しトークンを取得する', async () => {
    const mockToken = 'sa-access-token-xyz'

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: mockToken,
          token_type: 'Bearer',
          expires_in: 86400,
        }),
      })
    )

    const { getServiceAccountToken } = await import('../auth')
    const token = await getServiceAccountToken(ENV)

    expect(token).toBe(mockToken)

    // fetch が正しいエンドポイントに呼ばれたか
    expect(fetch).toHaveBeenCalledWith(
      'https://auth.worksmobile.com/oauth2/v2.0/token',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      })
    )

    // リクエストボディを検証
    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = callArgs[1].body as string
    const params = new URLSearchParams(body)

    expect(params.get('grant_type')).toBe(
      'urn:ietf:params:oauth:grant-type:jwt-bearer'
    )
    expect(params.get('client_id')).toBe('test-client-id')
    expect(params.get('client_secret')).toBe('test-client-secret')
    expect(params.has('assertion')).toBe(true)

    // JWTの中身を検証（デコードのみ、署名検証はスキップ）
    const assertion = params.get('assertion')!
    const decoded = jose.decodeJwt(assertion)
    expect(decoded.iss).toBe('test-client-id')
    expect(decoded.sub).toBe('test-sa@example.com')
    expect(decoded.iat).toBeDefined()
    expect(decoded.exp).toBeDefined()
    // exp は iat + 3600 以内
    expect((decoded.exp as number) - (decoded.iat as number)).toBeLessThanOrEqual(3600)
  })

  it('トークン交換失敗時にエラーをスローする', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      })
    )

    const { getServiceAccountToken } = await import('../auth')
    await expect(getServiceAccountToken(ENV)).rejects.toThrow()
  })

  it('キャッシュされたトークンが有効なら再取得しない', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'cached-token',
        token_type: 'Bearer',
        expires_in: 86400,
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    // 新しいモジュールインスタンスを取得（キャッシュをリセット）
    vi.resetModules()
    const { getServiceAccountToken } = await import('../auth')

    // 1回目の呼び出し
    const token1 = await getServiceAccountToken(ENV)
    expect(token1).toBe('cached-token')
    expect(mockFetch).toHaveBeenCalledTimes(1)

    // 2回目の呼び出し — キャッシュから返されるべき
    const token2 = await getServiceAccountToken(ENV)
    expect(token2).toBe('cached-token')
    expect(mockFetch).toHaveBeenCalledTimes(1) // fetch は追加で呼ばれない
  })

  it('キャッシュ期限切れなら再取得する', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'first-token',
          token_type: 'Bearer',
          expires_in: 1, // 1秒で期限切れ
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'second-token',
          token_type: 'Bearer',
          expires_in: 86400,
        }),
      })
    vi.stubGlobal('fetch', mockFetch)

    vi.resetModules()
    const { getServiceAccountToken } = await import('../auth')

    const token1 = await getServiceAccountToken(ENV)
    expect(token1).toBe('first-token')

    // 時間を進める（キャッシュ期限切れをシミュレート）
    vi.useFakeTimers()
    vi.advanceTimersByTime(2000)
    vi.useRealTimers()

    const token2 = await getServiceAccountToken(ENV)
    expect(token2).toBe('second-token')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})

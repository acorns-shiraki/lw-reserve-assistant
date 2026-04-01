import { importPKCS8, SignJWT } from 'jose'

interface AuthEnv {
  LW_CLIENT_ID: string
  LW_CLIENT_SECRET: string
  LW_SERVICE_ACCOUNT_ID: string
  LW_PRIVATE_KEY: string
}

interface TokenCache {
  accessToken: string
  expiresAt: number
}

let cache: TokenCache | null = null

export async function getServiceAccountToken(env: AuthEnv): Promise<string> {
  // キャッシュが有効ならそのまま返す（60秒のマージンを持たせる）
  if (cache && Date.now() < cache.expiresAt) {
    return cache.accessToken
  }

  const privateKey = await importPKCS8(env.LW_PRIVATE_KEY, 'RS256')

  const now = Math.floor(Date.now() / 1000)
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(env.LW_CLIENT_ID)
    .setSubject(env.LW_SERVICE_ACCOUNT_ID)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey)

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    client_id: env.LW_CLIENT_ID,
    client_secret: env.LW_CLIENT_SECRET,
    assertion: jwt,
    scope: 'calendar user.read',
  })

  const res = await fetch('https://auth.worksmobile.com/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Token exchange failed (${res.status}): ${errorText}`)
  }

  const data = await res.json()
  const accessToken = data.access_token as string
  const expiresIn = (data.expires_in as number) ?? 86400

  cache = {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000 - 60_000,
  }

  return accessToken
}

export interface AppEnv {
  WOFF_ID: string
  LW_CLIENT_ID: string
  LW_CLIENT_SECRET: string
  LW_SERVICE_ACCOUNT_ID: string
  LW_PRIVATE_KEY: string
  LW_DOMAIN_ID: string
  DYNAMO_ENDPOINT?: string
  DYNAMO_TABLE_MEMBERS: string
  DYNAMO_TABLE_RESERVATIONS: string
}

export function getEnv(): AppEnv {
  const required = [
    'WOFF_ID',
    'LW_CLIENT_ID',
    'LW_CLIENT_SECRET',
    'LW_SERVICE_ACCOUNT_ID',
    'LW_PRIVATE_KEY_BASE64',
    'LW_DOMAIN_ID',
    'DYNAMO_TABLE_MEMBERS',
    'DYNAMO_TABLE_RESERVATIONS',
  ] as const

  const env: Record<string, string> = {}
  for (const key of required) {
    const value = process.env[key]
    if (!value) throw new Error(`Missing environment variable: ${key}`)
    env[key] = value
  }

  // BASE64エンコードされた秘密鍵をデコード
  const privateKey = Buffer.from(env.LW_PRIVATE_KEY_BASE64, 'base64').toString('utf-8')

  return {
    WOFF_ID: env.WOFF_ID,
    LW_CLIENT_ID: env.LW_CLIENT_ID,
    LW_CLIENT_SECRET: env.LW_CLIENT_SECRET,
    LW_SERVICE_ACCOUNT_ID: env.LW_SERVICE_ACCOUNT_ID,
    LW_PRIVATE_KEY: privateKey,
    LW_DOMAIN_ID: env.LW_DOMAIN_ID,
    DYNAMO_TABLE_MEMBERS: env.DYNAMO_TABLE_MEMBERS,
    DYNAMO_TABLE_RESERVATIONS: env.DYNAMO_TABLE_RESERVATIONS,
    DYNAMO_ENDPOINT: process.env.DYNAMO_ENDPOINT,
  }
}

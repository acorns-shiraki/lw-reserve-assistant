import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

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

let cached: AppEnv | null = null

export async function getEnv(): Promise<AppEnv> {
  if (cached) return cached

  const woffId = process.env.WOFF_ID
  const tableMembersName = process.env.DYNAMO_TABLE_MEMBERS
  const tableReservationsName = process.env.DYNAMO_TABLE_RESERVATIONS

  if (!woffId) throw new Error('Missing environment variable: WOFF_ID')
  if (!tableMembersName) throw new Error('Missing environment variable: DYNAMO_TABLE_MEMBERS')
  if (!tableReservationsName) throw new Error('Missing environment variable: DYNAMO_TABLE_RESERVATIONS')

  let clientId: string
  let clientSecret: string
  let serviceAccountId: string
  let privateKey: string
  let domainId: string

  const secretArn = process.env.LW_SECRETS_ARN
  if (secretArn) {
    // 本番: Secrets Manager から取得
    const client = new SecretsManagerClient({})
    const result = await client.send(
      new GetSecretValueCommand({ SecretId: secretArn })
    )
    const secrets = JSON.parse(result.SecretString!)
    clientId = secrets.LW_CLIENT_ID
    clientSecret = secrets.LW_CLIENT_SECRET
    serviceAccountId = secrets.LW_SERVICE_ACCOUNT_ID
    domainId = secrets.LW_DOMAIN_ID
    privateKey = Buffer.from(secrets.LW_PRIVATE_KEY_BASE64, 'base64').toString('utf-8')
  } else {
    // ローカル開発: 環境変数から取得
    const required = ['LW_CLIENT_ID', 'LW_CLIENT_SECRET', 'LW_SERVICE_ACCOUNT_ID', 'LW_PRIVATE_KEY_BASE64', 'LW_DOMAIN_ID'] as const
    for (const key of required) {
      if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`)
    }
    clientId = process.env.LW_CLIENT_ID!
    clientSecret = process.env.LW_CLIENT_SECRET!
    serviceAccountId = process.env.LW_SERVICE_ACCOUNT_ID!
    domainId = process.env.LW_DOMAIN_ID!
    privateKey = Buffer.from(process.env.LW_PRIVATE_KEY_BASE64!, 'base64').toString('utf-8')
  }

  cached = {
    WOFF_ID: woffId,
    LW_CLIENT_ID: clientId,
    LW_CLIENT_SECRET: clientSecret,
    LW_SERVICE_ACCOUNT_ID: serviceAccountId,
    LW_PRIVATE_KEY: privateKey,
    LW_DOMAIN_ID: domainId,
    DYNAMO_TABLE_MEMBERS: tableMembersName,
    DYNAMO_TABLE_RESERVATIONS: tableReservationsName,
    DYNAMO_ENDPOINT: process.env.DYNAMO_ENDPOINT,
  }

  return cached
}

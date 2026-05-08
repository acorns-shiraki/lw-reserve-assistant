/**
 * リモートの GetAllLineWorksUsersTable から全ユーザーを取得し、
 * ローカル DynamoDB の lw-reserve-members テーブルにシードするスクリプト
 *
 * Usage: npx tsx scripts/seed-users.ts
 *
 * 前提:
 *   - AWS CLI profile "cdk-deploy" でリモートテーブルにアクセス可能
 *   - ローカル DynamoDB が localhost:8000 で稼働中
 */
import {
  DynamoDBClient,
  ScanCommand,
  CreateTableCommand,
  DescribeTableCommand,
  BatchWriteItemCommand,
} from '@aws-sdk/client-dynamodb'
import { fromIni } from '@aws-sdk/credential-providers'

const REMOTE_TABLE = 'GetAllLineWorksUsersTable'
const LOCAL_TABLE = 'lw-reserve-members'
const REGION = 'ap-northeast-1'
const LOCAL_ENDPOINT = 'http://localhost:8000'

// リモートクライアント (cdk-deploy profile)
const remoteClient = new DynamoDBClient({
  region: REGION,
  credentials: fromIni({ profile: 'cdk-deploy' }),
})

// ローカルクライアント
const localClient = new DynamoDBClient({
  region: REGION,
  endpoint: LOCAL_ENDPOINT,
})

async function ensureLocalTable() {
  try {
    await localClient.send(
      new DescribeTableCommand({ TableName: LOCAL_TABLE })
    )
    console.log(`テーブル ${LOCAL_TABLE} は既に存在します`)
  } catch {
    console.log(`テーブル ${LOCAL_TABLE} を作成します...`)
    await localClient.send(
      new CreateTableCommand({
        TableName: LOCAL_TABLE,
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },
          { AttributeName: 'SK', KeyType: 'RANGE' },
        ],
        AttributeDefinitions: [
          { AttributeName: 'PK', AttributeType: 'S' },
          { AttributeName: 'SK', AttributeType: 'S' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      })
    )
    console.log(`テーブル ${LOCAL_TABLE} を作成しました`)
  }
}

async function scanAllRemote(): Promise<Record<string, any>[]> {
  const items: Record<string, any>[] = []
  let lastKey: Record<string, any> | undefined

  do {
    const result = await remoteClient.send(
      new ScanCommand({
        TableName: REMOTE_TABLE,
        ExclusiveStartKey: lastKey,
      })
    )
    if (result.Items) {
      items.push(...result.Items)
    }
    lastKey = result.LastEvaluatedKey
    process.stdout.write(`\r取得中... ${items.length} 件`)
  } while (lastKey)

  console.log(`\n合計 ${items.length} 件取得しました`)
  return items
}

async function batchWriteLocal(items: Record<string, any>[]) {
  // DynamoDB BatchWriteItem は最大25件ずつ
  const BATCH_SIZE = 25
  let written = 0

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    const requests = batch.map((item) => ({
      PutRequest: { Item: item },
    }))

    await localClient.send(
      new BatchWriteItemCommand({
        RequestItems: {
          [LOCAL_TABLE]: requests,
        },
      })
    )

    written += batch.length
    process.stdout.write(`\r書き込み中... ${written}/${items.length} 件`)
  }

  console.log(`\n${written} 件をローカルに書き込みました`)
}

async function main() {
  console.log('=== ユーザーデータのシード ===')
  console.log(`リモート: ${REMOTE_TABLE} (profile: cdk-deploy)`)
  console.log(`ローカル: ${LOCAL_TABLE} (${LOCAL_ENDPOINT})`)
  console.log()

  await ensureLocalTable()
  const items = await scanAllRemote()
  await batchWriteLocal(items)

  console.log('\n完了!')
}

main().catch((e) => {
  console.error('エラー:', e)
  process.exit(1)
})

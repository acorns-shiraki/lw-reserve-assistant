import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

export interface MemberRecord {
  userId: string
  name: string
  email: string
}

function createClient(endpoint?: string) {
  return new DynamoDBClient({
    ...(endpoint ? { endpoint } : {}),
  })
}

export async function getAllMembers(
  tableName: string,
  endpoint?: string
): Promise<MemberRecord[]> {
  const client = createClient(endpoint)
  const members: MemberRecord[] = []
  let lastKey: Record<string, any> | undefined

  do {
    const result = await client.send(
      new ScanCommand({
        TableName: tableName,
        ProjectionExpression: 'PK, SK, lastName, firstName',
        ExclusiveStartKey: lastKey,
      })
    )

    if (result.Items) {
      for (const raw of result.Items) {
        const item = unmarshall(raw)
        members.push({
          userId: item.PK,
          name: [item.lastName, item.firstName].filter(Boolean).join(' '),
          email: item.SK,
        })
      }
    }

    lastKey = result.LastEvaluatedKey
  } while (lastKey)

  return members
}

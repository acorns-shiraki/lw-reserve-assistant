import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

export interface ReservationAttendee {
  userId: string
  name: string
  email: string
}

export interface TimeSlot {
  date: string
  start: string
  end: string
}

export interface Candidate {
  userId: string
  name: string
  email: string
  slots: TimeSlot[]
}

export interface Reservation {
  id: string
  title: string
  duration: number // 予約時間（分）: 30, 60, 90, 120
  creatorUserId: string
  attendees: ReservationAttendee[]
  weekStart: string
  freeSlots: TimeSlot[]
  candidates: Candidate[]
  status: 'open' | 'confirmed'
  confirmedSlot?: TimeSlot
  confirmedEventId?: string
  createdAt: string
}

function createClient(endpoint?: string) {
  const client = new DynamoDBClient({
    ...(endpoint ? { endpoint } : {}),
  })
  return DynamoDBDocumentClient.from(client)
}

export async function createReservation(
  tableName: string,
  reservation: Reservation,
  endpoint?: string
): Promise<void> {
  const docClient = createClient(endpoint)
  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: reservation,
    })
  )
}

export async function getReservation(
  tableName: string,
  id: string,
  endpoint?: string
): Promise<Reservation | null> {
  const docClient = createClient(endpoint)
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { id },
    })
  )
  return (result.Item as Reservation) ?? null
}

export async function addCandidates(
  tableName: string,
  id: string,
  candidate: Candidate,
  endpoint?: string
): Promise<void> {
  const docClient = createClient(endpoint)

  // まず現在のデータを取得
  const reservation = await getReservation(tableName, id, endpoint)
  if (!reservation) throw new Error('Reservation not found')
  if (reservation.status === 'confirmed') throw new Error('Reservation already confirmed')

  // 同一ユーザーの候補があれば上書き、なければ追加
  const existingIndex = reservation.candidates.findIndex(
    (c) => c.userId === candidate.userId
  )
  const updatedCandidates = [...reservation.candidates]
  if (existingIndex >= 0) {
    updatedCandidates[existingIndex] = candidate
  } else {
    updatedCandidates.push(candidate)
  }

  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: 'SET candidates = :candidates',
      ExpressionAttributeValues: {
        ':candidates': updatedCandidates,
      },
    })
  )
}

export async function confirmReservation(
  tableName: string,
  id: string,
  confirmedSlot: TimeSlot,
  confirmedEventId: string,
  endpoint?: string
): Promise<void> {
  const docClient = createClient(endpoint)
  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression:
        'SET #status = :confirmed, confirmedSlot = :slot, confirmedEventId = :eventId',
      ConditionExpression: '#status = :open',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':confirmed': 'confirmed',
        ':slot': confirmedSlot,
        ':eventId': confirmedEventId,
        ':open': 'open',
      },
    })
  )
}

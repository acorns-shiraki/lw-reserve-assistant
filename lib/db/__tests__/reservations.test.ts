import { describe, it, expect, vi, beforeEach } from 'vitest'

// DynamoDB クライアントをモック
const mockSend = vi.fn()
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn().mockImplementation(function () { return {} }),
}))
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: () => ({ send: mockSend }),
  },
  PutCommand: vi.fn().mockImplementation(function (this: Record<string, unknown>, input: unknown) { Object.assign(this, { type: 'Put', input }) }),
  GetCommand: vi.fn().mockImplementation(function (this: Record<string, unknown>, input: unknown) { Object.assign(this, { type: 'Get', input }) }),
  UpdateCommand: vi.fn().mockImplementation(function (this: Record<string, unknown>, input: unknown) { Object.assign(this, { type: 'Update', input }) }),
}))

import {
  createReservation,
  getReservation,
  addCandidates,
  confirmReservation,
  type Reservation,
  type Candidate,
} from '../reservations'

const TABLE = 'test-reservations'

function makeReservation(overrides?: Partial<Reservation>): Reservation {
  return {
    id: 'test-uuid',
    title: 'テスト会議',
    duration: 60,
    creatorUserId: 'user-1',
    attendees: [
      { userId: 'user-1', name: '田中太郎', email: 'tanaka@example.com' },
      { userId: 'user-2', name: '鈴木花子', email: 'suzuki@example.com' },
    ],
    weekStart: '2026-03-30',
    freeSlots: [
      { date: '2026-03-30', start: '10:00', end: '12:00' },
      { date: '2026-03-31', start: '14:00', end: '17:00' },
    ],
    candidates: [],
    status: 'open',
    createdAt: '2026-04-01T10:00:00.000Z',
    ...overrides,
  }
}

describe('reservations DB', () => {
  beforeEach(() => {
    mockSend.mockReset()
  })

  describe('createReservation', () => {
    it('DynamoDB に PutCommand で書き込む', async () => {
      mockSend.mockResolvedValue({})
      const reservation = makeReservation()

      await createReservation(TABLE, reservation)

      expect(mockSend).toHaveBeenCalledOnce()
      const cmd = mockSend.mock.calls[0][0]
      expect(cmd.input.TableName).toBe(TABLE)
      expect(cmd.input.Item.id).toBe('test-uuid')
      expect(cmd.input.Item.title).toBe('テスト会議')
    })
  })

  describe('getReservation', () => {
    it('存在するアイテムを返す', async () => {
      const reservation = makeReservation()
      mockSend.mockResolvedValue({ Item: reservation })

      const result = await getReservation(TABLE, 'test-uuid')

      expect(result).toEqual(reservation)
    })

    it('存在しない場合 null を返す', async () => {
      mockSend.mockResolvedValue({})

      const result = await getReservation(TABLE, 'nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('addCandidates', () => {
    it('新しい候補を追加する', async () => {
      const reservation = makeReservation()
      // 1回目: getReservation, 2回目: updateCommand
      mockSend
        .mockResolvedValueOnce({ Item: reservation })
        .mockResolvedValueOnce({})

      const candidate: Candidate = {
        userId: 'user-3',
        name: '佐藤次郎',
        email: 'sato@example.com',
        slots: [{ date: '2026-03-30', start: '10:00', end: '11:00' }],
      }

      await addCandidates(TABLE, 'test-uuid', candidate)

      expect(mockSend).toHaveBeenCalledTimes(2)
      const updateCmd = mockSend.mock.calls[1][0]
      expect(updateCmd.input.ExpressionAttributeValues[':candidates']).toHaveLength(1)
      expect(updateCmd.input.ExpressionAttributeValues[':candidates'][0].userId).toBe('user-3')
    })

    it('同一ユーザーの候補を上書きする', async () => {
      const reservation = makeReservation({
        candidates: [
          {
            userId: 'user-3',
            name: '佐藤次郎',
            email: 'sato@example.com',
            slots: [{ date: '2026-03-30', start: '10:00', end: '11:00' }],
          },
        ],
      })
      mockSend
        .mockResolvedValueOnce({ Item: reservation })
        .mockResolvedValueOnce({})

      const updatedCandidate: Candidate = {
        userId: 'user-3',
        name: '佐藤次郎',
        email: 'sato@example.com',
        slots: [{ date: '2026-03-31', start: '14:00', end: '15:00' }],
      }

      await addCandidates(TABLE, 'test-uuid', updatedCandidate)

      const updateCmd = mockSend.mock.calls[1][0]
      const candidates = updateCmd.input.ExpressionAttributeValues[':candidates']
      expect(candidates).toHaveLength(1)
      expect(candidates[0].slots[0].date).toBe('2026-03-31')
    })

    it('confirmed 状態ではエラー', async () => {
      const reservation = makeReservation({ status: 'confirmed' })
      mockSend.mockResolvedValueOnce({ Item: reservation })

      await expect(
        addCandidates(TABLE, 'test-uuid', {
          userId: 'user-3',
          name: '佐藤次郎',
          email: 'sato@example.com',
          slots: [],
        })
      ).rejects.toThrow('Reservation already confirmed')
    })

    it('存在しない予約ではエラー', async () => {
      mockSend.mockResolvedValueOnce({})

      await expect(
        addCandidates(TABLE, 'nonexistent', {
          userId: 'user-3',
          name: '佐藤次郎',
          email: 'sato@example.com',
          slots: [],
        })
      ).rejects.toThrow('Reservation not found')
    })
  })

  describe('confirmReservation', () => {
    it('status を confirmed に更新する', async () => {
      mockSend.mockResolvedValue({})

      await confirmReservation(
        TABLE,
        'test-uuid',
        { date: '2026-03-30', start: '10:00', end: '11:00' },
        'event-123'
      )

      expect(mockSend).toHaveBeenCalledOnce()
      const cmd = mockSend.mock.calls[0][0]
      expect(cmd.input.ExpressionAttributeValues[':confirmed']).toBe('confirmed')
      expect(cmd.input.ExpressionAttributeValues[':slot']).toEqual({
        date: '2026-03-30',
        start: '10:00',
        end: '11:00',
      })
      expect(cmd.input.ExpressionAttributeValues[':eventId']).toBe('event-123')
      expect(cmd.input.ConditionExpression).toBe('#status = :open')
    })
  })
})

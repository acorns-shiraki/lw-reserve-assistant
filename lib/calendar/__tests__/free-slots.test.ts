import { describe, it, expect } from 'vitest'
import { computeFreeSlots, type FreeSlot } from '../free-slots'
import type { CalendarEvent } from '../../lineworks/types'

// ヘルパー: 日時文字列を簡単に作る (Asia/Tokyo想定)
function makeEvent(
  date: string,
  startTime: string,
  endTime: string,
  transparency: 'OPAQUE' | 'TRANSPARENT' = 'OPAQUE'
): CalendarEvent {
  return {
    eventId: `event-${date}-${startTime}`,
    summary: 'Test Event',
    start: {
      dateTime: `${date}T${startTime}:00`,
      timeZone: 'Asia/Tokyo',
    },
    end: {
      dateTime: `${date}T${endTime}:00`,
      timeZone: 'Asia/Tokyo',
    },
    transparency,
  }
}

function makeAllDayEvent(
  startDate: string,
  endDate: string
): CalendarEvent {
  return {
    eventId: `event-allday-${startDate}`,
    summary: 'All Day Event',
    start: { date: startDate },
    end: { date: endDate },
    transparency: 'OPAQUE',
  }
}

describe('computeFreeSlots', () => {
  // 2026-04-06 は月曜日
  const weekStart = '2026-04-06'

  it('予定なしの場合、各日の営業時間全体が空きになる', () => {
    const allEvents = new Map<string, CalendarEvent[]>()
    const result = computeFreeSlots(allEvents, weekStart)

    // 月〜日 × 1つの連続空きスロット (10:00-19:00)
    expect(result).toHaveLength(7)
    expect(result[0]).toEqual(
      expect.objectContaining({
        date: '2026-04-06',
        start: '10:00',
        end: '19:00',
      })
    )
    expect(result[4]).toEqual(
      expect.objectContaining({
        date: '2026-04-10',
        start: '10:00',
        end: '19:00',
      })
    )
    // 土日も含まれる
    expect(result[5]).toEqual(
      expect.objectContaining({
        date: '2026-04-11',
        start: '10:00',
        end: '19:00',
      })
    )
    expect(result[6]).toEqual(
      expect.objectContaining({
        date: '2026-04-12',
        start: '10:00',
        end: '19:00',
      })
    )
  })

  it('1つの予定がある場合、その前後が空きになる', () => {
    const allEvents = new Map<string, CalendarEvent[]>([
      ['user1', [makeEvent('2026-04-06', '13:00', '14:00')]],
    ])
    const result = computeFreeSlots(allEvents, weekStart)

    // 月曜日は 10:00-13:00 と 14:00-19:00 の2スロット
    const mondaySlots = result.filter((s) => s.date === '2026-04-06')
    expect(mondaySlots).toHaveLength(2)
    expect(mondaySlots[0]).toEqual(
      expect.objectContaining({ start: '10:00', end: '13:00' })
    )
    expect(mondaySlots[1]).toEqual(
      expect.objectContaining({ start: '14:00', end: '19:00' })
    )
  })

  it('複数ユーザーの予定が重なるケース', () => {
    const allEvents = new Map<string, CalendarEvent[]>([
      ['user1', [makeEvent('2026-04-06', '10:00', '12:00')]],
      ['user2', [makeEvent('2026-04-06', '11:00', '14:00')]],
    ])
    const result = computeFreeSlots(allEvents, weekStart)

    // 月曜: 10:00-14:00がBusy → 空きは14:00-19:00
    const mondaySlots = result.filter((s) => s.date === '2026-04-06')
    expect(mondaySlots).toHaveLength(1)
    expect(mondaySlots[0]).toEqual(
      expect.objectContaining({ start: '14:00', end: '19:00' })
    )
  })

  it('TRANSPARENT予定は無視される', () => {
    const allEvents = new Map<string, CalendarEvent[]>([
      ['user1', [makeEvent('2026-04-06', '13:00', '14:00', 'TRANSPARENT')]],
    ])
    const result = computeFreeSlots(allEvents, weekStart)

    // TRANSPARENT は無視されるので、月曜は10:00-19:00が丸ごと空き
    const mondaySlots = result.filter((s) => s.date === '2026-04-06')
    expect(mondaySlots).toHaveLength(1)
    expect(mondaySlots[0]).toEqual(
      expect.objectContaining({ start: '10:00', end: '19:00' })
    )
  })

  it('終日予定はその日の営業時間全体をブロックする', () => {
    const allEvents = new Map<string, CalendarEvent[]>([
      // end.date は排他的: 4/7 は含まない → 4/6のみブロック
      ['user1', [makeAllDayEvent('2026-04-06', '2026-04-07')]],
    ])
    const result = computeFreeSlots(allEvents, weekStart)

    // 月曜は空きなし
    const mondaySlots = result.filter((s) => s.date === '2026-04-06')
    expect(mondaySlots).toHaveLength(0)

    // 火曜以降は空きあり
    const tuesdaySlots = result.filter((s) => s.date === '2026-04-07')
    expect(tuesdaySlots).toHaveLength(1)
  })

  it('営業時間外の予定は影響しない', () => {
    const allEvents = new Map<string, CalendarEvent[]>([
      ['user1', [makeEvent('2026-04-06', '08:00', '09:30')]],
    ])
    const result = computeFreeSlots(allEvents, weekStart)

    // 8:00-9:30は営業時間外なので影響なし → 10:00-19:00が空き
    const mondaySlots = result.filter((s) => s.date === '2026-04-06')
    expect(mondaySlots).toHaveLength(1)
    expect(mondaySlots[0]).toEqual(
      expect.objectContaining({ start: '10:00', end: '19:00' })
    )
  })

  it('営業時間にまたがる予定は営業時間部分のみブロックする', () => {
    const allEvents = new Map<string, CalendarEvent[]>([
      ['user1', [makeEvent('2026-04-06', '08:00', '11:00')]],
    ])
    const result = computeFreeSlots(allEvents, weekStart)

    const mondaySlots = result.filter((s) => s.date === '2026-04-06')
    expect(mondaySlots).toHaveLength(1)
    expect(mondaySlots[0]).toEqual(
      expect.objectContaining({ start: '11:00', end: '19:00' })
    )
  })
})

import type { TimeInterval } from './merge-busy'
import { mergeIntervals } from './merge-busy'
import type { CalendarEvent } from '../lineworks/types'

export interface FreeSlot {
  date: string
  start: string
  end: string
}

const BUSINESS_HOUR_START = 10
const BUSINESS_HOUR_END = 19

function toJSTTimestamp(dateStr: string, time: string): number {
  // Asia/Tokyo = UTC+9
  return new Date(`${dateStr}T${time}:00+09:00`).getTime()
}

function formatTimeJST(timestamp: number): string {
  const d = new Date(timestamp)
  return d.toLocaleTimeString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDateJST(timestamp: number): string {
  const d = new Date(timestamp)
  const year = d.toLocaleString('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric' })
  const month = d.toLocaleString('en-CA', { timeZone: 'Asia/Tokyo', month: '2-digit' })
  const day = d.toLocaleString('en-CA', { timeZone: 'Asia/Tokyo', day: '2-digit' })
  return `${year}-${month}-${day}`
}

function eventToInterval(event: CalendarEvent): TimeInterval | null {
  if (event.transparency === 'TRANSPARENT') return null

  if (event.start.dateTime && event.end.dateTime) {
    const start = new Date(event.start.dateTime + '+09:00').getTime()
    const end = new Date(event.end.dateTime + '+09:00').getTime()
    return { start, end }
  }

  if (event.start.date) {
    const startDate = event.start.date
    const endDate = event.end?.date ?? startDate
    // end.date は排他的なので、1日前まで
    const endExclusive = new Date(endDate + 'T00:00:00+09:00')
    endExclusive.setDate(endExclusive.getDate() - 1)
    const lastDay = formatDateJST(endExclusive.getTime())

    const start = toJSTTimestamp(startDate, `${String(BUSINESS_HOUR_START).padStart(2, '0')}:00`)
    const end = toJSTTimestamp(lastDay, `${String(BUSINESS_HOUR_END).padStart(2, '0')}:00`)
    return { start, end }
  }

  return null
}

export function computeFreeSlots(
  allEvents: Map<string, CalendarEvent[]>,
  weekStart: string
): FreeSlot[] {
  const busyIntervals: TimeInterval[] = []

  for (const [, events] of allEvents) {
    for (const event of events) {
      const interval = eventToInterval(event)
      if (interval) {
        busyIntervals.push(interval)
      }
    }
  }

  const mergedBusy = mergeIntervals(busyIntervals)

  const freeSlots: FreeSlot[] = []

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const dayDate = new Date(weekStart + 'T00:00:00+09:00')
    dayDate.setDate(dayDate.getDate() + dayOffset)
    const dateStr = formatDateJST(dayDate.getTime())

    const dayStart = toJSTTimestamp(dateStr, `${String(BUSINESS_HOUR_START).padStart(2, '0')}:00`)
    const dayEnd = toJSTTimestamp(dateStr, `${String(BUSINESS_HOUR_END).padStart(2, '0')}:00`)

    const dayBusy = mergedBusy
      .filter((b) => b.start < dayEnd && b.end > dayStart)
      .map((b) => ({
        start: Math.max(b.start, dayStart),
        end: Math.min(b.end, dayEnd),
      }))

    let cursor = dayStart
    for (const busy of dayBusy) {
      if (cursor < busy.start) {
        freeSlots.push({
          date: dateStr,
          start: formatTimeJST(cursor),
          end: formatTimeJST(busy.start),
        })
      }
      cursor = Math.max(cursor, busy.end)
    }

    if (cursor < dayEnd) {
      freeSlots.push({
        date: dateStr,
        start: formatTimeJST(cursor),
        end: formatTimeJST(dayEnd),
      })
    }
  }

  return freeSlots
}

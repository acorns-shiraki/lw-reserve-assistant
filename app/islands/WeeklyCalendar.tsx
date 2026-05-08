interface FreeSlot {
  date: string
  start: string
  end: string
}

interface WeeklyCalendarProps {
  weekStart: string
  freeSlots: FreeSlot[]
  loading: boolean
}

const HOURS = Array.from({ length: 9 }, (_, i) => i + 10) // 10〜18
const DAYS = ['日', '月', '火', '水', '木', '金', '土']

function getDayDates(weekStart: string): string[] {
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart + 'T00:00:00+09:00')
    d.setDate(d.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${day}`)
  }
  return dates
}

function formatDayHeader(dateStr: string, dayLabel: string): string {
  const d = new Date(dateStr + 'T00:00:00+09:00')
  return `${d.getMonth() + 1}/${d.getDate()}(${dayLabel})`
}

function isFree(date: string, hour: number, minute: number, freeSlots: FreeSlot[]): boolean {
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  const nextMinute = minute + 30
  const nextHour = nextMinute >= 60 ? hour + 1 : hour
  const nextMin = nextMinute >= 60 ? nextMinute - 60 : nextMinute
  const endStr = `${String(nextHour).padStart(2, '0')}:${String(nextMin).padStart(2, '0')}`

  return freeSlots.some(
    (slot) =>
      slot.date === date && slot.start <= timeStr && slot.end >= endStr
  )
}

export default function WeeklyCalendar({ weekStart, freeSlots, loading }: WeeklyCalendarProps) {
  const dates = getDayDates(weekStart)

  if (loading) {
    return <div class="calendar-loading">読み込み中...</div>
  }

  return (
    <div class="weekly-calendar">
      {/* ヘッダー行 */}
      <div class="calendar-header">
        <div class="calendar-time-label"></div>
        {dates.map((date, i) => (
          <div class="calendar-day-header" key={date}>
            {formatDayHeader(date, DAYS[i])}
          </div>
        ))}
      </div>

      {/* 時間グリッド */}
      <div class="calendar-body">
        {HOURS.map((hour) => (
          <div class="calendar-row" key={hour}>
            <div class="calendar-time-label">{hour}:00</div>
            {dates.map((date) => (
              <div class="calendar-cell" key={`${date}-${hour}`}>
                <div
                  class={`calendar-slot ${isFree(date, hour, 0, freeSlots) ? 'slot-free' : 'slot-busy'}`}
                ></div>
                <div
                  class={`calendar-slot ${isFree(date, hour, 30, freeSlots) ? 'slot-free' : 'slot-busy'}`}
                ></div>
              </div>
            ))}
          </div>
        ))}
        {/* 19:00 ラベル */}
        <div class="calendar-row calendar-row--end">
          <div class="calendar-time-label">19:00</div>
        </div>
      </div>
    </div>
  )
}

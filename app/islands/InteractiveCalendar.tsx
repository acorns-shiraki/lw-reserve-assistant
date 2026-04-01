interface FreeSlot {
  date: string
  start: string
  end: string
}

interface CandidateSlot {
  date: string
  start: string
  end: string
}

interface Candidate {
  userId: string
  name: string
  slots: CandidateSlot[]
}

interface InteractiveCalendarProps {
  weekStart: string
  freeSlots: FreeSlot[]
  duration: number // 分
  candidates: Candidate[]
  currentUserId: string
  selectedSlots: CandidateSlot[]
  onToggleSlot: (slot: CandidateSlot) => void
  confirmed: boolean
  confirmedSlot?: CandidateSlot
}

const HOURS = Array.from({ length: 9 }, (_, i) => i + 10)
const DAYS = ['月', '火', '水', '木', '金', '土', '日']

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

function makeSlotKey(date: string, hour: number, minute: number): string {
  return `${date}_${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function cellTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function cellEndTime(hour: number, minute: number): string {
  const nextMinute = minute + 30
  const nextHour = nextMinute >= 60 ? hour + 1 : hour
  const nextMin = nextMinute >= 60 ? nextMinute - 60 : nextMinute
  return `${String(nextHour).padStart(2, '0')}:${String(nextMin).padStart(2, '0')}`
}

/** duration 分後の時刻を返す */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function isFree(date: string, hour: number, minute: number, freeSlots: FreeSlot[]): boolean {
  const start = cellTime(hour, minute)
  const end = cellEndTime(hour, minute)
  return freeSlots.some(
    (slot) => slot.date === date && slot.start <= start && slot.end >= end
  )
}

/** この30分セルが duration 分のスロットを開始できるか（全セルが空き） */
function canStartSlot(
  date: string,
  hour: number,
  minute: number,
  duration: number,
  freeSlots: FreeSlot[]
): boolean {
  const startTime = cellTime(hour, minute)
  const endTime = addMinutes(startTime, duration)
  if (endTime > '19:00') return false
  // startTime から endTime まですべて free か
  return freeSlots.some(
    (slot) => slot.date === date && slot.start <= startTime && slot.end >= endTime
  )
}

/** このセルが selectedSlots のいずれかでカバーされているか */
function isCoveredBySelected(date: string, hour: number, minute: number, selectedSlots: CandidateSlot[]): boolean {
  const start = cellTime(hour, minute)
  const end = cellEndTime(hour, minute)
  return selectedSlots.some(
    (slot) => slot.date === date && slot.start <= start && slot.end >= end
  )
}

/** このセルをカバーする他ユーザーの候補数 */
function otherCandidateCount(
  date: string,
  hour: number,
  minute: number,
  candidates: Candidate[],
  currentUserId: string
): number {
  const start = cellTime(hour, minute)
  const end = cellEndTime(hour, minute)
  return candidates.filter(
    (c) =>
      c.userId !== currentUserId &&
      c.slots.some((s) => s.date === date && s.start <= start && s.end >= end)
  ).length
}

function isConfirmedCell(
  date: string,
  hour: number,
  minute: number,
  confirmedSlot?: CandidateSlot
): boolean {
  if (!confirmedSlot) return false
  const start = cellTime(hour, minute)
  const end = cellEndTime(hour, minute)
  return confirmedSlot.date === date && confirmedSlot.start <= start && confirmedSlot.end >= end
}

export default function InteractiveCalendar({
  weekStart,
  freeSlots,
  duration,
  candidates,
  currentUserId,
  selectedSlots,
  onToggleSlot,
  confirmed,
  confirmedSlot,
}: InteractiveCalendarProps) {
  const dates = getDayDates(weekStart)

  return (
    <div class="weekly-calendar interactive-calendar">
      <div class="calendar-header">
        <div class="calendar-time-label"></div>
        {dates.map((date, i) => (
          <div class="calendar-day-header" key={date}>
            {formatDayHeader(date, DAYS[i])}
          </div>
        ))}
      </div>

      <div class="calendar-body">
        {HOURS.map((hour) => (
          <div class="calendar-row" key={hour}>
            <div class="calendar-time-label">{hour}:00</div>
            {dates.map((date) => (
              <div class="calendar-cell" key={`${date}-${hour}`}>
                {[0, 30].map((minute) => {
                  const free = isFree(date, hour, minute, freeSlots)
                  const selected = isCoveredBySelected(date, hour, minute, selectedSlots)
                  const otherCount = otherCandidateCount(date, hour, minute, candidates, currentUserId)
                  const isConfirmed = isConfirmedCell(date, hour, minute, confirmedSlot)
                  const canStart = free && canStartSlot(date, hour, minute, duration, freeSlots)

                  let cls = 'calendar-slot'
                  if (isConfirmed) {
                    cls += ' slot-confirmed'
                  } else if (!free) {
                    cls += ' slot-busy'
                  } else if (selected) {
                    cls += ' slot-selected'
                  } else if (otherCount > 0) {
                    cls += ' slot-other-candidate'
                  } else {
                    cls += ' slot-free'
                  }

                  // クリック: 選択済みならトグル解除、未選択ならduration分のスロットを作成
                  const canClick = !confirmed && (selected || canStart)
                  const startTime = cellTime(hour, minute)
                  const endTime = addMinutes(startTime, duration)

                  return (
                    <div
                      key={makeSlotKey(date, hour, minute)}
                      class={cls}
                      onClick={canClick ? () => onToggleSlot({ date, start: startTime, end: endTime }) : undefined}
                    >
                      {otherCount > 0 && !selected && !isConfirmed && (
                        <span class="slot-badge">{otherCount}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ))}
        <div class="calendar-row calendar-row--end">
          <div class="calendar-time-label">19:00</div>
        </div>
      </div>
    </div>
  )
}

interface WeekPickerProps {
  weekStart: string
  onWeekChange: (newWeekStart: string) => void
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00+09:00')
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${m}/${day}`
}

function getThisMonday(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  return formatDate(monday)
}

export default function WeekPicker({ weekStart, onWeekChange }: WeekPickerProps) {
  const sunday = new Date(weekStart + 'T00:00:00+09:00')
  sunday.setDate(sunday.getDate() + 6)

  const thisMonday = getThisMonday()
  const maxMonday = new Date(thisMonday + 'T00:00:00+09:00')
  maxMonday.setDate(maxMonday.getDate() + 14)
  const maxMondayStr = formatDate(maxMonday)

  const canPrev = weekStart > thisMonday
  const canNext = weekStart < maxMondayStr

  const handlePrev = () => {
    if (!canPrev) return
    const d = new Date(weekStart + 'T00:00:00+09:00')
    d.setDate(d.getDate() - 7)
    onWeekChange(formatDate(d))
  }

  const handleNext = () => {
    if (!canNext) return
    const d = new Date(weekStart + 'T00:00:00+09:00')
    d.setDate(d.getDate() + 7)
    onWeekChange(formatDate(d))
  }

  return (
    <div class="week-picker">
      <button class="week-picker__btn" onClick={handlePrev} disabled={!canPrev}>◀</button>
      <span class="week-picker__label">
        {formatDisplayDate(weekStart)} 〜 {formatDisplayDate(formatDate(sunday))}
      </span>
      <button class="week-picker__btn" onClick={handleNext} disabled={!canNext}>▶</button>
    </div>
  )
}

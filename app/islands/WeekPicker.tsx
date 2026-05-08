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

function getThisSunday(): string {
  const now = new Date()
  const day = now.getDay()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - day)
  return formatDate(sunday)
}

export default function WeekPicker({ weekStart, onWeekChange }: WeekPickerProps) {
  const saturday = new Date(weekStart + 'T00:00:00+09:00')
  saturday.setDate(saturday.getDate() + 6)

  const thisSunday = getThisSunday()
  const maxSunday = new Date(thisSunday + 'T00:00:00+09:00')
  maxSunday.setDate(maxSunday.getDate() + 14)
  const maxSundayStr = formatDate(maxSunday)

  const canPrev = weekStart > thisSunday
  const canNext = weekStart < maxSundayStr

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
        {formatDisplayDate(weekStart)} 〜 {formatDisplayDate(formatDate(saturday))}
      </span>
      <button class="week-picker__btn" onClick={handleNext} disabled={!canNext}>▶</button>
    </div>
  )
}

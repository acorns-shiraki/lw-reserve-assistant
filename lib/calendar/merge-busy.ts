export interface TimeInterval {
  start: number
  end: number
}

export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return []

  const sorted = [...intervals].sort((a, b) => a.start - b.start)
  const merged: TimeInterval[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const last = merged[merged.length - 1]

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end)
    } else {
      merged.push({ start: current.start, end: current.end })
    }
  }

  return merged
}

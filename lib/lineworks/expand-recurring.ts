import type { CalendarEvent, EventComponents } from './types'

/**
 * LINE WORKS API が返す eventComponents を展開し、
 * 指定期間内の実際のオカレンスに変換する。
 *
 * マスターイベント (recurrence あり) は元の日付が対象期間外でも、
 * 曜日と時刻を使って対象期間内の該当日にマッピングする。
 *
 * 例外イベント (recurringEventId あり) はそのまま使用。
 * 通常イベント (どちらもなし) はそのまま使用。
 */
export function expandRecurringEvents(
  eventGroups: EventComponents[],
  fromDate: string,
  untilDate: string
): CalendarEvent[] {
  const expanded: CalendarEvent[] = []

  for (const group of eventGroups) {
    const components = group.eventComponents

    const master = components.find((c) => c.recurrence && c.recurrence.length > 0)
    const exceptions = components.filter((c) => c.recurringEventId)
    const nonRecurring = components.filter((c) => !c.recurrence && !c.recurringEventId)

    // 通常イベント・例外イベントはそのまま
    expanded.push(...nonRecurring)
    expanded.push(...exceptions)

    if (!master || !master.start.dateTime) continue

    // EXDATE を収集（除外日）
    const exdates = new Set<string>()
    for (const r of master.recurrence ?? []) {
      if (r.startsWith('EXDATE')) {
        const match = r.match(/(\d{4})(\d{2})(\d{2})T/)
        if (match) {
          exdates.add(`${match[1]}-${match[2]}-${match[3]}`)
        }
      }
    }
    // 例外イベントの日付も除外（既に別途追加済み）
    for (const exc of exceptions) {
      if (exc.start.dateTime) {
        exdates.add(exc.start.dateTime.slice(0, 10))
      }
    }

    // マスターの曜日と時刻
    const masterDowJST = getDowJST(master.start.dateTime)
    const masterStartTime = master.start.dateTime.slice(11) // "13:30:00"
    const masterEndTime = master.end.dateTime!.slice(11)

    // 対象期間の各日を走査し、マスターと同じ曜日の日にイベントを生成
    const cursor = new Date(fromDate + 'T00:00:00+09:00')
    const end = new Date(untilDate + 'T23:59:59+09:00')

    while (cursor <= end) {
      const cursorDow = getDowFromDate(cursor)
      if (cursorDow === masterDowJST) {
        const dateStr = formatDateFromDate(cursor)

        if (!exdates.has(dateStr)) {
          expanded.push({
            ...master,
            recurrence: undefined,
            start: {
              dateTime: `${dateStr}T${masterStartTime}`,
              timeZone: master.start.timeZone,
            },
            end: {
              dateTime: `${dateStr}T${masterEndTime}`,
              timeZone: master.end.timeZone,
            },
          })
        }
      }
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  return expanded
}

/** "2024-12-13T13:30:00" → JST での曜日 (0=Sun) */
function getDowJST(dateTimeStr: string): number {
  const d = new Date(dateTimeStr + '+09:00')
  // JST = UTC+9 なので、UTCの時刻に9時間足してからUTCの曜日を見る
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return jst.getUTCDay()
}

/** Date オブジェクト（+09:00 で作成済み）から JST の曜日を取得 */
function getDowFromDate(d: Date): number {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return jst.getUTCDay()
}

/** Date オブジェクト（+09:00 で作成済み）から "YYYY-MM-DD" */
function formatDateFromDate(d: Date): string {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const y = jst.getUTCFullYear()
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0')
  const day = String(jst.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

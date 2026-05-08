import { useState, useEffect } from 'hono/jsx'
import WeekPicker from './WeekPicker'
import MemberSelector from './MemberSelector'
import WeeklyCalendar from './WeeklyCalendar'

interface UserProfile {
  userId: string
  email: string
  userName: { lastName?: string | null; firstName?: string | null }
}

function getThisSunday(): string {
  const now = new Date()
  const day = now.getDay()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - day)
  const y = sunday.getFullYear()
  const m = String(sunday.getMonth() + 1).padStart(2, '0')
  const d = String(sunday.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function CreateReservation({ woffId }: { woffId: string }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'need_login' | 'error'>('loading')
  const [token, setToken] = useState('')
  const [user, setUser] = useState<UserProfile | null>(null)

  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(60)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [memberNames, setMemberNames] = useState<Map<string, string>>(new Map())
  const [memberEmails, setMemberEmails] = useState<Map<string, string>>(new Map())
  const [weekStart, setWeekStart] = useState(getThisSunday())
  const [submitting, setSubmitting] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [freeSlots, setFreeSlots] = useState<{ date: string; start: string; end: string }[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarVisibleIds, setCalendarVisibleIds] = useState<string[]>([])
  const [myCalendarVisible, setMyCalendarVisible] = useState(true)

  // WOFF SDK 初期化 + 認証
  useEffect(() => {
    async function init() {
      try {
        if (typeof window === 'undefined' || !window.woff) {
          setStatus('error')
          return
        }

        await window.woff.init({ woffId })

        if (!window.woff.isInClient() && !window.woff.isLoggedIn()) {
          setStatus('need_login')
          return
        }

        const accessToken = window.woff.getAccessToken()
        setToken(accessToken)

        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!res.ok) {
          setStatus('error')
          return
        }

        const userData = await res.json()
        setUser(userData)
        setStatus('ready')
      } catch (e) {
        console.error('[CreateReservation] init error:', e)
        setStatus('error')
      }
    }
    init()
  }, [woffId])

  // 自分 + カレンダー表示ONのメンバーで空き時間を取得
  const calendarUserIdsKey = [
    ...(myCalendarVisible && user ? [user.userId] : []),
    ...calendarVisibleIds,
  ].sort().join(',')

  useEffect(() => {
    if (status !== 'ready' || !calendarUserIdsKey) {
      setFreeSlots([])
      return
    }

    async function loadSlots() {
      setCalendarLoading(true)
      try {
        const params = new URLSearchParams({
          userIds: calendarUserIdsKey,
          weekStart,
        })
        const res = await fetch(`/api/calendar/free-slots?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setFreeSlots(data.freeSlots)
        }
      } catch {
        // ignore
      } finally {
        setCalendarLoading(false)
      }
    }
    loadSlots()
  }, [status, calendarUserIdsKey, weekStart, token])

  const handleSubmit = async () => {
    if (!title.trim()) return

    setSubmitting(true)
    setErrorMsg('')
    try {
      // 自分を出席者に含める
      const selfAttendee = user
        ? {
            userId: user.userId,
            name: `${user.userName.lastName ?? ''} ${user.userName.firstName ?? ''}`.trim(),
            email: user.email,
          }
        : null

      // 追加メンバーの名前・emailを解決
      const otherAttendees = selectedMembers.map((id) => ({
        userId: id,
        name: memberNames.get(id) ?? id,
        email: memberEmails.get(id) ?? '',
      }))

      const attendees = [
        ...(selfAttendee ? [selfAttendee] : []),
        ...otherAttendees,
      ]

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          duration,
          attendees,
          weekStart,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setErrorMsg(data.error || 'エラーが発生しました')
        return
      }

      const data = await res.json()
      const url = `${window.location.origin}/s/${data.id}`
      setGeneratedUrl(url)
    } catch {
      setErrorMsg('通信エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const input = document.createElement('input')
      input.value = generatedUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (status === 'loading') {
    return <div class="app-status">初期化中...</div>
  }

  if (status === 'need_login') {
    const handleLogin = () => {
      window.woff.login({ redirectUri: window.location.href })
    }
    return (
      <div class="app-status">
        <h1 class="app-title">Schedule Coordinator</h1>
        <p>LINE WORKS にログインしてください</p>
        <button class="app-login-btn" onClick={handleLogin}>
          LINE WORKS でログイン
        </button>
      </div>
    )
  }

  if (status === 'error') {
    return <div class="app-status app-status--error">認証エラーが発生しました。LINE WORKSからアクセスしてください。</div>
  }

  // URL発行完了画面
  if (generatedUrl) {
    return (
      <div class="calendar-app">
        <h1 class="app-title">Schedule Coordinator</h1>
        <div class="generated-url">
          <h2 class="generated-url__title">予約URLを発行しました</h2>
          <p class="generated-url__desc">以下のURLを共有して、候補時間を入力してもらいましょう。</p>
          <div class="generated-url__box">
            <input
              type="text"
              class="generated-url__input"
              value={generatedUrl}
              readOnly
            />
            <button class="generated-url__copy" onClick={handleCopy}>
              {copied ? 'コピー済み' : 'コピー'}
            </button>
          </div>
          <a class="generated-url__link" href={generatedUrl}>
            予約ページを開く
          </a>
          <button
            class="generated-url__new"
            onClick={() => {
              setGeneratedUrl('')
              setTitle('')
              setDuration(60)
              setSelectedMembers([])
            }}
          >
            新しい予約を作成
          </button>
        </div>
      </div>
    )
  }

  return (
    <div class="calendar-app">
      <h1 class="app-title">Schedule Coordinator</h1>
      {user && (
        <p class="app-user">
          {user.userName.lastName} {user.userName.firstName} さん
        </p>
      )}

      <div class="form-section">
        <label class="form-label">タイトル</label>
        <input
          type="text"
          class="form-input"
          placeholder="例: 定例ミーティング"
          value={title}
          onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="form-section">
        <label class="form-label">予約時間</label>
        <div class="duration-picker">
          {([
            { value: 30, label: '30分' },
            { value: 60, label: '1時間' },
            { value: 90, label: '1.5時間' },
            { value: 120, label: '2時間' },
          ] as const).map((d) => (
            <button
              key={d.value}
              type="button"
              class={`duration-picker__btn ${duration === d.value ? 'duration-picker__btn--active' : ''}`}
              onClick={() => setDuration(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div class="form-section">
        <label class="form-label">出席メンバー</label>
        <MemberSelector
          token={token}
          selectedIds={selectedMembers}
          onSelectionChange={(ids) => {
            // 新規追加分はカレンダー表示もON
            const added = ids.filter((id) => !selectedMembers.includes(id))
            if (added.length > 0) {
              setCalendarVisibleIds((prev) => [...prev, ...added])
            }
            // 削除分はカレンダー表示からも除外
            const removed = selectedMembers.filter((id) => !ids.includes(id))
            if (removed.length > 0) {
              setCalendarVisibleIds((prev) => prev.filter((id) => !removed.includes(id)))
            }
            setSelectedMembers(ids)
          }}
          selfName={`${user?.userName.lastName ?? ''} ${user?.userName.firstName ?? ''}`.trim()}
          onMembersLoaded={(members) => {
            const names = new Map<string, string>()
            const emails = new Map<string, string>()
            for (const m of members) {
              names.set(m.userId, m.name)
              emails.set(m.userId, m.email)
            }
            setMemberNames(names)
            setMemberEmails(emails)
          }}
        />
      </div>

      <div class="form-section">
        <label class="form-label">対象週</label>
        <WeekPicker weekStart={weekStart} onWeekChange={setWeekStart} />
      </div>

      <div class="form-section">
        <label class="form-label">空き状況</label>
        <div class="calendar-visibility-toggles">
          <label class="calendar-visibility-item">
            <input
              type="checkbox"
              checked={myCalendarVisible}
              onChange={() => setMyCalendarVisible(!myCalendarVisible)}
            />
            {user?.userName.lastName} {user?.userName.firstName}（自分）
          </label>
          {selectedMembers.map((id) => (
            <label class="calendar-visibility-item" key={id}>
              <input
                type="checkbox"
                checked={calendarVisibleIds.includes(id)}
                onChange={() => {
                  setCalendarVisibleIds((prev) =>
                    prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
                  )
                }}
              />
              {memberNames.get(id) ?? id}
            </label>
          ))}
        </div>
        <WeeklyCalendar
          weekStart={weekStart}
          freeSlots={freeSlots}
          loading={calendarLoading}
        />
      </div>

      {errorMsg && <p class="form-error">{errorMsg}</p>}

      <button
        class="form-submit"
        disabled={!title.trim() || submitting}
        onClick={handleSubmit}
      >
        {submitting ? 'URL を発行中...' : 'URL を発行'}
      </button>
    </div>
  )
}

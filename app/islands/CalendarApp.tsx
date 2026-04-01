import { useState, useEffect } from 'hono/jsx'
import WeekPicker from './WeekPicker'
import MemberSelector from './MemberSelector'
import WeeklyCalendar from './WeeklyCalendar'

interface FreeSlot {
  date: string
  start: string
  end: string
}

interface UserProfile {
  userId: string
  userName: { lastName?: string | null; firstName?: string | null }
}

function getThisMonday(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  const y = monday.getFullYear()
  const m = String(monday.getMonth() + 1).padStart(2, '0')
  const d = String(monday.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function CalendarApp({ woffId }: { woffId: string }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'need_login' | 'error'>('loading')
  const [token, setToken] = useState('')
  const [user, setUser] = useState<UserProfile | null>(null)
  const [weekStart, setWeekStart] = useState(getThisMonday())
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)

  // WOFF SDK 初期化 + 認証
  useEffect(() => {
    async function init() {
      try {
        if (typeof window === 'undefined' || !window.woff) {
          setStatus('error')
          return
        }

        await window.woff.init({ woffId })

        // 外部ブラウザの場合、ログインが必要
        if (!window.woff.isInClient() && !window.woff.isLoggedIn()) {
          setStatus('need_login')
          return
        }

        const accessToken = window.woff.getAccessToken()
        setToken(accessToken)

        // バックエンドで認証検証
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
      } catch {
        setStatus('error')
      }
    }
    init()
  }, [woffId])

  // メンバー選択 or 週変更時にカレンダー取得
  useEffect(() => {
    if (status !== 'ready' || selectedMembers.length === 0) {
      setFreeSlots([])
      return
    }

    async function loadSlots() {
      setCalendarLoading(true)
      try {
        const params = new URLSearchParams({
          userIds: selectedMembers.join(','),
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
  }, [status, selectedMembers, weekStart, token])

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

  return (
    <div class="calendar-app">
      <h1 class="app-title">Schedule Coordinator</h1>
      {user && (
        <p class="app-user">
          {user.userName.lastName} {user.userName.firstName} さん
        </p>
      )}

      <MemberSelector
        token={token}
        selectedIds={selectedMembers}
        onSelectionChange={setSelectedMembers}
      />

      <WeekPicker weekStart={weekStart} onWeekChange={setWeekStart} />

      <WeeklyCalendar
        weekStart={weekStart}
        freeSlots={freeSlots}
        loading={calendarLoading}
      />
    </div>
  )
}

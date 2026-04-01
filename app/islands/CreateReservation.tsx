import { useState, useEffect } from 'hono/jsx'
import WeekPicker from './WeekPicker'
import MemberSelector from './MemberSelector'

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

export default function CreateReservation({ woffId }: { woffId: string }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'need_login' | 'error'>('loading')
  const [token, setToken] = useState('')
  const [user, setUser] = useState<UserProfile | null>(null)

  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(60)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [weekStart, setWeekStart] = useState(getThisMonday())
  const [submitting, setSubmitting] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

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
      } catch {
        setStatus('error')
      }
    }
    init()
  }, [woffId])

  const handleSubmit = async () => {
    if (!title.trim() || selectedMembers.length === 0) return

    setSubmitting(true)
    setErrorMsg('')
    try {
      // メンバー情報を取得するために /api/members を呼ぶ
      const membersRes = await fetch('/api/members', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const membersData = await membersRes.json()
      const allMembers: { userId: string; name: string }[] = membersData.members ?? []

      // 選択メンバーの詳細を取得（email は Users API からは name しか取れないので userId ベースで）
      const attendees = selectedMembers.map((id) => {
        const m = allMembers.find((m) => m.userId === id)
        return {
          userId: id,
          name: m?.name ?? id,
          email: '', // email は後でサーバー側で補完可能
        }
      })

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
          onSelectionChange={setSelectedMembers}
        />
      </div>

      <div class="form-section">
        <label class="form-label">対象週</label>
        <WeekPicker weekStart={weekStart} onWeekChange={setWeekStart} />
      </div>

      {errorMsg && <p class="form-error">{errorMsg}</p>}

      <button
        class="form-submit"
        disabled={!title.trim() || selectedMembers.length === 0 || submitting}
        onClick={handleSubmit}
      >
        {submitting ? 'URL を発行中...' : 'URL を発行'}
      </button>
    </div>
  )
}

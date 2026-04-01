import { useState, useEffect } from 'hono/jsx'
import InteractiveCalendar from './InteractiveCalendar'

interface TimeSlot {
  date: string
  start: string
  end: string
}

interface Candidate {
  userId: string
  name: string
  email: string
  slots: TimeSlot[]
}

interface Reservation {
  id: string
  title: string
  duration: number
  creatorUserId: string
  attendees: { userId: string; name: string; email: string }[]
  weekStart: string
  freeSlots: TimeSlot[]
  candidates: Candidate[]
  status: 'open' | 'confirmed'
  confirmedSlot?: TimeSlot
  confirmedEventId?: string
}

export default function ReservationPage({
  woffId,
  reservationId,
}: {
  woffId: string
  reservationId: string
}) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'need_login' | 'error'>('loading')
  const [token, setToken] = useState('')
  const [userId, setUserId] = useState('')
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([])
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState('')

  // WOFF SDK 初期化
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
        setUserId(userData.userId)
        setStatus('ready')
      } catch {
        setStatus('error')
      }
    }
    init()
  }, [woffId])

  // 予約データ取得
  useEffect(() => {
    if (status !== 'ready') return

    async function loadReservation() {
      try {
        const res = await fetch(`/api/reservations/${reservationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          setMessage('予約が見つかりません')
          return
        }
        const data = await res.json()
        setReservation(data.reservation)

        // 自分の既存候補を復元
        const myCandidate = data.reservation.candidates.find(
          (c: Candidate) => c.userId === userId
        )
        if (myCandidate) {
          setSelectedSlots(myCandidate.slots)
        }
      } catch {
        setMessage('データの読み込みに失敗しました')
      }
    }
    loadReservation()
  }, [status, token, reservationId, userId])

  const handleToggleSlot = (slot: TimeSlot) => {
    setSelectedSlots((prev) => {
      // duration ベースのスロットなので date + start で一致判定
      const existing = prev.findIndex(
        (s) => s.date === slot.date && s.start === slot.start
      )
      if (existing >= 0) {
        return prev.filter((_, i) => i !== existing)
      }
      return [...prev, slot]
    })
  }

  const handleSaveCandidates = async () => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`/api/reservations/${reservationId}/candidates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slots: selectedSlots }),
      })

      if (!res.ok) {
        const data = await res.json()
        setMessage(data.error || 'エラーが発生しました')
        return
      }

      setMessage('候補を保存しました')
      // リロードして最新データ反映
      const reloadRes = await fetch(`/api/reservations/${reservationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (reloadRes.ok) {
        const data = await reloadRes.json()
        setReservation(data.reservation)
      }
    } catch {
      setMessage('通信エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirm = async () => {
    if (!confirm('最も早い候補時間で予約を確定しますか？')) return

    setConfirming(true)
    setMessage('')
    try {
      const res = await fetch(`/api/reservations/${reservationId}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json()
        setMessage(data.error || 'エラーが発生しました')
        return
      }

      const data = await res.json()
      setMessage(`予約を確定しました (${data.confirmedSlot.date} ${data.confirmedSlot.start}〜${data.confirmedSlot.end})`)

      // リロード
      const reloadRes = await fetch(`/api/reservations/${reservationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json()
        setReservation(reloadData.reservation)
      }
    } catch {
      setMessage('通信エラーが発生しました')
    } finally {
      setConfirming(false)
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
    return <div class="app-status app-status--error">認証エラーが発生しました。</div>
  }

  if (!reservation) {
    return <div class="app-status">読み込み中...</div>
  }

  const isConfirmed = reservation.status === 'confirmed'

  return (
    <div class="calendar-app reservation-page">
      <h1 class="app-title">{reservation.title}</h1>

      {isConfirmed && reservation.confirmedSlot && (
        <div class="confirmed-banner">
          予約確定済み: {reservation.confirmedSlot.date}{' '}
          {reservation.confirmedSlot.start}〜{reservation.confirmedSlot.end}
        </div>
      )}

      <div class="reservation-info">
        <p class="reservation-info__members">
          出席者: {reservation.attendees.map((a) => a.name).join(', ')}
        </p>
        {reservation.candidates.length > 0 && (
          <p class="reservation-info__candidates">
            候補入力済み: {reservation.candidates.map((c) => c.name).join(', ')}
          </p>
        )}
      </div>

      <div class="calendar-legend">
        <span class="legend-item"><span class="legend-color slot-free"></span>予約可能</span>
        <span class="legend-item"><span class="legend-color slot-busy"></span>予約不可</span>
        <span class="legend-item"><span class="legend-color slot-selected"></span>自分の候補</span>
        <span class="legend-item"><span class="legend-color slot-other-candidate"></span>他の候補</span>
        {isConfirmed && (
          <span class="legend-item"><span class="legend-color slot-confirmed"></span>確定</span>
        )}
      </div>

      <InteractiveCalendar
        weekStart={reservation.weekStart}
        freeSlots={reservation.freeSlots}
        duration={reservation.duration}
        candidates={reservation.candidates}
        currentUserId={userId}
        selectedSlots={selectedSlots}
        onToggleSlot={handleToggleSlot}
        confirmed={isConfirmed}
        confirmedSlot={reservation.confirmedSlot}
      />

      {message && <p class="reservation-message">{message}</p>}

      {!isConfirmed && (
        <div class="reservation-actions">
          <button
            class="btn btn--primary"
            disabled={saving || selectedSlots.length === 0}
            onClick={handleSaveCandidates}
          >
            {saving ? '保存中...' : '候補を保存'}
          </button>
          <button
            class="btn btn--confirm"
            disabled={confirming || reservation.candidates.length === 0}
            onClick={handleConfirm}
          >
            {confirming ? '確定中...' : '予約を取る'}
          </button>
        </div>
      )}
    </div>
  )
}

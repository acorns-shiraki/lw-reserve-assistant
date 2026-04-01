import { useState, useEffect, useRef } from 'hono/jsx'

interface Member {
  userId: string
  name: string
}

interface MemberSelectorProps {
  token: string
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}

export default function MemberSelector({ token, selectedIds, onSelectionChange }: MemberSelectorProps) {
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await fetch('/api/members', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setAllMembers(data.members)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    loadMembers()
  }, [token])

  // 外側クリックでドロップダウンを閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedMembers = allMembers.filter((m) => selectedIds.includes(m.userId))

  const filtered = query.trim()
    ? allMembers
        .filter((m) => !selectedIds.includes(m.userId))
        .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 20)
    : []

  const handleSelect = (member: Member) => {
    onSelectionChange([...selectedIds, member.userId])
    setQuery('')
    setShowDropdown(false)
  }

  const handleRemove = (userId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== userId))
  }

  if (loading) return <div class="member-selector">読み込み中...</div>

  return (
    <div class="member-selector" ref={containerRef}>
      {/* 選択済みメンバー（チップ表示） */}
      <div class="member-chips">
        {selectedMembers.map((m) => (
          <span class="member-chip" key={m.userId}>
            {m.name}
            <button
              class="member-chip__remove"
              type="button"
              onClick={() => handleRemove(m.userId)}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* 検索入力 */}
      <div class="member-search-wrapper">
        <input
          type="text"
          class="member-search"
          placeholder="メンバーを検索..."
          value={query}
          onInput={(e) => {
            setQuery((e.target as HTMLInputElement).value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
        />

        {/* ドロップダウン候補 */}
        {showDropdown && filtered.length > 0 && (
          <div class="member-dropdown">
            {filtered.map((m) => (
              <button
                class="member-dropdown__item"
                type="button"
                key={m.userId}
                onClick={() => handleSelect(m)}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedIds.length === 0 && (
        <p class="member-hint">名前を入力してメンバーを追加してください</p>
      )}
    </div>
  )
}

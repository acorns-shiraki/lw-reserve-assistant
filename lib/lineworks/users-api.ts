import type { UserProfile } from './types'

const API_BASE = 'https://www.worksapis.com/v1.0'

interface UsersResponse {
  users: UserProfile[]
  responseMetaData?: {
    nextCursor?: string
  }
}

export async function fetchDomainUsers(
  accessToken: string,
  domainId: string
): Promise<UserProfile[]> {
  const allUsers: UserProfile[] = []
  let cursor: string | undefined

  do {
    const params = new URLSearchParams({ domainId })
    if (cursor) {
      params.set('cursor', cursor)
    }

    const url = `${API_BASE}/users?${params}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      console.error('[users-api] failed:', res.status, await res.text())
      return allUsers
    }

    const data = (await res.json()) as UsersResponse
    allUsers.push(...data.users)
    cursor = data.responseMetaData?.nextCursor
  } while (cursor)

  return allUsers
}

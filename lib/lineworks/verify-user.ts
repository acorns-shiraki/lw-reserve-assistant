import type { UserProfile } from './types'

export async function verifyWoffUser(accessToken: string): Promise<UserProfile | null> {
  try {
    const res = await fetch('https://www.worksapis.com/v1.0/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) return null

    const data = await res.json()
    return data as UserProfile
  } catch {
    return null
  }
}

import type {} from 'hono'

type Head = {
  title?: string
}

declare module 'hono' {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      head?: Head
    ): Response | Promise<Response>
  }
}

// WOFF SDK グローバル型定義
interface WoffSDK {
  init(config: { woffId: string }): Promise<void>
  getAccessToken(): string
  getProfile(): Promise<{ userId: string; displayName: string }>
  isInClient(): boolean
  isLoggedIn(): boolean
  login(config?: { redirectUri?: string; domain?: string }): void
  logout(): void
  closeWindow(): void
}

declare global {
  interface Window {
    woff: WoffSDK
  }
  var woff: WoffSDK
}

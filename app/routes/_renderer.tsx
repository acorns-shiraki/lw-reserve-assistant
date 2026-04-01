import { jsxRenderer } from 'hono/jsx-renderer'
import { Script } from 'honox/server'

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title ?? 'Schedule Coordinator'}</title>
        <script
          charset="utf-8"
          src="https://static.worksmobile.net/static/wm/woff/edge/3.7.1/sdk.js"
        />
        <link rel="stylesheet" href="/app/style.css" />
        <Script src="/app/client.ts" />
      </head>
      <body>
        <div id="app">{children}</div>
      </body>
    </html>
  )
})

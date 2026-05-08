import { jsxRenderer } from 'hono/jsx-renderer'
import { Script } from 'honox/server'

interface OgpMeta {
  title: string
  description: string
}

export default jsxRenderer(({ children, title, ogp }: { children: any; title?: string; ogp?: OgpMeta }) => {
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title ?? 'Schedule Coordinator'}</title>
        {ogp && (
          <>
            <meta property="og:title" content={ogp.title} />
            <meta property="og:description" content={ogp.description} />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:title" content={ogp.title} />
            <meta name="twitter:description" content={ogp.description} />
          </>
        )}
        <script
          charset="utf-8"
          src="https://static.worksmobile.net/static/wm/woff/edge/3.7.1/sdk.js"
        />
        <link rel="stylesheet" href="/app/style.css" />
        {import.meta.env.PROD
          ? <script type="module" src="/static/client.js" />
          : <Script src="/app/client.ts" />
        }
      </head>
      <body>
        <div id="app">{children}</div>
      </body>
    </html>
  )
})

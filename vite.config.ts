import { defineConfig, loadEnv } from 'vite'
import honox from 'honox/vite'
import build from '@hono/vite-build/node'

const awsSdkExternal = [
  '@aws-sdk/client-dynamodb',
  '@aws-sdk/lib-dynamodb',
  '@aws-sdk/util-dynamodb',
  '@aws-sdk/client-secrets-manager',
]

export default defineConfig(({ mode }) => {
  // .env.local / .env をすべて読み込み process.env に注入
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }

  if (mode === 'client') {
    return {
      build: {
        rollupOptions: {
          input: ['./app/client.ts'],
          output: {
            entryFileNames: 'static/client.js',
            chunkFileNames: 'static/assets/[name]-[hash].js',
            assetFileNames: 'static/assets/[name]-[hash][extname]',
          },
        },
      },
    }
  }

  // SSR build for Lambda
  if (process.env.BUILD_TARGET === 'lambda') {
    return {
      ssr: {
        external: awsSdkExternal,
      },
      build: {
        ssr: './lambda-entry.ts',
        outDir: 'dist',
        rollupOptions: {
          external: awsSdkExternal,
          output: {
            entryFileNames: 'index.js',
          },
        },
      },
      plugins: [honox()],
    }
  }

  // Dev server
  return {
    server: {
      allowedHosts: true,
    },
    ssr: {
      external: awsSdkExternal,
    },
    plugins: [
      honox(),
      build({
        entry: './app/server.ts',
      }),
    ],
  }
})

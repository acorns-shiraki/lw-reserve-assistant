import { execSync } from 'child_process'
import { writeFileSync, cpSync, rmSync } from 'fs'

const run = (cmd, env) => execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } })

// 1. クライアントビルド → dist/static/
run('npx vite build --mode client')

// 2. static/ を一時退避
cpSync('dist/static', '_static_tmp', { recursive: true })

// 3. Lambda SSRビルド → dist/index.js（dist/ を上書き）
run('npx vite build', { BUILD_TARGET: 'lambda' })

// 4. static/ を dist/ に戻す
cpSync('_static_tmp', 'dist/static', { recursive: true })
rmSync('_static_tmp', { recursive: true })

// 5. CSSをコピー
cpSync('app/style.css', 'dist/app/style.css')

// 6. ESM用 package.json
writeFileSync('dist/package.json', '{"type":"module"}')

console.log('\nBuild complete!')

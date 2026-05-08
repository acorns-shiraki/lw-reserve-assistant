import { handle } from 'hono/aws-lambda'
import app from './app/server'

export const handler = handle(app)
export default app

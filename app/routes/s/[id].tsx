import { createRoute } from 'honox/factory'
import { getReservation } from '../../../lib/db/reservations'
import { getEnv } from '../../../lib/env'
import ReservationPage from '../../islands/ReservationPage'

export default createRoute(async (c) => {
  const woffId = process.env.WOFF_ID ?? ''
  const id = c.req.param('id')!

  const env = await getEnv()
  const reservation = await getReservation(
    env.DYNAMO_TABLE_RESERVATIONS,
    id,
    env.DYNAMO_ENDPOINT
  )

  const title = reservation?.title ?? 'Schedule Coordinator'
  const description = reservation
    ? `${reservation.attendees.map((a) => a.name).join(', ')} - ${reservation.duration >= 60 ? `${reservation.duration / 60}時間` : `${reservation.duration}分`}`
    : '候補時間を入力してください'

  return c.render(
    <ReservationPage woffId={woffId} reservationId={id} />,
    {
      title,
      ogp: { title, description },
    }
  )
})

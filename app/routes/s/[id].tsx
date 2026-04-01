import { createRoute } from 'honox/factory'
import ReservationPage from '../../islands/ReservationPage'

export default createRoute((c) => {
  const woffId = process.env.WOFF_ID ?? ''
  const id = c.req.param('id')!
  return c.render(
    <ReservationPage woffId={woffId} reservationId={id} />,
    { title: 'Schedule Coordinator' }
  )
})

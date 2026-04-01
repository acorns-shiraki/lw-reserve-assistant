import { createRoute } from 'honox/factory'
import CreateReservation from '../islands/CreateReservation'

export default createRoute((c) => {
  const woffId = process.env.WOFF_ID ?? ''
  return c.render(
    <CreateReservation woffId={woffId} />,
    { title: 'Schedule Coordinator' }
  )
})

import { Router } from 'express'
import { listarNotificaciones, marcarLeida, notificacionesNoLeidas } from '../controllers/notificacionesController.js'

const router = Router()

router.get('/', listarNotificaciones)
router.get('/no-leidas', notificacionesNoLeidas)
router.put('/:id/leer', marcarLeida)

export default router

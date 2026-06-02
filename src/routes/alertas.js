import { Router } from 'express'
import { listarAlertas, alertasRecientes } from '../controllers/alertasController.js'

const router = Router()

router.get('/', listarAlertas)
router.get('/recientes', alertasRecientes)

export default router

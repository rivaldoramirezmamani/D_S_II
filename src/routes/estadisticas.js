import { Router } from 'express'
import { obtenerEstadisticas } from '../controllers/estadisticasController.js'

const router = Router()

router.get('/', obtenerEstadisticas)

export default router

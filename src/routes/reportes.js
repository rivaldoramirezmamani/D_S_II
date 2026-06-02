import { Router } from 'express'
import { crearReporte, listarReportes, validarReporte } from '../controllers/reportesController.js'

const router = Router()

router.post('/', crearReporte)
router.get('/', listarReportes)
router.post('/:id/validar', validarReporte)

export default router

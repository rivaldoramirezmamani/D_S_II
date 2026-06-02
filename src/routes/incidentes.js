import { Router } from 'express'
import { crearIncidente, listarIncidentes, validarIncidente } from '../controllers/incidentesController.js'

const router = Router()

router.post('/', crearIncidente)
router.get('/', listarIncidentes)
router.post('/:id/validar', validarIncidente)

export default router

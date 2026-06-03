import { Router } from 'express'
import multer from 'multer'
import { crearIncidente, listarIncidentes, validarIncidente } from '../controllers/incidentesController.js'

const upload = multer({ storage: multer.memoryStorage() })

const router = Router()

router.post('/', upload.single('evidencia'), crearIncidente)
router.get('/', listarIncidentes)
router.post('/:id/validar', validarIncidente)

export default router

import { Router } from 'express'
import { obtenerDatosMapa } from '../controllers/mapaController.js'

const router = Router()

router.get('/datos', obtenerDatosMapa)

export default router

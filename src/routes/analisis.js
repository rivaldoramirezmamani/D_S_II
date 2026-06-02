import { Router } from 'express'
import { obtenerAnalisis, preguntarIA } from '../controllers/analisisController.js'

const router = Router()

router.get('/', obtenerAnalisis)
router.post('/chat', preguntarIA)

export default router

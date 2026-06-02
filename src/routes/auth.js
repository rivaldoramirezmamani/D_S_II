import { Router } from 'express'
import { registrar, obtenerPerfil, seedAuth } from '../controllers/authController.js'

const router = Router()

router.post('/register', registrar)
router.get('/me', obtenerPerfil)
router.get('/seed', seedAuth)

export default router

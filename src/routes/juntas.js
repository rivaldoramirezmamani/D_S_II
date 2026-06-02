import { Router } from 'express'
import { verificarToken } from '../middleware/auth.js'
import { listarJuntas, listarRoles, listarBarrios, crearJunta } from '../controllers/juntasController.js'

const router = Router()

router.get('/', listarJuntas)
router.get('/roles', listarRoles)
router.get('/barrios', listarBarrios)
router.post('/', verificarToken, crearJunta)

export default router

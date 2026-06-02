import { Router } from 'express'
import { crearPatrullaje, listarPatrullajes } from '../controllers/patrullajesController.js'

const router = Router()

router.post('/', crearPatrullaje)
router.get('/', listarPatrullajes)

export default router

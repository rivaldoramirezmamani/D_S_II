import { Router } from 'express'
import { preguntar } from '../controllers/chatController.js'

const router = Router()

router.post('/', preguntar)

export default router

import { Router } from 'express'
import { crearUsuario, listarUsuarios, actualizarUsuario, eliminarUsuario } from '../controllers/usuariosController.js'

const router = Router()

router.post('/', crearUsuario)
router.get('/', listarUsuarios)
router.put('/:id', actualizarUsuario)
router.delete('/:id', eliminarUsuario)

export default router

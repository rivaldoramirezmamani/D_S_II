import { supabase } from '../config/supabase.js'

export async function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).json({ error: 'Token requerido' })
    }

    const token = authHeader.replace('Bearer ', '')

    try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser(token)
        if (error || !authUser) {
            return res.status(401).json({ error: 'Token inválido o expirado' })
        }

        const { data: perfil } = await supabase
            .from('usuario')
            .select(`
                id_usuario, nombres, apellidos, telefono, correo,
                id_rol, id_junta,
                rol: id_rol (id_rol, nombre_rol),
                junta_vecinal: id_junta (id_junta, nombre, id_barrio)
            `)
            .eq('correo', authUser.email)
            .maybeSingle()

        if (!perfil) {
            return res.status(401).json({ error: 'Perfil de usuario no encontrado' })
        }

        req.user = {
            id_usuario: perfil.id_usuario,
            id_rol: perfil.id_rol,
            id_junta: perfil.id_junta,
            correo: perfil.correo,
            nombres: perfil.nombres,
            apellidos: perfil.apellidos,
            rol: perfil.rol,
            junta_vecinal: perfil.junta_vecinal
        }

        next()
    } catch (error) {
        console.error('Error en middleware auth:', error)
        res.status(500).json({ error: 'Error interno de autenticación' })
    }
}

export function verificarRol(...rolesPermitidos) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' })
        }
        if (!rolesPermitidos.includes(req.user.id_rol)) {
            return res.status(403).json({ error: 'No tienes permisos para esta operación' })
        }
        next()
    }
}

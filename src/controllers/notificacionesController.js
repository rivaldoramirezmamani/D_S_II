import { supabase } from '../config/supabase.js'

export async function listarNotificaciones(req, res) {
    try {
        let query = supabase
            .from('notificacion')
            .select('*')
            .order('fecha_envio', { ascending: false })

        if (req.user.id_rol === 2) {
            query = query.eq('id_usuario', req.user.id_usuario)
        } else if (req.user.id_rol === 3) {
            query = query.eq('id_usuario', req.user.id_usuario)
        }

        const { data, error } = await query

        if (error) throw error
        res.json(data || [])
    } catch (error) {
        console.error('Error al listar notificaciones:', error)
        res.status(500).json({ error: 'Error al cargar notificaciones' })
    }
}

export async function marcarLeida(req, res) {
    try {
        const { id } = req.params
        const { error } = await supabase
            .from('notificacion')
            .update({ leido: true })
            .eq('id_notificacion', id)

        if (error) throw error
        res.json({ success: true })
    } catch (error) {
        console.error('Error al marcar notificación:', error)
        res.status(500).json({ error: 'Error al actualizar notificación' })
    }
}

export async function notificacionesNoLeidas(req, res) {
    try {
        let query = supabase
            .from('notificacion')
            .select('*', { count: 'exact', head: true })
            .eq('leido', false)

        if (req.user.id_rol === 2 || req.user.id_rol === 3) {
            query = query.eq('id_usuario', req.user.id_usuario)
        }

        const { count, error } = await query

        if (error) throw error
        res.json({ count: count || 0 })
    } catch (error) {
        console.error('Error al contar notificaciones:', error)
        res.status(500).json({ error: 'Error al contar notificaciones' })
    }
}

import { supabase } from '../config/supabase.js'

export async function crearPatrullaje(req, res) {
    try {
        if (![1, 3].includes(req.user.id_rol)) {
            return res.status(403).json({ error: 'No tienes permiso para crear patrullajes' })
        }

        const { fecha, hora_inicio, hora_fin, responsable, zona, estado, observaciones } = req.body

        if (!fecha || !hora_inicio || !responsable) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' })
        }

        const { data, error } = await supabase
            .from('patrullaje')
            .insert({
                fecha,
                hora_inicio,
                hora_fin: hora_fin || null,
                observaciones: observaciones || '',
                estado: estado || 'Activo',
                id_usuario: req.user.id_usuario
            })
            .select()
            .maybeSingle()

        if (error) {
            if (error.code === '42501') {
                return res.status(403).json({
                    error: 'La tabla patrullaje tiene RLS activado. Ejecuta el SQL de configuración en el panel de Supabase.'
                })
            }
            throw error
        }

        res.status(201).json({ mensaje: 'Patrullaje registrado exitosamente', patrullaje: data })
    } catch (error) {
        console.error('Error al crear patrullaje:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

export async function listarPatrullajes(req, res) {
    try {
        let query = supabase
            .from('patrullaje')
            .select(`
                *,
                usuario: id_usuario (nombres, apellidos)
            `)

        if (req.user.id_rol === 3) {
            query = query.eq('id_usuario', req.user.id_usuario)
        }

        const { data, error } = await query
            .order('fecha', { ascending: false })
            .limit(50)

        if (error) throw error
        res.json(data || [])
    } catch (error) {
        console.error('Error al listar patrullajes:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

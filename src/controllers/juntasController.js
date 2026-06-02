import { supabase } from '../config/supabase.js'

export async function listarJuntas(req, res) {
    try {
        const { data, error } = await supabase
            .from('junta_vecinal')
            .select('*, barrio: id_barrio (id_barrio, nombre, nivel_riesgo, descripcion)')
            .order('nombre')

        if (error) throw error

        const resultado = []
        for (const j of (data || [])) {
            const { count: totalMiembros } = await supabase
                .from('usuario')
                .select('*', { count: 'exact', head: true })
                .eq('id_junta', j.id_junta)

            resultado.push({
                ...j,
                total_miembros: totalMiembros || 0
            })
        }

        res.json(resultado)
    } catch (error) {
        console.error('Error al listar juntas:', error)
        res.status(500).json({ error: 'Error al cargar juntas vecinales' })
    }
}

export async function listarRoles(req, res) {
    try {
        const { data, error } = await supabase
            .from('rol')
            .select('id_rol, nombre_rol')
            .order('nombre_rol')

        if (error) throw error
        res.json(data || [])
    } catch (error) {
        console.error('Error al listar roles:', error)
        res.status(500).json({ error: 'Error al cargar roles' })
    }
}

export async function crearJunta(req, res) {
    try {
        if (req.user.id_rol !== 1) {
            return res.status(403).json({ error: 'Solo el administrador puede crear juntas' })
        }

        const { nombre, descripcion, id_barrio, fecha_creacion } = req.body
        if (!nombre || !id_barrio) {
            return res.status(400).json({ error: 'Nombre y barrio son obligatorios' })
        }
        const { data, error } = await supabase
            .from('junta_vecinal')
            .insert([{ nombre, descripcion, id_barrio, fecha_creacion: fecha_creacion || new Date() }])
            .select()
            .single()

        if (error) throw error
        res.status(201).json(data)
    } catch (error) {
        console.error('Error al crear junta:', error)
        res.status(500).json({ error: 'Error al crear junta vecinal' })
    }
}

export async function listarBarrios(req, res) {
    try {
        const { data, error } = await supabase
            .from('barrio')
            .select('id_barrio, nombre')
            .order('nombre')

        if (error) throw error
        res.json(data || [])
    } catch (error) {
        console.error('Error al listar barrios:', error)
        res.status(500).json({ error: 'Error al cargar barrios' })
    }
}

import { supabase } from '../config/supabase.js'

export async function listarAlertas(req, res) {
    try {
        let query = supabase
            .from('alerta')
            .select('*')

        if (req.user.id_rol === 2 && req.user.junta_vecinal?.id_barrio) {
            const { data: calles } = await supabase
                .from('calle')
                .select('id_calle')
                .eq('id_barrio', req.user.junta_vecinal.id_barrio)
            const idsCalles = (calles || []).map(c => c.id_calle)
            const idsInc = []
            const idsRep = []
            if (idsCalles.length > 0) {
                const { data: incidentes } = await supabase
                    .from('incidente')
                    .select('id_incidente')
                    .in('id_ubicacion', idsCalles)
                idsInc.push(...(incidentes || []).map(i => i.id_incidente))
                const { data: reportes } = await supabase
                    .from('reporte')
                    .select('id_reporte')
                    .in('id_ubicacion', idsCalles)
                idsRep.push(...(reportes || []).map(r => r.id_reporte))
            }
            const filtros = []
            if (idsInc.length > 0) filtros.push(`id_incidente.in.(${idsInc.join(',')})`)
            if (idsRep.length > 0) filtros.push(`id_reporte.in.(${idsRep.join(',')})`)
            if (filtros.length > 0) {
                query = query.or(filtros.join(','))
            } else {
                query = query.in('id_incidente', [0])
            }
        }

        const { data, error } = await query.order('fecha', { ascending: false })

        if (error) throw error
        res.json(data || [])
    } catch (error) {
        console.error('Error al listar alertas:', error)
        res.status(500).json({ error: 'Error al cargar alertas' })
    }
}

export async function alertasRecientes(req, res) {
    try {
        const { data, error } = await supabase
            .from('alerta')
            .select('*')
            .order('fecha', { ascending: false })
            .limit(10)

        if (error) throw error
        res.json(data || [])
    } catch (error) {
        console.error('Error al cargar alertas recientes:', error)
        res.status(500).json({ error: 'Error al cargar alertas recientes' })
    }
}

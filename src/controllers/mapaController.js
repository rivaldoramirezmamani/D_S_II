import { supabase } from '../config/supabase.js'

export async function obtenerDatosMapa(req, res) {
    try {
        const { data: incidentes } = await supabase
            .from('incidente')
            .select('id_incidente, descripcion, fecha_hora, estado, id_tipo_incidente, id_ubicacion')
            .eq('estado', 'Validado')
            .not('id_ubicacion', 'is', null)

        const { data: reportes } = await supabase
            .from('reporte')
            .select('id_reporte, descripcion, fecha_reporte, estado, id_tipo_reporte, id_ubicacion')
            .eq('estado', 'Atendido')
            .not('id_ubicacion', 'is', null)

        const { data: ubicaciones } = await supabase
            .from('ubicacion')
            .select('id_ubicacion, latitud, longitud, referencia, id_calle')

        const { data: calles } = await supabase
            .from('calle')
            .select('id_calle, nombre')

        const { data: tiposInc } = await supabase
            .from('tipo_incidente')
            .select('id_tipo_incidente, nombre')

        const { data: tiposRep } = await supabase
            .from('tipo_reporte')
            .select('id_tipo_reporte, nombre')

        const ubiMap = new Map((ubicaciones || []).map(u => [u.id_ubicacion, u]))
        const calleMap = new Map((calles || []).map(c => [c.id_calle, c]))
        const tipoIncMap = new Map((tiposInc || []).map(t => [t.id_tipo_incidente, t]))
        const tipoRepMap = new Map((tiposRep || []).map(t => [t.id_tipo_reporte, t]))

        const puntos = []

        if (incidentes) {
            incidentes.forEach(i => {
                const ubi = ubiMap.get(i.id_ubicacion)
                if (ubi && ubi.latitud && ubi.longitud) {
                    const calle = calleMap.get(ubi.id_calle)
                    const tipo = tipoIncMap.get(i.id_tipo_incidente)
                    puntos.push({
                        id: i.id_incidente,
                        tipo: 'incidente',
                        nombre: tipo?.nombre || 'Incidente',
                        descripcion: i.descripcion,
                        estado: i.estado,
                        fecha: i.fecha_hora,
                        latitud: parseFloat(ubi.latitud),
                        longitud: parseFloat(ubi.longitud),
                        lugar: calle?.nombre || ubi.referencia || ''
                    })
                }
            })
        }

        if (reportes) {
            reportes.forEach(r => {
                const ubi = ubiMap.get(r.id_ubicacion)
                if (ubi && ubi.latitud && ubi.longitud) {
                    const calle = calleMap.get(ubi.id_calle)
                    const tipo = tipoRepMap.get(r.id_tipo_reporte)
                    puntos.push({
                        id: r.id_reporte,
                        tipo: 'reporte',
                        nombre: tipo?.nombre || 'Reporte',
                        descripcion: r.descripcion,
                        estado: r.estado,
                        fecha: r.fecha_reporte,
                        latitud: parseFloat(ubi.latitud),
                        longitud: parseFloat(ubi.longitud),
                        lugar: calle?.nombre || ubi.referencia || ''
                    })
                }
            })
        }

        res.json(puntos)
    } catch (error) {
        console.error('Error al obtener datos del mapa:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

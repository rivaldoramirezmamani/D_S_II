import { supabase } from '../config/supabase.js'

export async function obtenerEstadisticas(req, res) {
    try {
        const hoy = new Date()
        const hace30 = new Date(hoy)
        hace30.setDate(hace30.getDate() - 30)

        const { data: incValidados } = await supabase
            .from('incidente')
            .select('id_incidente')
            .eq('estado', 'Validado')
        const totalIncidentes = incValidados?.length || 0

        const { data: inc30d } = await supabase
            .from('incidente')
            .select('id_incidente')
            .gte('fecha_hora', hace30.toISOString())
            .eq('estado', 'Validado')
        const incidentes30d = inc30d?.length || 0

        const { count: totalReportes } = await supabase
            .from('reporte')
            .select('*', { count: 'exact', head: true })

        const { data: repAt } = await supabase
            .from('reporte')
            .select('id_reporte')
            .eq('estado', 'Atendido')
        const reportesAtendidos = repAt?.length || 0

        const { count: totalUsuarios } = await supabase
            .from('usuario')
            .select('*', { count: 'exact', head: true })

        const { data: zonasCriticas } = await supabase
            .from('prediccion_riesgo')
            .select('*')
            .eq('nivel_riesgo', 'Alto')

        const { data: ultimaPrediccion } = await supabase
            .from('prediccion_riesgo')
            .select('*')
            .order('fecha_generacion', { ascending: false })
            .limit(1)
            .maybeSingle()

        const riesgo = ultimaPrediccion?.nivel_riesgo || 'Medio'

        const { data: tiposIncidentes } = await supabase
            .from('tipo_incidente')
            .select('id_tipo_incidente, nombre')

        let tiposDistribucion = []
        if (tiposIncidentes) {
            for (const t of tiposIncidentes) {
                const { count } = await supabase
                    .from('incidente')
                    .select('*', { count: 'exact', head: true })
                    .eq('id_tipo_incidente', t.id_tipo_incidente)
                    .eq('estado', 'Validado')
                if (count > 0) {
                    tiposDistribucion.push({ nombre: t.nombre, count })
                }
            }
        }

        const { data: alertas } = await supabase
            .from('alerta')
            .select('*')
            .order('fecha', { ascending: false })
            .limit(5)

        const { data: barrios } = await supabase
            .from('barrio')
            .select('id_barrio, nombre, nivel_riesgo')

        res.json({
            riesgo_actual: riesgo,
            total_incidentes: totalIncidentes || 0,
            incidentes_30d: incidentes30d || 0,
            total_reportes: totalReportes || 0,
            reportes_atendidos: reportesAtendidos || 0,
            zonas_criticas: zonasCriticas?.length || 0,
            total_usuarios: totalUsuarios || 0,
            tipos_incidentes: tiposDistribucion,
            alertas: alertas || [],
            barrios: barrios || []
        })
    } catch (error) {
        console.error('Error al obtener estadísticas:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

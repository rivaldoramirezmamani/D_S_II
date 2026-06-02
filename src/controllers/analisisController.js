import { supabase } from '../config/supabase.js'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''

export async function obtenerAnalisis(req, res) {
    try {
        const [
            { data: predicciones },
            { data: tiposIncidente },
            { data: barrios },
            { data: ultimaPrediccion },
            { count: totalIncidentes },
        ] = await Promise.all([
            supabase.from('prediccion_riesgo').select('*, barrio: id_barrio (nombre)').order('fecha_generacion', { ascending: false }),
            supabase.from('tipo_incidente').select('id_tipo_incidente, nombre, gravedad_base'),
            supabase.from('barrio').select('id_barrio, nombre, nivel_riesgo'),
            supabase.from('prediccion_riesgo').select('*').order('fecha_generacion', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('incidente').select('*', { count: 'exact', head: true }),
        ])

        const hoy = new Date()
        const hace30 = new Date(hoy)
        hace30.setDate(hace30.getDate() - 30)

        const [
            { count: incidentesRecientes },
            { data: incidentesPorDia }
        ] = await Promise.all([
            supabase.from('incidente').select('*', { count: 'exact', head: true }).gte('fecha_hora', hace30.toISOString()),
            supabase.from('incidente').select('fecha_hora, id_ubicacion').gte('fecha_hora', hace30.toISOString()),
        ])

        let distribucionTipos = []
        if (tiposIncidente) {
            const counts = await Promise.all(
                tiposIncidente.map(t =>
                    supabase.from('incidente').select('*', { count: 'exact', head: true }).eq('id_tipo_incidente', t.id_tipo_incidente)
                )
            )
            distribucionTipos = tiposIncidente.map((t, i) => ({
                nombre: t.nombre,
                gravedad: t.gravedad_base,
                count: counts[i].count || 0
            }))
        }

        let riesgoPorBarrio = []
        if (barrios) {
            riesgoPorBarrio = barrios.map(b => {
                const count = Array.isArray(incidentesPorDia)
                    ? incidentesPorDia.filter(i => {
                        const idUbicacion = i.id_ubicacion
                        return typeof idUbicacion === 'number' && idUbicacion > 0
                    }).length
                    : 0
                return {
                    barrio: b.nombre,
                    nivel_riesgo: b.nivel_riesgo,
                    total_incidentes: count
                }
            })
        }

        let tendencia = []
        if (incidentesPorDia) {
            const agrupado = {}
            incidentesPorDia.forEach(inc => {
                const dia = inc.fecha_hora ? inc.fecha_hora.split('T')[0] : 'sin-fecha'
                agrupado[dia] = (agrupado[dia] || 0) + 1
            })
            tendencia = Object.entries(agrupado)
                .map(([fecha, count]) => ({ fecha, count }))
                .filter(t => t.fecha !== 'sin-fecha')
                .sort((a, b) => a.fecha.localeCompare(b.fecha))
        }

        const recomendaciones = generarRecomendaciones(distribucionTipos, riesgoPorBarrio)

        res.json({
            predicciones: predicciones || [],
            distribucion_tipos: distribucionTipos,
            riesgo_por_barrio: riesgoPorBarrio,
            total_incidentes: totalIncidentes || 0,
            incidentes_recientes: incidentesRecientes || 0,
            tendencia_diaria: tendencia,
            nivel_riesgo_general: ultimaPrediccion?.nivel_riesgo || 'Medio',
            probabilidad_general: ultimaPrediccion?.probabilidad || 0,
            factores_riesgo: ultimaPrediccion?.factores_riesgo || '',
            recomendaciones
        })
    } catch (error) {
        console.error('Error al obtener análisis:', error)
        res.status(500).json({ error: 'Error al generar análisis' })
    }
}

export async function preguntarIA(req, res) {
    try {
        const { pregunta, historial, contexto, system } = req.body

        if (!pregunta) {
            return res.status(400).json({ error: 'La pregunta es obligatoria' })
        }

        if (!GROQ_API_KEY) {
            return res.status(500).json({ error: 'GROQ_API_KEY no configurada en .env', ok: false })
        }

        const messages = []

        if (system) {
            messages.push({ role: 'system', content: system })
        } else {
            messages.push({
                role: 'system',
                content: 'Eres el asistente de seguridad de Santa Cruz Segura Predictiva. Responde en español de forma útil y concisa.'
            })
        }

        if (historial && Array.isArray(historial)) {
            messages.push(...historial)
        }

        messages.push({ role: 'user', content: pregunta })

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                max_tokens: 1000,
                messages
            })
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            throw new Error(`Error API Groq: ${response.status} - ${err?.error?.message || ''}`)
        }

        const data = await response.json()
        const respuesta = data.choices?.[0]?.message?.content || 'Sin respuesta.'

        res.json({ respuesta, ok: true })
    } catch (error) {
        console.error('Error en chat IA:', error)
        res.status(500).json({ error: error.message, ok: false })
    }
}

function generarRecomendaciones(tipos, barrios) {
    const recs = []
    const altoRiesgo = barrios.filter(b => b.nivel_riesgo === 'Alto')
    if (altoRiesgo.length > 0) {
        recs.push(`Reforzar patrullaje en barrios: ${altoRiesgo.map(b => b.barrio).join(', ')}`)
    }
    const tipoAlto = tipos.filter(t => t.gravedad === 'Alta' && t.count > 0)
    if (tipoAlto.length > 0) {
        recs.push(`Atención prioritaria a incidentes de: ${tipoAlto.map(t => t.nombre).join(', ')}`)
    }
    recs.push('Mantener coordinación con juntas vecinales para prevención')
    recs.push('Implementar campañas de concientización en zonas de riesgo')
    return recs
}

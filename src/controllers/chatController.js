import { supabase } from '../config/supabase.js'

export async function preguntar(req, res) {
    try {
        const { pregunta } = req.body
        if (!pregunta) {
            return res.status(400).json({ error: 'La pregunta es obligatoria' })
        }

        const q = pregunta.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

        const totalIncidentes = await contar('incidente')
        const totalUsuarios = await contar('usuario')
        const totalReportes = await contar('reporte')
        const totalAlertas = await contar('alerta')
        const totalJuntas = await contar('junta_vecinal')

        let respuesta

        if (esPregunta(q, ['total', 'cuantos', 'cuantas', 'cuantos incidentes', 'cuantas incidentes', 'numero de incidentes', 'cantidad de incidentes', 'incidentes hay', 'hay incidentes'])) {
            respuesta = `Hay un total de **${totalIncidentes} incidentes** registrados en el sistema. De ellos, los más frecuentes son robos, violencia y vandalismo.`

        } else if (esPregunta(q, ['robo', 'robos', 'cuantos robos', 'hurtos', 'hurto'])) {
            const count = await contarPorTipo(1)
            respuesta = `Se han registrado **${count} incidentes de robo** en la plataforma. Es el tipo de incidente más común.`

        } else if (esPregunta(q, ['violencia', 'pelea', 'agresion', 'agresión', 'riña'])) {
            const count = await contarPorTipo(2)
            respuesta = `Hay **${count} incidentes de violencia/peleas** reportados. Estos requieren atención prioritaria de las autoridades.`

        } else if (esPregunta(q, ['vandalismo', 'grafiti', 'daños', 'dano'])) {
            const count = await contarPorTipo(3)
            respuesta = `Se reportaron **${count} casos de vandalismo**. Incluyen grafitis y daños a propiedad pública.`

        } else if (esPregunta(q, ['sospechoso', 'sospechosos', 'merodeando'])) {
            const count = await contarPorTipo(4)
            respuesta = `Hay **${count} reportes de personas con actitud sospechosa**. Se recomienda mantener vigilancia en esas zonas.`

        } else if (esPregunta(q, ['riesgo', 'nivel de riesgo', 'barrio riesgo', 'riesgo barrio', 'zona riesgo'])) {
            const { data: barrios } = await supabase.from('barrio').select('nombre, nivel_riesgo').order('nivel_riesgo', { ascending: false })
            if (barrios && barrios.length > 0) {
                const tabla = barrios.map(b => `- **${b.nombre}**: ${b.nivel_riesgo}`).join('\n')
                respuesta = `Estos son los niveles de riesgo por barrio:\n${tabla}`
            } else {
                respuesta = 'No hay datos de riesgo por barrio disponibles.'
            }

        } else if (esPregunta(q, ['alerta', 'alertas', 'alertas recientes', 'ultimas alertas', 'alertas activas'])) {
            const { data: alertas } = await supabase.from('alerta').select('titulo, prioridad, fecha').order('fecha', { ascending: false }).limit(5)
            if (alertas && alertas.length > 0) {
                const lista = alertas.map(a => `- [${a.prioridad}] ${a.titulo} (${new Date(a.fecha).toLocaleDateString('es-BO')})`).join('\n')
                respuesta = `Últimas alertas del sistema:\n${lista}`
            } else {
                respuesta = 'No hay alertas activas en este momento.'
            }

        } else if (esPregunta(q, ['usuario', 'usuarios', 'cuantos usuarios', 'personas registradas', 'miembros'])) {
            respuesta = `Hay **${totalUsuarios} usuarios registrados** en la plataforma, entre vecinos, policías, moderadores y administradores.`

        } else if (esPregunta(q, ['junta', 'juntas', 'junta vecinal', 'vecinal', 'juntas vecinales'])) {
            respuesta = `Existen **${totalJuntas} juntas vecinales** registradas. Cada una agrupa a vecinos organizados de distintos barrios.`

        } else if (esPregunta(q, ['reporte', 'reportes', 'reportes vecinales', 'reporte vecinal'])) {
            respuesta = `Se han generado **${totalReportes} reportes vecinales**. Los más comunes son sobre luminarias dañadas, basura acumulada y ruidos molestos.`

        } else if (esPregunta(q, ['prediccion', 'predicciones', 'prediccion riesgo', 'predicciones riesgo'])) {
            const { data: preds } = await supabase.from('prediccion_riesgo').select('nivel_riesgo, probabilidad, recomendacion, barrio:id_barrio(nombre)').order('probabilidad', { ascending: false }).limit(3)
            if (preds && preds.length > 0) {
                const lista = preds.map(p => `- **${p.barrio?.nombre || 'Barrio'}**: ${p.nivel_riesgo} (${p.probabilidad}% probabilidad)`).join('\n')
                respuesta = `Principales predicciones de riesgo:\n${lista}\n\nRecomendación general: Reforzar patrullaje en zonas de alto riesgo.`
            } else {
                respuesta = 'No hay predicciones de riesgo disponibles.'
            }

        } else if (esPregunta(q, ['patrullaje', 'patrullajes', 'ronda', 'patrullas', 'policia'])) {
            const { data: pats } = await supabase.from('patrullaje').select('fecha, estado, id_usuario').order('fecha', { ascending: false }).limit(5)
            if (pats && pats.length > 0) {
                const completados = pats.filter(p => p.estado === 'Completado').length
                const programados = pats.filter(p => p.estado === 'Programado').length
                respuesta = `Últimos patrullajes: ${completados} completados y ${programados} programados. Se realizaron rondas en distintos horarios para cubrir zonas críticas.`
            } else {
                respuesta = 'No hay registros de patrullajes.'
            }

        } else if (esPregunta(q, ['san pedro', 'villa mayo', 'plan tres mil', 'plan 3000', 'equipetrol', 'hamacas', 'barrio'])) {
            const barrioNombre = q.includes('san pedro') ? 'San Pedro'
                : q.includes('villa mayo') ? 'Villa Primero de Mayo'
                : q.includes('plan tres mil') || q.includes('plan 3000') ? 'Plan Tres Mil'
                : q.includes('equipetrol') ? 'Equipetrol'
                : q.includes('hamacas') ? 'Hamacas'
                : null
            if (barrioNombre) {
                const { data: barrio } = await supabase.from('barrio').select('*').ilike('nombre', `%${barrioNombre}%`).maybeSingle()
                if (barrio) {
                    respuesta = `**${barrio.nombre}** — ${barrio.descripcion || 'Sin descripción'}\nNivel de riesgo: **${barrio.nivel_riesgo || 'No definido'}**`
                } else {
                    respuesta = `No encontré información sobre "${barrioNombre}" en la base de datos.`
                }
            } else {
                respuesta = 'Los barrios registrados son: San Pedro, Villa Primero de Mayo, Plan Tres Mil, Equipetrol y Hamacas.'
            }

        } else if (esPregunta(q, ['hola', 'buenas', 'buen dia', 'buenos dias', 'buenas tardes', 'que tal', 'como estas', 'saludos'])) {
            respuesta = `¡Hola! Soy el asistente IA de **Santa Cruz Segura Predictiva**. Actualmente hay **${totalIncidentes} incidentes** registrados y **${totalUsuarios} usuarios** activos. ¿En qué puedo ayudarte? Puedes preguntarme sobre incidentes, barrios, alertas, patrullajes, juntas vecinales y más.`

        } else if (esPregunta(q, ['ayuda', 'help', 'que puedes hacer', 'que preguntas', 'funciones', 'que haces', 'comandos'])) {
            respuesta = `Puedo ayudarte con estas consultas:\n` +
                `- 📊 **Incidentes**: total, robos, violencia, vandalismo, sospechosos\n` +
                `- 🏘️ **Barrios**: nivel de riesgo, información específica\n` +
                `- 🔔 **Alertas**: últimas alertas del sistema\n` +
                `- 👥 **Usuarios**: cantidad de personas registradas\n` +
                `- 🏛️ **Juntas Vecinales**: cuántas hay registradas\n` +
                `- 📋 **Reportes**: reportes vecinales\n` +
                `- 🚔 **Patrullajes**: rondas y estado\n` +
                `- 🔮 **Predicciones**: riesgo por barrio\n` +
                `- 📈 **Tendencias**: datos generales del sistema\n\n` +
                `¡Solo pregúntame lo que necesites saber!`

        } else {
            // fallback: buscar en la base de datos coincidencias de texto
            const busqueda = await buscarEnBD(q)
            if (busqueda) {
                respuesta = busqueda
            } else {
                respuesta = `No entendí bien tu pregunta. Intenté buscar en la base de datos y no encontré coincidencias claras. Puedes preguntar por:\n\n` +
                    `• Incidentes (totales, robos, violencia, vandalismo)\n` +
                    `• Barrios y niveles de riesgo\n` +
                    `• Alertas activas\n` +
                    `• Usuarios registrados\n` +
                    `• Juntas vecinales\n` +
                    `• Reportes vecinales\n` +
                    `• Patrullajes\n` +
                    `• Predicciones de riesgo\n\n` +
                    `Ejemplos: "¿Cuántos incidentes hay?", "¿Qué barrio tiene más riesgo?", "Muéstrame las alertas recientes"`
            }
        }

        res.json({ respuesta, ok: true })
    } catch (error) {
        console.error('Error en chat:', error)
        res.status(500).json({ error: 'Error al procesar la pregunta', ok: false })
    }
}

async function buscarEnBD(q) {
    try {
        const qLike = `%${q}%`
        const partes = []

        // Incidentes: buscar en titulo o descripcion
        const { data: incs } = await supabase.from('incidente').select('id, titulo, descripcion, fecha').or(`titulo.ilike.${qLike},descripcion.ilike.${qLike}`).limit(5)
        if (incs && incs.length) {
            partes.push('Coincidencias en incidentes:')
            incs.forEach(i => partes.push(`- [Incidente ${i.id}] ${i.titulo || i.descripcion || 'Sin título'} (${i.fecha ? new Date(i.fecha).toLocaleDateString('es-BO') : 'fecha desconocida'})`))
        }

        // Alertas
        const { data: alts } = await supabase.from('alerta').select('id, titulo, prioridad, fecha').ilike('titulo', qLike).limit(5)
        if (alts && alts.length) {
            partes.push('Coincidencias en alertas:')
            alts.forEach(a => partes.push(`- [Alerta] [${a.prioridad || 'Media'}] ${a.titulo} (${a.fecha ? new Date(a.fecha).toLocaleDateString('es-BO') : 'fecha'})`))
        }

        // Reportes
        const { data: reps } = await supabase.from('reporte').select('id, titulo, descripcion, fecha').or(`titulo.ilike.${qLike},descripcion.ilike.${qLike}`).limit(5)
        if (reps && reps.length) {
            partes.push('Coincidencias en reportes:')
            reps.forEach(r => partes.push(`- [Reporte ${r.id}] ${r.titulo || r.descripcion}`))
        }

        // Barrios
        const { data: barrios } = await supabase.from('barrio').select('id, nombre, descripcion, nivel_riesgo').ilike('nombre', qLike).limit(5)
        if (barrios && barrios.length) {
            partes.push('Coincidencias en barrios:')
            barrios.forEach(b => partes.push(`- ${b.nombre} — Nivel de riesgo: ${b.nivel_riesgo || 'No definido'}`))
        }

        // Usuarios
        const { data: users } = await supabase.from('usuario').select('id_usuario, nombres, apellidos, correo').or(`nombres.ilike.${qLike},apellidos.ilike.${qLike},correo.ilike.${qLike}`).limit(5)
        if (users && users.length) {
            partes.push('Coincidencias en usuarios:')
            users.forEach(u => partes.push(`- ${u.nombres} ${u.apellidos} (${u.correo || 'sin correo'})`))
        }

        if (partes.length) {
            return partes.join('\n')
        }
        // Si no hubo coincidencias exactas, intentar búsqueda por tokens (palabras)
            const tokens = q.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 6)
            if (tokens.length === 0) {
                console.log('buscarEnBD -> sin coincidencias (tokens):', tokens)
                return null
            }

        // construir condiciones 'or' para supabase usando tokens
        const buildOr = (fields) => tokens.flatMap(t => fields.map(f => `${f}.ilike.%${t}%`)).join(',')

        // Reintentar para varias tablas con tokens
        const incCond = buildOr(['titulo', 'descripcion'])
        const { data: incs2 } = await supabase.from('incidente').select('id, titulo, descripcion, fecha').or(incCond).limit(5)
        if (incs2 && incs2.length) {
            partes.push('Coincidencias (por palabras) en incidentes:')
            incs2.forEach(i => partes.push(`- [Incidente ${i.id}] ${i.titulo || i.descripcion}`))
        }

        const altCond = buildOr(['titulo'])
        const { data: alts2 } = await supabase.from('alerta').select('id, titulo, prioridad, fecha').or(altCond).limit(5)
        if (alts2 && alts2.length) {
            partes.push('Coincidencias (por palabras) en alertas:')
            alts2.forEach(a => partes.push(`- [Alerta] [${a.prioridad || 'Media'}] ${a.titulo}`))
        }

        const repCond = buildOr(['titulo', 'descripcion'])
        const { data: reps2 } = await supabase.from('reporte').select('id, titulo, descripcion, fecha').or(repCond).limit(5)
        if (reps2 && reps2.length) {
            partes.push('Coincidencias (por palabras) en reportes:')
            reps2.forEach(r => partes.push(`- [Reporte ${r.id}] ${r.titulo || r.descripcion}`))
        }

        const barCond = buildOr(['nombre', 'descripcion'])
        const { data: barrios2 } = await supabase.from('barrio').select('id, nombre, descripcion, nivel_riesgo').or(barCond).limit(5)
        if (barrios2 && barrios2.length) {
            partes.push('Coincidencias (por palabras) en barrios:')
            barrios2.forEach(b => partes.push(`- ${b.nombre} — Nivel: ${b.nivel_riesgo || 'No definido'}`))
        }

        const usrCond = buildOr(['nombres', 'apellidos', 'correo'])
        const { data: users2 } = await supabase.from('usuario').select('id_usuario, nombres, apellidos, correo').or(usrCond).limit(5)
        if (users2 && users2.length) {
            partes.push('Coincidencias (por palabras) en usuarios:')
            users2.forEach(u => partes.push(`- ${u.nombres} ${u.apellidos} (${u.correo || 'sin correo'})`))
        }

        if (partes.length) return partes.join('\n')
        return null
    } catch (e) {
        console.error('Error en buscarEnBD:', e)
        return null
    }
}

async function contar(tabla) {
    const { count } = await supabase.from(tabla).select('*', { count: 'exact', head: true })
    return count || 0
}

async function contarPorTipo(idTipo) {
    const { count } = await supabase.from('incidente').select('*', { count: 'exact', head: true }).eq('id_tipo_incidente', idTipo)
    return count || 0
}

function esPregunta(q, keywords) {
    return keywords.some(k => q.includes(k))
}

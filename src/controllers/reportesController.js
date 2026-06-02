import { supabase } from '../config/supabase.js'

export async function validarReporte(req, res) {
    try {
        if (![1, 4].includes(req.user.id_rol)) {
            return res.status(403).json({ error: 'No tienes permiso para validar reportes' })
        }

        const reporteId = parseInt(req.params.id)
        const { resultado } = req.body

        if (!resultado || !['Atendido', 'Rechazado'].includes(resultado)) {
            return res.status(400).json({ error: 'Resultado inválido. Usa: Atendido o Rechazado' })
        }

        const { error: updError } = await supabase
            .from('reporte')
            .update({ estado: resultado })
            .eq('id_reporte', reporteId)

        if (updError) throw updError

        if (resultado === 'Atendido') {
            try {
                const { data: rep, error: repError } = await supabase
                    .from('reporte')
                    .select('descripcion, id_tipo_reporte, id_ubicacion')
                    .eq('id_reporte', reporteId)
                    .maybeSingle()

                if (repError) {
                    console.error('Error al consultar reporte para alerta:', repError)
                } else if (!rep) {
                    console.error('Reporte #' + reporteId + ' no encontrado al crear alerta')
                } else {
                    let tipo = 'Reporte vecinal'
                    let calle = ''

                    if (rep.id_tipo_reporte) {
                        const { data: tr } = await supabase
                            .from('tipo_reporte')
                            .select('nombre')
                            .eq('id_tipo_reporte', rep.id_tipo_reporte)
                            .maybeSingle()
                        if (tr) tipo = tr.nombre || tipo
                    }

                    if (rep.id_ubicacion) {
                        const { data: ubi } = await supabase
                            .from('ubicacion')
                            .select('id_calle')
                            .eq('id_ubicacion', rep.id_ubicacion)
                            .maybeSingle()
                        if (ubi && ubi.id_calle) {
                            const { data: c } = await supabase
                                .from('calle')
                                .select('nombre')
                                .eq('id_calle', ubi.id_calle)
                                .maybeSingle()
                            if (c) calle = c.nombre || ''
                        }
                    }

                    const { error: alertaError } = await supabase
                        .from('alerta')
                        .insert({
                            titulo: `${tipo} atendido en ${calle}`,
                            mensaje: rep.descripcion || '',
                            fecha: new Date().toISOString(),
                            prioridad: 'Media',
                            canal: 'App',
                            id_reporte: reporteId
                        })

                    if (alertaError) {
                        console.error('Error al insertar alerta:', alertaError)
                    } else {
                        console.log('Alerta creada exitosamente para reporte #' + reporteId)
                    }
                }
            } catch (e) {
                console.error('Error al generar alerta automática:', e)
            }
        }

        res.json({ mensaje: `Reporte ${resultado.toLowerCase()} exitosamente` })
    } catch (error) {
        console.error('Error al validar reporte:', error)
        res.status(500).json({ error: 'Error al validar reporte' })
    }
}

export async function crearReporte(req, res) {
    try {
        if (![1, 2, 4].includes(req.user.id_rol)) {
            return res.status(403).json({ error: 'No tienes permiso para crear reportes' })
        }

        const { tipo_reporte, descripcion, direccion, referencia, evidencia, latitud, longitud } = req.body

        if (!tipo_reporte || !descripcion || !direccion) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' })
        }

        let id_tipo_reporte = null
        const { data: tipoData } = await supabase
            .from('tipo_reporte')
            .select('id_tipo_reporte')
            .ilike('nombre', tipo_reporte)
            .maybeSingle()

        if (tipoData) {
            id_tipo_reporte = tipoData.id_tipo_reporte
        } else {
            const { data: newTipo } = await supabase
                .from('tipo_reporte')
                .insert({ nombre: tipo_reporte, descripcion: '' })
                .select('id_tipo_reporte')
                .maybeSingle()
            if (newTipo) id_tipo_reporte = newTipo.id_tipo_reporte
        }

        let id_calle = null
        const { data: calleData } = await supabase
            .from('calle')
            .select('id_calle')
            .ilike('nombre', `%${direccion}%`)
            .maybeSingle()

        if (calleData) {
            id_calle = calleData.id_calle
        } else {
            const { data: newCalle } = await supabase
                .from('calle')
                .insert({ nombre: direccion })
                .select('id_calle')
                .maybeSingle()
            if (newCalle) id_calle = newCalle.id_calle
        }

        let id_ubicacion = null
        if (id_calle) {
            const ubicacionPayload = { referencia: referencia || '', id_calle }
            if (latitud && longitud) {
                ubicacionPayload.latitud = parseFloat(latitud)
                ubicacionPayload.longitud = parseFloat(longitud)
            }
            const { data: ubicacionData, error: ubiError } = await supabase
                .from('ubicacion')
                .insert(ubicacionPayload)
                .select('id_ubicacion')
                .maybeSingle()
            if (ubiError) {
                console.error('Error al crear ubicación:', ubiError)
            } else if (ubicacionData) {
                id_ubicacion = ubicacionData.id_ubicacion
            }
        }

        const { data, error } = await supabase
            .from('reporte')
            .insert({
                descripcion,
                fecha_reporte: new Date().toISOString(),
                estado: 'Enviado',
                evidencia_url: evidencia || null,
                id_tipo_reporte,
                id_usuario: req.user.id_usuario,
                id_ubicacion
            })
            .select()
            .maybeSingle()

        if (error) throw error
        res.status(201).json({ mensaje: 'Reporte enviado exitosamente', reporte: data })
    } catch (error) {
        console.error('Error al crear reporte:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

export async function listarReportes(req, res) {
    try {
        let query = supabase
            .from('reporte')
            .select(`
                id_reporte, descripcion, fecha_reporte, estado, evidencia_url,
                usuario: id_usuario (id_usuario, nombres, apellidos, telefono, correo),
                tipo_reporte: id_tipo_reporte (nombre),
                ubicacion: id_ubicacion (id_ubicacion, referencia, latitud, longitud, calle: id_calle (nombre))
            `)

        if (req.user.id_rol === 2) {
            query = query.eq('id_usuario', req.user.id_usuario)
        } else if (req.user.id_rol === 3) {
            query = query.eq('id_usuario', req.user.id_usuario)
        }

        const { data, error } = await query
            .order('fecha_reporte', { ascending: false })
            .limit(50)

        if (error) throw error
        res.json(data || [])
    } catch (error) {
        console.error('Error al listar reportes:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

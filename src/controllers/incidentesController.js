import { supabase, supabaseAdmin } from '../config/supabase.js'

export async function crearIncidente(req, res) {
    try {
        if (![1, 2, 3, 4].includes(req.user.id_rol)) {
            return res.status(403).json({ error: 'No tienes permiso para crear incidentes' })
        }

        const { tipo, descripcion, fecha_hora, urgencia, calle, barrio, zona, referencia, latitud, longitud } = req.body

        let evidenciaUrl = null
        if (req.file) {
            try {
                const ext = req.file.originalname.split('.').pop() || 'jpg'
                const filePath = 'incidentes/' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.' + ext
                const { error: uploadError } = await supabaseAdmin.storage
                    .from('evidencias')
                    .upload(filePath, req.file.buffer, { contentType: req.file.mimetype })
                if (!uploadError) {
                    const { data: urlData } = supabaseAdmin.storage
                        .from('evidencias')
                        .getPublicUrl(filePath)
                    evidenciaUrl = urlData.publicUrl
                } else {
                    console.error('Error al subir imagen a Supabase Storage:', uploadError)
                }
            } catch (e) {
                console.error('Error al procesar imagen:', e)
            }
        }

        if (!tipo || !descripcion || !fecha_hora || !calle) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' })
        }

        let id_tipo_incidente = null
        const { data: tipoData } = await supabase
            .from('tipo_incidente')
            .select('id_tipo_incidente')
            .ilike('nombre', tipo)
            .maybeSingle()

        if (tipoData) {
            id_tipo_incidente = tipoData.id_tipo_incidente
        } else {
            const { data: newTipo } = await supabase
                .from('tipo_incidente')
                .insert({ nombre: tipo, gravedad_base: urgencia || 'Media' })
                .select('id_tipo_incidente')
                .maybeSingle()
            if (newTipo) id_tipo_incidente = newTipo.id_tipo_incidente
        }

        let id_barrio = null
        if (barrio) {
            const { data: barrioData } = await supabase
                .from('barrio')
                .select('id_barrio')
                .ilike('nombre', barrio)
                .maybeSingle()
            if (barrioData) {
                id_barrio = barrioData.id_barrio
            } else {
                const { data: newBarrio } = await supabase
                    .from('barrio')
                    .insert({ nombre: barrio })
                    .select('id_barrio')
                    .maybeSingle()
                if (newBarrio) id_barrio = newBarrio.id_barrio
            }
        }

        let id_calle = null
        const { data: calleData } = await supabase
            .from('calle')
            .select('id_calle')
            .ilike('nombre', `%${calle}%`)
            .maybeSingle()

        if (calleData) {
            id_calle = calleData.id_calle
        } else {
            const { data: newCalle } = await supabase
                .from('calle')
                .insert({ nombre: calle, id_barrio })
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
            .from('incidente')
            .insert({
                descripcion,
                fecha_hora,
                estado: 'Pendiente',
                evidencia_url: evidenciaUrl,
                id_tipo_incidente,
                id_usuario: req.user.id_usuario,
                id_ubicacion
            })
            .select()
            .maybeSingle()

        if (error) throw error
        res.status(201).json({ mensaje: 'Incidente reportado exitosamente', incidente: data })
    } catch (error) {
        console.error('Error al crear incidente:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

export async function listarIncidentes(req, res) {
    try {
        let query = supabase
            .from('incidente')
            .select(`
                id_incidente, descripcion, fecha_hora, estado, evidencia_url,
                usuario: id_usuario (id_usuario, nombres, apellidos, telefono, correo),
                tipo_incidente: id_tipo_incidente (nombre),
                ubicacion: id_ubicacion (id_ubicacion, referencia, latitud, longitud, calle: id_calle (nombre))
            `)

        if (req.user.id_rol === 2) {
            query = query.eq('id_usuario', req.user.id_usuario).eq('estado', 'Validado')
        }

        const { data, error } = await query
            .order('fecha_hora', { ascending: false })
            .limit(50)

        if (error) throw error
        res.json(data || [])
    } catch (error) {
        console.error('Error al listar incidentes:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

export async function validarIncidente(req, res) {
    try {
        if (![1, 3, 4].includes(req.user.id_rol)) {
            return res.status(403).json({ error: 'No tienes permiso para validar incidentes' })
        }

        const incidenteId = parseInt(req.params.id)
        const { resultado, comentario } = req.body

        if (!resultado || !['Validado', 'Rechazado', 'En revisión'].includes(resultado)) {
            return res.status(400).json({ error: 'Resultado inválido. Usa: Validado, Rechazado o En revisión' })
        }

        const { error: valError } = await supabase
            .from('validacion_incidente')
            .insert({
                id_incidente: incidenteId,
                id_usuario: req.user.id_usuario,
                resultado,
                comentario: comentario || '',
                fecha_validacion: new Date().toISOString()
            })

        if (valError) throw valError

        const { error: updError } = await supabase
            .from('incidente')
            .update({ estado: resultado })
            .eq('id_incidente', incidenteId)

        if (updError) throw updError

        if (resultado === 'Validado') {
            try {
                const { data: inc, error: incError } = await supabase
                    .from('incidente')
                    .select('descripcion, id_tipo_incidente, id_ubicacion')
                    .eq('id_incidente', incidenteId)
                    .maybeSingle()

                if (incError) {
                    console.error('Error al consultar incidente para alerta:', incError)
                } else if (!inc) {
                    console.error('Incidente #' + incidenteId + ' no encontrado al crear alerta')
                } else {
                    let tipo = 'Incidente'
                    let prioridad = 'Media'
                    let calle = ''

                    if (inc.id_tipo_incidente) {
                        const { data: ti } = await supabase
                            .from('tipo_incidente')
                            .select('nombre, gravedad_base')
                            .eq('id_tipo_incidente', inc.id_tipo_incidente)
                            .maybeSingle()
                        if (ti) {
                            tipo = ti.nombre || tipo
                            prioridad = ti.gravedad_base || prioridad
                        }
                    }

                    if (inc.id_ubicacion) {
                        const { data: ubi } = await supabase
                            .from('ubicacion')
                            .select('id_calle')
                            .eq('id_ubicacion', inc.id_ubicacion)
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
                            titulo: `${tipo} en ${calle}`,
                            mensaje: inc.descripcion || '',
                            fecha: new Date().toISOString(),
                            prioridad,
                            canal: 'App',
                            id_incidente: incidenteId
                        })

                    if (alertaError) {
                        console.error('Error al insertar alerta:', alertaError)
                    } else {
                        console.log('Alerta creada exitosamente para incidente #' + incidenteId)
                    }
                }
            } catch (e) {
                console.error('Error al generar alerta automática:', e)
            }
        }

        res.json({ mensaje: `Incidente ${resultado.toLowerCase()} exitosamente` })
    } catch (error) {
        console.error('Error al validar incidente:', error)
        res.status(500).json({ error: 'Error al validar incidente' })
    }
}

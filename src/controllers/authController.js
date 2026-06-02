import bcrypt from 'bcryptjs'
import { supabase, supabaseAdmin } from '../config/supabase.js'

export async function registrar(req, res) {
    try {
        const { nombres, apellidos, telefono, correo, contrasena, rol, junta } = req.body

        if (!nombres || !apellidos || !correo || !contrasena) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' })
        }

        let id_rol = null
        if (rol) {
            const { data: rolData } = await supabase
                .from('rol')
                .select('id_rol')
                .ilike('nombre_rol', rol)
                .maybeSingle()
            if (rolData) id_rol = rolData.id_rol
        } else {
            const { data: rolVecino } = await supabase
                .from('rol')
                .select('id_rol')
                .ilike('nombre_rol', 'Vecino')
                .maybeSingle()
            if (rolVecino) id_rol = rolVecino.id_rol
        }

        let id_junta = null
        if (junta) {
            if (typeof junta === 'number') {
                id_junta = junta
            } else {
                const { data: juntaData } = await supabase
                    .from('junta_vecinal')
                    .select('id_junta')
                    .ilike('nombre', `%${junta}%`)
                    .maybeSingle()
                if (juntaData) id_junta = juntaData.id_junta
            }
        }

        const salt = await bcrypt.genSalt(10)
        const contrasena_hash = await bcrypt.hash(contrasena, salt)

        const { data: userData, error: userError } = await supabase
            .from('usuario')
            .insert({
                nombres,
                apellidos,
                telefono: telefono || null,
                correo,
                contrasena_hash,
                id_rol,
                id_junta
            })
            .select()
            .maybeSingle()

        if (userError) {
            return res.status(500).json({ error: 'Error al guardar datos del usuario: ' + userError.message })
        }

        res.status(201).json({
            mensaje: 'Registro exitoso. Revisa tu correo para verificar la cuenta.',
            usuario: userData
        })
    } catch (error) {
        console.error('Error al registrar:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

export async function seedAuth(req, res) {
    try {
        const { data: usuarios, error: dbError } = await supabase
            .from('usuario')
            .select('id_usuario, nombres, apellidos, correo')
            .order('id_usuario')

        if (dbError) return res.status(500).json({ error: 'Error al leer usuarios: ' + dbError.message })

        const resultados = []
        const defaultPassword = req.query.password || '123456'

        for (const u of usuarios) {
            try {
                const { data, error } = await supabaseAdmin.auth.admin.createUser({
                    email: u.correo,
                    password: defaultPassword,
                    email_confirm: true,
                    user_metadata: { nombres: u.nombres, apellidos: u.apellidos }
                })
                if (error) {
                    if (error.message?.toLowerCase().includes('already')) {
                        resultados.push({ id: u.id_usuario, correo: u.correo, skip: 'ya existe' })
                    } else {
                        resultados.push({ id: u.id_usuario, correo: u.correo, error: error.message })
                    }
                } else {
                    resultados.push({ id: u.id_usuario, correo: u.correo, ok: true, uid: data.user?.id })
                }
            } catch (e) {
                resultados.push({ id: u.id_usuario, correo: u.correo, error: e.message })
            }
        }

        res.json({
            mensaje: 'Seed de Auth completado',
            password_usada: defaultPassword,
            resultados
        })
    } catch (error) {
        console.error('Error en seedAuth:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

export async function obtenerPerfil(req, res) {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader) {
            return res.status(401).json({ error: 'No autorizado' })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error } = await supabase.auth.getUser(token)

        if (error || !user) {
            return res.status(401).json({ error: 'Token inválido' })
        }

        const { data: perfil } = await supabase
            .from('usuario')
            .select(`
                id_usuario, nombres, apellidos, telefono, correo, fecha_registro,
                rol: id_rol (id_rol, nombre_rol),
                junta_vecinal: id_junta (id_junta, nombre)
            `)
            .eq('correo', user.email)
            .maybeSingle()

        res.json({ user: user, perfil: perfil })
    } catch (error) {
        console.error('Error al obtener perfil:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

import bcrypt from 'bcryptjs'
import { supabase } from '../config/supabase.js'

export async function crearUsuario(req, res) {
    try {
        if (req.user.id_rol !== 1) {
            return res.status(403).json({ error: 'Solo el administrador puede crear usuarios' })
        }

        const { nombres, apellidos, telefono, correo, contrasena, rol, junta, barrio } = req.body

        if (!nombres || !apellidos || !correo || !contrasena || !rol) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' })
        }

        let id_rol = null
        const { data: rolData } = await supabase
            .from('rol')
            .select('id_rol')
            .ilike('nombre_rol', rol)
            .maybeSingle()

        if (rolData) {
            id_rol = rolData.id_rol
        } else {
            return res.status(400).json({ error: 'Rol no encontrado' })
        }

        let id_junta = null
        if (junta) {
            const { data: juntaData } = await supabase
                .from('junta_vecinal')
                .select('id_junta')
                .ilike('nombre', junta)
                .maybeSingle()
            if (juntaData) id_junta = juntaData.id_junta
        }

        const salt = await bcrypt.genSalt(10)
        const contrasena_hash = await bcrypt.hash(contrasena, salt)

        const { data, error } = await supabase
            .from('usuario')
            .insert({
                nombres,
                apellidos,
                telefono,
                correo,
                contrasena_hash,
                id_rol,
                id_junta
            })
            .select()
            .maybeSingle()

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'El correo ya está registrado' })
            }
            throw error
        }

        res.status(201).json({ mensaje: 'Usuario registrado exitosamente', usuario: data })
    } catch (error) {
        console.error('Error al crear usuario:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

export async function listarUsuarios(req, res) {
    try {
        if (req.user.id_rol !== 1) {
            return res.status(403).json({ error: 'Solo el administrador puede listar usuarios' })
        }

        const { data, error } = await supabase
            .from('usuario')
            .select(`
                id_usuario, nombres, apellidos, telefono, correo, fecha_registro,
                rol: id_rol (id_rol, nombre_rol),
                junta_vecinal: id_junta (id_junta, nombre)
            `)
            .order('fecha_registro', { ascending: false })

        if (error) throw error
        res.json(data || [])
    } catch (error) {
        console.error('Error al listar usuarios:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

export async function actualizarUsuario(req, res) {
    try {
        if (req.user.id_rol !== 1) {
            return res.status(403).json({ error: 'Solo el administrador puede actualizar usuarios' })
        }

        const { id } = req.params
        const { nombres, apellidos, telefono, correo, contrasena, rol, junta } = req.body

        const updates = {}
        if (nombres) updates.nombres = nombres
        if (apellidos) updates.apellidos = apellidos
        if (telefono !== undefined) updates.telefono = telefono
        if (correo) updates.correo = correo
        if (contrasena) {
            const salt = await bcrypt.genSalt(10)
            updates.contrasena_hash = await bcrypt.hash(contrasena, salt)
        }

        if (rol) {
            const { data: rolData } = await supabase
                .from('rol')
                .select('id_rol')
                .ilike('nombre_rol', rol)
                .maybeSingle()
            if (rolData) updates.id_rol = rolData.id_rol
        }

        if (junta) {
            const { data: juntaData } = await supabase
                .from('junta_vecinal')
                .select('id_junta')
                .ilike('nombre', junta)
                .maybeSingle()
            if (juntaData) updates.id_junta = juntaData.id_junta
        }

        const { data, error } = await supabase
            .from('usuario')
            .update(updates)
            .eq('id_usuario', id)
            .select()
            .maybeSingle()

        if (error) throw error
        if (!data) return res.status(404).json({ error: 'Usuario no encontrado' })

        res.json({ mensaje: 'Usuario actualizado exitosamente', usuario: data })
    } catch (error) {
        console.error('Error al actualizar usuario:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

export async function eliminarUsuario(req, res) {
    try {
        if (req.user.id_rol !== 1) {
            return res.status(403).json({ error: 'Solo el administrador puede eliminar usuarios' })
        }

        const { id } = req.params

        const { data, error } = await supabase
            .from('usuario')
            .delete()
            .eq('id_usuario', id)
            .select()
            .maybeSingle()

        if (error) throw error
        if (!data) return res.status(404).json({ error: 'Usuario no encontrado' })

        res.json({ mensaje: 'Usuario eliminado exitosamente' })
    } catch (error) {
        console.error('Error al eliminar usuario:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

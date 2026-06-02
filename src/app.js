import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { supabase } from './config/supabase.js'
import { verificarToken } from './middleware/auth.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, '..', 'public'), { index: false }))

import usuariosRouter from './routes/usuarios.js'
import incidentesRouter from './routes/incidentes.js'
import reportesRouter from './routes/reportes.js'
import patrullajesRouter from './routes/patrullajes.js'
import estadisticasRouter from './routes/estadisticas.js'
import mapaRouter from './routes/mapa.js'
import authRouter from './routes/auth.js'
import juntasRouter from './routes/juntas.js'
import alertasRouter from './routes/alertas.js'
import notificacionesRouter from './routes/notificaciones.js'
import analisisRouter from './routes/analisis.js'
import chatRouter from './routes/chat.js'

app.use('/api/usuarios', verificarToken, usuariosRouter)
app.use('/api/incidentes', verificarToken, incidentesRouter)
app.use('/api/reportes', verificarToken, reportesRouter)
app.use('/api/patrullajes', verificarToken, patrullajesRouter)
app.use('/api/estadisticas', verificarToken, estadisticasRouter)
app.use('/api/mapa', verificarToken, mapaRouter)
app.use('/api/auth', authRouter)
app.use('/api/juntas', juntasRouter)
app.use('/api/alertas', verificarToken, alertasRouter)
app.use('/api/notificaciones', verificarToken, notificacionesRouter)
app.use('/api/analisis', verificarToken, analisisRouter)
app.use('/api/chat', verificarToken, chatRouter)

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'))
})

// PRUEBA DE CONEXIÓN A SUPABASE
const probarConexion = async () => {
    const { data, error } = await supabase
        .from('usuario')
        .select('*')

    if (error) console.error('Error conexión Supabase:', error)
    else console.log('Conexión Supabase OK')
}

await probarConexion()

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`)
    console.log('Endpoints API:')
    console.log('  POST/GET /api/usuarios')
    console.log('  POST/GET /api/incidentes')
    console.log('  POST/GET /api/reportes')
    console.log('  POST/GET /api/patrullajes')
    console.log('  GET      /api/estadisticas')
    console.log('  POST     /api/auth/register')
    console.log('  GET      /api/auth/me')
    console.log('  GET      /api/mapa/datos')
})
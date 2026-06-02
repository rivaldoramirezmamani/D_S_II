import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { createInterface } from 'readline'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pbcukzkywhmbdcgeydjy.supabase.co'
const ANON_KEY = process.env.SUPABASE_KEY

const rl = createInterface({ input: process.stdin, output: process.stdout })
const pregunta = q => new Promise(r => rl.question(q, r))

async function main() {
  console.log('=== SCRIPT: Crear Auth Users desde DB existente ===\n')

  const serviceRole = await pregunta('Pega tu SERVICE_ROLE KEY de Supabase (Settings > API > service_role key): ')
  if (!serviceRole || !serviceRole.startsWith('sb')) {
    console.error('ERROR: La key service_role es necesaria (empieza con "sb")')
    rl.close()
    process.exit(1)
  }

  const DEFAULT_PASSWORD = await pregunta('Contraseña por defecto para usuarios [Segura2025!]: ') || 'Segura2025!'

  const adminClient = createClient(SUPABASE_URL, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const anonClient = createClient(SUPABASE_URL, ANON_KEY)

  const { data: usuarios, error: dbError } = await anonClient
    .from('usuario')
    .select('id_usuario, nombres, apellidos, correo')

  if (dbError) {
    console.error('ERROR leyendo usuarios de la DB:', dbError.message)
    rl.close()
    process.exit(1)
  }

  console.log(`\nUsuarios encontrados en DB: ${usuarios.length}`)

  let creados = 0, existentes = 0, errores = 0

  for (const u of usuarios) {
    const { data: existing } = await adminClient.auth.admin.getUserByEmail(u.correo)
    if (existing?.user) {
      console.log(`  [SKIP] ${u.correo} - ya existe en Auth`)
      existentes++
      continue
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email: u.correo,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { nombres: u.nombres, apellidos: u.apellidos }
    })

    if (error) {
      console.error(`  [ERROR] ${u.correo}: ${error.message}`)
      errores++
    } else {
      console.log(`  [OK] ${u.correo} - creado (pass: ${DEFAULT_PASSWORD})`)
      creados++
    }
  }

  console.log(`\n=== RESUMEN ===`)
  console.log(`  Creados:   ${creados}`)
  console.log(`  Existentes: ${existentes}`)
  console.log(`  Errores:   ${errores}`)
  console.log(`\nAhora puedes iniciar sesión con:`)
  console.log(`  Correo: el email del usuario`)
  console.log(`  Pass:   ${DEFAULT_PASSWORD}`)

  rl.close()
}

main()

const SUPABASE_URL = 'https://pbcukzkywhmbdcgeydjy.supabase.co'
const SUPABASE_KEY = 'sb_publishable_9TZeEa2AwMtyJXUGZb7v5A_v6A_Tmlv'

const _supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

const ROLES = { ADMINISTRADOR: 1, VECINO: 2, POLICIA: 3, MODERADOR: 4 }

const PAGE_ACCESS = {
  'index.html': [1,2,3,4],
  'incidentes.html': [1,2,3,4],
  'reportes.html': [1,2,4],
  'patrullajes.html': [1,3],
  'usuarios.html': [1],
  'alertas.html': [1,2,3,4],
  'analisis.html': [1,2,3,4],
  'juntas.html': [1,2,4],
  'configuracion.html': [1,2,3,4],
}

const SIDEBAR_ITEMS = [
  { id:'inicio', label:'Inicio', href:'index.html', icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>', roles:[1,2,3,4] },
  { id:'incidentes', label:'Incidentes', href:'incidentes.html', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', roles:[1,2,3,4] },
  { id:'reportes', label:'Reportes Vecinales', href:'reportes.html', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>', roles:[1,2,4] },
  { id:'patrullajes', label:'Patrullajes', href:'patrullajes.html', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', roles:[1,3] },
  { id:'usuarios', label:'Usuarios', href:'usuarios.html', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', roles:[1] },

  { id:'analisis', label:'Análisis con IA', href:'analisis.html', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>', roles:[1,2,3,4] },
  { id:'juntas', label:'Juntas Vecinales', href:'juntas.html', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-8 0 4 4 0 0 0-8 0 4 4 0 0 0 0 8"/></svg>', roles:[1,2,4] },
  { id:'configuracion', label:'Configuración', href:'configuracion.html', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', roles:[1,2,3,4] },
]

function getUsuarioSesion() {
    const data = localStorage.getItem('sb-usuario')
    return data ? JSON.parse(data) : null
}

function guardarUsuarioSesion(usuario, perfil) {
    localStorage.setItem('sb-usuario', JSON.stringify({ usuario, perfil }))
}

function limpiarSesion() {
    localStorage.removeItem('sb-usuario')
}

async function getToken() {
    try {
        const { data: { session } } = await _supabaseClient.auth.getSession()
        return session?.access_token || null
    } catch (e) {
        return null
    }
}

async function apiFetch(url, options = {}) {
    const token = await getToken()
    const headers = { ...options.headers }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(url, { ...options, headers })
}

function obtenerRolId() {
    const data = getUsuarioSesion()
    return data?.perfil?.rol?.id_rol || null
}

function obtenerRolNombre() {
    const data = getUsuarioSesion()
    return data?.perfil?.rol?.nombre_rol || ''
}

function generarSidebar() {
    const nav = document.getElementById('sidebarNav')
    if (!nav) return
    const rolId = obtenerRolId()
    if (!rolId) { nav.innerHTML = ''; return }
    const currentPage = window.location.pathname.split('/').pop() || 'index.html'
    nav.innerHTML = SIDEBAR_ITEMS
        .filter(item => item.roles.includes(rolId))
        .map(item => `
            <a class="nav-item${item.href === currentPage ? ' active' : ''}" href="${item.href}">
                ${item.icon} ${item.label}
            </a>
        `).join('')
}

function verificarAcceso() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html'
    if (['login.html', 'register.html', 'forgot-password.html', 'reset-password.html'].includes(currentPage)) return true
    const rolId = obtenerRolId()
    if (!rolId) { window.location.href = 'login.html'; return false }
    const allowed = PAGE_ACCESS[currentPage]
    if (!allowed || !allowed.includes(rolId)) {
        window.location.href = 'index.html'
        return false
    }
    return true
}

async function verificarSesion() {
    const { data: { session } } = await _supabaseClient.auth.getSession()
    if (!session) {
        const currentPage = window.location.pathname.split('/').pop()
        if (!['login.html', 'register.html', 'forgot-password.html', 'reset-password.html'].includes(currentPage)) {
            window.location.href = 'login.html'
        }
        return null
    }
    const savedData = getUsuarioSesion()
    if (!savedData || !savedData.perfil) {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            })
            if (res.ok) {
                const data = await res.json()
                guardarUsuarioSesion(data.user, data.perfil)
            } else {
                guardarUsuarioSesion(session.user, null)
            }
        } catch (e) {
            console.error('Error al obtener perfil:', e)
            guardarUsuarioSesion(session.user, null)
        }
    }
    return session
}

async function cerrarSesion() {
    await _supabaseClient.auth.signOut()
    limpiarSesion()
    window.location.href = 'login.html'
}

function _getUserEmail(data) {
    return data.usuario?.email || data.user?.email || null
}

function actualizarHeaderUsuario() {
    const data = getUsuarioSesion()
    const userBadge = document.querySelector('.user-badge')
    if (!userBadge) return
    if (!data) {
        userBadge.innerHTML = `
            <div class="user-avatar" style="background:var(--verde);">?</div>
            <span style="font-size:11px;">Sin sesión</span>
        `
        return
    }
    const email = _getUserEmail(data)
    const nombre = data.perfil?.nombres || email?.split('@')[0] || 'Usuario'
    const inicial = nombre.charAt(0).toUpperCase()
    const rol = data.perfil?.rol?.nombre_rol || ''
    const junta = data.perfil?.junta_vecinal?.nombre || ''
    userBadge.innerHTML = `
        <div class="user-avatar" style="background:var(--verde);">${inicial}</div>
        <div style="display:flex;flex-direction:column;align-items:flex-start;">
            <span style="font-size:11px;line-height:1.2;">${nombre}</span>
            ${rol ? `<span style="font-size:9px;opacity:0.7;line-height:1;">${rol}</span>` : ''}
        </div>
        <button onclick="cerrarSesion()" style="background:none;border:none;cursor:pointer;padding:2px;margin-left:4px;" title="Cerrar sesión">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
        </button>
    `
    const sidebarFooter = document.querySelector('.sidebar-footer')
    if (sidebarFooter) {
        sidebarFooter.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:28px;height:28px;font-size:12px;background:var(--verde);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;flex-shrink:0;">${inicial}</div>
                    <div style="display:flex;flex-direction:column;">
                        <strong style="color:rgba(255,255,255,0.85);font-size:12px;">${nombre}</strong>
                        <span style="color:rgba(255,255,255,0.5);font-size:10px;">${rol}${junta ? ' · ' + junta : ''}</span>
                    </div>
                </div>
                <button onclick="cerrarSesion()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.7);border-radius:6px;padding:6px 10px;cursor:pointer;font-size:11px;font-family:'Inter',sans-serif;display:flex;align-items:center;gap:6px;justify-content:center;margin-top:2px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Cerrar sesión
                </button>
            </div>
        `
    }
}

;(function aplicarTemaGuardado(){
    try {
        const saved = localStorage.getItem('scsp_theme')
        if (saved === 'dark') document.body.classList.add('dark')
        else document.body.classList.remove('dark')
    } catch (e) {}
})()

// Sidebar toggle for mobile
;(function initSidebarToggle(){
    var toggle = document.getElementById('menuToggle')
    var overlay = document.getElementById('sidebarOverlay')
    var sidebar = document.querySelector('.sidebar')
    if (!toggle || !overlay || !sidebar) return
    toggle.addEventListener('click', function(e) {
        e.stopPropagation()
        sidebar.classList.toggle('open')
        overlay.classList.toggle('active')
    })
    overlay.addEventListener('click', function() {
        sidebar.classList.remove('open')
        overlay.classList.remove('active')
    })
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open')
            overlay.classList.remove('active')
        }
    })
})()

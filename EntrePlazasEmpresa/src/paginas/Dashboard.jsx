import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Dashboard.css'
import PlanoMesas from './PlanoMesas'

const API = 'http://localhost:3001/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const usuario = JSON.parse(localStorage.getItem('ep_usuario') || '{}')
  const token = localStorage.getItem('ep_token')
  const [negocio, setNegocio] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [reservasHoy, setReservasHoy] = useState([])
  const [vistaActiva, setVistaActiva] = useState('inicio')
  const [formNegocio, setFormNegocio] = useState({
    nombre: '', descripcion: '', direccion: '',
    ciudad: '', telefono: '', horarioApertura: '', horarioCierre: ''
  })

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    cargarNegocio()
  }, [])

  const cargarNegocio = async () => {
    try {
      const { data } = await axios.get(`${API}/negocios/mi/negocio`, { headers })
      setNegocio(data)
      cargarReservasHoy(data.id)
    } catch {
      setNegocio(null)
    } finally {
      setCargando(false)
    }
  }

  const cargarReservasHoy = async (negocioId) => {
    try {
      const { data } = await axios.get(`${API}/reservas/negocio/${negocioId}`, { headers })
      const hoy = new Date().toISOString().split('T')[0]
      const hoyReservas = data.filter(r =>
        r.fecha.split('T')[0] === hoy && r.estado !== 'CANCELADA'
      )
      setReservasHoy(hoyReservas)
    } catch {
      setReservasHoy([])
    }
  }

  const crearNegocio = async e => {
    e.preventDefault()
    try {
      const { data } = await axios.post(`${API}/negocios`, formNegocio, { headers })
      setNegocio(data)
    } catch {
      alert('Error al crear el negocio')
    }
  }

  const cerrarSesion = () => {
    localStorage.removeItem('ep_token')
    localStorage.removeItem('ep_usuario')
    navigate('/login')
  }

  if (cargando) return (
    <div className="dash-loading">
      <div className="dash-spinner" />
    </div>
  )

  if (!negocio) return (
    <div className="dash-onboarding">
      <div className="onboarding-card">
        <div className="onboarding-icono">🍺</div>
        <h2>Configura tu negocio</h2>
        <p>Completa los datos de tu local para empezar a recibir reservas.</p>
        <form onSubmit={crearNegocio} className="onboarding-form">
          <div className="campo-grid">
            <div className="campo">
              <label>Nombre del local</label>
              <input
                type="text"
                placeholder="Bar La Parrala"
                value={formNegocio.nombre}
                onChange={e => setFormNegocio({ ...formNegocio, nombre: e.target.value })}
                required
              />
            </div>
            <div className="campo">
              <label>Teléfono</label>
              <input
                type="tel"
                placeholder="959 123 456"
                value={formNegocio.telefono}
                onChange={e => setFormNegocio({ ...formNegocio, telefono: e.target.value })}
              />
            </div>
          </div>
          <div className="campo">
            <label>Descripción</label>
            <input
              type="text"
              placeholder="Bar tradicional en el centro..."
              value={formNegocio.descripcion}
              onChange={e => setFormNegocio({ ...formNegocio, descripcion: e.target.value })}
            />
          </div>
          <div className="campo-grid">
            <div className="campo">
              <label>Dirección</label>
              <input
                type="text"
                placeholder="Calle Real 12"
                value={formNegocio.direccion}
                onChange={e => setFormNegocio({ ...formNegocio, direccion: e.target.value })}
              />
            </div>
            <div className="campo">
              <label>Ciudad</label>
              <input
                type="text"
                placeholder="La Palma del Condado"
                value={formNegocio.ciudad}
                onChange={e => setFormNegocio({ ...formNegocio, ciudad: e.target.value })}
              />
            </div>
          </div>
          <div className="campo-grid">
            <div className="campo">
              <label>Apertura</label>
              <input
                type="time"
                value={formNegocio.horarioApertura}
                onChange={e => setFormNegocio({ ...formNegocio, horarioApertura: e.target.value })}
              />
            </div>
            <div className="campo">
              <label>Cierre</label>
              <input
                type="time"
                value={formNegocio.horarioCierre}
                onChange={e => setFormNegocio({ ...formNegocio, horarioCierre: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="btn-principal">Crear mi negocio</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="dash-root">
      <aside className="dash-sidebar">
        <div className="sidebar-marca">
          <span className="login-logo">EP</span>
          <span className="sidebar-nombre">EntrePlazas</span>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${vistaActiva === 'inicio' ? 'activo' : ''}`}
            onClick={() => setVistaActiva('inicio')}
          >
            <span className="nav-icono">▦</span> Inicio
          </button>
          <button
            className={`nav-item ${vistaActiva === 'plano' ? 'activo' : ''}`}
            onClick={() => setVistaActiva('plano')}
          >
            <span className="nav-icono">⊞</span> Plano de mesas
          </button>
          <button
            className={`nav-item ${vistaActiva === 'reservas' ? 'activo' : ''}`}
            onClick={() => setVistaActiva('reservas')}
          >
            <span className="nav-icono">📋</span> Reservas
          </button>
          <button
            className={`nav-item ${vistaActiva === 'negocio' ? 'activo' : ''}`}
            onClick={() => setVistaActiva('negocio')}
          >
            <span className="nav-icono">⚙</span> Mi negocio
          </button>
        </nav>
        <button className="sidebar-salir" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </aside>

      <main className="dash-main">
        {vistaActiva === 'inicio' && (
          <div className="dash-contenido">
            <div className="dash-header">
              <div>
                <h1>Bienvenido, {usuario.nombre}</h1>
                <p className="dash-subtitulo">{negocio.nombre} · {negocio.ciudad}</p>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-card-num">{reservasHoy.length}</span>
                <span className="stat-card-label">Reservas hoy</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-num">{negocio.mesas?.length || 0}</span>
                <span className="stat-card-label">Mesas activas</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-num">
                  {negocio.mesas?.length
                    ? Math.round(((negocio.mesas.length - reservasHoy.length) / negocio.mesas.length) * 100)
                    : 0}%
                </span>
                <span className="stat-card-label">Disponibilidad</span>
              </div>
            </div>

            <div className="seccion">
              <h2>Reservas de hoy</h2>
              {reservasHoy.length === 0 ? (
                <div className="vacio">No hay reservas para hoy</div>
              ) : (
                <div className="reservas-lista">
                  {reservasHoy.map(r => (
                    <div key={r.id} className="reserva-item">
                      <div className="reserva-info">
                        <span className="reserva-nombre">{r.nombreContacto || r.usuario?.nombre}</span>
                        <span className="reserva-detalle">Mesa {r.mesa?.etiqueta} · {r.numPersonas} personas · {r.horaInicio}</span>
                      </div>
                      <span className={`reserva-estado ${r.estado.toLowerCase()}`}>{r.estado}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {vistaActiva === 'plano' && (
            <div className="dash-contenido">
                <PlanoMesas negocioId={negocio.id} token={token} />
            </div>
        )}

        {vistaActiva === 'reservas' && (
          <div className="dash-contenido">
            <div className="dash-header">
              <h1>Todas las reservas</h1>
            </div>
          </div>
        )}

        {vistaActiva === 'negocio' && (
          <div className="dash-contenido">
            <div className="dash-header">
              <h1>Mi negocio</h1>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
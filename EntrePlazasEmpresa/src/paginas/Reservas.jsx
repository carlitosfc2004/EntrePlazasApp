import { useState, useEffect } from 'react'
import axios from 'axios'
import API from '../config'
import './Reservas.css'

const ESTADOS = ['TODAS', 'PENDIENTE', 'CONFIRMADA', 'CANCELADA']

export default function Reservas({ negocioId, token }) {
  const [reservas, setReservas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('TODAS')
  const [busqueda, setBusqueda] = useState('')
  const [diaExpandido, setDiaExpandido] = useState(null)
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => { cargarReservas() }, [])

  const cargarReservas = async () => {
    try {
      const { data } = await axios.get(`${API}/reservas/negocio/${negocioId}`, { headers })
      setReservas(data)
      const hoy = new Date().toISOString().split('T')[0]
      setDiaExpandido(hoy)
    } catch {
      console.error('Error cargando reservas')
    } finally {
      setCargando(false)
    }
  }

  const confirmar = async (id) => {
    try {
      await axios.put(`${API}/reservas/${id}/confirmar`, {}, { headers })
      setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: 'CONFIRMADA' } : r))
    } catch {
      alert('Error al confirmar')
    }
  }

  const cancelar = async (id) => {
    if (!confirm('¿Cancelar esta reserva?')) return
    try {
      await axios.put(`${API}/reservas/${id}/cancelar`, {}, { headers })
      setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: 'CANCELADA' } : r))
    } catch {
      alert('Error al cancelar')
    }
  }

  const reservasFiltradas = reservas.filter(r => {
    const coincideFiltro = filtro === 'TODAS' || r.estado === filtro
    const coincideBusqueda = busqueda === '' ||
      r.nombreContacto?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.mesa?.etiqueta?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.usuario?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
    return coincideFiltro && coincideBusqueda
  })

  // Agrupar por fecha
  const reservasPorDia = reservasFiltradas.reduce((acc, r) => {
    const fecha = r.fecha.split('T')[0]
    if (!acc[fecha]) acc[fecha] = []
    acc[fecha].push(r)
    return acc
  }, {})

  const diasOrdenados = Object.keys(reservasPorDia).sort((a, b) => new Date(b) - new Date(a))

  const formatFecha = (fecha) => {
    const hoy = new Date().toISOString().split('T')[0]
    const manana = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    if (fecha === hoy) return 'Hoy'
    if (fecha === manana) return 'Mañana'
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long'
    })
  }

  const formatFechaCorta = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const esHoy = (fecha) => fecha === new Date().toISOString().split('T')[0]
  const esPasado = (fecha) => new Date(fecha) < new Date(new Date().toISOString().split('T')[0])

  if (cargando) return <div className="reservas-loading">Cargando reservas...</div>

  return (
    <div className="reservas-root">
      <div className="dash-header">
        <div>
          <h1>Reservas</h1>
          <p className="dash-subtitulo">{reservas.length} reservas en total</p>
        </div>
      </div>

      <div className="reservas-controles">
        <div className="reservas-filtros">
          {ESTADOS.map(e => (
            <button
              key={e}
              className={`filtro-btn ${filtro === e ? 'activo' : ''}`}
              onClick={() => setFiltro(e)}
            >
              {e === 'TODAS' ? 'Todas' : e.charAt(0) + e.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="reservas-busqueda">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Buscar por nombre o mesa..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {diasOrdenados.length === 0 ? (
        <div className="vacio">
          <i className="bi bi-calendar-x" style={{ fontSize: 32, marginBottom: 12, display: 'block' }}></i>
          No hay reservas {filtro !== 'TODAS' ? `con estado ${filtro.toLowerCase()}` : ''}
        </div>
      ) : (
        <div className="dias-lista">
          {diasOrdenados.map(dia => {
            const reservasDelDia = reservasPorDia[dia]
            const expandido = diaExpandido === dia
            const pendientes = reservasDelDia.filter(r => r.estado === 'PENDIENTE').length
            const pasado = esPasado(dia)

            return (
              <div key={dia} className={`dia-grupo ${pasado ? 'pasado' : ''} ${esHoy(dia) ? 'hoy' : ''}`}>
                <button
                  className="dia-cabecera"
                  onClick={() => setDiaExpandido(expandido ? null : dia)}
                >
                  <div className="dia-cabecera-izq">
                    <span className="dia-nombre">{formatFecha(dia)}</span>
                    <span className="dia-fecha-corta">{formatFechaCorta(dia)}</span>
                  </div>
                  <div className="dia-cabecera-der">
                    <span className="dia-count">{reservasDelDia.length} reservas</span>
                    {pendientes > 0 && (
                      <span className="dia-pendientes">{pendientes} pendiente{pendientes > 1 ? 's' : ''}</span>
                    )}
                    <i className={`bi bi-chevron-${expandido ? 'up' : 'down'} dia-chevron`}></i>
                  </div>
                </button>

                {expandido && (
                  <div className="dia-reservas">
                    <div className="tabla-header">
                      <span>Cliente</span>
                      <span>Mesa</span>
                      <span>Turno / Hora</span>
                      <span>Personas</span>
                      <span>Estado</span>
                      <span>Acciones</span>
                    </div>
                    {reservasDelDia.map(r => (
                      <div key={r.id} className="tabla-fila">
                        <span className="fila-cliente">
                          <i className="bi bi-person-circle"></i>
                          <div>
                            <span>{r.nombreContacto || r.usuario?.nombre || '—'}</span>
                            {r.telefono && <span style={{ fontSize: '12px', color: 'var(--gris-texto)', display: 'block' }}><i className="bi bi-telephone"></i> {r.telefono}</span>}
                          </div>
                        </span>
                        <span className="fila-mesa">
                          <i className="bi bi-grid-3x3"></i>
                          {r.mesa?.etiqueta || '—'}
                        </span>
                        <span>{r.horaInicio || '—'}</span>
                        <span>
                          <i className="bi bi-people"></i> {r.numPersonas || '—'}
                        </span>
                        <span>
                          <span className={`badge-estado ${r.estado.toLowerCase()}`}>
                            {r.estado.charAt(0) + r.estado.slice(1).toLowerCase()}
                          </span>
                        </span>
                        <span className="fila-acciones">
                          {r.estado === 'PENDIENTE' && (
                            <button className="btn-confirmar" onClick={() => confirmar(r.id)}>
                              <i className="bi bi-check-lg"></i>
                            </button>
                          )}
                          {r.estado !== 'CANCELADA' && (
                            <button className="btn-cancelar-sm" onClick={() => cancelar(r.id)}>
                              <i className="bi bi-x-lg"></i>
                            </button>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from './Navbar'
import './MisReservas.css'

const API = 'https://entreplazas-api.onrender.com/api'

export default function MisReservas() {
  const navigate = useNavigate()
  const [reservas, setReservas] = useState([])
  const [cargando, setCargando] = useState(true)
  const token = localStorage.getItem('ep_cliente_token')

  useEffect(() => { cargarReservas() }, [])

  const cargarReservas = async () => {
    try {
      const { data } = await axios.get(`${API}/reservas/mis-reservas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setReservas(data)
    } catch {
      console.error('Error cargando reservas')
    } finally {
      setCargando(false)
    }
  }

  const cancelar = async (id) => {
    if (!confirm('¿Cancelar esta reserva?')) return
    try {
      await axios.put(`${API}/reservas/${id}/cancelar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: 'CANCELADA' } : r))
    } catch {
      alert('Error al cancelar la reserva')
    }
  }

  const formatFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  const esProxima = (fecha) => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    return new Date(fecha) >= hoy
  }

  const proximas = reservas.filter(r => esProxima(r.fecha) && r.estado !== 'CANCELADA')
  const pasadas = reservas.filter(r => !esProxima(r.fecha) || r.estado === 'CANCELADA')

  if (cargando) return (
    <div>
      <Navbar />
      <div className="misreservas-loading"><div className="spinner" /></div>
    </div>
  )

  return (
    <div>
      <Navbar />
      <div className="misreservas-root">
        <div className="misreservas-header">
          <h1>Mis reservas</h1>
          <p className="misreservas-sub">{reservas.length} reservas en total</p>
        </div>

        {reservas.length === 0 ? (
          <div className="misreservas-vacio">
            <i className="bi bi-calendar-x"></i>
            <h3>No tienes reservas todavía</h3>
            <p>Explora los bares disponibles y reserva tu primera mesa</p>
            <button className="btn-explorar" onClick={() => navigate('/')}>
              <i className="bi bi-search"></i> Explorar bares
            </button>
          </div>
        ) : (
          <div className="misreservas-contenido">
            {proximas.length > 0 && (
              <div className="misreservas-seccion">
                <h2><i className="bi bi-clock"></i> Próximas reservas</h2>
                <div className="reservas-lista-cliente">
                  {proximas.map(r => (
                    <TarjetaReserva
                      key={r.id}
                      reserva={r}
                      onCancelar={cancelar}
                      formatFecha={formatFecha}
                      proxima={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {pasadas.length > 0 && (
              <div className="misreservas-seccion">
                <h2><i className="bi bi-archive"></i> Historial</h2>
                <div className="reservas-lista-cliente">
                  {pasadas.map(r => (
                    <TarjetaReserva
                      key={r.id}
                      reserva={r}
                      onCancelar={cancelar}
                      formatFecha={formatFecha}
                      proxima={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TarjetaReserva({ reserva: r, onCancelar, formatFecha, proxima }) {
  return (
    <div className={`reserva-tarjeta ${!proxima ? 'pasada' : ''}`}>
      <div className="reserva-tarjeta-izq">
        <div className="reserva-tarjeta-icono">
          <i className="bi bi-shop"></i>
        </div>
        <div className="reserva-tarjeta-info">
          <h3>{r.negocio?.nombre}</h3>
          <p className="reserva-tarjeta-dir">
            <i className="bi bi-geo-alt"></i> {r.negocio?.direccion || '—'}
          </p>
          <div className="reserva-tarjeta-detalles">
            <span><i className="bi bi-calendar"></i> {formatFecha(r.fecha.split('T')[0])}</span>
            {r.horaInicio && <span><i className="bi bi-clock"></i> {r.horaInicio}</span>}
            <span><i className="bi bi-grid-3x3"></i> {r.mesa?.etiqueta}</span>
            <span><i className="bi bi-people"></i> {r.numPersonas} personas</span>
          </div>
        </div>
      </div>
      <div className="reserva-tarjeta-der">
        <span className={`badge-estado ${r.estado.toLowerCase()}`}>
          {r.estado === 'PENDIENTE' ? 'Pendiente' :
           r.estado === 'CONFIRMADA' ? 'Confirmada' : 'Cancelada'}
        </span>
        {proxima && r.estado !== 'CANCELADA' && (
          <button className="btn-cancelar-reserva" onClick={() => onCancelar(r.id)}>
            <i className="bi bi-x-circle"></i> Cancelar
          </button>
        )}
      </div>
    </div>
  )
}
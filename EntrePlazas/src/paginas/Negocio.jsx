import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from './Navbar'
import './Negocio.css'

const API = 'http://localhost:3001/api'

function MesaCliente({ mesa, ocupada, seleccionada, onClick }) {
  const esCirculo = mesa.forma === 'circulo'
  const esRectangulo = mesa.forma === 'rectangulo'

  const style = {
    position: 'absolute',
    left: mesa.posX,
    top: mesa.posY,
    width: mesa.ancho,
    height: esRectangulo ? mesa.alto * 0.65 : mesa.alto,
    borderRadius: esCirculo ? '50%' : '10px',
    cursor: ocupada ? 'not-allowed' : 'pointer',
  }

  return (
    <div
      style={style}
      className={`mesa-cliente ${ocupada ? 'ocupada' : 'libre'} ${seleccionada ? 'seleccionada' : ''}`}
      onClick={() => !ocupada && onClick(mesa)}
    >
      <span className="mesa-etiqueta">{mesa.etiqueta}</span>
      <span className="mesa-capacidad">{mesa.capacidad}p</span>
    </div>
  )
}

export default function Negocio() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [negocio, setNegocio] = useState(null)
  const [mesas, setMesas] = useState([])
  const [mesasOcupadas, setMesasOcupadas] = useState([])
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [formReserva, setFormReserva] = useState({
    horaInicio: '',
    nombreContacto: '',
    numPersonas: 1
  })
  const [reservando, setReservando] = useState(false)
  const [exito, setExito] = useState(false)
  const token = localStorage.getItem('ep_cliente_token')

  useEffect(() => { cargarNegocio() }, [id])
  useEffect(() => { if (negocio) cargarDisponibilidad() }, [fecha, negocio])

  const cargarNegocio = async () => {
    try {
      const { data } = await axios.get(`${API}/negocios/${id}`)
      setNegocio(data)
      setMesas(data.mesas || [])
    } catch {
      console.error('Error cargando negocio')
    } finally {
      setCargando(false)
    }
  }

  const cargarDisponibilidad = async () => {
    try {
      const { data } = await axios.get(`${API}/reservas/disponibilidad/${id}/${fecha}`)
      setMesasOcupadas(data.mesasOcupadas || [])
      setMesaSeleccionada(null)
    } catch {
      console.error('Error cargando disponibilidad')
    }
  }

  const seleccionarMesa = (mesa) => {
    if (!token) {
      navigate('/login')
      return
    }
    setMesaSeleccionada(mesa)
    setFormReserva({ ...formReserva, numPersonas: Math.min(formReserva.numPersonas, mesa.capacidad) })
    setMostrarModal(true)
  }

  const hacerReserva = async (e) => {
    e.preventDefault()
    if (!token) { navigate('/login'); return }
    setReservando(true)
    try {
      await axios.post(`${API}/reservas`, {
        mesaId: mesaSeleccionada.id,
        negocioId: id,
        fecha,
        horaInicio: formReserva.horaInicio,
        nombreContacto: formReserva.nombreContacto,
        numPersonas: formReserva.numPersonas
      }, { headers: { Authorization: `Bearer ${token}` } })
      setExito(true)
      setMesasOcupadas(prev => [...prev, mesaSeleccionada.id])
      setTimeout(() => {
        setMostrarModal(false)
        setMesaSeleccionada(null)
        setExito(false)
      }, 2000)
    } catch (err) {
      alert(err.response?.data?.error || 'Error al realizar la reserva')
    } finally {
      setReservando(false)
    }
  }

  if (cargando) return (
    <div>
      <Navbar />
      <div className="negocio-loading"><div className="spinner" /></div>
    </div>
  )

  if (!negocio) return (
    <div>
      <Navbar />
      <div className="negocio-loading">Negocio no encontrado</div>
    </div>
  )

  const mesasLibres = mesas.filter(m => !mesasOcupadas.includes(m.id)).length

  return (
    <div>
      <Navbar />
      <div className="negocio-root">

        <div className="negocio-cabecera">
          <div className="negocio-cabecera-info">
            <h1>{negocio.nombre}</h1>
            <p className="negocio-desc">{negocio.descripcion}</p>
            <div className="negocio-datos">
              {negocio.direccion && (
                <span><i className="bi bi-geo-alt"></i> {negocio.direccion}, {negocio.ciudad}</span>
              )}
              {negocio.telefono && (
                <span><i className="bi bi-telephone"></i> {negocio.telefono}</span>
              )}
              {negocio.horarioApertura && (
                <span><i className="bi bi-clock"></i> {negocio.horarioApertura} - {negocio.horarioCierre}</span>
              )}
            </div>
          </div>
          <div className="negocio-disponibilidad">
            <div className="disp-numero">{mesasLibres}</div>
            <div className="disp-texto">mesas libres hoy</div>
          </div>
        </div>

        <div className="negocio-plano-seccion">
          <div className="plano-controles">
            <div className="plano-controles-izq">
              <h2>Elige tu mesa</h2>
              <p className="plano-sub">Haz clic en una mesa libre para reservar</p>
            </div>
            <div className="campo" style={{ width: 'auto' }}>
              <label>Fecha de la reserva</label>
              <input
                type="date"
                value={fecha}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setFecha(e.target.value)}
                style={{ width: '180px' }}
              />
            </div>
          </div>

          <div className="leyenda">
            <span className="leyenda-item">
              <span className="leyenda-color libre"></span> Libre
            </span>
            <span className="leyenda-item">
              <span className="leyenda-color ocupada"></span> Ocupada
            </span>
            <span className="leyenda-item">
              <span className="leyenda-color seleccionada"></span> Seleccionada
            </span>
          </div>

          <div className="plano-cliente-contenedor">
            <div className="plano-cliente">
              {mesas.map(mesa => (
                <MesaCliente
                  key={mesa.id}
                  mesa={mesa}
                  ocupada={mesasOcupadas.includes(mesa.id)}
                  seleccionada={mesaSeleccionada?.id === mesa.id}
                  onClick={seleccionarMesa}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {mostrarModal && mesaSeleccionada && (
        <div className="modal-overlay" onClick={() => { setMostrarModal(false); setExito(false) }}>
          <div className="modal-reserva" onClick={e => e.stopPropagation()}>
            {exito ? (
              <div className="reserva-exito">
                <i className="bi bi-check-circle"></i>
                <h3>¡Reserva realizada!</h3>
                <p>Tu mesa ha sido reservada correctamente.</p>
              </div>
            ) : (
              <>
                <div className="modal-reserva-header">
                  <div>
                    <h3>Reservar {mesaSeleccionada.etiqueta}</h3>
                    <p>Capacidad máxima: {mesaSeleccionada.capacidad} personas</p>
                  </div>
                  <button className="modal-cerrar" onClick={() => setMostrarModal(false)}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
                <form onSubmit={hacerReserva} className="modal-reserva-form">
                  <div className="campo">
                    <label>Nombre de contacto</label>
                    <input
                      type="text"
                      placeholder="Tu nombre"
                      value={formReserva.nombreContacto}
                      onChange={e => setFormReserva({ ...formReserva, nombreContacto: e.target.value })}
                      required
                    />
                  </div>
                  <div className="campo-grid">
                    <div className="campo">
                      <label>Número de personas</label>
                      <input
                        type="number"
                        min="1"
                        max={mesaSeleccionada.capacidad}
                        value={formReserva.numPersonas}
                        onChange={e => setFormReserva({ ...formReserva, numPersonas: e.target.value })}
                        required
                      />
                    </div>
                    <div className="campo">
                      <label>Hora de llegada</label>
                      <input
                        type="time"
                        value={formReserva.horaInicio}
                        onChange={e => setFormReserva({ ...formReserva, horaInicio: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-resumen">
                    <span><i className="bi bi-calendar"></i> {new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    <span><i className="bi bi-geo-alt"></i> {negocio.nombre}</span>
                  </div>
                  <button type="submit" className="btn-principal" disabled={reservando}>
                    {reservando ? 'Reservando...' : 'Confirmar reserva'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
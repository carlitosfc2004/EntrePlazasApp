import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from './Navbar'
import MapaNegocio from './MapaNegocio'
import './Negocio.css'

const API = 'https://entreplazas-api.onrender.com/api'

function generarHoras(horaInicio, horaFin) {
  const horas = []
  const [hI, mI] = horaInicio.split(':').map(Number)
  const [hF, mF] = horaFin.split(':').map(Number)
  let totalMinutosInicio = hI * 60 + mI
  let totalMinutosFin = hF * 60 + mF
  if (totalMinutosFin <= totalMinutosInicio) totalMinutosFin += 24 * 60
  for (let m = totalMinutosInicio; m < totalMinutosFin; m += 30) {
    const horas24 = Math.floor(m / 60) % 24
    const minutos = m % 60
    horas.push(`${String(horas24).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`)
  }
  return horas
}

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
  const [paredes, setParedes] = useState([])
  const [turnos, setTurnos] = useState([])
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null)
  const [mesasOcupadas, setMesasOcupadas] = useState([])
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [diasBloqueados, setDiasBloqueados] = useState([])
  const [formReserva, setFormReserva] = useState({
    horaInicio: '', nombreContacto: '', numPersonas: 1
  })
  const [reservando, setReservando] = useState(false)
  const [exito, setExito] = useState(false)
  const [menus, setMenus] = useState([])
  const [vistaActiva, setVistaActiva] = useState('plano') // 'plano' o 'menu'
  const token = localStorage.getItem('ep_cliente_token')

  useEffect(() => { cargarNegocio() }, [id])

  useEffect(() => {
    if (negocio && turnoSeleccionado) cargarDisponibilidad()
    else setMesasOcupadas([])
  }, [fecha, turnoSeleccionado, negocio])

  {/* Carga toda la información del negocio: datos, mesas, paredes, turnos, días bloqueados y menús públicos */}
  const cargarNegocio = async () => {

    {/* Datos del negocio y mesas */}
    try {
      const negocioRes = await axios.get(`${API}/negocios/${id}`)
      setNegocio(negocioRes.data)
      setMesas(negocioRes.data.mesas || [])
    } catch {
      console.error('Error cargando negocio')
    }

    {/* Turnos */} 
    try {
      const turnosRes = await axios.get(`${API}/turnos/negocio/${id}`)
      setTurnos(turnosRes.data)
    } catch {
      console.error('Error cargando turnos')
    }

    {/* Paredes */}
    try {
      const paredesRes = await axios.get(`${API}/paredes/negocio/${id}`)
      setParedes(paredesRes.data)
    } catch {
      console.error('Error cargando paredes')
    }

    {/* Días bloqueados */}
    try {
      const diasRes = await axios.get(`${API}/dias-bloqueados/negocio/${id}`)
      setDiasBloqueados(diasRes.data.map(d => d.fecha.split('T')[0]))
    } catch {
      console.error('Error cargando días bloqueados')
    }
    
    {/* Menús públicos */}
    try {
      const menusRes = await axios.get(`${API}/menus/negocio/${id}/publico`)
      setMenus(menusRes.data)
    } catch {
      console.error('Error cargando menús')
    }

    setCargando(false)
  }

  const cargarDisponibilidad = async () => {
    if (!turnoSeleccionado) return
    try {
      const { data } = await axios.get(
        `${API}/reservas/disponibilidad/${id}/${fecha}/${turnoSeleccionado.id}`
      )
      setMesasOcupadas(data.mesasOcupadas || [])
      setMesaSeleccionada(null)
    } catch {
      console.error('Error cargando disponibilidad')
    }
  }

  const seleccionarMesa = (mesa) => {
    if (!token) { navigate('/login'); return }
    if (!turnoSeleccionado) { alert('Selecciona primero un turno'); return }
    setMesaSeleccionada(mesa)
    setFormReserva({
      horaInicio: generarHoras(turnoSeleccionado.horaInicio, turnoSeleccionado.horaFin)[0] || '',
      nombreContacto: usuario.nombre || '',
      telefono: usuario.telefono || '',
      numPersonas: 1,
    })
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
        numPersonas: formReserva.numPersonas,
        turnoId: turnoSeleccionado.id
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
    <div><Navbar /><div className="negocio-loading"><div className="spinner" /></div></div>
  )

  if (!negocio) return (
    <div><Navbar /><div className="negocio-loading">Negocio no encontrado</div></div>
  )

  const mesasLibres = turnoSeleccionado
    ? mesas.filter(m => !mesasOcupadas.includes(m.id)).length
    : mesas.length

  const horasDisponibles = turnoSeleccionado
    ? generarHoras(turnoSeleccionado.horaInicio, turnoSeleccionado.horaFin)
    : []

  const hoy = new Date().toISOString().split('T')[0]
  const maxFecha = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const fechaBloqueada = (f) => diasBloqueados.includes(f)

  const turnosFiltrados = (() => {
    if (!fecha) return turnos
    const diaSemana = new Date(fecha + 'T00:00:00').getDay().toString()
    return turnos.filter(t => {
      const dias = t.diasSemana ? t.diasSemana.split(',') : ['0','1','2','3','4','5','6']
      return dias.includes(diaSemana)
    })
  })()
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
            <div className="disp-texto">mesas libres</div>
          </div>
        </div>
        {negocio.direccion && (
          <MapaNegocio
            direccion={negocio.direccion}
            ciudad={negocio.ciudad}
            nombre={negocio.nombre}
          />
        )}
        {negocio.mensajeAviso && (
          <div className="negocio-aviso">
            <i className="bi bi-megaphone"></i>
            {negocio.mensajeAviso}
          </div>
        )}

        <div className="negocio-pestanas">
          <button
            className={`pestana-btn ${vistaActiva === 'plano' ? 'activo' : ''}`}
            onClick={() => setVistaActiva('plano')}
          >
            <i className="bi bi-grid"></i> Reservar mesa
          </button>
          <button
            className={`pestana-btn ${vistaActiva === 'menu' ? 'activo' : ''}`}
            onClick={() => setVistaActiva('menu')}
          >
            <i className="bi bi-journal-text"></i> Ver carta
          </button>
        </div>
        
        {vistaActiva === 'plano' && <div className="negocio-plano-seccion">
          <div className="plano-controles">
            <div className="plano-controles-izq">
              <h2>Elige tu mesa</h2>
              <p className="plano-sub">Selecciona fecha y turno para ver la disponibilidad</p>
            </div>
            <div className="campo" style={{ width: 'auto' }}>
              <label>Fecha</label>
              <input
                type="date"
                value={fecha}
                min={hoy}
                max={maxFecha}
                onChange={e => {
                  const nuevaFecha = e.target.value
                  if (fechaBloqueada(nuevaFecha)) {
                    alert('Este día está cerrado. Por favor selecciona otra fecha.')
                    return
                  }
                  setFecha(nuevaFecha)
                  setTurnoSeleccionado(null)
                }}
                style={{ width: '180px' }}
              />
            </div>
          </div>

          {fechaBloqueada(fecha) ? (
            <div className="turnos-aviso">
              <i className="bi bi-x-circle"></i>
              Este día está cerrado. Por favor selecciona otra fecha.
            </div>
          ) : turnosFiltrados.length === 0 ? (
            <div className="turnos-aviso">
              <i className="bi bi-info-circle"></i>
              No hay turnos disponibles para este día.
            </div>
          ) : (
            <div className="turnos-selector">
              <p className="turnos-label">Selecciona un turno:</p>
              <div className="turnos-opciones">
                {turnosFiltrados.map(t => (
                  <button
                    key={t.id}
                    className={`turno-opcion ${turnoSeleccionado?.id === t.id ? 'activo' : ''}`}
                    onClick={() => setTurnoSeleccionado(t)}
                  >
                    <span className="turno-opcion-nombre">{t.nombre}</span>
                    <span className="turno-opcion-horario">{t.horaInicio} — {t.horaFin}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {turnoSeleccionado && (
            <>
              <div className="leyenda">
                <span className="leyenda-item">
                  <span className="leyenda-color libre"></span> Libre
                </span>
                <span className="leyenda-item">
                  <span className="leyenda-color ocupada"></span> Ocupada
                </span>
              </div>

              <div className="plano-cliente-contenedor">
                <div className="plano-cliente">
                  <svg style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%',
                    pointerEvents: 'none'
                  }}>
                    {paredes.map(p => (
                      <line
                        key={p.id}
                        x1={p.x1} y1={p.y1}
                        x2={p.x2} y2={p.y2}
                        stroke="#6b7280"
                        strokeWidth={p.grosor}
                        strokeLinecap="round"
                      />
                    ))}
                  </svg>
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
            </>
          )}
        </div>}

        {vistaActiva === 'menu' && (
          <div className="menu-cliente">
            {menus.length === 0 ? (
              <div className="turnos-aviso">
                <i className="bi bi-info-circle"></i>
                Este establecimiento aún no tiene carta disponible.
              </div>
            ) : (
              menus.map(menu => (
                <div key={menu.id} className="menu-seccion">
                  <h3 className="menu-seccion-titulo">{menu.nombre}</h3>
                  <div className="platos-cliente-grid">
                    {menu.platos.map(plato => (
                      <div key={plato.id} className="plato-cliente-card">
                        {plato.imagenUrl && (
                          <div className="plato-cliente-imagen">
                            <img src={plato.imagenUrl} alt={plato.nombre} />
                          </div>
                        )}
                        <div className="plato-cliente-info">
                          <div className="plato-cliente-top">
                            <span className="plato-nombre">{plato.nombre}</span>
                            {plato.precio && <span className="plato-precio">{plato.precio.toFixed(2)} €</span>}
                          </div>
                          {plato.descripcion && <p className="plato-desc">{plato.descripcion}</p>}
                          {plato.categoria && <span className="plato-categoria">{plato.categoria}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
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
                    <p>Turno: {turnoSeleccionado.nombre} · Máx. {mesaSeleccionada.capacidad} personas</p>
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
                  <div className="campo">
                    <label>Teléfono de contacto</label>
                    <input
                      type="tel"
                      placeholder="666 123 456"
                      value={formReserva.telefono}
                      onChange={e => setFormReserva({ ...formReserva, telefono: e.target.value })}
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
                      <select
                        value={formReserva.horaInicio}
                        onChange={e => setFormReserva({ ...formReserva, horaInicio: e.target.value })}
                        required
                      >
                        {horasDisponibles.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-resumen">
                    <span><i className="bi bi-calendar"></i> {new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    <span><i className="bi bi-clock"></i> {turnoSeleccionado.nombre}: {turnoSeleccionado.horaInicio} — {turnoSeleccionado.horaFin}</span>
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
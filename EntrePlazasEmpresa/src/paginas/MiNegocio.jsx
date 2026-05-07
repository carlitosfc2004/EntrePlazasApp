import { useState, useEffect } from 'react'
import axios from 'axios'
import API from '../config'
import './MiNegocio.css'

const DIAS_SEMANA = [
  { id: '1', label: 'L' , nombre: 'Lunes' },
  { id: '2', label: 'M' , nombre: 'Martes' },
  { id: '3', label: 'X' , nombre: 'Miércoles' },
  { id: '4', label: 'J' , nombre: 'Jueves' },
  { id: '5', label: 'V' , nombre: 'Viernes' },
  { id: '6', label: 'S' , nombre: 'Sábado' },
  { id: '0', label: 'D' , nombre: 'Domingo' },
]

export default function MiNegocio({ negocio, token, onActualizar }) {
  const [form, setForm] = useState({
    nombre: negocio.nombre || '',
    descripcion: negocio.descripcion || '',
    direccion: negocio.direccion || '',
    ciudad: negocio.ciudad || '',
    telefono: negocio.telefono || '',
    horarioApertura: negocio.horarioApertura || '',
    horarioCierre: negocio.horarioCierre || '',
    mensajeAviso: negocio.mensajeAviso || ''
  })
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const [imagenPreview, setImagenPreview] = useState(
    negocio.imagenUrl ? `https://entreplazas-api.onrender.com${negocio.imagenUrl}` : null
  )
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [turnos, setTurnos] = useState([])
  const [formTurno, setFormTurno] = useState({ nombre: '', horaInicio: '', horaFin: '', diasSemana: ['1','2','3','4','5','6','0'] })
  const [añadiendoTurno, setAñadiendoTurno] = useState(false)
  const [diasBloqueados, setDiasBloqueados] = useState([])
  const [formDia, setFormDia] = useState({ fecha: '', motivo: '' })
  const [añadiendoDia, setAñadiendoDia] = useState(false)
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => { cargarTurnos(); cargarDiasBloqueados() }, [])

  const cargarTurnos = async () => {
    try {
      const { data } = await axios.get(`${API}/turnos/negocio/${negocio.id}`)
      setTurnos(data)
    } catch { console.error('Error cargando turnos') }
  }

  const cargarDiasBloqueados = async () => {
    try {
      const { data } = await axios.get(`${API}/dias-bloqueados/negocio/${negocio.id}`)
      setDiasBloqueados(data)
    } catch { console.error('Error cargando días bloqueados') }
  }

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setExito(false)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setGuardando(true)
    try {
      await axios.put(`${API}/negocios/${negocio.id}`, form, { headers })
      setExito(true)
      onActualizar()
    } catch {
      alert('Error al guardar los cambios')
    } finally {
      setGuardando(false)
    }
  }

  const handleImagen = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImagenPreview(URL.createObjectURL(file))
    setSubiendoImagen(true)
    const formData = new FormData()
    formData.append('imagen', file)
    try {
      await axios.post(`${API}/negocios/${negocio.id}/imagen`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      })
      onActualizar()
    } catch {
      alert('Error al subir la imagen')
    } finally {
      setSubiendoImagen(false)
    }
  }

  const toggleDiaSemana = (diaId) => {
    const dias = formTurno.diasSemana.includes(diaId)
      ? formTurno.diasSemana.filter(d => d !== diaId)
      : [...formTurno.diasSemana, diaId]
    setFormTurno({ ...formTurno, diasSemana: dias })
  }

  const crearTurno = async (e) => {
    e.preventDefault()
    console.log('diasSemana', formTurno.diasSemana)
    if (formTurno.diasSemana.length === 0) {
      alert('Selecciona al menos un día de la semana')
      return
    }
    try {
      await axios.post(`${API}/turnos`, {
        negocioId: negocio.id,
        nombre: formTurno.nombre,
        horaInicio: formTurno.horaInicio,
        horaFin: formTurno.horaFin,
        diasSemana: formTurno.diasSemana.join(',')
      }, { headers })
      setFormTurno({ nombre: '', horaInicio: '', horaFin: '', diasSemana: ['1','2','3','4','5','6','0'] })
      setAñadiendoTurno(false)
      cargarTurnos()
    } catch { alert('Error al crear turno') }
  }

  const eliminarTurno = async (id) => {
    if (!confirm('¿Eliminar este turno?')) return
    try {
      await axios.delete(`${API}/turnos/${id}`, { headers })
      cargarTurnos()
    } catch { alert('Error al eliminar turno') }
  }

  const bloquearDia = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API}/dias-bloqueados`, {
        negocioId: negocio.id,
        fecha: formDia.fecha,
        motivo: formDia.motivo
      }, { headers })
      setFormDia({ fecha: '', motivo: '' })
      setAñadiendoDia(false)
      cargarDiasBloqueados()
    } catch { alert('Error al bloquear día') }
  }

  const desbloquearDia = async (id) => {
    if (!confirm('¿Desbloquear este día?')) return
    try {
      await axios.delete(`${API}/dias-bloqueados/${id}`, { headers })
      cargarDiasBloqueados()
    } catch { alert('Error al desbloquear día') }
  }

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  const getNombreDias = (diasSemana) => {
    if (!diasSemana) return 'Todos los días'
    const ids = diasSemana.split(',')
    return DIAS_SEMANA.filter(d => ids.includes(d.id)).map(d => d.nombre).join(', ')
  }

  return (
    <div className="minegocio-root">
      <div className="dash-header">
        <div>
          <h1>Mi negocio</h1>
          <p className="dash-subtitulo">Edita la información de tu local</p>
        </div>
      </div>

      <div className="minegocio-grid">
        <div className="minegocio-card">
          <div className="card-titulo">
            <i className="bi bi-shop"></i>
            <span>Información general</span>
          </div>

          <div className="imagen-uploader">
            <div className="imagen-preview">
              {imagenPreview
                ? <img src={imagenPreview} alt="Imagen del negocio" />
                : <div className="imagen-placeholder">
                    <i className="bi bi-image"></i>
                    <span>Sin imagen</span>
                  </div>
              }
              {subiendoImagen && <div className="imagen-overlay"><div className="spinner" /></div>}
            </div>
            <div className="imagen-acciones">
              <p className="imagen-info">Foto principal de tu local.</p>
              <label className="btn-subir-imagen">
                <i className="bi bi-upload"></i>
                {imagenPreview ? 'Cambiar imagen' : 'Subir imagen'}
                <input type="file" accept="image/jpeg,image/png,image/webp"
                  onChange={handleImagen} style={{ display: 'none' }} />
              </label>
              <p className="imagen-hint">JPG, PNG o WEBP · Máx. 5MB</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="minegocio-form">
            <div className="campo">
              <label>Nombre del local</label>
              <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />
            </div>
            <div className="campo">
              <label>Descripción</label>
              <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} />
            </div>
            <div className="campo-grid">
              <div className="campo">
                <label>Dirección</label>
                <input type="text" name="direccion" value={form.direccion} onChange={handleChange} />
              </div>
              <div className="campo">
                <label>Ciudad</label>
                <input type="text" name="ciudad" value={form.ciudad} onChange={handleChange} />
              </div>
            </div>
            <div className="campo">
              <label>Teléfono</label>
              <input type="tel" name="telefono" value={form.telefono} onChange={handleChange} />
            </div>
            <div className="campo-grid">
              <div className="campo">
                <label>Hora de apertura</label>
                <input type="time" name="horarioApertura" value={form.horarioApertura} onChange={handleChange} />
              </div>
              <div className="campo">
                <label>Hora de cierre</label>
                <input type="time" name="horarioCierre" value={form.horarioCierre} onChange={handleChange} />
              </div>
            </div>
            <div className="campo">
              <label>Mensaje de aviso <span style={{ color: 'var(--gris-texto)', fontWeight: 400 }}>(opcional)</span></label>
              <textarea
                name="mensajeAviso"
                value={form.mensajeAviso}
                onChange={handleChange}
                placeholder="Ej: No abrimos el día 25. Cerrado por vacaciones del 1 al 7 de agosto..."
                rows={2}
              />
            </div>
            {exito && (
              <div className="exito-msg">
                <i className="bi bi-check-circle"></i> Cambios guardados correctamente
              </div>
            )}
            <button type="submit" className="btn-principal" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>

        <div className="minegocio-info">
          <div className="info-card">
            <div className="card-titulo">
              <i className="bi bi-info-circle"></i>
              <span>Resumen</span>
            </div>
            <div className="info-lista">
              <div className="info-item">
                <i className="bi bi-shop"></i>
                <div>
                  <span className="info-label">Local</span>
                  <span className="info-valor">{negocio.nombre}</span>
                </div>
              </div>
              <div className="info-item">
                <i className="bi bi-geo-alt"></i>
                <div>
                  <span className="info-label">Ubicación</span>
                  <span className="info-valor">{negocio.ciudad || '—'}</span>
                </div>
              </div>
              <div className="info-item">
                <i className="bi bi-clock"></i>
                <div>
                  <span className="info-label">Horario</span>
                  <span className="info-valor">
                    {negocio.horarioApertura && negocio.horarioCierre
                      ? `${negocio.horarioApertura} - ${negocio.horarioCierre}`
                      : '—'}
                  </span>
                </div>
              </div>
              <div className="info-item">
                <i className="bi bi-telephone"></i>
                <div>
                  <span className="info-label">Teléfono</span>
                  <span className="info-valor">{negocio.telefono || '—'}</span>
                </div>
              </div>
              <div className="info-item">
                <i className="bi bi-grid"></i>
                <div>
                  <span className="info-label">Mesas activas</span>
                  <span className="info-valor">{negocio.mesas?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="info-card">
            <div className="card-titulo">
              <i className="bi bi-clock-history"></i>
              <span>Turnos de servicio</span>
            </div>
            {turnos.length === 0 && !añadiendoTurno && (
              <p className="turnos-vacio">No hay turnos configurados.</p>
            )}
            <div className="turnos-lista">
              {turnos.map(t => (
                <div key={t.id} className="turno-item">
                  <div className="turno-info">
                    <span className="turno-nombre">{t.nombre}</span>
                    <span className="turno-horario">{t.horaInicio} — {t.horaFin}</span>
                    <span className="turno-dias">{getNombreDias(t.diasSemana)}</span>
                  </div>
                  <button className="turno-eliminar" onClick={() => eliminarTurno(t.id)}>
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              ))}
            </div>
            {añadiendoTurno ? (
              <form onSubmit={crearTurno} className="turno-form">
                <div className="campo">
                  <label>Nombre del turno</label>
                  <input type="text" placeholder="Mediodía, Noche..."
                    value={formTurno.nombre}
                    onChange={e => setFormTurno({ ...formTurno, nombre: e.target.value })}
                    required autoFocus />
                </div>
                <div className="campo-grid">
                  <div className="campo">
                    <label>Hora inicio</label>
                    <input type="time" value={formTurno.horaInicio}
                      onChange={e => setFormTurno({ ...formTurno, horaInicio: e.target.value })}
                      required />
                  </div>
                  <div className="campo">
                    <label>Hora fin</label>
                    <input type="time" value={formTurno.horaFin}
                      onChange={e => setFormTurno({ ...formTurno, horaFin: e.target.value })}
                      required />
                  </div>
                </div>
                <div className="campo">
                  <label>Días de la semana</label>
                  <div className="dias-semana-selector">
                    {DIAS_SEMANA.map(d => (
                      <button
                        key={d.id}
                        type="button"
                        className={`dia-btn ${formTurno.diasSemana.includes(d.id) ? 'activo' : ''}`}
                        onClick={() => toggleDiaSemana(d.id)}
                        title={d.nombre}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="modal-botones">
                  <button type="button" className="btn-cancelar"
                    onClick={() => setAñadiendoTurno(false)}>Cancelar</button>
                  <button type="submit" className="btn-principal">Guardar turno</button>
                </div>
              </form>
            ) : (
              <button className="btn-añadir-turno" onClick={() => setAñadiendoTurno(true)}>
                <i className="bi bi-plus-circle"></i> Añadir turno
              </button>
            )}
          </div>

          <div className="info-card">
            <div className="card-titulo">
              <i className="bi bi-calendar-x"></i>
              <span>Días bloqueados</span>
            </div>
            {diasBloqueados.length === 0 && !añadiendoDia && (
              <p className="turnos-vacio">No hay días bloqueados.</p>
            )}
            <div className="turnos-lista">
              {diasBloqueados.map(d => (
                <div key={d.id} className="turno-item">
                  <div className="turno-info">
                    <span className="turno-nombre">{formatFecha(d.fecha)}</span>
                    {d.motivo && <span className="turno-horario">{d.motivo}</span>}
                  </div>
                  <button className="turno-eliminar" onClick={() => desbloquearDia(d.id)}>
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              ))}
            </div>
            {añadiendoDia ? (
              <form onSubmit={bloquearDia} className="turno-form">
                <div className="campo">
                  <label>Fecha a bloquear</label>
                  <input type="date" value={formDia.fecha}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setFormDia({ ...formDia, fecha: e.target.value })}
                    required />
                </div>
                <div className="campo">
                  <label>Motivo <span style={{ color: 'var(--gris-texto)', fontWeight: 400 }}>(opcional)</span></label>
                  <input type="text" placeholder="Ej: Cerrado por festivo"
                    value={formDia.motivo}
                    onChange={e => setFormDia({ ...formDia, motivo: e.target.value })} />
                </div>
                <div className="modal-botones">
                  <button type="button" className="btn-cancelar"
                    onClick={() => setAñadiendoDia(false)}>Cancelar</button>
                  <button type="submit" className="btn-principal">Bloquear día</button>
                </div>
              </form>
            ) : (
              <button className="btn-añadir-turno" onClick={() => setAñadiendoDia(true)}>
                <i className="bi bi-plus-circle"></i> Bloquear día
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
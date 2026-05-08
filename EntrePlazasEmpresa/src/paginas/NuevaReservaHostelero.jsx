import { useState, useEffect } from 'react'
import axios from 'axios'
import API from '../config'

export default function NuevaReservaHostelero({ negocio, token, onCreada }) {
    const [mesas, setMesas] = useState([])
    const [turnos, setTurnos] = useState([])
    const [form, setForm] = useState({
        mesaId: '',
        turnoId: '',
        fecha: new Date().toISOString().split('T')[0],
        horaInicio: '',
        nombreContacto: '',
        telefono: '',
        numPersonas: 1
    })
    const [exito, setExito] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const headers = { Authorization: `Bearer ${token}` }

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        try {
            const [mesasRes, turnosRes] = await Promise.all([
                axios.get(`${API}/mesas/negocio/${negocio.id}`),
                axios.get(`${API}/turnos/negocio/${negocio.id}`)
            ])
            setMesas(mesasRes.data)
            setTurnos(turnosRes.data)
        } catch (err) {
            console.error('Error cargando datos', err)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setGuardando(true)
        try {
            await axios.post(`${API}/reservas`, {
                mesaId: parseInt(form.mesaId),
                negocioId: negocio.id,
                fecha: form.fecha,
                horaInicio: form.horaInicio,
                nombreContacto: form.nombreContacto,
                telefono: form.telefono,
                numPersonas: parseInt(form.numPersonas),
                turnoId: parseInt(form.turnoId)
            }, { headers })
            setExito(true)
            setForm({
                mesaId: '', turnoId: '',
                fecha: new Date().toISOString().split('T')[0],
                horaInicio: '', nombreContacto: '', telefono: '', numPersonas: 1
            })
            onCreada()
            setTimeout(() => setExito(false), 3000)
        } catch (err) {
            alert(err.response?.data?.error || 'Error al crear la reserva')
        } finally {
            setGuardando(false)
        }
    }

    return (
        <div>
            <div className="dash-header">
                <div>
                    <h1>Nueva reserva</h1>
                    <p className="dash-subtitulo">Registra una reserva recibida por teléfono</p>
                </div>
            </div>

            <div style={{ maxWidth: '500px' }}>
                <div className="minegocio-card">
                    <div className="card-titulo">
                        <i className="bi bi-calendar-plus"></i>
                        <span>Datos de la reserva</span>
                    </div>

                    {exito && (
                        <div className="exito-msg" style={{ marginBottom: '16px' }}>
                            <i className="bi bi-check-circle"></i> Reserva creada correctamente
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="campo-grid">
                            <div className="campo">
                                <label>Fecha</label>
                                <input type="date" value={form.fecha}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={e => setForm({ ...form, fecha: e.target.value })}
                                required />
                            </div>
                            <div className="campo">
                                <label>Turno</label>
                                <select value={form.turnoId}
                                    onChange={e => setForm({ ...form, turnoId: e.target.value })}
                                    required
                                    style={{ background: 'var(--gris-medio)', border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio)', padding: '14px 16px', fontSize: '15px', color: 'var(--blanco)', width: '100%' }}>
                                    <option value="">Selecciona turno</option>
                                    {turnos.map(t => (
                                        <option key={t.id} value={t.id}>{t.nombre} ({t.horaInicio}-{t.horaFin})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="campo-grid">
                            <div className="campo">
                                <label>Mesa</label>
                                <select value={form.mesaId}
                                    onChange={e => setForm({ ...form, mesaId: e.target.value })}
                                    required
                                    style={{ background: 'var(--gris-medio)', border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio)', padding: '14px 16px', fontSize: '15px', color: 'var(--blanco)', width: '100%' }}>
                                    <option value="">Selecciona mesa</option>
                                    {mesas.map(m => (
                                        <option key={m.id} value={m.id}>{m.etiqueta} ({m.capacidad} personas)</option>
                                    ))}
                                </select>
                            </div>
                            <div className="campo">
                                <label>Hora</label>
                                <input type="time" value={form.horaInicio}
                                onChange={e => setForm({ ...form, horaInicio: e.target.value })}
                                required />
                            </div>
                        </div>
                        <div className="campo">
                            <label>Nombre del cliente</label>
                            <input type="text" placeholder="Nombre de contacto"
                            value={form.nombreContacto}
                            onChange={e => setForm({ ...form, nombreContacto: e.target.value })}
                            required />
                        </div>
                        <div className="campo-grid">
                            <div className="campo">
                                <label>Teléfono</label>
                                <input type="tel" placeholder="666 123 456"
                                value={form.telefono}
                                onChange={e => setForm({ ...form, telefono: e.target.value })} />
                            </div>
                            <div className="campo">
                                <label>Nº personas</label>
                                <input type="number" min="1" max="30"
                                value={form.numPersonas}
                                onChange={e => setForm({ ...form, numPersonas: e.target.value })}
                                required />
                            </div>
                        </div>
                        <button type="submit" className="btn-principal" disabled={guardando}>
                            {guardando ? 'Creando...' : 'Crear reserva'}
                        </button>
                    </form> 
                </div>
            </div>
        </div>
    )
}
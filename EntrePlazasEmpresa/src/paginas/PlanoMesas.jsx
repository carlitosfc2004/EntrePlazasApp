import { useState, useEffect, useRef } from 'react'
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import axios from 'axios'
import './PlanoMesas.css'

const API = 'http://localhost:3001/api'

function Mesa({ mesa, seleccionada, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: mesa.id.toString(),
  })

  const style = {
    position: 'absolute',
    left: mesa.posX,
    top: mesa.posY,
    width: mesa.ancho,
    height: mesa.alto,
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    zIndex: isDragging ? 999 : seleccionada ? 10 : 1,
    opacity: isDragging ? 0.85 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mesa-bloque ${seleccionada ? 'seleccionada' : ''} ${isDragging ? 'arrastrando' : ''}`}
      onClick={(e) => { e.stopPropagation(); onClick(mesa) }}
      {...listeners}
      {...attributes}
    >
      <span className="mesa-etiqueta">{mesa.etiqueta}</span>
      <span className="mesa-capacidad">{mesa.capacidad}p</span>
    </div>
  )
}

function Lienzo({ children }) {
  const { setNodeRef } = useDroppable({ id: 'lienzo' })
  return (
    <div ref={setNodeRef} className="lienzo">
      {children}
    </div>
  )
}

export default function PlanoMesas({ negocioId, token }) {
  const [mesas, setMesas] = useState([])
  const [seleccionada, setSeleccionada] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [formNueva, setFormNueva] = useState({ etiqueta: '', capacidad: 4 })
  const [mostrarForm, setMostrarForm] = useState(false)
  const lienzoRef = useRef(null)

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    cargarMesas()
  }, [])

  const cargarMesas = async () => {
    try {
      const { data } = await axios.get(`${API}/mesas/negocio/${negocioId}`)
      setMesas(data)
    } catch {
      console.error('Error cargando mesas')
    } finally {
      setCargando(false)
    }
  }

  const handleDragEnd = async (event) => {
    const { active, delta } = event
    if (!delta) return

    const mesaId = parseInt(active.id)
    const mesa = mesas.find(m => m.id === mesaId)
    if (!mesa) return

    const lienzoRect = lienzoRef.current?.getBoundingClientRect()
    const nuevaPosX = Math.max(0, Math.min(mesa.posX + delta.x, (lienzoRect?.width || 800) - mesa.ancho))
    const nuevaPosY = Math.max(0, Math.min(mesa.posY + delta.y, (lienzoRect?.height || 600) - mesa.alto))

    setMesas(prev => prev.map(m =>
      m.id === mesaId ? { ...m, posX: nuevaPosX, posY: nuevaPosY } : m
    ))

    try {
      await axios.put(`${API}/mesas/${mesaId}/posicion`,
        { posX: nuevaPosX, posY: nuevaPosY },
        { headers }
      )
    } catch {
      console.error('Error guardando posición')
    }
  }

  const crearMesa = async (e) => {
    e.preventDefault()
    try {
      const { data } = await axios.post(`${API}/mesas`, {
        negocioId,
        etiqueta: formNueva.etiqueta,
        capacidad: parseInt(formNueva.capacidad),
        posX: 50 + mesas.length * 20,
        posY: 50 + mesas.length * 20,
        ancho: 90,
        alto: 90
      }, { headers })
      setMesas(prev => [...prev, data])
      setFormNueva({ etiqueta: '', capacidad: 4 })
      setMostrarForm(false)
    } catch {
      alert('Error al crear mesa')
    }
  }

  const eliminarMesa = async (mesa) => {
    if (!confirm(`¿Eliminar ${mesa.etiqueta}?`)) return
    try {
      await axios.delete(`${API}/mesas/${mesa.id}`, { headers })
      setMesas(prev => prev.filter(m => m.id !== mesa.id))
      setSeleccionada(null)
    } catch {
      alert('Error al eliminar mesa')
    }
  }

  if (cargando) return <div className="plano-loading">Cargando plano...</div>

  return (
    <div className="plano-root">
      <div className="plano-toolbar">
        <div className="toolbar-izq">
          <h2>Editor de plano</h2>
          <span className="toolbar-info">{mesas.length} mesas · Arrastra para mover</span>
        </div>
        <button className="btn-nueva-mesa" onClick={() => setMostrarForm(true)}>
          + Nueva mesa
        </button>
      </div>

      <div className="plano-workspace" ref={lienzoRef}>
        <DndContext onDragEnd={handleDragEnd}>
          <Lienzo>
            {mesas.map(mesa => (
              <Mesa
                key={mesa.id}
                mesa={mesa}
                seleccionada={seleccionada?.id === mesa.id}
                onClick={setSeleccionada}
              />
            ))}
          </Lienzo>
        </DndContext>

        {seleccionada && (
          <div className="panel-mesa">
            <div className="panel-mesa-header">
              <span className="panel-mesa-titulo">{seleccionada.etiqueta}</span>
              <button className="panel-cerrar" onClick={() => setSeleccionada(null)}>✕</button>
            </div>
            <div className="panel-mesa-info">
              <div className="panel-dato">
                <span className="panel-label">Capacidad</span>
                <span className="panel-valor">{seleccionada.capacidad} personas</span>
              </div>
              <div className="panel-dato">
                <span className="panel-label">Posición</span>
                <span className="panel-valor">X:{Math.round(seleccionada.posX)} Y:{Math.round(seleccionada.posY)}</span>
              </div>
            </div>
            <button
              className="btn-eliminar"
              onClick={() => eliminarMesa(seleccionada)}
            >
              Eliminar mesa
            </button>
          </div>
        )}
      </div>

      {mostrarForm && (
        <div className="modal-overlay" onClick={() => setMostrarForm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Nueva mesa</h3>
            <form onSubmit={crearMesa} className="modal-form">
              <div className="campo">
                <label>Etiqueta</label>
                <input
                  type="text"
                  placeholder="Mesa 1, Barra, Terraza..."
                  value={formNueva.etiqueta}
                  onChange={e => setFormNueva({ ...formNueva, etiqueta: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="campo">
                <label>Capacidad (personas)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formNueva.capacidad}
                  onChange={e => setFormNueva({ ...formNueva, capacidad: e.target.value })}
                  required
                />
              </div>
              <div className="modal-botones">
                <button type="button" className="btn-cancelar" onClick={() => setMostrarForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-principal">
                  Crear mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
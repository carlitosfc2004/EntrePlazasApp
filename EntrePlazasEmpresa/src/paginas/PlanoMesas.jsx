import { useState, useEffect, useRef } from 'react'
import { DndContext, useDraggable, useDroppable, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import axios from 'axios'
import './PlanoMesas.css'

const API = 'https://entreplazas-api.onrender.com/api'

const FORMAS = [
  { id: 'cuadrado', label: 'Cuadrado', icono: 'bi bi-square' },
  { id: 'rectangulo', label: 'Rectángulo', icono: 'bi bi-aspect-ratio' },
  { id: 'circulo', label: 'Círculo', icono: 'bi bi-circle' },
]

const TAMAÑOS = [
  { id: 'pequena', label: 'Pequeña', ancho: 70, alto: 70 },
  { id: 'mediana', label: 'Mediana', ancho: 90, alto: 90 },
  { id: 'grande', label: 'Grande', ancho: 120, alto: 120 },
  { id: 'rectangulo', label: 'Alargada', ancho: 140, alto: 80 },
]

function Mesa({ mesa, seleccionada, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `mesa-${mesa.id}`,
  })

  const esCirculo = mesa.forma === 'circulo'
  const esRectangulo = mesa.forma === 'rectangulo'

  const style = {
    position: 'absolute',
    left: mesa.posX,
    top: mesa.posY,
    width: mesa.ancho,
    height: esRectangulo ? mesa.alto * 0.65 : mesa.alto,
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    zIndex: isDragging ? 999 : seleccionada ? 10 : 1,
    opacity: isDragging ? 0.85 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    borderRadius: esCirculo ? '50%' : '10px',
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

function ParedSVG({ pared, seleccionada, onClick }) {
  const dx = pared.x2 - pared.x1
  const dy = pared.y2 - pared.y1
  const longitud = Math.sqrt(dx * dx + dy * dy)
  if (longitud === 0) return null

  return (
    <line
      x1={pared.x1} y1={pared.y1}
      x2={pared.x2} y2={pared.y2}
      stroke={seleccionada ? '#e8562a' : '#6b7280'}
      strokeWidth={pared.grosor}
      strokeLinecap="round"
      style={{ cursor: 'pointer' }}
      onClick={(e) => { e.stopPropagation(); onClick(pared) }}
    />
  )
}

function Lienzo({ children, zoom, modo, onDibujarPared, paredes, paredSeleccionada, onSeleccionarPared }) {
  const { setNodeRef } = useDroppable({ id: 'lienzo' })
  const svgRef = useRef(null)
  const [dibujando, setDibujando] = useState(false)
  const [inicio, setInicio] = useState(null)
  const [preview, setPreview] = useState(null)

  const getPosicion = (e) => {
    const rect = svgRef.current.getBoundingClientRect()
    return {
      x: Math.round((e.clientX - rect.left) / zoom),
      y: Math.round((e.clientY - rect.top) / zoom)
    }
  }

  const handleMouseDown = (e) => {
    if (modo !== 'pared') return
    const pos = getPosicion(e)
    setDibujando(true)
    setInicio(pos)
    setPreview(pos)
  }

  const handleMouseMove = (e) => {
    if (!dibujando || modo !== 'pared') return
    const pos = getPosicion(e)
    const dx = Math.abs(pos.x - inicio.x)
    const dy = Math.abs(pos.y - inicio.y)
    if (dx > dy) {
      setPreview({ x: pos.x, y: inicio.y })
    } else {
      setPreview({ x: inicio.x, y: pos.y })
    }
  }

  const handleMouseUp = (e) => {
    if (!dibujando || modo !== 'pared' || !inicio || !preview) return
    setDibujando(false)
    const distancia = Math.sqrt(
      Math.pow(preview.x - inicio.x, 2) + Math.pow(preview.y - inicio.y, 2)
    )
    if (distancia > 20) {
      onDibujarPared(inicio.x, inicio.y, preview.x, preview.y)
    }
    setInicio(null)
    setPreview(null)
  }

  return (
    <div
      ref={setNodeRef}
      className="lienzo"
      style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', cursor: modo === 'pared' ? 'crosshair' : 'default' }}
    >
      <svg
        ref={svgRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: modo === 'pared' ? 'all' : 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {paredes.map(p => (
          <ParedSVG
            key={p.id}
            pared={p}
            seleccionada={paredSeleccionada?.id === p.id}
            onClick={onSeleccionarPared}
          />
        ))}
        {dibujando && inicio && preview && (
          <line
            x1={inicio.x} y1={inicio.y}
            x2={preview.x} y2={preview.y}
            stroke="#e8562a"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray="8 4"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </svg>
      {children}
    </div>
  )
}

export default function PlanoMesas({ negocioId, token }) {
  const [mesas, setMesas] = useState([])
  const [paredes, setParedes] = useState([])
  const [seleccionada, setSeleccionada] = useState(null)
  const [paredSeleccionada, setParedSeleccionada] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [modo, setModo] = useState('mesa')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [formNueva, setFormNueva] = useState({
    etiqueta: '', capacidad: 4, forma: 'cuadrado', tamaño: 'mediana'
  })
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [mesasRes, paredesRes] = await Promise.all([
        axios.get(`${API}/mesas/negocio/${negocioId}`),
        axios.get(`${API}/paredes/negocio/${negocioId}`)
      ])
      setMesas(mesasRes.data)
      setParedes(paredesRes.data)
    } catch {
      console.error('Error cargando datos')
    } finally {
      setCargando(false)
    }
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const handleDragEnd = async (event) => {
    const { active, delta } = event
    if (!delta) return
    const mesaId = parseInt(active.id.replace('mesa-', ''))
    const mesa = mesas.find(m => m.id === mesaId)
    if (!mesa) return
    const nuevaPosX = Math.max(0, mesa.posX + delta.x / zoom)
    const nuevaPosY = Math.max(0, mesa.posY + delta.y / zoom)
    setMesas(prev => prev.map(m => m.id === mesaId ? { ...m, posX: nuevaPosX, posY: nuevaPosY } : m))
    setSeleccionada(prev => prev?.id === mesaId ? { ...prev, posX: nuevaPosX, posY: nuevaPosY } : prev)
    try {
      await axios.put(`${API}/mesas/${mesaId}/posicion`, { posX: Math.round(nuevaPosX), posY: Math.round(nuevaPosY) }, { headers })
    } catch { console.error('Error guardando posición') }
  }

  const crearMesa = async (e) => {
    e.preventDefault()
    const tamaño = TAMAÑOS.find(t => t.id === formNueva.tamaño) || TAMAÑOS[1]
    const ancho = formNueva.forma === 'rectangulo' ? tamaño.ancho + 40 : tamaño.ancho
    try {
      const { data } = await axios.post(`${API}/mesas`, {
        negocioId, etiqueta: formNueva.etiqueta,
        capacidad: parseInt(formNueva.capacidad),
        posX: 40 + (mesas.length % 6) * 160,
        posY: 40 + Math.floor(mesas.length / 6) * 160,
        ancho, alto: tamaño.alto,
        forma: formNueva.forma
      }, { headers })
      setMesas(prev => [...prev, { ...data, forma: formNueva.forma }])
      setFormNueva({ etiqueta: '', capacidad: 4, forma: 'cuadrado', tamaño: 'mediana' })
      setMostrarForm(false)
    } catch { alert('Error al crear mesa') }
  }

  const eliminarMesa = async (mesa) => {
    if (!confirm(`¿Eliminar ${mesa.etiqueta}?`)) return
    try {
      await axios.delete(`${API}/mesas/${mesa.id}`, { headers })
      setMesas(prev => prev.filter(m => m.id !== mesa.id))
      setSeleccionada(null)
    } catch { alert('Error al eliminar mesa') }
  }

  const dibujarPared = async (x1, y1, x2, y2) => {
    try {
      const { data } = await axios.post(`${API}/paredes`, {
        negocioId, x1, y1, x2, y2, grosor: 8
      }, { headers })
      setParedes(prev => [...prev, data])
    } catch { console.error('Error al crear pared') }
  }

  const eliminarPared = async (pared) => {
    if (!confirm('¿Eliminar esta pared?')) return
    try {
      await axios.delete(`${API}/paredes/${pared.id}`, { headers })
      setParedes(prev => prev.filter(p => p.id !== pared.id))
      setParedSeleccionada(null)
    } catch { alert('Error al eliminar pared') }
  }

  const handleClickLienzo = () => {
    setSeleccionada(null)
    setParedSeleccionada(null)
  }

  if (cargando) return <div className="plano-loading">Cargando plano...</div>

  return (
    <div className="plano-root">
      <div className="plano-toolbar">
        <div className="toolbar-izq">
          <h2>Editor de plano</h2>
          <span className="toolbar-info">{mesas.length} mesas · {paredes.length} paredes</span>
        </div>
        <div className="toolbar-der">
          <div className="modo-controles">
            <button
              className={`modo-btn ${modo === 'mesa' ? 'activo' : ''}`}
              onClick={() => { setModo('mesa'); setParedSeleccionada(null) }}
            >
              <i className="bi bi-grid"></i> Mesas
            </button>
            <button
              className={`modo-btn ${modo === 'pared' ? 'activo' : ''}`}
              onClick={() => { setModo('pared'); setSeleccionada(null) }}
            >
              <i className="bi bi-pencil-square"></i> Paredes
            </button>
          </div>
          <div className="zoom-controles">
            <button className="zoom-btn" onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}>−</button>
            <span className="zoom-valor">{Math.round(zoom * 100)}%</span>
            <button className="zoom-btn" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>+</button>
            <button className="zoom-btn" onClick={() => setZoom(1)}>↺</button>
          </div>
          {modo === 'mesa' && (
            <button className="btn-nueva-mesa" onClick={() => setMostrarForm(true)}>
              + Nueva mesa
            </button>
          )}
          {modo === 'pared' && (
            <span className="pared-hint">
              <i className="bi bi-info-circle"></i> Haz clic y arrastra para dibujar
            </span>
          )}
        </div>
      </div>

      <div className="plano-workspace">
        <div className="lienzo-contenedor" onClick={handleClickLienzo}>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <Lienzo
              zoom={zoom}
              modo={modo}
              onDibujarPared={dibujarPared}
              paredes={paredes}
              paredSeleccionada={paredSeleccionada}
              onSeleccionarPared={setParedSeleccionada}
            >
              {modo === 'mesa' && mesas.map(mesa => (
                <Mesa
                  key={mesa.id}
                  mesa={mesa}
                  seleccionada={seleccionada?.id === mesa.id}
                  onClick={setSeleccionada}
                />
              ))}
              {modo !== 'mesa' && mesas.map(mesa => {
                const esCirculo = mesa.forma === 'circulo'
                const esRectangulo = mesa.forma === 'rectangulo'
                return (
                  <div key={mesa.id} style={{
                    position: 'absolute', left: mesa.posX, top: mesa.posY,
                    width: mesa.ancho, height: esRectangulo ? mesa.alto * 0.65 : mesa.alto,
                    borderRadius: esCirculo ? '50%' : '10px',
                    background: 'var(--gris-medio)', border: '2px solid var(--gris-borde)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: 4, opacity: 0.5, pointerEvents: 'none'
                  }}>
                    <span style={{ fontSize: 12, color: 'white' }}>{mesa.etiqueta}</span>
                  </div>
                )
              })}
            </Lienzo>
          </DndContext>
        </div>

        {seleccionada && modo === 'mesa' && (
          <div className="panel-mesa">
            <div className="panel-mesa-header">
              <span className="panel-mesa-titulo">{seleccionada.etiqueta}</span>
              <button className="panel-cerrar" onClick={() => setSeleccionada(null)}>✕</button>
            </div>
            <div className="panel-mesa-info">
              <div className="panel-dato">
                <span className="panel-label">Forma</span>
                <span className="panel-valor" style={{ textTransform: 'capitalize' }}>{seleccionada.forma}</span>
              </div>
              <div className="panel-dato">
                <span className="panel-label">Capacidad</span>
                <span className="panel-valor">{seleccionada.capacidad} personas</span>
              </div>
              <div className="panel-dato">
                <span className="panel-label">Posición</span>
                <span className="panel-valor">X:{Math.round(seleccionada.posX)} Y:{Math.round(seleccionada.posY)}</span>
              </div>
            </div>
            <button className="btn-eliminar" onClick={() => eliminarMesa(seleccionada)}>
              Eliminar mesa
            </button>
          </div>
        )}

        {paredSeleccionada && modo === 'pared' && (
          <div className="panel-mesa">
            <div className="panel-mesa-header">
              <span className="panel-mesa-titulo">Pared</span>
              <button className="panel-cerrar" onClick={() => setParedSeleccionada(null)}>✕</button>
            </div>
            <div className="panel-mesa-info">
              <div className="panel-dato">
                <span className="panel-label">Inicio</span>
                <span className="panel-valor">X:{paredSeleccionada.x1} Y:{paredSeleccionada.y1}</span>
              </div>
              <div className="panel-dato">
                <span className="panel-label">Fin</span>
                <span className="panel-valor">X:{paredSeleccionada.x2} Y:{paredSeleccionada.y2}</span>
              </div>
              <div className="panel-dato">
                <span className="panel-label">Grosor</span>
                <span className="panel-valor">{paredSeleccionada.grosor}px</span>
              </div>
            </div>
            <button className="btn-eliminar" onClick={() => eliminarPared(paredSeleccionada)}>
              Eliminar pared
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
                <label>Nombre de la mesa</label>
                <input type="text" placeholder="Mesa 1, Barra, Terraza..."
                  value={formNueva.etiqueta}
                  onChange={e => setFormNueva({ ...formNueva, etiqueta: e.target.value })}
                  required autoFocus />
              </div>
              <div className="campo">
                <label>Capacidad (personas)</label>
                <input type="number" min="1" max="30" value={formNueva.capacidad}
                  onChange={e => setFormNueva({ ...formNueva, capacidad: e.target.value })} required />
              </div>
              <div className="campo">
                <label>Forma</label>
                <div className="selector-formas">
                  {FORMAS.map(f => (
                    <button key={f.id} type="button"
                      className={`forma-btn ${formNueva.forma === f.id ? 'activo' : ''}`}
                      onClick={() => setFormNueva({ ...formNueva, forma: f.id })}>
                      <i className={`${f.icono} forma-icono`}></i>
                      <span className="forma-label">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="campo">
                <label>Tamaño</label>
                <div className="selector-tamaños">
                  {TAMAÑOS.map(t => (
                    <button key={t.id} type="button"
                      className={`tamaño-btn ${formNueva.tamaño === t.id ? 'activo' : ''}`}
                      onClick={() => setFormNueva({ ...formNueva, tamaño: t.id })}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-botones">
                <button type="button" className="btn-cancelar" onClick={() => setMostrarForm(false)}>Cancelar</button>
                <button type="submit" className="btn-principal">Crear mesa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
import { useState, useEffect } from 'react'
import axios from 'axios'
import API from '../config'
import './MenuDigital.css'

export default function MenuDigital({ negocioId, token }) {
  const [menus, setMenus] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormMenu, setMostrarFormMenu] = useState(false)
  const [mostrarFormPlato, setMostrarFormPlato] = useState(null)
  const [formMenu, setFormMenu] = useState({ nombre: '' })
  const [formPlato, setFormPlato] = useState({ nombre: '', descripcion: '', precio: '', categoria: '' })
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => { cargarMenus() }, [])

  const cargarMenus = async () => {
    try {
      const { data } = await axios.get(`${API}/menus/negocio/${negocioId}`, { headers })
      setMenus(data)
    } catch {
      console.error('Error cargando menús')
    } finally {
      setCargando(false)
    }
  }

  const crearMenu = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API}/menus`, { negocioId, nombre: formMenu.nombre }, { headers })
      setFormMenu({ nombre: '' })
      setMostrarFormMenu(false)
      cargarMenus()
    } catch { alert('Error al crear menú') }
  }

  const eliminarMenu = async (id) => {
    if (!confirm('¿Eliminar este menú y todos sus platos?')) return
    try {
      await axios.delete(`${API}/menus/${id}`, { headers })
      cargarMenus()
    } catch { alert('Error al eliminar menú') }
  }

  const crearPlato = async (e, menuId) => {
    e.preventDefault()
    try {
      await axios.post(`${API}/platos`, {
        menuId,
        nombre: formPlato.nombre,
        descripcion: formPlato.descripcion,
        precio: parseFloat(formPlato.precio),
        categoria: formPlato.categoria
      }, { headers })
      setFormPlato({ nombre: '', descripcion: '', precio: '', categoria: '' })
      setMostrarFormPlato(null)
      cargarMenus()
    } catch { alert('Error al crear plato') }
  }

  const eliminarPlato = async (id) => {
    if (!confirm('¿Eliminar este plato?')) return
    try {
      await axios.delete(`${API}/platos/${id}`, { headers })
      cargarMenus()
    } catch { alert('Error al eliminar plato') }
  }

  const subirImagenPlato = async (platoId, file) => {
    setSubiendoImagen(platoId)
    const formData = new FormData()
    formData.append('imagen', file)
    try {
      await axios.post(`${API}/platos/${platoId}/imagen`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      })
      cargarMenus()
    } catch { alert('Error al subir imagen') }
    finally { setSubiendoImagen(null) }
  }

  if (cargando) return <div className="menu-loading">Cargando menú...</div>

  return (
    <div className="menu-root">
      <div className="dash-header">
        <div>
          <h1>Menú digital</h1>
          <p className="dash-subtitulo">Gestiona la carta de tu establecimiento</p>
        </div>
        <button className="btn-nueva-mesa" onClick={() => setMostrarFormMenu(true)}>
          <i className="bi bi-plus-lg"></i> Nueva carta
        </button>
      </div>

      {menus.length === 0 && !mostrarFormMenu && (
        <div className="menu-vacio">
          <i className="bi bi-journal-x"></i>
          <p>No hay cartas creadas. Añade tu primera carta.</p>
        </div>
      )}

      {mostrarFormMenu && (
        <div className="menu-card">
          <form onSubmit={crearMenu} className="menu-form-nueva">
            <div className="campo">
              <label>Nombre de la carta</label>
              <input type="text" placeholder="Carta, Menú del día, Tapas..."
                value={formMenu.nombre}
                onChange={e => setFormMenu({ nombre: e.target.value })}
                required autoFocus />
            </div>
            <div className="modal-botones">
              <button type="button" className="btn-cancelar" onClick={() => setMostrarFormMenu(false)}>Cancelar</button>
              <button type="submit" className="btn-principal">Crear carta</button>
            </div>
          </form>
        </div>
      )}

      {menus.map(menu => (
        <div key={menu.id} className="menu-card">
          <div className="menu-card-header">
            <h2>{menu.nombre}</h2>
            <button className="turno-eliminar" onClick={() => eliminarMenu(menu.id)}>
              <i className="bi bi-trash"></i>
            </button>
          </div>

          <div className="platos-grid">
            {menu.platos?.map(plato => (
              <div key={plato.id} className="plato-card">
                <div className="plato-imagen">
                  {plato.imagenUrl
                    ? <img src={plato.imagenUrl} alt={plato.nombre} />
                    : <div className="plato-imagen-placeholder">
                        <i className="bi bi-image"></i>
                      </div>
                  }
                  <label className="plato-imagen-btn">
                    {subiendoImagen === plato.id
                      ? <div className="spinner" />
                      : <i className="bi bi-camera"></i>
                    }
                    <input type="file" accept="image/jpeg,image/png,image/webp"
                      onChange={e => subirImagenPlato(plato.id, e.target.files[0])}
                      style={{ display: 'none' }} />
                  </label>
                </div>
                <div className="plato-info">
                  <div className="plato-info-top">
                    <span className="plato-nombre">{plato.nombre}</span>
                    <span className="plato-precio">{plato.precio ? `${plato.precio.toFixed(2)} €` : '—'}</span>
                  </div>
                  {plato.descripcion && <p className="plato-desc">{plato.descripcion}</p>}
                  {plato.categoria && <span className="plato-categoria">{plato.categoria}</span>}
                </div>
                <button className="plato-eliminar" onClick={() => eliminarPlato(plato.id)}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            ))}

            {mostrarFormPlato === menu.id ? (
              <form onSubmit={e => crearPlato(e, menu.id)} className="plato-form">
                <div className="campo">
                  <label>Nombre del plato</label>
                  <input type="text" placeholder="Nombre del plato"
                    value={formPlato.nombre}
                    onChange={e => setFormPlato({ ...formPlato, nombre: e.target.value })}
                    required autoFocus />
                </div>
                <div className="campo">
                  <label>Descripción</label>
                  <input type="text" placeholder="Ingredientes, alérgenos..."
                    value={formPlato.descripcion}
                    onChange={e => setFormPlato({ ...formPlato, descripcion: e.target.value })} />
                </div>
                <div className="campo-grid">
                  <div className="campo">
                    <label>Precio (€)</label>
                    <input type="number" step="0.01" min="0" placeholder="0.00"
                      value={formPlato.precio}
                      onChange={e => setFormPlato({ ...formPlato, precio: e.target.value })} />
                  </div>
                  <div className="campo">
                    <label>Categoría</label>
                    <input type="text" placeholder="Entrantes, Carnes..."
                      value={formPlato.categoria}
                      onChange={e => setFormPlato({ ...formPlato, categoria: e.target.value })} />
                  </div>
                </div>
                <div className="modal-botones">
                  <button type="button" className="btn-cancelar" onClick={() => setMostrarFormPlato(null)}>Cancelar</button>
                  <button type="submit" className="btn-principal">Añadir plato</button>
                </div>
              </form>
            ) : (
              <button className="plato-añadir" onClick={() => setMostrarFormPlato(menu.id)}>
                <i className="bi bi-plus-circle"></i>
                <span>Añadir plato</span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
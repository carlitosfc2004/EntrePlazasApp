import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from './Navbar'
import './Inicio.css'

const API = 'http://localhost:3001/api'

export default function Inicio() {
    const navigate = useNavigate()
    const [negocios, setNegocios] = useState([])
    const [cargando, setCargando] = useState(true)
    const [busqueda, setBusqueda] = useState('')

useEffect(() => { cargarNegocios() }, [])

const cargarNegocios = async () => {
    try {
        const { data } = await axios.get(`${API}/negocios`)
        setNegocios(data)
    } catch {
        console.error('Error cargando negocios')
    } finally {
        setCargando(false)
    }
}

const negociosFiltrados = negocios.filter(n =>
    n.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    n.ciudad?.toLowerCase().includes(busqueda.toLowerCase())
)

return (
    <div>
        <Navbar />
        <div className="inicio-hero">
            <div className="hero-contenido">
                <h1 className="hero-titulo">Reserva tu mesa<br /><em>sin esperas</em></h1>
                <p className="hero-sub">Encuentra los mejores bares y tabernas de La Palma del Condado y reserva en segundos.</p>
                <div className="hero-busqueda">
                    <i className="bi bi-search"></i>
                    <input
                        type="text"
                        placeholder="Busca un bar o ciudad..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                </div>
            </div>
        </div>

        <div className="inicio-contenido">
            <div className="inicio-header">
                <h2>Establecimientos disponibles</h2>
                <span className="inicio-count">{negociosFiltrados.length} locales</span>
            </div>

            {cargando ? (
            <div className="inicio-loading">
                <div className="spinner" />
            </div>
            ) : negociosFiltrados.length === 0 ? (
            <div className="inicio-vacio">
                <i className="bi bi-shop"></i>
                <p>No se encontraron establecimientos</p>
            </div>
            ) : (
            <div className="negocios-grid">
                {negociosFiltrados.map(n => (
                <div key={n.id} className="negocio-card" onClick={() => navigate(`/negocio/${n.id}`)}>
                    <div className="negocio-imagen">
                        {n.imagenUrl
                            ? <img src={`http://localhost:3001${n.imagenUrl}`} alt={n.nombre} />
                            : <div className="negocio-imagen-placeholder">
                                <i className="bi bi-shop"></i>
                            </div>
                        }
                    </div>
                    <div className="negocio-info">
                        <h3 className="negocio-nombre">{n.nombre}</h3>
                        <p className="negocio-desc">{n.descripcion || 'Bar tradicional'}</p>
                        <div className="negocio-meta">
                            <span><i className="bi bi-geo-alt"></i> {n.ciudad || '—'}</span>
                            {n.horarioApertura && (
                            <span><i className="bi bi-clock"></i> {n.horarioApertura} - {n.horarioCierre}</span>
                            )}
                        </div>
                        <button className="negocio-btn">
                            Ver y reservar <i className="bi bi-arrow-right"></i>
                        </button>
                    </div>
                </div>
                ))}
            </div>
            )}
        </div>
    </div>
)
}
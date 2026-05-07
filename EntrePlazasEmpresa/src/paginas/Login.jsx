import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Login.css'

const API = 'https://entreplazas-api.onrender.com/api'

export default function Login() {
  const navigate = useNavigate()
  const [modo, setModo] = useState('login')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nombre: '', apellidos: '', email: '', password: '', telefono: ''
  })

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setCargando(true)
    setError('')
    try {
      if (modo === 'login') {
        const { data } = await axios.post(`${API}/auth/login`, {
          email: form.email,
          password: form.password
        })
        localStorage.setItem('ep_token', data.token)
        localStorage.setItem('ep_usuario', JSON.stringify(data.usuario))
        navigate('/dashboard')
      } else {
        const { data } = await axios.post(`${API}/auth/registro`, {
          nombre: form.nombre,
          apellidos: form.apellidos,
          email: form.email,
          password: form.password,
          telefono: form.telefono,
          rol: 'HOSTELERO'
        })
        localStorage.setItem('ep_token', data.token)
        localStorage.setItem('ep_usuario', JSON.stringify(data.usuario))
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ha ocurrido un error')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-root">
      <div className="login-izquierda">
        <img src="/logo.png" alt="EntrePlazas" style={{ height: '40px', width: 'auto' }} />
        <div className="login-hero">
          <h1 className="login-titulo">Gestiona tu local<br />con elegancia</h1>
          <p className="login-subtitulo">El panel profesional para hosteleros que quieren modernizar su negocio.</p>
        </div>
        <div className="login-stats">
          <div className="login-stat">
            <span className="stat-num">0 errores</span>
            <span className="stat-label">en reservas</span>
          </div>
          <div className="login-stat">
            <span className="stat-num">100%</span>
            <span className="stat-label">control del local</span>
          </div>
        </div>
      </div>

      <div className="login-derecha">
        <div className="login-card">
          <div className="login-tabs">
            <button
              className={`login-tab ${modo === 'login' ? 'activo' : ''}`}
              onClick={() => setModo('login')}
            >
              Entrar
            </button>
            <button
              className={`login-tab ${modo === 'registro' ? 'activo' : ''}`}
              onClick={() => setModo('registro')}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {modo === 'registro' && (
              <>
                <div className="campo">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div className="campo">
                  <label>Apellidos</label>
                  <input
                    type="text"
                    name="apellidos"
                    value={form.apellidos}
                    onChange={handleChange}
                    placeholder="Tus apellidos"
                    required
                  />
                </div>
                <div className="campo">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                    placeholder="666 123 456"
                  />
                </div>
              </>
            )}
            <div className="campo">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                required
              />
            </div>
            <div className="campo">
              <label>Contraseña</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="btn-principal" disabled={cargando}>
              {cargando ? 'Cargando...' : modo === 'login' ? 'Entrar al panel' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
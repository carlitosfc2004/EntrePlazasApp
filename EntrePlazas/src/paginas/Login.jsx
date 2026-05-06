import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from './Navbar'
import './LoginCliente.css'

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
    try {
      if (modo === 'login') {
        const { data } = await axios.post(`${API}/auth/login`, {
          email: form.email, password: form.password
        })
        localStorage.setItem('ep_cliente_token', data.token)
        localStorage.setItem('ep_cliente_usuario', JSON.stringify(data.usuario))
        navigate('/')
      } else {
        const { data } = await axios.post(`${API}/auth/registro`, {
          nombre: form.nombre, apellidos: form.apellidos,
          email: form.email, password: form.password,
          telefono: form.telefono, rol: 'CLIENTE'
        })
        localStorage.setItem('ep_cliente_token', data.token)
        localStorage.setItem('ep_cliente_usuario', JSON.stringify(data.usuario))
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ha ocurrido un error')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="login-cliente-root">
        <div className="login-cliente-card">
          <h1>{modo === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}</h1>
          <p className="login-cliente-sub">
            {modo === 'login' ? 'Entra para gestionar tus reservas' : 'Regístrate gratis para reservar mesas'}
          </p>

          <div className="login-tabs">
            <button className={`login-tab ${modo === 'login' ? 'activo' : ''}`} onClick={() => setModo('login')}>
              Entrar
            </button>
            <button className={`login-tab ${modo === 'registro' ? 'activo' : ''}`} onClick={() => setModo('registro')}>
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-cliente-form">
            {modo === 'registro' && (
              <>
                <div className="campo">
                  <label>Nombre</label>
                  <input type="text" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Tu nombre" required />
                </div>
                <div className="campo">
                  <label>Apellidos</label>
                  <input type="text" name="apellidos" value={form.apellidos} onChange={handleChange} placeholder="Tus apellidos" required />
                </div>
                <div className="campo">
                  <label>Teléfono</label>
                  <input type="tel" name="telefono" value={form.telefono} onChange={handleChange} placeholder="666 123 456" />
                </div>
              </>
            )}
            <div className="campo">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="tu@email.com" required />
            </div>
            <div className="campo">
              <label>Contraseña</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="btn-principal" disabled={cargando}>
              {cargando ? 'Cargando...' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
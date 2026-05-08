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
            <div className="separador">
              <span>o</span>
            </div>

            <button
              type="button"
              className="btn-google"
              onClick={() => window.location.href = 'https://entreplazas-api.onrender.com/api/auth/google/cliente'}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
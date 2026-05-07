import { useNavigate, Link } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('ep_cliente_token')
  const usuario = JSON.parse(localStorage.getItem('ep_cliente_usuario') || '{}')

  const cerrarSesion = () => {
    localStorage.removeItem('ep_cliente_token')
    localStorage.removeItem('ep_cliente_usuario')
    navigate('/')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-marca">
        <img src="/logo.png" alt="EntrePlazas" className="navbar-logo-img" />
      </Link>
      <div className="navbar-der">
        {token ? (
          <>
            <Link to="/mis-reservas" className="navbar-link">
              <i className="bi bi-calendar-check"></i>
              Mis reservas
            </Link>
            <div className="navbar-usuario">
              <i className="bi bi-person-circle"></i>
              <span>{usuario.nombre}</span>
            </div>
            <button className="navbar-salir" onClick={cerrarSesion}>
              Salir
            </button>
          </>
        ) : (
          <button className="navbar-btn" onClick={() => navigate('/login')}>
            Entrar
          </button>
        )}
      </div>
    </nav>
  )
}
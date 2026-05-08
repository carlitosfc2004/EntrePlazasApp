import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Inicio from './paginas/Inicio'
import Negocio from './paginas/Negocio'
import Login from './paginas/Login'
import MisReservas from './paginas/MisReservas'
import './App.css'
import AuthCallback from './paginas/AuthCallback'
import CompletarPerfil from './paginas/CompletarPerfil'

const RutaPrivada = ({ children }) => {
  const token = localStorage.getItem('ep_cliente_token')
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/negocio/:id" element={<Negocio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mis-reservas" element={
          <RutaPrivada>
            <MisReservas />
          </RutaPrivada>
        } />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/completar-perfil" element={<CompletarPerfil />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
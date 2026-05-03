import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Inicio from './paginas/Inicio'
import Negocio from './paginas/Negocio'
import Login from './paginas/Login'
import MisReservas from './paginas/MisReservas'
import './App.css'

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
      </Routes>
    </BrowserRouter>
  )
}

export default App
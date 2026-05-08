import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './paginas/Login'
import Dashboard from './paginas/Dashboard'
import './App.css'
import AuthCallback from './paginas/AuthCallback'
import CompletarPerfil from './paginas/CompletarPerfil'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('ep_token')
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/completar-perfil" element={<CompletarPerfil />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
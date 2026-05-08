import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')
        const usuario = params.get('usuario')

        if (token && usuario) {
        const usuarioObj = JSON.parse(decodeURIComponent(usuario))
        localStorage.setItem('ep_token', token)
        localStorage.setItem('ep_usuario', JSON.stringify(usuarioObj))
        
        if (!usuarioObj.telefono) {
            navigate('/completar-perfil')
        } else {
            navigate('/dashboard')
        }
        } else {
            navigate('/login')
        }
    }, [])

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'white' }}>
        <p>Iniciando sesión...</p>
        </div>
    )
}
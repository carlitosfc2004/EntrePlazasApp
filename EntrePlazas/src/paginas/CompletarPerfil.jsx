import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from './Navbar'

const API = 'https://entreplazas-api.onrender.com/api'

export default function CompletarPerfil() {
    const navigate = useNavigate()
    const [telefono, setTelefono] = useState('')
    const [guardando, setGuardando] = useState(false)
    const token = localStorage.getItem('ep_cliente_token')
    const usuario = JSON.parse(localStorage.getItem('ep_cliente_usuario') || '{}')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setGuardando(true)
        try {
            await axios.put(`${API}/usuarios/mi-cuenta`, { telefono }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const actualizado = { ...usuario, telefono }
            localStorage.setItem('ep_cliente_usuario', JSON.stringify(actualizado))
            navigate('/')
        } catch {
            alert('Error al guardar el teléfono')
        } finally {
            setGuardando(false)
        }
    }

    return (
        <div>
            <Navbar />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '24px' }}>
                <div style={{ width: '100%', maxWidth: '400px', background: 'var(--gris-oscuro)', border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio-lg)', padding: '32px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 500, marginBottom: '8px' }}>Completa tu perfil</h2>
                    <p style={{ color: 'var(--gris-texto)', fontSize: '14px', marginBottom: '24px' }}>
                        Para poder contactarte si hay algún problema con tu reserva, necesitamos tu número de teléfono.
                    </p>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="campo">
                            <label>Número de teléfono</label>
                            <input
                                type="tel"
                                placeholder="666 123 456"
                                value={telefono}
                                onChange={e => setTelefono(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="btn-principal" disabled={guardando}>
                            {guardando ? 'Guardando...' : 'Continuar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
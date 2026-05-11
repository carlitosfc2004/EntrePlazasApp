import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix icono por defecto de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function MapaNegocio({ direccion, ciudad, nombre }) {
    const [coordenadas, setCoordenadas] = useState(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!direccion && !ciudad) return
        const query = encodeURIComponent(`${direccion}, ${ciudad}, España`)
        fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`)
            .then(r => r.json())
            .then(data => {
                if (data.length > 0) {
                    setCoordenadas([parseFloat(data[0].lat), parseFloat(data[0].lon)])
                } else {
                    setError(true)
                }
            })
        .catch(() => setError(true))
    }, [direccion, ciudad])

  if (error || !coordenadas) return null

  return (
    <div className="mapa-contenedor">
        <MapContainer
            center={coordenadas}
            zoom={16}
            style={{ height: '220px', width: '100%', borderRadius: '12px' }}
            zoomControl={false}
            scrollWheelZoom={true}
        >
        <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
        />
        <Marker position={coordenadas}>
        <Popup>{nombre}</Popup>
        </Marker>
        </MapContainer>
    </div>
  )
}
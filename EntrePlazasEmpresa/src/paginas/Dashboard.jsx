import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";
import Reservas from "./Reservas";
import PlanoMesas from "./PlanoMesas";
import MiNegocio from "./MiNegocio";
import MenuDigital from "./MenuDigital";
import NuevaReservaHostelero from "./NuevaReservaHostelero";

const API = "https://entreplazas-api.onrender.com/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("ep_usuario") || "{}");
  const token = localStorage.getItem("ep_token");
  const [negocio, setNegocio] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [reservasHoy, setReservasHoy] = useState([]);
  const [vistaActiva, setVistaActiva] = useState("inicio");
  const [reservasPendientes, setReservasPendientes] = useState(0);
  const [formNegocio, setFormNegocio] = useState({
    nombre: "",
    descripcion: "",
    direccion: "",
    ciudad: "",
    telefono: "",
    horarioApertura: "",
    horarioCierre: "",
  });

  const headers = { Authorization: `Bearer ${token}` };

  // Ref para polling — siempre apunta a la versión más reciente de la función
  // Esto es importante para evitar problemas de closures con estados obsoletos
  const pollRef = useRef(null);
  pollRef.current = () => {
    if (negocio?.id) cargarReservasHoy(negocio.id);
  };

  useEffect(() => {
    cargarNegocio();
  }, []);

  // Arranca el polling en cuanto se carga el negocio
  // Esto hace que las notificaciones de nuevas reservas estén siempre actualizadas sin necesidad de recargar la página
  useEffect(() => {
    if (!negocio?.id) return;
    const intervalo = setInterval(() => pollRef.current(), 15000);
    return () => clearInterval(intervalo);
  }, [negocio?.id]);

  const cargarNegocio = async () => {
    try {
      const { data } = await axios.get(`${API}/negocios/mi/negocio`, {
        headers,
      });
      setNegocio(data);
      cargarReservasHoy(data.id);
    } catch {
      setNegocio(null);
    } finally {
      setCargando(false);
    }
  };

  const cargarReservasHoy = async (negocioId) => {
    try {
      const { data } = await axios.get(`${API}/reservas/negocio/${negocioId}`, {
        headers,
      });
      const hoy = new Date().toISOString().split("T")[0];
      const hoyReservas = data.filter(
        (r) => r.fecha.split("T")[0] === hoy && r.estado !== "CANCELADA",
      );
      setReservasHoy(hoyReservas);
      const pendientes = data.filter((r) => r.estado === "PENDIENTE").length;
      setReservasPendientes(pendientes);
    } catch {
      setReservasHoy([]);
    }
  };

  const crearNegocio = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API}/negocios`, formNegocio, {
        headers,
      });
      setNegocio(data);
    } catch {
      alert("Error al crear el negocio");
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("ep_token");
    localStorage.removeItem("ep_usuario");
    navigate("/login");
  };

  if (cargando)
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
      </div>
    );

  if (!negocio)
    return (
      <div className="dash-onboarding">
        <div className="onboarding-card">
          <div className="onboarding-icono">🍺</div>
          <h2>Configura tu negocio</h2>
          <p>Completa los datos de tu local para empezar a recibir reservas.</p>
          <form onSubmit={crearNegocio} className="onboarding-form">
            <div className="campo-grid">
              <div className="campo">
                <label>Nombre del local</label>
                <input
                  type="text"
                  placeholder="Bar La Parrala"
                  value={formNegocio.nombre}
                  onChange={(e) =>
                    setFormNegocio({ ...formNegocio, nombre: e.target.value })
                  }
                  required
                />
              </div>
              <div className="campo">
                <label>Teléfono</label>
                <input
                  type="tel"
                  placeholder="959 123 456"
                  value={formNegocio.telefono}
                  onChange={(e) =>
                    setFormNegocio({ ...formNegocio, telefono: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="campo">
              <label>Descripción</label>
              <input
                type="text"
                placeholder="Bar tradicional en el centro..."
                value={formNegocio.descripcion}
                onChange={(e) =>
                  setFormNegocio({
                    ...formNegocio,
                    descripcion: e.target.value,
                  })
                }
              />
            </div>
            <div className="campo-grid">
              <div className="campo">
                <label>Dirección</label>
                <input
                  type="text"
                  placeholder="Calle Real 12"
                  value={formNegocio.direccion}
                  onChange={(e) =>
                    setFormNegocio({
                      ...formNegocio,
                      direccion: e.target.value,
                    })
                  }
                />
              </div>
              <div className="campo">
                <label>Ciudad</label>
                <input
                  type="text"
                  placeholder="La Palma del Condado"
                  value={formNegocio.ciudad}
                  onChange={(e) =>
                    setFormNegocio({ ...formNegocio, ciudad: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="campo-grid">
              <div className="campo">
                <label>Apertura</label>
                <input
                  type="time"
                  value={formNegocio.horarioApertura}
                  onChange={(e) =>
                    setFormNegocio({
                      ...formNegocio,
                      horarioApertura: e.target.value,
                    })
                  }
                />
              </div>
              <div className="campo">
                <label>Cierre</label>
                <input
                  type="time"
                  value={formNegocio.horarioCierre}
                  onChange={(e) =>
                    setFormNegocio({
                      ...formNegocio,
                      horarioCierre: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <button type="submit" className="btn-principal">
              Crear mi negocio
            </button>
          </form>
        </div>
      </div>
    );

  return (
    <div className="dash-root">
      <aside className="dash-sidebar">
        <div className="sidebar-marca">
          <img
            src="/logo.png"
            alt="EntrePlazas"
            style={{ height: "36px", width: "auto" }}
          />
        </div>
        <nav className="sidebar-nav">
          {/* Pestaña Inicio */}
          <button
            className={`nav-item ${vistaActiva === "inicio" ? "activo" : ""}`}
            onClick={() => setVistaActiva("inicio")}
          >
            <i className="bi bi-house-door nav-icono"></i> Inicio
          </button>

          {/* Pestaña Plano de mesas */}
          <button
            className={`nav-item ${vistaActiva === "plano" ? "activo" : ""}`}
            onClick={() => setVistaActiva("plano")}
          >
            <i className="bi bi-grid nav-icono"></i> Mi plano de mesas
          </button>

          {/* Pestaña Reservas */}
          <button
            className={`nav-item ${vistaActiva === "reservas" ? "activo" : ""}`}
            onClick={() => setVistaActiva("reservas")}
          >
            <i className="bi bi-calendar-check nav-icono"></i> Reservas
            {reservasPendientes > 0 && (
              <span className="badge-pendiente">{reservasPendientes}</span>
            )}
          </button>

          {/* Pestaña Mi menú */}
          <button
            className={`nav-item ${vistaActiva === "menu" ? "activo" : ""}`}
            onClick={() => setVistaActiva("menu")}
          >
            <i className="bi bi-journal-text nav-icono"></i> Mi menú
          </button>

          {/*Crear una resrva manualmente*/}
          <button
            className={`nav-item ${vistaActiva === "nueva-reserva" ? "activo" : ""}`}
            onClick={() => setVistaActiva("nueva-reserva")}
          >
            <i className="bi bi-calendar-plus nav-icono"></i> Nueva reserva
          </button>

          {/* Pestaña Mi negocio */}
          <button
            className={`nav-item ${vistaActiva === "negocio" ? "activo" : ""}`}
            onClick={() => setVistaActiva("negocio")}
          >
            <i className="bi bi-gear nav-icono"></i> Mi negocio
          </button>
        </nav>
        <button className="sidebar-salir" onClick={cerrarSesion}>
          <i className="bi bi-box-arrow-left nav-icono"></i> Cerrar sesión
        </button>
      </aside>

      <main className="dash-main">
        {vistaActiva === "inicio" && (
          <div className="dash-contenido">
            <div className="dash-header">
              <div>
                <h1>Bienvenido, {usuario.nombre}</h1>
                <p className="dash-subtitulo">
                  {negocio.nombre} · {negocio.ciudad}
                </p>
              </div>
            </div>
            {reservasPendientes > 0 && (
              <div className="aviso-pendientes">
                <i className="bi bi-bell-fill"></i>
                <span>
                  Tienes <strong>{reservasPendientes}</strong>{" "}
                  {reservasPendientes === 1
                    ? "reserva pendiente"
                    : "reservas pendientes"}{" "}
                  de confirmar
                </span>
                <button
                  className="aviso-pendientes-btn"
                  onClick={() => setVistaActiva("reservas")}
                >
                  Ver reservas
                </button>
              </div>
            )}
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-card-num">{reservasHoy.length}</span>
                <span className="stat-card-label">Reservas hoy</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-num">
                  {negocio.mesas?.length || 0}
                </span>
                <span className="stat-card-label">Mesas activas</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-num">
                  {negocio.mesas?.length
                    ? Math.round(
                        ((negocio.mesas.length - reservasHoy.length) /
                          negocio.mesas.length) *
                          100,
                      )
                    : 0}
                  %
                </span>
                <span className="stat-card-label">Disponibilidad</span>
              </div>
            </div>

            <div className="seccion">
              <h2>Reservas de hoy</h2>
              {reservasHoy.length === 0 ? (
                <div className="vacio">No hay reservas para hoy</div>
              ) : (
                <div className="reservas-lista">
                  {reservasHoy.map((r) => (
                    <div key={r.id} className="reserva-item">
                      <div className="reserva-info">
                        <span className="reserva-nombre">
                          <i className="bi bi-person-circle"></i>{" "}
                          {r.nombreContacto || r.usuario?.nombre}
                        </span>
                        <span className="reserva-detalle">
                          <i className="bi bi-table"></i> Mesa{" "}
                          {r.mesa?.etiqueta} ·<i className="bi bi-people"></i>{" "}
                          {r.numPersonas} personas ·
                          <i className="bi bi-clock"></i> {r.horaInicio}
                        </span>
                      </div>
                      <span
                        className={`reserva-estado ${r.estado.toLowerCase()}`}
                      >
                        <i className="bi bi-info-circle"></i> {r.estado}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {vistaActiva === "plano" && (
          <div className="dash-contenido">
            <PlanoMesas negocioId={negocio.id} token={token} />
          </div>
        )}

        {vistaActiva === "reservas" && (
          <div className="dash-contenido">
            <Reservas negocioId={negocio.id} token={token} />
          </div>
        )}

        {vistaActiva === "menu" && (
          <div className="dash-contenido">
            <MenuDigital negocioId={negocio.id} token={token} />
          </div>
        )}

        {vistaActiva === "negocio" && (
          <div className="dash-contenido">
            <MiNegocio
              negocio={negocio}
              token={token}
              onActualizar={cargarNegocio}
            />
          </div>
        )}

        {vistaActiva === "nueva-reserva" && (
          <div className="dash-contenido">
            <NuevaReservaHostelero
              negocio={negocio}
              token={token}
              onCreada={cargarNegocio}
            />
          </div>
        )}
      </main>
    </div>
  );
}

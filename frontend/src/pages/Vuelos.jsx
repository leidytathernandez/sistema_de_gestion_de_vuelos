import React, { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EstadoBadge({ estado }) {
  const map = {
    programado: { cls: "badge-info", label: "Programado" },
    en_vuelo: { cls: "badge-success", label: "En vuelo" },
    aterrizado: { cls: "badge-warning", label: "Aterrizado" },
    cancelado: { cls: "badge-danger", label: "Cancelado" },
  };
  const { cls, label } = map[estado] ?? { cls: "badge-warning", label: estado };
  return <span className={`badge ${cls}`}>{label}</span>;
}

function PrioridadBadge({ prioridad }) {
  const map = {
    1: { cls: "badge-danger", label: "🚨 Emergencia" },
    2: { cls: "badge-warning", label: "⚠️ Retraso" },
    3: { cls: "badge-info", label: "✅ Normal" },
  };
  const { cls, label } = map[prioridad] ?? { cls: "badge-info", label: `P${prioridad}` };
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function Vuelos() {
  // ── Estado global ────────────────────────────────────────────────────────
  const [tabLocal, setTabLocal] = useState("buscador"); // "buscador" | "torre"
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);

  // ── Estado buscador (AVL Tree) ───────────────────────────────────────────
  const [vuelos, setVuelos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [vueloEncontrado, setVueloEncontrado] = useState(null);
  const [formVuelo, setFormVuelo] = useState({
    codigo: "",
    origen: "",
    destino: "",
    salida: "",
    llegada: "",
  });
  const [mostrarFormVuelo, setMostrarFormVuelo] = useState(false);

  // ── Estado torre de control (Min-Heap) ──────────────────────────────────
  const [cola, setCola] = useState([]);
  const [formSolicitud, setFormSolicitud] = useState({
    codigo: "",
    tipo: "despegue",
    prioridad: "3",
  });

  // ── Carga de datos ────────────────────────────────────────────────────────
  const cargarVuelos = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/vuelos`);
      const data = await r.json();
      setVuelos(Array.isArray(data) ? data : []);
    } catch {
      setVuelos([]);
    }
  }, []);

  const cargarCola = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/torre`);
      const data = await r.json();
      setCola(Array.isArray(data) ? data : []);
    } catch {
      setCola([]);
    }
  }, []);

  useEffect(() => {
    cargarVuelos();
    cargarCola();
  }, [cargarVuelos, cargarCola]);

  // ── Helpers mensajes ──────────────────────────────────────────────────────
  function mostrarMensaje(tipo, texto) {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4500);
  }

  // ── Acciones buscador ─────────────────────────────────────────────────────
  async function buscarVuelo(e) {
    e.preventDefault();
    if (!busqueda.trim()) return;
    setCargando(true);
    setVueloEncontrado(null);
    try {
      const r = await fetch(`${API}/api/vuelos/${busqueda.trim().toUpperCase()}`);
      if (r.status === 404) {
        mostrarMensaje("error", `No existe el vuelo "${busqueda.trim().toUpperCase()}".`);
        return;
      }
      const data = await r.json();
      setVueloEncontrado(data);
    } catch {
      mostrarMensaje("error", "No se pudo conectar al backend de vuelos.");
    } finally {
      setCargando(false);
    }
  }

  async function crearVuelo(e) {
    e.preventDefault();
    const { codigo, origen, destino, salida, llegada } = formVuelo;
    if (!codigo || !origen || !destino || !salida || !llegada) {
      mostrarMensaje("error", "Todos los campos del vuelo son obligatorios.");
      return;
    }
    setCargando(true);
    try {
      const r = await fetch(`${API}/api/vuelos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: codigo.trim().toUpperCase(),
          origen: origen.trim(),
          destino: destino.trim(),
          salida,
          llegada,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Error al crear vuelo");
      mostrarMensaje("ok", `✅ Vuelo ${data.codigo} creado y guardado en el AVL Tree.`);
      setFormVuelo({ codigo: "", origen: "", destino: "", salida: "", llegada: "" });
      setMostrarFormVuelo(false);
      await cargarVuelos();
    } catch (err) {
      mostrarMensaje("error", err.message);
    } finally {
      setCargando(false);
    }
  }

  async function eliminarVuelo(codigo) {
    if (!window.confirm(`¿Eliminar el vuelo ${codigo}?`)) return;
    setCargando(true);
    try {
      const r = await fetch(`${API}/api/vuelos/${codigo}`, { method: "DELETE" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Error al eliminar");
      mostrarMensaje("ok", `🗑️ Vuelo ${codigo} eliminado del árbol y la BD.`);
      setVueloEncontrado(null);
      await cargarVuelos();
    } catch (err) {
      mostrarMensaje("error", err.message);
    } finally {
      setCargando(false);
    }
  }

  // ── Acciones torre ────────────────────────────────────────────────────────
  async function solicitarTorre(e) {
    e.preventDefault();
    const { codigo, tipo, prioridad } = formSolicitud;
    if (!codigo.trim()) {
      mostrarMensaje("error", "Ingresa el código del vuelo.");
      return;
    }
    setCargando(true);
    try {
      const r = await fetch(`${API}/api/torre`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: codigo.trim().toUpperCase(),
          tipo,
          prioridad: Number(prioridad),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Error al solicitar");
      mostrarMensaje("ok", `✅ Solicitud de ${tipo} para ${data.vuelo_codigo} añadida al Heap.`);
      setFormSolicitud({ codigo: "", tipo: "despegue", prioridad: "3" });
      await cargarCola();
    } catch (err) {
      mostrarMensaje("error", err.message);
    } finally {
      setCargando(false);
    }
  }

  async function atenderTorre() {
    setCargando(true);
    try {
      const r = await fetch(`${API}/api/torre/atender`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Sin solicitudes pendientes");
      mostrarMensaje(
        "ok",
        `✅ Vuelo ${data.vuelo_codigo} — ${data.tipo} atendido. Nuevo estado: ${data.nuevoEstado}.`
      );
      await cargarCola();
      await cargarVuelos();
    } catch (err) {
      mostrarMensaje("error", err.message);
    } finally {
      setCargando(false);
    }
  }

  // ── Filtro de vuelos en pantalla ──────────────────────────────────────────
  const vuelosFiltrados = vuelos.slice(0, 20);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Encabezado */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header">
          <h2 className="card-title">🛫 Gestión de Vuelos</h2>
          <span className="badge badge-info">AVL Tree + Min-Heap · Carlos</span>
        </div>

        {/* Conceptos */}
        <div className="grid-2" style={{ marginBottom: "1rem" }}>
          <div className="concepto-box concepto-avl">
            <div className="concepto-icono">🌳</div>
            <div>
              <strong>AVL Tree — Buscador de vuelos</strong>
              <p className="concepto-desc">
                Árbol binario de búsqueda auto-balanceado. Garantiza búsqueda,
                inserción y eliminación en O(log n), sin importar el orden de
                llegada.
              </p>
            </div>
          </div>
          <div className="concepto-box concepto-heap">
            <div className="concepto-icono">⛽</div>
            <div>
              <strong>Min-Heap — Torre de control</strong>
              <p className="concepto-desc">
                Cola de prioridad donde el vuelo con menor número de prioridad
                (1 = emergencia) siempre queda en la cima y es atendido primero.
              </p>
            </div>
          </div>
        </div>

        {mensaje && (
          <div className={`alert ${mensaje.tipo === "ok" ? "alert-info" : "alert-danger"}`}>
            {mensaje.texto}
          </div>
        )}

        {/* Sub-tabs */}
        <div className="sub-tabs">
          <button
            className={`sub-tab-btn ${tabLocal === "buscador" ? "active" : ""}`}
            onClick={() => setTabLocal("buscador")}
          >
            🌳 Buscador AVL ({vuelos.length} vuelos)
          </button>
          <button
            className={`sub-tab-btn ${tabLocal === "torre" ? "active" : ""}`}
            onClick={() => setTabLocal("torre")}
          >
            ⛽ Torre de control ({cola.length} pendientes)
          </button>
        </div>
      </div>

      {/* ── TAB: Buscador AVL ──────────────────────────────────────────────── */}
      {tabLocal === "buscador" && (
        <div className="grid-2">
          {/* Formulario búsqueda + nuevo vuelo */}
          <div>
            <div className="card">
              <h3 className="card-title" style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>
                🔍 Buscar vuelo por código
              </h3>
              <form onSubmit={buscarVuelo}>
                <div className="form-group">
                  <label>Código del vuelo</label>
                  <input
                    type="text"
                    placeholder="Ej: AV101"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary btn-block" disabled={cargando}>
                  {cargando ? "⏳ Buscando…" : "🔍 Buscar en AVL Tree"}
                </button>
              </form>

              {/* Resultado */}
              {vueloEncontrado && (
                <div className="resultado-vuelo">
                  <h4 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>
                    ✈️ {vueloEncontrado.codigo}
                  </h4>
                  <div className="detalle-grid">
                    <span className="detalle-label">Origen</span>
                    <span>{vueloEncontrado.origen}</span>
                    <span className="detalle-label">Destino</span>
                    <span>{vueloEncontrado.destino}</span>
                    <span className="detalle-label">Salida</span>
                    <span>{fmtFecha(vueloEncontrado.salida)}</span>
                    <span className="detalle-label">Llegada</span>
                    <span>{fmtFecha(vueloEncontrado.llegada)}</span>
                    <span className="detalle-label">Estado</span>
                    <EstadoBadge estado={vueloEncontrado.estado} />
                  </div>
                  <button
                    className="btn btn-block"
                    style={{
                      marginTop: "0.75rem",
                      background: "#fee2e2",
                      color: "#991b1b",
                      border: "1px solid #fca5a5",
                    }}
                    onClick={() => eliminarVuelo(vueloEncontrado.codigo)}
                    disabled={cargando}
                  >
                    🗑️ Eliminar vuelo
                  </button>
                </div>
              )}
            </div>

            {/* Crear vuelo */}
            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: mostrarFormVuelo ? "1.25rem" : 0,
                }}
              >
                <h3 className="card-title" style={{ fontSize: "1rem" }}>
                  ➕ Agregar nuevo vuelo
                </h3>
                <button
                  className="btn"
                  style={{ padding: "0.4rem 0.8rem", background: "var(--gray-100)", fontSize: "0.85rem" }}
                  onClick={() => setMostrarFormVuelo((v) => !v)}
                >
                  {mostrarFormVuelo ? "✖ Cerrar" : "Abrir formulario"}
                </button>
              </div>

              {mostrarFormVuelo && (
                <form onSubmit={crearVuelo}>
                  {[
                    { id: "codigo", label: "Código", placeholder: "Ej: AV999" },
                    { id: "origen", label: "Ciudad origen", placeholder: "Ej: Cali" },
                    { id: "destino", label: "Ciudad destino", placeholder: "Ej: Bogotá" },
                  ].map(({ id, label, placeholder }) => (
                    <div className="form-group" key={id}>
                      <label>{label}</label>
                      <input
                        type="text"
                        placeholder={placeholder}
                        value={formVuelo[id]}
                        onChange={(e) => setFormVuelo({ ...formVuelo, [id]: e.target.value })}
                      />
                    </div>
                  ))}
                  <div className="grid-2" style={{ gap: "0.75rem" }}>
                    <div className="form-group">
                      <label>Fecha/hora salida</label>
                      <input
                        type="datetime-local"
                        value={formVuelo.salida}
                        onChange={(e) => setFormVuelo({ ...formVuelo, salida: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Fecha/hora llegada</label>
                      <input
                        type="datetime-local"
                        value={formVuelo.llegada}
                        onChange={(e) => setFormVuelo({ ...formVuelo, llegada: e.target.value })}
                      />
                    </div>
                  </div>
                  <button className="btn btn-primary btn-block" disabled={cargando}>
                    {cargando ? "⏳ Creando…" : "✈️ Crear vuelo"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Listado de todos los vuelos */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: "1rem", marginBottom: "1rem" }}>
              📋 Vuelos en el AVL Tree ({vuelos.length} total)
            </h3>
            {vuelos.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">✈️</span>
                <p>No hay vuelos registrados. Agrega uno con el formulario.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Origen → Destino</th>
                      <th>Salida</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vuelosFiltrados.map((v) => (
                      <tr key={v.id ?? v.codigo}>
                        <td>
                          <strong
                            style={{ cursor: "pointer", color: "var(--primary)" }}
                            onClick={() => { setBusqueda(v.codigo); setVueloEncontrado(v); }}
                            title="Ver detalles"
                          >
                            {v.codigo}
                          </strong>
                        </td>
                        <td style={{ fontSize: "0.9rem" }}>
                          {v.origen} → {v.destino}
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
                          {fmtFecha(v.salida)}
                        </td>
                        <td>
                          <EstadoBadge estado={v.estado} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {vuelos.length > 20 && (
                  <p style={{ textAlign: "center", color: "var(--gray-500)", padding: "0.75rem", fontSize: "0.85rem" }}>
                    Mostrando 20 de {vuelos.length} vuelos.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Torre de Control (Heap) ───────────────────────────────────── */}
      {tabLocal === "torre" && (
        <div className="grid-2">
          {/* Formulario solicitud */}
          <div>
            <div className="card">
              <h3 className="card-title" style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>
                📡 Nueva solicitud a la torre
              </h3>
              <form onSubmit={solicitarTorre}>
                <div className="form-group">
                  <label>Código del vuelo</label>
                  <input
                    type="text"
                    placeholder="Ej: AV101"
                    value={formSolicitud.codigo}
                    onChange={(e) => setFormSolicitud({ ...formSolicitud, codigo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Tipo de operación</label>
                  <select
                    value={formSolicitud.tipo}
                    onChange={(e) => setFormSolicitud({ ...formSolicitud, tipo: e.target.value })}
                  >
                    <option value="despegue">🛫 Despegue</option>
                    <option value="aterrizaje">🛬 Aterrizaje</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Prioridad</label>
                  <select
                    value={formSolicitud.prioridad}
                    onChange={(e) => setFormSolicitud({ ...formSolicitud, prioridad: e.target.value })}
                  >
                    <option value="1">🚨 1 — Emergencia (más urgente)</option>
                    <option value="2">⚠️ 2 — Retraso</option>
                    <option value="3">✅ 3 — Normal</option>
                  </select>
                </div>
                <button className="btn btn-primary btn-block" disabled={cargando}>
                  {cargando ? "⏳ Enviando…" : "📡 Solicitar a la torre"}
                </button>
              </form>
            </div>

            <div className="card">
              <h3 className="card-title" style={{ fontSize: "1rem", marginBottom: "1rem" }}>
                ⚡ Atender solicitud
              </h3>
              <p style={{ color: "var(--gray-500)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                El Min-Heap siempre entrega la solicitud con <strong>menor número de prioridad</strong> primero (1 = emergencia).
              </p>
              <button
                className="btn btn-primary btn-block"
                onClick={atenderTorre}
                disabled={cargando || cola.length === 0}
              >
                {cargando ? "⏳ Atendiendo…" : `✅ Atender siguiente (${cola.length} pendientes)`}
              </button>
            </div>
          </div>

          {/* Cola de prioridad */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: "1rem", marginBottom: "1rem" }}>
              ⛽ Cola de prioridad (Min-Heap)
            </h3>
            {cola.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📡</span>
                <p>No hay solicitudes pendientes en la torre.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Pos.</th>
                      <th>Vuelo</th>
                      <th>Operación</th>
                      <th>Prioridad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cola.map((sol, i) => (
                      <tr key={sol.id ?? i} className={i === 0 ? "fila-primero" : ""}>
                        <td>
                          {i === 0 ? (
                            <span style={{ fontWeight: 700, color: "var(--danger)" }}>▶ 1</span>
                          ) : (
                            i + 1
                          )}
                        </td>
                        <td>
                          <strong>{sol.vuelo_codigo ?? sol.vuelo ?? "—"}</strong>
                        </td>
                        <td>
                          {sol.tipo === "despegue" ? "🛫 Despegue" : "🛬 Aterrizaje"}
                        </td>
                        <td>
                          <PrioridadBadge prioridad={sol.prioridad} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

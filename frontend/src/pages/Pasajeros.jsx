import React, { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtHora(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function EstadoBadge({ estado }) {
  const map = {
    en_fila: { cls: "badge-info", label: "En fila" },
    atendido: { cls: "badge-success", label: "Atendido" },
  };
  const { cls, label } = map[estado] ?? { cls: "badge-warning", label: estado };
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function Pasajeros() {
  const [fila, setFila] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [form, setForm] = useState({ nombre: "", vuelo: "" });
  const [mensaje, setMensaje] = useState(null); // { tipo: "ok"|"error", texto }
  const [cargando, setCargando] = useState(false);
  const [tabLocal, setTabLocal] = useState("fila"); // "fila" | "historial"

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const cargarFila = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/pasajeros/checkin`);
      const data = await r.json();
      setFila(Array.isArray(data) ? data : data.fila ?? []);
    } catch {
      setFila([]);
    }
  }, []);

  const cargarHistorial = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/pasajeros/historial`);
      const data = await r.json();
      setHistorial(Array.isArray(data) ? data : data.historial ?? []);
    } catch {
      setHistorial([]);
    }
  }, []);

  useEffect(() => {
    cargarFila();
    cargarHistorial();
  }, [cargarFila, cargarHistorial]);

  // ── Acciones ────────────────────────────────────────────────────────────────
  function mostrarMensaje(tipo, texto) {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4000);
  }

  async function registrar(e) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.vuelo.trim()) {
      mostrarMensaje("error", "Completa nombre y vuelo antes de registrar.");
      return;
    }
    setCargando(true);
    try {
      const r = await fetch(`${API}/api/pasajeros/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: form.nombre.trim(), vuelo: form.vuelo.trim().toUpperCase() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Error al registrar");
      mostrarMensaje("ok", `✅ ${data.pasajero?.nombre ?? "Pasajero"} registrado en la fila.`);
      setForm({ nombre: "", vuelo: "" });
      await cargarFila();
      await cargarHistorial();
    } catch (err) {
      mostrarMensaje("error", err.message);
    } finally {
      setCargando(false);
    }
  }

  async function atender() {
    setCargando(true);
    try {
      const r = await fetch(`${API}/api/pasajeros/checkin/atender`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Error al atender");
      mostrarMensaje("ok", `✅ ${data.nombre} (vuelo ${data.vuelo}) atendido.`);
      await cargarFila();
      await cargarHistorial();
    } catch (err) {
      mostrarMensaje("error", err.message);
    } finally {
      setCargando(false);
    }
  }

  async function deshacer() {
    setCargando(true);
    try {
      const r = await fetch(`${API}/api/pasajeros/historial/deshacer`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "No hay operaciones para deshacer");
      const accion = data.tipo === "registrar" ? "registro" : "atención";
      mostrarMensaje("ok", `↩️ Deshecho el ${accion} de ${data.pasajero?.nombre ?? "pasajero"}.`);
      await cargarFila();
      await cargarHistorial();
    } catch (err) {
      mostrarMensaje("error", err.message);
    } finally {
      setCargando(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Encabezado */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header">
          <h2 className="card-title">👥 Check-in de Pasajeros</h2>
          <span className="badge badge-info">Cola + Pila · Leidy Hernández</span>
        </div>

        {/* Conceptos */}
        <div className="grid-2" style={{ marginBottom: "1rem" }}>
          <div className="concepto-box concepto-cola">
            <div className="concepto-icono">🔵</div>
            <div>
              <strong>Cola FIFO — Check-in</strong>
              <p className="concepto-desc">
                El primero en llegar es el primero en ser atendido. Los pasajeros
                ingresan al final de la fila y salen por el frente.
              </p>
            </div>
          </div>
          <div className="concepto-box concepto-pila">
            <div className="concepto-icono">🟠</div>
            <div>
              <strong>Pila LIFO — Historial / Deshacer</strong>
              <p className="concepto-desc">
                La última operación realizada es la primera en poderse deshacer.
                Funciona como el Ctrl+Z de un editor de texto.
              </p>
            </div>
          </div>
        </div>

        {mensaje && (
          <div className={`alert ${mensaje.tipo === "ok" ? "alert-info" : "alert-danger"}`}>
            {mensaje.texto}
          </div>
        )}
      </div>

      {/* Panel izquierdo: Formulario + Acciones */}
      <div className="grid-2">
        <div>
          {/* Registrar pasajero */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>
              ➕ Registrar pasajero en fila
            </h3>
            <form onSubmit={registrar}>
              <div className="form-group">
                <label htmlFor="nombre">Nombre del pasajero</label>
                <input
                  id="nombre"
                  type="text"
                  placeholder="Ej: María García"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="vuelo">Código de vuelo</label>
                <input
                  id="vuelo"
                  type="text"
                  placeholder="Ej: AV101"
                  value={form.vuelo}
                  onChange={(e) => setForm({ ...form, vuelo: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={cargando}>
                {cargando ? "⏳ Registrando…" : "✈️ Registrar en fila"}
              </button>
            </form>
          </div>

          {/* Acciones de fila */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>
              ⚡ Acciones de la fila
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                className="btn btn-primary btn-block"
                onClick={atender}
                disabled={cargando || fila.length === 0}
              >
                ✅ Atender siguiente (Cola → FIFO)
              </button>
              <button
                className="btn btn-secondary btn-block"
                onClick={deshacer}
                disabled={cargando || historial.length === 0}
              >
                ↩️ Deshacer última operación (Pila → LIFO)
              </button>
            </div>
          </div>
        </div>

        {/* Panel derecho: Fila / Historial */}
        <div className="card">
          {/* Sub-tabs */}
          <div className="sub-tabs" style={{ marginBottom: "1rem" }}>
            <button
              className={`sub-tab-btn ${tabLocal === "fila" ? "active" : ""}`}
              onClick={() => setTabLocal("fila")}
            >
              🔵 Fila actual ({fila.length})
            </button>
            <button
              className={`sub-tab-btn ${tabLocal === "historial" ? "active" : ""}`}
              onClick={() => setTabLocal("historial")}
            >
              🟠 Historial ({historial.length})
            </button>
          </div>

          {tabLocal === "fila" && (
            <>
              <p className="seccion-desc">
                Orden de atención — el <strong>primero</strong> de la lista es el próximo en salir.
              </p>
              {fila.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🪑</span>
                  <p>La fila de check-in está vacía.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Pasajero</th>
                        <th>Vuelo</th>
                        <th>Llegada</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fila.map((p, i) => (
                        <tr key={p.id ?? p.idFila ?? i} className={i === 0 ? "fila-primero" : ""}>
                          <td>
                            {i === 0 ? (
                              <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                                ▶ {i + 1}
                              </span>
                            ) : (
                              i + 1
                            )}
                          </td>
                          <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                          <td>
                            <span className="badge badge-info">{p.vuelo}</span>
                          </td>
                          <td style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>
                            {fmtHora(p.llegada)}
                          </td>
                          <td>
                            <EstadoBadge estado={p.estado ?? "en_fila"} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tabLocal === "historial" && (
            <>
              <p className="seccion-desc">
                Pila de operaciones — la <strong>última</strong> es la que se puede deshacer.
              </p>
              {historial.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📋</span>
                  <p>Aún no hay operaciones en el historial.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Pos.</th>
                        <th>Operación</th>
                        <th>Pasajero</th>
                        <th>Vuelo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...historial].reverse().map((op, i) => (
                        <tr key={i} className={i === 0 ? "fila-primero" : ""}>
                          <td>
                            {i === 0 ? (
                              <span style={{ fontWeight: 700, color: "var(--warning)" }}>
                                ↩ {i + 1}
                              </span>
                            ) : (
                              i + 1
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${op.tipo === "registrar" ? "badge-info" : "badge-success"}`}
                            >
                              {op.tipo === "registrar" ? "Registro" : "Atención"}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {op.pasajero?.nombre ?? op.nombre ?? "—"}
                          </td>
                          <td>{op.pasajero?.vuelo ?? op.vuelo ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

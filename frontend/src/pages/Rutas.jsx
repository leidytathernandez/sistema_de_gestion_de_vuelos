import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Rutas() {
  const [aeropuertos, setAeropuertos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [rutasDirectas, setRutasDirectas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Estados para cálculo de Dijkstra
  const [origenDijkstra, setOrigenDijkstra] = useState("BOG");
  const [destinoDijkstra, setDestinoDijkstra] = useState("JFK");
  const [criterio, setCriterio] = useState("distancia");
  const [resultadoDijkstra, setResultadoDijkstra] = useState(null);

  // Estados para búsqueda de escalas con BFS
  const [origenBFS, setOrigenBFS] = useState("BOG");
  const [destinoBFS, setDestinoBFS] = useState("MAD");
  const [maxEscalas, setMaxEscalas] = useState(2);
  const [resultadoBFS, setResultadoBFS] = useState(null);

  // Estados para formulario de nueva ruta
  const [nuevaRuta, setNuevaRuta] = useState({
    origen: "BOG",
    destino: "MDE",
    distancia: "",
    precio: "",
    duracion: "",
    aerolinea: "Avianca",
    bidireccional: true,
  });

  // Carga inicial de datos
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const [resAero, resStats, resRutas] = await Promise.all([
        fetch(`${API_URL}/api/rutas/aeropuertos`),
        fetch(`${API_URL}/api/rutas/estadisticas`),
        fetch(`${API_URL}/api/rutas/listado`),
      ]);

      if (!resAero.ok || !resStats.ok || !resRutas.ok) {
        throw new Error("No se pudo conectar con el servidor de rutas.");
      }

      const [dataAero, dataStats, dataRutas] = await Promise.all([
        resAero.json(),
        resStats.json(),
        resRutas.json(),
      ]);

      setAeropuertos(dataAero);
      setEstadisticas(dataStats);
      setRutasDirectas(dataRutas);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // 1. Calcular ruta con Dijkstra
  const handleCalcularDijkstra = async (e) => {
    e.preventDefault();
    if (origenDijkstra === destinoDijkstra) {
      setError("El aeropuerto de origen y destino deben ser diferentes.");
      return;
    }
    setError(null);
    setCargando(true);
    try {
      const res = await fetch(
        `${API_URL}/api/rutas/corta?origen=${origenDijkstra}&destino=${destinoDijkstra}&criterio=${criterio}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se encontró ruta entre los aeropuertos.");
      }
      setResultadoDijkstra(data);
    } catch (err) {
      setError(err.message);
      setResultadoDijkstra(null);
    } finally {
      setCargando(false);
    }
  };

  // 2. Buscar opciones de vuelo con BFS
  const handleBuscarBFS = async (e) => {
    e.preventDefault();
    if (origenBFS === destinoBFS) {
      setError("El origen y destino para búsqueda de escalas deben ser diferentes.");
      return;
    }
    setError(null);
    setCargando(true);
    try {
      const res = await fetch(
        `${API_URL}/api/rutas/escalas?origen=${origenBFS}&destino=${destinoBFS}&maxEscalas=${maxEscalas}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al buscar itinerarios.");
      }
      setResultadoBFS(data);
    } catch (err) {
      setError(err.message);
      setResultadoBFS(null);
    } finally {
      setCargando(false);
    }
  };

  // 3. Agregar nueva ruta
  const handleAgregarRuta = async (e) => {
    e.preventDefault();
    setError(null);
    setMensajeExito(null);

    if (nuevaRuta.origen === nuevaRuta.destino) {
      setError("El origen y destino no pueden ser el mismo.");
      return;
    }
    if (!nuevaRuta.distancia || Number(nuevaRuta.distancia) <= 0) {
      setError("Ingresa una distancia válida mayor a 0 km.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/rutas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nuevaRuta,
          distancia: Number(nuevaRuta.distancia),
          precio: Number(nuevaRuta.precio) || 0,
          duracion: Number(nuevaRuta.duracion) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear la ruta.");

      setMensajeExito(`Ruta ${nuevaRuta.origen} ➔ ${nuevaRuta.destino} agregada exitosamente.`);
      setNuevaRuta({
        origen: "BOG",
        destino: "MDE",
        distancia: "",
        precio: "",
        duracion: "",
        aerolinea: "Avianca",
        bidireccional: true,
      });
      cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="rutas-page">
      {/* Encabezado del Módulo */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a" }}>
          Red de Rutas Aéreas y Navegación
        </h1>
        <p style={{ color: "#64748b", marginTop: "0.25rem" }}>
          Módulo de <strong>Grafos Ponderados</strong>: Algoritmo de Dijkstra para la trayectoria óptima y Búsqueda en Anchura (BFS) para escalas.
        </p>
      </div>

      {/* Alertas */}
      {error && <div className="alert alert-danger">⚠️ {error}</div>}
      {mensajeExito && <div className="alert alert-info">✅ {mensajeExito}</div>}

      {/* Tarjetas de Estadísticas del Grafo */}
      {estadisticas && (
        <div className="grid-3" style={{ marginBottom: "2rem" }}>
          <div className="stat-box">
            <div className="stat-label">Vértices (Aeropuertos)</div>
            <div className="stat-value">{estadisticas.totalAeropuertos}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Aristas (Vuelos Directos)</div>
            <div className="stat-value">{estadisticas.totalRutasDirectas}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Aeropuerto Hub Principal</div>
            <div className="stat-value" style={{ fontSize: "1.3rem" }}>
              {estadisticas.aeropuertoMasConectado?.id} ({estadisticas.aeropuertoMasConectado?.ciudad})
            </div>
          </div>
        </div>
      )}

      {/* Sección 1: Algoritmo de Dijkstra */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <span>🎯</span> Ruta Óptima con Algoritmo de Dijkstra
          </h2>
          <span className="badge badge-success">Complejidad: O(|V|² + |E|)</span>
        </div>

        <form onSubmit={handleCalcularDijkstra} className="grid-3">
          <div className="form-group">
            <label>Aeropuerto Origen:</label>
            <select
              value={origenDijkstra}
              onChange={(e) => setOrigenDijkstra(e.target.value)}
            >
              {aeropuertos.map((a) => (
                <option key={`orig-${a.id}`} value={a.id}>
                  {a.id} - {a.ciudad} ({a.nombre})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Aeropuerto Destino:</label>
            <select
              value={destinoDijkstra}
              onChange={(e) => setDestinoDijkstra(e.target.value)}
            >
              {aeropuertos.map((a) => (
                <option key={`dest-${a.id}`} value={a.id}>
                  {a.id} - {a.ciudad} ({a.nombre})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Criterio de Optimización:</label>
            <select
              value={criterio}
              onChange={(e) => setCriterio(e.target.value)}
            >
              <option value="distancia">Menor Distancia (km)</option>
              <option value="precio">Menor Precio ($ USD)</option>
              <option value="duracion">Menor Tiempo de Vuelo (min)</option>
            </select>
          </div>
        </form>

        <button
          onClick={handleCalcularDijkstra}
          disabled={cargando}
          className="btn btn-primary btn-block"
        >
          {cargando ? "Calculando con Dijkstra..." : "🚀 Calcular Ruta Más Corta (Dijkstra)"}
        </button>

        {/* Resultado Dijkstra */}
        {resultadoDijkstra && resultadoDijkstra.encontrado && (
          <div className="route-path-container">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e3a8a" }}>
              Trayectoria Calculada: {resultadoDijkstra.origen} ➔ {resultadoDijkstra.destino}
            </h3>

            {/* Pastillas del Camino */}
            <div className="route-steps">
              {resultadoDijkstra.camino.map((codigo, idx) => (
                <React.Fragment key={`step-${codigo}-${idx}`}>
                  <span className="airport-pill">
                    ✈️ {codigo}
                  </span>
                  {idx < resultadoDijkstra.camino.length - 1 && (
                    <span className="step-arrow">➔</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Métricas */}
            <div className="grid-3" style={{ marginTop: "1rem" }}>
              <div style={{ background: "white", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Distancia Total:</span>
                <p style={{ fontWeight: 800, fontSize: "1.2rem", color: "#0f172a" }}>
                  {resultadoDijkstra.resumen.totalDistanciaKm.toLocaleString()} km
                </p>
              </div>
              <div style={{ background: "white", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Tarifa Estimada:</span>
                <p style={{ fontWeight: 800, fontSize: "1.2rem", color: "#10b981" }}>
                  ${resultadoDijkstra.resumen.totalPrecioUSD} USD
                </p>
              </div>
              <div style={{ background: "white", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Escalas Intermedias:</span>
                <p style={{ fontWeight: 800, fontSize: "1.2rem", color: "#f59e0b" }}>
                  {resultadoDijkstra.escalas === 0 ? "Vuelo Directo" : `${resultadoDijkstra.escalas} escala(s)`}
                </p>
              </div>
            </div>

            {/* Desglose de Tramos */}
            <div className="table-responsive" style={{ marginTop: "1.25rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Tramo</th>
                    <th>Aerolínea</th>
                    <th>Vuelo</th>
                    <th>Distancia</th>
                    <th>Precio</th>
                    <th>Duración</th>
                  </tr>
                </thead>
                <tbody>
                  {resultadoDijkstra.tramos.map((t, idx) => (
                    <tr key={`tramo-${idx}`}>
                      <td><strong>{t.desde} ➔ {t.hacia}</strong></td>
                      <td>{t.aerolinea}</td>
                      <td><code>{t.vuelo}</code></td>
                      <td>{t.distancia} km</td>
                      <td>${t.precio} USD</td>
                      <td>{t.duracion} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Sección 2: Búsqueda de Escalas con BFS */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <span>🌐</span> Explorador de Escalas e Itinerarios (BFS)
          </h2>
          <span className="badge badge-info">Búsqueda por Capas FIFO</span>
        </div>

        <form onSubmit={handleBuscarBFS} className="grid-3">
          <div className="form-group">
            <label>Origen:</label>
            <select value={origenBFS} onChange={(e) => setOrigenBFS(e.target.value)}>
              {aeropuertos.map((a) => (
                <option key={`bfs-orig-${a.id}`} value={a.id}>
                  {a.id} - {a.ciudad}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Destino:</label>
            <select value={destinoBFS} onChange={(e) => setDestinoBFS(e.target.value)}>
              {aeropuertos.map((a) => (
                <option key={`bfs-dest-${a.id}`} value={a.id}>
                  {a.id} - {a.ciudad}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Máximo de Escalas:</label>
            <select value={maxEscalas} onChange={(e) => setMaxEscalas(Number(e.target.value))}>
              <option value={0}>Solo Vuelos Directos (0 escalas)</option>
              <option value={1}>Hasta 1 Escala</option>
              <option value={2}>Hasta 2 Escalas</option>
            </select>
          </div>
        </form>

        <button
          onClick={handleBuscarBFS}
          disabled={cargando}
          className="btn btn-secondary btn-block"
        >
          {cargando ? "Buscando conexiones..." : "🔍 Explorar Rutas con BFS"}
        </button>

        {resultadoBFS && (
          <div style={{ marginTop: "1.5rem" }}>
            <p style={{ fontWeight: 600, color: "#334155", marginBottom: "0.75rem" }}>
              Total de alternativas encontradas: {resultadoBFS.totalRutasEncontradas}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {resultadoBFS.rutas.map((r, idx) => (
                <div
                  key={`itinerario-${idx}`}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "1rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      Opción {idx + 1}: {r.camino.join(" ➔ ")}
                    </div>
                    <span className={r.escalas === 0 ? "badge badge-success" : "badge badge-warning"}>
                      {r.escalas === 0 ? "Directo" : `${r.escalas} escala(s)`}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem", fontSize: "0.9rem", color: "#64748b" }}>
                    <span>📍 Distancia: <strong>{r.totalDistanciaKm} km</strong></span>
                    <span>💵 Tarifa: <strong>${r.totalPrecioUSD} USD</strong></span>
                    <span>⏱️ Duración: <strong>{r.totalDuracionMin} min</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sección 3: Agregar Nueva Ruta al Grafo */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <span>➕</span> Agregar Nueva Conexión Aérea (Arista)
          </h2>
          <span className="badge badge-info">Sincronizado con PostgreSQL Neon</span>
        </div>

        <form onSubmit={handleAgregarRuta}>
          <div className="grid-2">
            <div className="form-group">
              <label>Origen:</label>
              <select
                value={nuevaRuta.origen}
                onChange={(e) => setNuevaRuta({ ...nuevaRuta, origen: e.target.value })}
              >
                {aeropuertos.map((a) => (
                  <option key={`new-orig-${a.id}`} value={a.id}>{a.id} - {a.ciudad}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Destino:</label>
              <select
                value={nuevaRuta.destino}
                onChange={(e) => setNuevaRuta({ ...nuevaRuta, destino: e.target.value })}
              >
                {aeropuertos.map((a) => (
                  <option key={`new-dest-${a.id}`} value={a.id}>{a.id} - {a.ciudad}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label>Distancia (km):</label>
              <input
                type="number"
                placeholder="Ej: 850"
                value={nuevaRuta.distancia}
                onChange={(e) => setNuevaRuta({ ...nuevaRuta, distancia: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Precio estimado ($ USD):</label>
              <input
                type="number"
                placeholder="Ej: 120"
                value={nuevaRuta.precio}
                onChange={(e) => setNuevaRuta({ ...nuevaRuta, precio: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Duración (minutos):</label>
              <input
                type="number"
                placeholder="Ej: 75"
                value={nuevaRuta.duracion}
                onChange={(e) => setNuevaRuta({ ...nuevaRuta, duracion: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            ➕ Registrar Ruta en el Grafo y BD
          </button>
        </form>
      </div>

      {/* Sección 4: Tabla de Rutas Registradas */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <span>🗺️</span> Catálogo de Rutas Directas en el Grafo ({rutasDirectas.length})
          </h2>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Origen</th>
                <th>Destino</th>
                <th>Distancia</th>
                <th>Precio</th>
                <th>Duración</th>
                <th>Aerolínea</th>
                <th>Vuelo</th>
              </tr>
            </thead>
            <tbody>
              {rutasDirectas.slice(0, 15).map((r, idx) => (
                <tr key={`list-ruta-${idx}`}>
                  <td><strong>{r.origen}</strong></td>
                  <td><strong>{r.destino}</strong></td>
                  <td>{r.distancia} km</td>
                  <td>${r.precio} USD</td>
                  <td>{r.duracion} min</td>
                  <td>{r.aerolinea}</td>
                  <td><code>{r.vuelo}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rutasDirectas.length > 15 && (
            <p style={{ textAlign: "center", color: "#64748b", fontSize: "0.85rem", marginTop: "0.75rem" }}>
              Mostrando las primeras 15 rutas de {rutasDirectas.length} registradas.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

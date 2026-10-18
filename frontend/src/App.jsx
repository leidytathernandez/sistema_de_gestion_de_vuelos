import React, { useState } from "react";
import Rutas from "./pages/Rutas.jsx";
import Pasajeros from "./pages/Pasajeros.jsx";
import Vuelos from "./pages/Vuelos.jsx";

export default function App() {
  const [tabActiva, setTabActiva] = useState("rutas");

  return (
    <div className="app-container">
      {/* Barra de Navegación Principal */}
      <nav className="navbar">
        <div className="brand">
          <span>✈️</span>
          <span>Sistema de Gestión de Vuelos</span>
          <span className="brand-badge">ED&A 2 - UAO</span>
        </div>

        <div className="nav-links">
          <button
            className={`nav-btn ${tabActiva === "pasajeros" ? "active" : ""}`}
            onClick={() => setTabActiva("pasajeros")}
          >
            👥 Pasajeros (Cola/Pila)
          </button>
          <button
            className={`nav-btn ${tabActiva === "vuelos" ? "active" : ""}`}
            onClick={() => setTabActiva("vuelos")}
          >
            🛫 Vuelos (Heap/AVL)
          </button>
          <button
            className={`nav-btn ${tabActiva === "rutas" ? "active" : ""}`}
            onClick={() => setTabActiva("rutas")}
          >
            🌐 Rutas (Grafo)
          </button>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="main-content">
        {tabActiva === "rutas" && <Rutas />}
        {tabActiva === "pasajeros" && <Pasajeros />}
        {tabActiva === "vuelos" && <Vuelos />}
      </main>

      <footer className="footer">
        Sistema de Gestión de Vuelos / Aeropuerto • Estructuras de Datos y Algoritmos 2 • UAO 2026
      </footer>
    </div>
  );
}

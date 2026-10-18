import express from "express";
import cors from "cors";
import "dotenv/config";
import { fileURLToPath } from "node:url";

// Rutas de los 3 módulos del equipo
import rutasRoutes from "./routes/rutas.routes.js";
import pasajerosRoutes from "./routes/pasajeros.routes.js";
import arbolesRoutes from "./arboles/index.js";

// Servicios y BD
import { conectarDB, dbConectada, query } from "./db.js";
import {
  restaurarRedDesdeDB,
  obtenerAeropuertos,
  obtenerRutas,
} from "./services/rutas.service.js";
import { restaurarFila } from "./services/checkin.service.js";
import { cargarEstructuras as cargarEstructurasVuelos } from "./arboles/vuelosService.js";

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de comprobación de salud de la API
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "API del sistema de vuelos funcionando con todos los módulos",
    baseDeDatos: dbConectada() ? "PostgreSQL (Neon) conectada" : "Memoria",
    modulos: ["/api/rutas", "/api/pasajeros", "/api/vuelos", "/api/torre"]
  });
});

// 1. Módulo Rutas (Grafo + Dijkstra + BFS) - Juan
app.use("/api/rutas", rutasRoutes);

// 2. Módulo Pasajeros (Cola FIFO + Pila LIFO) - Leidy
app.use("/api/pasajeros", pasajerosRoutes);

// 3. Módulo Vuelos (Árbol AVL + Min-Heap) - Carlos
app.use("/api", arbolesRoutes);

export async function iniciarServidor() {
  await conectarDB();

  if (dbConectada()) {
    try {
      // --- Sincronizar Módulo Rutas (Grafo) ---
      const { rows: aeropuertosDB } = await query(
        "SELECT codigo, nombre, ciudad, pais FROM aeropuertos"
      );
      const { rows: rutasDB } = await query(
        "SELECT origen, destino, distancia, precio, duracion, aerolinea, vuelo FROM rutas"
      );

      if (aeropuertosDB.length > 0 || rutasDB.length > 0) {
        restaurarRedDesdeDB(aeropuertosDB, rutasDB);
        console.log(
          `[Rutas] Red restaurada: ${aeropuertosDB.length} aeropuertos, ${rutasDB.length} rutas.`
        );
      } else {
        console.log("[Rutas] Sembrando catálogo inicial en PostgreSQL...");
        for (const a of obtenerAeropuertos()) {
          await query(
            `INSERT INTO aeropuertos (codigo, nombre, ciudad, pais)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (codigo) DO NOTHING`,
            [a.id, a.nombre, a.ciudad, a.pais]
          );
        }

        for (const r of obtenerRutas()) {
          await query(
            `INSERT INTO rutas (origen, destino, distancia, precio, duracion, aerolinea, vuelo)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [r.origen, r.destino, r.distancia, r.precio, r.duracion, r.aerolinea, r.vuelo]
          );
        }
        console.log("[Rutas] Catálogo inicial sembrado.");
      }

      // --- Sincronizar Módulo Pasajeros (Cola) ---
      const { rows: pasajerosEnFila } = await query(
        "SELECT id_fila, nombre, vuelo, llegada FROM pasajeros WHERE estado = 'en_fila' ORDER BY llegada"
      );
      const { rows: maximoId } = await query(
        "SELECT COALESCE(MAX(id_fila), 0) AS ultimo FROM pasajeros"
      );
      restaurarFila(
        pasajerosEnFila.map((p) => ({
          idFila: p.id_fila,
          nombre: p.nombre,
          vuelo: p.vuelo,
          llegada: p.llegada,
        })),
        Number(maximoId[0].ultimo)
      );
      console.log(`[Pasajeros] Fila restaurada: ${pasajerosEnFila.length} en espera.`);

      // --- Sincronizar Módulo Vuelos (AVL + Min-Heap) ---
      await cargarEstructurasVuelos();
      console.log("[Vuelos] Estructuras AVL y Min-Heap cargadas.");
    } catch (err) {
      console.warn("Aviso durante la sincronización inicial:", err.message);
    }
  }

  const PORT = process.env.PORT || 3000;
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`Servidor completo escuchando en el puerto ${PORT}`);
      resolve(server);
    });
  });
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun || process.env.NODE_ENV === "production") {
  iniciarServidor().catch((err) => {
    console.error("Error al iniciar el servidor:", err);
  });
}

export default app;
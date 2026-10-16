import express from "express";
import cors from "cors";
import "dotenv/config";
import { fileURLToPath } from "node:url";
import rutasRoutes from "./routes/rutas.routes.js";
import { conectarDB, dbConectada, query } from "./db.js";
import {
  restaurarRedDesdeDB,
  obtenerAeropuertos,
  obtenerRutas,
} from "./services/rutas.service.js";

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de salud de la API
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "API del sistema de vuelos funcionando",
    baseDeDatos: dbConectada() ? "PostgreSQL (Neon) conectada" : "Memoria",
  });
});

// Rutas del módulo de Red de Rutas y Grafos (Integrante 3: Juan Manuel Alvarez Molano)
app.use("/api/rutas", rutasRoutes);

export async function iniciarServidor() {
  await conectarDB();

  if (dbConectada()) {
    try {
      const { rows: aeropuertosDB } = await query(
        "SELECT codigo, nombre, ciudad, pais FROM aeropuertos"
      );
      const { rows: rutasDB } = await query(
        "SELECT origen, destino, distancia, precio, duracion, aerolinea, vuelo FROM rutas"
      );

      // Si la BD ya contiene rutas o aeropuertos, sincroniza la memoria con PostgreSQL
      if (aeropuertosDB.length > 0 || rutasDB.length > 0) {
        restaurarRedDesdeDB(aeropuertosDB, rutasDB);
        console.log(
          `Red restaurada desde PostgreSQL: ${aeropuertosDB.length} aeropuertos, ${rutasDB.length} rutas.`
        );
      } else {
        // Si la base está vacía, sembramos los aeropuertos y rutas iniciales para que existan en Neon
        console.log("Sembrando catálogo inicial de rutas en PostgreSQL...");
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
        console.log("Catálogo inicial registrado en PostgreSQL con éxito.");
      }
    } catch (err) {
      console.warn("Aviso durante la sincronización con PostgreSQL:", err.message);
    }
  }

  const PORT = process.env.PORT || 3000;
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
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
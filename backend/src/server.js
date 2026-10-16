import express from "express";
import cors from "cors";
import "dotenv/config";
import pasajerosRoutes from "./routes/pasajeros.routes.js";
import { conectarDB, dbConectada, query } from "./db.js";
import { restaurarFila } from "./services/checkin.service.js";

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de prueba para saber que el servidor está vivo
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API del sistema de vuelos funcionando" });
});

app.use("/api/pasajeros", pasajerosRoutes);

async function iniciar() {
  await conectarDB();

  // Si hay base de datos, la fila se reconstruye con lo que quedó guardado
  if (dbConectada()) {
    const { rows } = await query(
      "SELECT id_fila, nombre, vuelo, llegada FROM pasajeros WHERE estado = 'en_fila' ORDER BY llegada"
    );
    const { rows: maximo } = await query(
      "SELECT COALESCE(MAX(id_fila), 0) AS ultimo FROM pasajeros"
    );
    restaurarFila(
      rows.map((p) => ({
        idFila: p.id_fila,
        nombre: p.nombre,
        vuelo: p.vuelo,
        llegada: p.llegada,
      })),
      Number(maximo[0].ultimo)
    );
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });
}

iniciar().catch((error) => {
  console.error("No se pudo iniciar el servidor:", error);
  process.exit(1);
});
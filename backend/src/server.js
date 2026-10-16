import express from "express";
import cors from "cors";
import "dotenv/config";
import { fileURLToPath } from "node:url";
import rutasRoutes from "./routes/rutas.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de prueba para saber que el servidor está vivo
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API del sistema de vuelos funcionando" });
});

// Rutas del módulo de Red de Rutas y Grafos (Integrante 3)
app.use("/api/rutas", rutasRoutes);

const PORT = process.env.PORT || 3000;

// Inicia el listener solo cuando se ejecuta server.js directamente
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun || process.env.NODE_ENV === "production") {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });
}

export default app;
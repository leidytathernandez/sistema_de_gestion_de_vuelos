import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de prueba para saber que el servidor está vivo
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API del sistema de vuelos funcionando" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
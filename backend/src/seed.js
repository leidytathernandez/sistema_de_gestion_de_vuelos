import "dotenv/config";
import { conectarDB, dbConectada, query } from "./db.js";

// Pasajeros de ejemplo: "minutos" indica hace cuánto llegaron
const pasajeros = [
  { id: 101, nombre: "Camila Rojas", vuelo: "AV9301", minutos: 95, estado: "atendido" },
  { id: 102, nombre: "Andrés Gómez", vuelo: "AV9301", minutos: 80, estado: "atendido" },
  { id: 103, nombre: "Valentina Ríos", vuelo: "LA4025", minutos: 60, estado: "atendido" },
  { id: 104, nombre: "Santiago Pérez", vuelo: "AV9301", minutos: 45, estado: "en_fila" },
  { id: 105, nombre: "Daniela Torres", vuelo: "VV1207", minutos: 38, estado: "en_fila" },
  { id: 106, nombre: "Mateo Herrera", vuelo: "LA4025", minutos: 30, estado: "en_fila" },
  { id: 107, nombre: "Laura Mejía", vuelo: "AV9301", minutos: 22, estado: "en_fila" },
  { id: 108, nombre: "Julián Castro", vuelo: "VV1207", minutos: 15, estado: "en_fila" },
  { id: 109, nombre: "Sofía Ramírez", vuelo: "LA4025", minutos: 8, estado: "en_fila" },
  { id: 110, nombre: "Nicolás Vargas", vuelo: "AV9301", minutos: 3, estado: "en_fila" },
];

async function sembrar() {
  await conectarDB();
  if (!dbConectada()) {
    console.error("No hay DATABASE_URL: configura backend/.env antes del seed");
    process.exit(1);
  }

  for (const p of pasajeros) {
    const llegada = new Date(Date.now() - p.minutos * 60000).toISOString();
    // ON CONFLICT evita duplicados si el seed se ejecuta más de una vez
    await query(
      `INSERT INTO pasajeros (id_fila, nombre, vuelo, llegada, estado)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id_fila) DO NOTHING`,
      [p.id, p.nombre, p.vuelo, llegada, p.estado]
    );
  }

  console.log(`Datos de ejemplo listos (${pasajeros.length} pasajeros)`);
  process.exit(0);
}

sembrar().catch((error) => {
  console.error("No se pudo cargar los datos de ejemplo:", error);
  process.exit(1);
});
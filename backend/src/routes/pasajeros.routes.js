import { Router } from "express";
import {
  registrarPasajero,
  verCola,
  atenderSiguiente,
  verHistorial,
  deshacer,
} from "../services/checkin.service.js";
import { dbConectada, query } from "../db.js";

const router = Router();

// Registrar un pasajero en la fila de check-in
router.post("/checkin", async (req, res) => {
  const { nombre, vuelo } = req.body ?? {};
  if (!nombre || !vuelo) {
    return res.status(400).json({ error: "nombre y vuelo son obligatorios" });
  }
  const resultado = registrarPasajero({ nombre, vuelo });
  if (dbConectada()) {
    const p = resultado.pasajero;
    await query(
      "INSERT INTO pasajeros (id_fila, nombre, vuelo, llegada) VALUES ($1, $2, $3, $4)",
      [p.id, p.nombre, p.vuelo, p.llegada]
    );
  }
  res.status(201).json(resultado);
});

// Ver la fila completa
router.get("/checkin", (req, res) => {
  res.json(verCola());
});

// Atender al siguiente de la fila
router.post("/checkin/atender", async (req, res) => {
  const pasajero = atenderSiguiente();
  if (!pasajero) {
    return res.status(404).json({ error: "La fila est├í vac├¡a" });
  }
  if (dbConectada()) {
    await query("UPDATE pasajeros SET estado = 'atendido' WHERE id_fila = $1", [
      pasajero.id,
    ]);
  }
  res.json(pasajero);
});

// Ver el historial de operaciones
router.get("/historial", (req, res) => {
  res.json(verHistorial());
});

// Deshacer la ├║ltima operaci├│n
router.post("/historial/deshacer", async (req, res) => {
  const operacion = deshacer();
  if (!operacion) {
    return res.status(404).json({ error: "No hay operaciones para deshacer" });
  }
  if (dbConectada()) {
    const idFila = operacion.pasajero.id;
    if (operacion.tipo === "registrar") {
      await query("DELETE FROM pasajeros WHERE id_fila = $1", [idFila]);
    } else {
      await query("UPDATE pasajeros SET estado = 'en_fila' WHERE id_fila = $1", [
        idFila,
      ]);
    }
  }
  res.json(operacion);
});

export default router;

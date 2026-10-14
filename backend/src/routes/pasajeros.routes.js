import { Router } from "express";
import {
  registrarPasajero,
  verCola,
  atenderSiguiente,
  verHistorial,
  deshacer,
} from "../services/checkin.service.js";

const router = Router();

// Registrar un pasajero en la fila de check-in
router.post("/checkin", (req, res) => {
  const { nombre, vuelo } = req.body ?? {};
  if (!nombre || !vuelo) {
    return res.status(400).json({ error: "nombre y vuelo son obligatorios" });
  }
  res.status(201).json(registrarPasajero({ nombre, vuelo }));
});

// Ver la fila completa
router.get("/checkin", (req, res) => {
  res.json(verCola());
});

// Atender al siguiente de la fila
router.post("/checkin/atender", (req, res) => {
  const pasajero = atenderSiguiente();
  if (!pasajero) {
    return res.status(404).json({ error: "La fila está vacía" });
  }
  res.json(pasajero);
});

// Ver el historial de operaciones
router.get("/historial", (req, res) => {
  res.json(verHistorial());
});

// Deshacer la última operación
router.post("/historial/deshacer", (req, res) => {
  const operacion = deshacer();
  if (!operacion) {
    return res.status(404).json({ error: "No hay operaciones para deshacer" });
  }
  res.json(operacion);
});

export default router;
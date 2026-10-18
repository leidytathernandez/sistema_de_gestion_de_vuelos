
import {Router} from 'express';
import * as svc from './vuelosService.js';

const router = Router();

// Envoltorio para capturar errores de funciones async
const ruta = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    const status = err.code === '23505' ? 409 : 400; // 23505 = c├│digo de vuelo duplicado
    res.status(status).json({ error: err.message });
  }
};

// --- Buscador de vuelos (AVL) ---
router.get('/vuelos', ruta((req, res) => res.json(svc.listarVuelos())));

router.get('/vuelos/rango', ruta((req, res) => {
  const { desde, hasta } = req.query;
  if (!desde || !hasta) throw new Error('Faltan los par├ímetros desde y hasta (ISO 8601)');
  res.json(svc.vuelosEntre(desde, hasta));
}));

router.get('/vuelos/arbol', ruta((req, res) => res.json(svc.arbolVuelos())));

router.get('/vuelos/:codigo', ruta((req, res) => {
  const vuelo = svc.buscarVuelo(req.params.codigo.toUpperCase());
  if (!vuelo) return res.status(404).json({ error: 'Vuelo no encontrado' });
  res.json(vuelo);
}));

router.post('/vuelos', ruta(async (req, res) => res.status(201).json(await svc.crearVuelo(req.body))));

router.delete('/vuelos/:codigo', ruta(async (req, res) => {
  const vuelo = await svc.eliminarVuelo(req.params.codigo.toUpperCase());
  if (!vuelo) return res.status(404).json({ error: 'Vuelo no encontrado' });
  res.json(vuelo);
}));

// --- Torre de control (Heap) ---
router.get('/torre', ruta((req, res) => res.json(svc.verCola())));
router.get('/torre/arbol', ruta((req, res) => res.json(svc.arbolCola())));

router.post('/torre', ruta(async (req, res) => {
  const { codigo, tipo, prioridad } = req.body;
  res.status(201).json(await svc.solicitar(codigo?.toUpperCase(), tipo, Number(prioridad)));
}));

router.post('/torre/atender', ruta(async (req, res) => {
  const atendida = await svc.atenderSiguiente();
  if (!atendida) return res.status(404).json({ error: 'No hay solicitudes pendientes' });
  res.json(atendida);
}));
export default router;

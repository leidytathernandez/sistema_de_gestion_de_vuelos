import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import * as svc from './vuelosService.js';

const app = express();
app.use(cors());
app.use(express.json());

// Envoltorio para capturar errores de funciones async
const ruta = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    const status = err.code === '23505' ? 409 : 400; // 23505 = código de vuelo duplicado
    res.status(status).json({ error: err.message });
  }
};

// --- Buscador de vuelos (AVL) ---
app.get('/api/vuelos', ruta((req, res) => res.json(svc.listarVuelos())));

app.get('/api/vuelos/rango', ruta((req, res) => {
  const { desde, hasta } = req.query;
  if (!desde || !hasta) throw new Error('Faltan los parámetros desde y hasta (ISO 8601)');
  res.json(svc.vuelosEntre(desde, hasta));
}));

app.get('/api/vuelos/arbol', ruta((req, res) => res.json(svc.arbolVuelos())));

app.get('/api/vuelos/:codigo', ruta((req, res) => {
  const vuelo = svc.buscarVuelo(req.params.codigo.toUpperCase());
  if (!vuelo) return res.status(404).json({ error: 'Vuelo no encontrado' });
  res.json(vuelo);
}));

app.post('/api/vuelos', ruta(async (req, res) => res.status(201).json(await svc.crearVuelo(req.body))));

app.delete('/api/vuelos/:codigo', ruta(async (req, res) => {
  const vuelo = await svc.eliminarVuelo(req.params.codigo.toUpperCase());
  if (!vuelo) return res.status(404).json({ error: 'Vuelo no encontrado' });
  res.json(vuelo);
}));

// --- Torre de control (Heap) ---
app.get('/api/torre', ruta((req, res) => res.json(svc.verCola())));
app.get('/api/torre/arbol', ruta((req, res) => res.json(svc.arbolCola())));

app.post('/api/torre', ruta(async (req, res) => {
  const { codigo, tipo, prioridad } = req.body;
  res.status(201).json(await svc.solicitar(codigo?.toUpperCase(), tipo, Number(prioridad)));
}));

app.post('/api/torre/atender', ruta(async (req, res) => {
  const atendida = await svc.atenderSiguiente();
  if (!atendida) return res.status(404).json({ error: 'No hay solicitudes pendientes' });
  res.json(atendida);
}));

const PORT = process.env.PORT || 3000;
await svc.cargarEstructuras();
app.listen(PORT, () => console.log(`API de árboles escuchando en el puerto ${PORT}`));

import test, { beforeEach } from "node:test";
import assert from "node:assert";
import {
  obtenerAeropuertos,
  obtenerAeropuerto,
  agregarAeropuerto,
  obtenerRutas,
  agregarRuta,
  eliminarRuta,
  calcularRutaMasCorta,
  buscarRutasConEscalas,
  obtenerEstadisticasRed,
  reiniciarRed,
} from "../src/services/rutas.service.js";

beforeEach(() => {
  reiniciarRed();
});

test("inicializa con aeropuertos y rutas base preconfiguradas", () => {
  const aeropuertos = obtenerAeropuertos();
  const rutas = obtenerRutas();

  assert.ok(aeropuertos.length >= 10);
  assert.ok(rutas.length >= 15);

  const bog = obtenerAeropuerto("BOG");
  assert.strictEqual(bog.ciudad, "Bogotá");
});

test("permite registrar un nuevo aeropuerto", () => {
  const nuevo = agregarAeropuerto({
    codigo: "SMR",
    nombre: "Aeropuerto Simón Bolívar",
    ciudad: "Santa Marta",
    pais: "Colombia",
  });

  assert.strictEqual(nuevo.id, "SMR");
  assert.strictEqual(obtenerAeropuerto("SMR").ciudad, "Santa Marta");
});

test("rechaza aeropuertos con códigos duplicados o inválidos", () => {
  assert.throws(() => {
    agregarAeropuerto({ codigo: "BOG", nombre: "Duplicado" });
  }, /ya existe/);

  assert.throws(() => {
    agregarAeropuerto({ codigo: "", nombre: "Sin codigo" });
  }, /obligatorios/);
});

test("permite registrar una nueva ruta aérea", () => {
  const nuevaRuta = agregarRuta({
    origen: "MDE",
    destino: "MIA",
    distancia: 2250,
    precio: 280,
    duracion: 215,
    aerolinea: "Avianca",
    bidireccional: true,
  });

  assert.strictEqual(nuevaRuta.distancia, 2250);
  assert.strictEqual(nuevaRuta.bidireccional, true);

  // Comprobar que Dijkstra puede usar la nueva ruta directa MDE -> MIA
  const resultado = calcularRutaMasCorta("MDE", "MIA", "distancia");
  assert.strictEqual(resultado.encontrado, true);
  assert.deepStrictEqual(resultado.camino, ["MDE", "MIA"]);
  assert.strictEqual(resultado.pesoTotal, 2250);
});

test("calcula la ruta más corta entre Bogotá y Nueva York (JFK) con Dijkstra", () => {
  const resultado = calcularRutaMasCorta("BOG", "JFK", "distancia");

  assert.strictEqual(resultado.encontrado, true);
  assert.strictEqual(resultado.origen, "BOG");
  assert.strictEqual(resultado.destino, "JFK");
  assert.ok(resultado.camino.length >= 3); // Mínimo con 1 escala (ej. BOG -> MIA -> JFK)
  assert.strictEqual(resultado.camino[0], "BOG");
  assert.strictEqual(resultado.camino[resultado.camino.length - 1], "JFK");
  assert.ok(resultado.resumen.totalDistanciaKm > 0);
  assert.ok(resultado.resumen.totalPrecioUSD > 0);
});

test("busca rutas alternativas con escalas", () => {
  // Buscamos opciones de BOG a JFK con hasta 2 escalas
  const busqueda = buscarRutasConEscalas("BOG", "JFK", 2);

  assert.strictEqual(busqueda.origen, "BOG");
  assert.strictEqual(busqueda.destino, "JFK");
  assert.ok(busqueda.totalRutasEncontradas >= 1);

  // Cada ruta debe tener origen en BOG y destino en JFK
  for (const r of busqueda.rutas) {
    assert.strictEqual(r.camino[0], "BOG");
    assert.strictEqual(r.camino[r.camino.length - 1], "JFK");
    assert.ok(r.escalas <= 2);
  }
});

test("calcula estadísticas de conectividad y grado de aeropuertos", () => {
  const stats = obtenerEstadisticasRed();

  assert.ok(stats.totalAeropuertos >= 10);
  assert.ok(stats.totalRutasDirectas >= 15);
  assert.ok(stats.aeropuertoMasConectado !== null);
  // BOG debería ser de los principales hubs
  assert.ok(["BOG", "PTY", "MIA"].includes(stats.aeropuertoMasConectado.id));
});

test("permite eliminar una ruta de la red", () => {
  const res = eliminarRuta("BOG", "MDE");
  assert.strictEqual(res.eliminado, true);

  // Comprobar que ya no es ruta directa
  const corta = calcularRutaMasCorta("BOG", "MDE", "distancia");
  // O bien no hay camino directo o usa una escala
  if (corta.encontrado) {
    assert.notDeepStrictEqual(corta.camino, ["BOG", "MDE"]);
  }
});

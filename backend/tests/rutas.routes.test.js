import test, { before, after } from "node:test";
import assert from "node:assert";
import app from "../src/server.js";

let server;
let baseUrl;

before(() => {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(() => {
  return new Promise((resolve) => {
    if (server) {
      server.close(resolve);
    } else {
      resolve();
    }
  });
});

test("GET /api/health responde con estado ok", async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, "ok");
});

test("GET /api/rutas retorna la topología de la red", async () => {
  const res = await fetch(`${baseUrl}/api/rutas`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.totalVertices >= 10);
  assert.ok(data.totalAristas >= 15);
  assert.ok(Array.isArray(data.vertices));
  assert.ok(Array.isArray(data.aristas));
});

test("GET /api/rutas/aeropuertos retorna la lista de aeropuertos", async () => {
  const res = await fetch(`${baseUrl}/api/rutas/aeropuertos`);
  assert.strictEqual(res.status, 200);
  const aeropuertos = await res.json();
  assert.ok(Array.isArray(aeropuertos));
  const bog = aeropuertos.find((a) => a.id === "BOG");
  assert.ok(bog);
  assert.strictEqual(bog.ciudad, "Bogotá");
});

test("POST /api/rutas/aeropuertos registra un nuevo aeropuerto", async () => {
  const res = await fetch(`${baseUrl}/api/rutas/aeropuertos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      codigo: "AXM",
      nombre: "Aeropuerto Internacional El Edén",
      ciudad: "Armenia",
      pais: "Colombia",
    }),
  });
  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.aeropuerto.id, "AXM");
});

test("POST /api/rutas agrega una nueva ruta", async () => {
  const res = await fetch(`${baseUrl}/api/rutas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      origen: "BOG",
      destino: "AXM",
      distancia: 180,
      precio: 50,
      duracion: 40,
      aerolinea: "EasyFly",
      bidireccional: true,
    }),
  });
  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.ruta.origen, "BOG");
  assert.strictEqual(data.ruta.destino, "AXM");
});

test("GET /api/rutas/corta calcula la ruta óptima con Dijkstra", async () => {
  const res = await fetch(`${baseUrl}/api/rutas/corta?origen=BOG&destino=JFK&criterio=distancia`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.encontrado, true);
  assert.strictEqual(data.origen, "BOG");
  assert.strictEqual(data.destino, "JFK");
  assert.ok(data.camino.length >= 3);
  assert.ok(data.resumen.totalDistanciaKm > 0);
});

test("GET /api/rutas/corta retorna 404 si no hay ruta", async () => {
  // Creamos un aeropuerto aislado
  await fetch(`${baseUrl}/api/rutas/aeropuertos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo: "ISL", nombre: "Isla Desierta", ciudad: "Remota" }),
  });

  const res = await fetch(`${baseUrl}/api/rutas/corta?origen=BOG&destino=ISL`);
  assert.strictEqual(res.status, 404);
  const data = await res.json();
  assert.strictEqual(data.encontrado, false);
});

test("GET /api/rutas/escalas busca opciones con escalas", async () => {
  const res = await fetch(`${baseUrl}/api/rutas/escalas?origen=BOG&destino=MAD&maxEscalas=2`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.origen, "BOG");
  assert.strictEqual(data.destino, "MAD");
  assert.ok(data.totalRutasEncontradas >= 1);
});

test("GET /api/rutas/estadisticas retorna métricas de conectividad", async () => {
  const res = await fetch(`${baseUrl}/api/rutas/estadisticas`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.totalAeropuertos > 0);
  assert.ok(data.totalRutasDirectas > 0);
  assert.ok(data.aeropuertoMasConectado);
});

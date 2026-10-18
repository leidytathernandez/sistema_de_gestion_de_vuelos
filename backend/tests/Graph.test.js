import test from "node:test";
import assert from "node:assert";
import Graph from "../src/structures/Graph.js";

test("debe permitir agregar y consultar vértices (aeropuertos)", () => {
  const grafo = new Graph(true);
  grafo.addVertex("BOG", { nombre: "El Dorado", ciudad: "Bogotá" });
  grafo.addVertex("MDE", { nombre: "José María Córdova", ciudad: "Medellín" });

  assert.strictEqual(grafo.hasVertex("BOG"), true);
  assert.strictEqual(grafo.hasVertex("MDE"), true);
  assert.strictEqual(grafo.hasVertex("CLO"), false);

  const verticeBog = grafo.getVertex("BOG");
  assert.strictEqual(verticeBog.nombre, "El Dorado");
  assert.strictEqual(grafo.getVertices().length, 2);
});

test("debe permitir agregar aristas con peso y metadatos", () => {
  const grafo = new Graph(true);
  grafo.addEdge("BOG", "MIA", 2430, { precio: 320, duracion: 240, aerolinea: "Avianca" });

  assert.strictEqual(grafo.hasEdge("BOG", "MIA"), true);
  assert.strictEqual(grafo.hasEdge("MIA", "BOG"), false); // dirigido

  const ruta = grafo.getEdge("BOG", "MIA");
  assert.strictEqual(ruta.distancia, 2430);
  assert.strictEqual(ruta.precio, 320);
  assert.strictEqual(ruta.aerolinea, "Avianca");
});

test("Dijkstra encuentra la ruta más corta por distancia", () => {
  const grafo = new Graph(true);
  // Red de prueba:
  // BOG -> PTY: 760 km
  // PTY -> MIA: 1860 km (total con escala: 2620 km)
  // BOG -> MIA: 2430 km (directo: 2430 km)
  // MIA -> JFK: 1750 km
  grafo.addEdge("BOG", "PTY", 760, { precio: 190, duracion: 105 });
  grafo.addEdge("PTY", "MIA", 1860, { precio: 220, duracion: 180 });
  grafo.addEdge("BOG", "MIA", 2430, { precio: 320, duracion: 240 });
  grafo.addEdge("MIA", "JFK", 1750, { precio: 150, duracion: 185 });

  const resultadoDirecto = grafo.dijkstra("BOG", "MIA", "distancia");
  assert.strictEqual(resultadoDirecto.encontrado, true);
  assert.strictEqual(resultadoDirecto.pesoTotal, 2430);
  assert.deepStrictEqual(resultadoDirecto.camino, ["BOG", "MIA"]);
  assert.strictEqual(resultadoDirecto.escalas, 0);

  const resultadoLargo = grafo.dijkstra("BOG", "JFK", "distancia");
  assert.strictEqual(resultadoLargo.encontrado, true);
  assert.strictEqual(resultadoLargo.pesoTotal, 2430 + 1750);
  assert.deepStrictEqual(resultadoLargo.camino, ["BOG", "MIA", "JFK"]);
  assert.strictEqual(resultadoLargo.escalas, 1);
  assert.deepStrictEqual(resultadoLargo.aeropuertosEscala, ["MIA"]);
});

test("Dijkstra optimiza según el criterio seleccionado (precio vs distancia)", () => {
  const grafo = new Graph(true);
  // Ruta A directa: distancia 1000 km pero cara ($500)
  // Ruta B con escala: distancia 1500 km pero económica ($200 + $100 = $300)
  grafo.addEdge("A", "C", 1000, { distancia: 1000, precio: 500, duracion: 120 });
  grafo.addEdge("A", "B", 700, { distancia: 700, precio: 200, duracion: 90 });
  grafo.addEdge("B", "C", 800, { distancia: 800, precio: 100, duracion: 100 });

  // Por distancia: debe elegir el camino directo A -> C
  const optDistancia = grafo.dijkstra("A", "C", "distancia");
  assert.deepStrictEqual(optDistancia.camino, ["A", "C"]);
  assert.strictEqual(optDistancia.pesoTotal, 1000);

  // Por precio: debe elegir el camino con escala A -> B -> C
  const optPrecio = grafo.dijkstra("A", "C", "precio");
  assert.deepStrictEqual(optPrecio.camino, ["A", "B", "C"]);
  assert.strictEqual(optPrecio.pesoTotal, 300);
});

test("Dijkstra retorna encontrado=false si no existe camino posible", () => {
  const grafo = new Graph(true);
  grafo.addVertex("BOG");
  grafo.addVertex("TYO"); // Tokio aislado sin vuelos

  const resultado = grafo.dijkstra("BOG", "TYO");
  assert.strictEqual(resultado.encontrado, false);
  assert.strictEqual(resultado.camino.length, 0);
  assert.strictEqual(resultado.pesoTotal, null);
});

test("findAllRoutes encuentra todas las combinaciones con escalas respetando maxStops", () => {
  const grafo = new Graph(true);
  // Caminos posibles de A a D:
  // 1. A -> D (directo, 0 escalas)
  // 2. A -> B -> D (1 escala)
  // 3. A -> C -> D (1 escala)
  // 4. A -> B -> C -> D (2 escalas)
  grafo.addEdge("A", "D", 2000, { distancia: 2000, precio: 400 });
  grafo.addEdge("A", "B", 500, { distancia: 500, precio: 100 });
  grafo.addEdge("B", "D", 1200, { distancia: 1200, precio: 250 });
  grafo.addEdge("A", "C", 800, { distancia: 800, precio: 150 });
  grafo.addEdge("C", "D", 900, { distancia: 900, precio: 200 });
  grafo.addEdge("B", "C", 400, { distancia: 400, precio: 80 });

  const todasConMax1Escala = grafo.findAllRoutes("A", "D", 1);
  assert.strictEqual(todasConMax1Escala.length, 3); // A->D, A->B->D, A->C->D
  assert.strictEqual(todasConMax1Escala[0].escalas, 0); // La primera debe ser directa

  const todasConMax2Escalas = grafo.findAllRoutes("A", "D", 2);
  assert.strictEqual(todasConMax2Escalas.length, 4); // incluye A->B->C->D
});

test("permite eliminar aristas y vértices correctamente", () => {
  const grafo = new Graph(true);
  grafo.addEdge("BOG", "MDE", 240);
  grafo.addEdge("MDE", "CTG", 460);

  assert.strictEqual(grafo.removeEdge("BOG", "MDE"), true);
  assert.strictEqual(grafo.hasEdge("BOG", "MDE"), false);

  assert.strictEqual(grafo.removeVertex("MDE"), true);
  assert.strictEqual(grafo.hasVertex("MDE"), false);
  assert.strictEqual(grafo.hasEdge("MDE", "CTG"), false);
});

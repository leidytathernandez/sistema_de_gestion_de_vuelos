import test from "node:test";
import assert from "node:assert";
import {
  registrarPasajero,
  verCola,
  atenderSiguiente,
  verHistorial,
  deshacer,
  restaurarFila,
} from "../src/services/checkin.service.js";

test("registrar, atender y deshacer mantienen la fila coherente", () => {
  registrarPasajero({ nombre: "Ana", vuelo: "AV123" });
  registrarPasajero({ nombre: "Luis", vuelo: "AV123" });

  assert.strictEqual(atenderSiguiente().nombre, "Ana");
  assert.strictEqual(verCola().length, 1);

  deshacer(); // Ana vuelve al frente de la fila
  assert.deepStrictEqual(verCola().map((p) => p.nombre), ["Ana", "Luis"]);

  deshacer(); // se cancela el registro de Luis
  assert.deepStrictEqual(verCola().map((p) => p.nombre), ["Ana"]);
  assert.strictEqual(verHistorial().length, 1);
});

test("restaurarFila reconstruye la fila y continúa los ids", () => {
  restaurarFila(
    [{ idFila: 7, nombre: "Marta", vuelo: "AV9", llegada: new Date() }],
    7
  );

  assert.deepStrictEqual(verCola().map((p) => p.nombre), ["Marta"]);
  assert.strictEqual(
    registrarPasajero({ nombre: "Pedro", vuelo: "AV9" }).pasajero.id,
    8
  );
});
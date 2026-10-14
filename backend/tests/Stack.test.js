import test from "node:test";
import assert from "node:assert";
import Stack from "../src/structures/Stack.js";

test("la pila saca primero lo último que entró (LIFO)", () => {
  const pila = new Stack();
  pila.push("registrar a Ana");
  pila.push("cancelar reserva de Luis");

  assert.strictEqual(pila.pop(), "cancelar reserva de Luis");
  assert.strictEqual(pila.peek(), "registrar a Ana");
  assert.strictEqual(pila.size(), 1);
});

test("pop en una pila vacía devuelve null", () => {
  const pila = new Stack();
  assert.strictEqual(pila.pop(), null);
  assert.strictEqual(pila.isEmpty(), true);
});

test("toArray muestra lo más reciente primero y no modifica la pila", () => {
  const pila = new Stack();
  pila.push("registrar a Ana");
  pila.push("cancelar reserva de Luis");

  assert.deepStrictEqual(pila.toArray(), [
    "cancelar reserva de Luis",
    "registrar a Ana",
  ]);
  assert.strictEqual(pila.size(), 2);
});
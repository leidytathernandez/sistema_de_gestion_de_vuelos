import test from "node:test";
import assert from "node:assert";
import Queue from "../src/structures/Queue.js";

test("la cola atiende en orden de llegada (FIFO)", () => {
  const cola = new Queue();
  cola.enqueue("Ana");
  cola.enqueue("Luis");

  assert.strictEqual(cola.dequeue(), "Ana");
  assert.strictEqual(cola.peek(), "Luis");
  assert.strictEqual(cola.size(), 1);
});

test("dequeue en una cola vacía devuelve null", () => {
  const cola = new Queue();
  assert.strictEqual(cola.dequeue(), null);
  assert.strictEqual(cola.isEmpty(), true);
});
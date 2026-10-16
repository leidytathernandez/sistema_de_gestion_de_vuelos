### sistema_de_gestion_de_vuelos

## Módulo de pasajeros (check-in)

Responsable: Leidy Hernandez · Rama: `feature/pasajeros`

### Qué hace

Gestiona la fila de check-in del aeropuerto: registrar pasajeros, atender al siguiente y deshacer la última acción.

### Estructuras de datos

| Estructura | Archivo | Para qué se usa |
|---|---|---|
| **Cola (Queue)** | `backend/src/structures/Queue.js` | La fila de check-in: el primer pasajero en llegar es el primero en ser atendido (FIFO). |
| **Pila (Stack)** | `backend/src/structures/Stack.js` | El historial de operaciones: la última acción es la primera que se deshace (LIFO). |

**Por qué estas estructuras:** una fila de personas es una cola por naturaleza, y "deshacer" necesita recuperar siempre lo último que se hizo, que es justo lo que entrega una pila.

### API

Prefijo: `/api/pasajeros`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/checkin` | Registra un pasajero (`nombre`, `vuelo`) al final de la fila |
| GET | `/checkin` | Devuelve la fila completa |
| POST | `/checkin/atender` | Atiende al primero de la fila |
| GET | `/historial` | Devuelve el historial (lo más reciente primero) |
| POST | `/historial/deshacer` | Revierte la última operación |

Al deshacer un registro, el pasajero sale de la fila. Al deshacer una atención, el pasajero vuelve al frente.

### Base de datos

Usamos **PostgreSQL** en **Neon**. El backend se conecta con el driver **pg** (node-postgres), la librería que permite que Node.js se conecte a PostgreSQL y envíe consultas SQL. La conexión está en `backend/src/db.js`, con un `Pool` que reutiliza conexiones abiertas. La cadena de conexión va en `backend/.env` (`DATABASE_URL`), que nunca se sube a GitHub; `backend/.env.example` es la plantilla.

Tabla `pasajeros` (se crea sola al iniciar el servidor):

| Columna | Tipo | Descripción |
|---|---|---|
| id_fila | INTEGER (PK) | Identificador del pasajero en la fila |
| nombre | TEXT | Nombre del pasajero |
| vuelo | TEXT | Código del vuelo |
| llegada | TIMESTAMPTZ | Fecha y hora de llegada |
| estado | TEXT | `en_fila` o `atendido` |

La cola y la pila viven en memoria mientras el servidor corre; la base guarda a los pasajeros para reconstruir la fila si el servidor se reinicia.

### Cómo ejecutarlo

Desde `backend`:

```bash
npm install
npm run dev      # servidor en el puerto 3000
npm run seed     # carga pasajeros de ejemplo en la base
node --test      # corre las pruebas
```

### Archivos del módulo

- `backend/src/structures/Queue.js`, `Stack.js`
- `backend/src/services/checkin.service.js`
- `backend/src/routes/pasajeros.routes.js`
- `backend/src/db.js`, `backend/src/seed.js`
- `backend/tests/Queue.test.js`, `Stack.test.js`, `checkin.service.test.js`
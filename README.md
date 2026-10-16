# sistema_de_gestion_de_vuelos 


Proyecto final · Estructura de Datos y Algoritmos 2 · UAO

Plataforma web para gestionar la operación de un aeropuerto: fila de check-in de pasajeros, prioridad y búsqueda de vuelos, y red de rutas entre aeropuertos. Cada funcionalidad se apoya en una estructura de datos implementada a mano.

## Integrantes

| Integrante | Módulo | Rama |
|---|---|---|
| Leidy Tatiana Hernandez Montenegro | Pasajeros (check-in) | `feature/pasajeros` |
| NOMBRE_COMPAÑERO_1 | Vuelos | `feature/vuelos` |
| NOMBRE_COMPAÑERO_2 | Rutas | `feature/rutas` |

## Enlaces de despliegue

- **Frontend:** ENLACE_DEL_FRONTEND
- **Backend (API):** ENLACE_DEL_BACKEND (comprobación: `/api/health`)
- **Repositorio:** https://github.com/leidytathernandez/sistema_de_gestion_de_vuelos

## Alcance

El sistema permite:

- Registrar pasajeros en una fila de check-in, atenderlos en orden de llegada y deshacer la última acción.
- Gestionar vuelos con prioridad de despegue y aterrizaje, y buscarlos con autocompletado.
- Consultar rutas entre aeropuertos, la ruta más corta y las conexiones con escalas.

Queda fuera del alcance: reservas con pago, autenticación de usuarios y datos de vuelos en tiempo real.

## Estructuras de datos y por qué se eligieron

| Estructura | Módulo | Uso en el sistema | Por qué |
|---|---|---|---|
| **Cola** | Pasajeros | Fila de check-in | Se atiende en orden de llegada (FIFO) |
| **Pila** | Pasajeros | Historial con deshacer | La última acción es la primera que se revierte (LIFO) |
| **Heap** | Vuelos | Prioridad de despegues y aterrizajes | Entrega siempre primero el más prioritario sin ordenar todo |
| **Trie** | Vuelos | Autocompletado de aeropuertos y ciudades | Busca por prefijo en tiempo proporcional a lo escrito |
| **Grafo** | Rutas | Red de aeropuertos con distancias | Modela conexiones entre nodos; Dijkstra (ruta más corta) y BFS (escalas) |

Todas están escritas a mano en `backend/src/structures/`, sin librerías de estructuras de datos.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React con Vite |
| Backend | Node.js con Express (módulos ES) |
| Base de datos | PostgreSQL en Neon, con el driver `pg` |
| Pruebas | `node:test` y `node:assert` |
| Control de versiones | Git y GitHub: una rama por módulo, commits con prefijo (`feat`, `fix`, `test`, `docs`, `chore`) |
| Despliegue | PLATAFORMA_DEL_FRONTEND y PLATAFORMA_DEL_BACKEND |

## Estructura del repositorio

```
backend/
  src/structures/   estructuras de datos (clases)
  src/services/     lógica de cada módulo
  src/routes/       endpoints de la API
  src/db.js         conexión a PostgreSQL
  tests/            pruebas
frontend/           aplicación React
```

## Base de datos

Una base PostgreSQL en Neon compartida por el equipo. Cada módulo crea sus propias tablas con `CREATE TABLE IF NOT EXISTS` al iniciar el servidor, y las consultas usan parámetros (`$1`, `$2`) para evitar inyección de SQL. La cadena de conexión va en `backend/.env` (variable `DATABASE_URL`), que no se sube al repositorio; `backend/.env.example` es la plantilla.

## Cómo ejecutarlo en local

```bash
# Backend
cd backend
npm install
cp .env.example .env     # y completar DATABASE_URL
npm run dev              # puerto 3000
node --test              # pruebas

# Frontend
cd frontend
npm install
npm run dev
```

## Flujo de trabajo

Cada integrante trabaja en su rama, con commits pequeños que explican qué se hizo y por qué, y al terminar abre un Pull Request hacia `main`. La documentación detallada de cada módulo está en las secciones de abajo.

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
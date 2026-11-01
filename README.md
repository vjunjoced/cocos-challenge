# cocos-challenge-backend

API REST para el challenge de backend de Cocos: portfolio, búsqueda de activos y envío de órdenes al mercado (MARKET y LIMIT).

Stack: Node.js, NestJS, TypeScript (ESM), TypeORM con PostgreSQL y Vitest.

## Requisitos

| Herramienta | Versión | Para qué se usa |
|---|---|---|
| Git | cualquiera reciente | Clonar el repositorio |
| Node.js | 24.x | Entorno de ejecución |
| pnpm | 12.x | Gestor de paquetes (el repositorio usa `pnpm-lock.yaml`) |

## Instalación

```bash
git clone https://github.com/vjunjoced/cocos-challenge.git
cd cocos-challenge
pnpm install
```

## Ejecución

```bash
# desarrollo (con recarga automática)
pnpm run start:dev

# compilar y correr en modo producción
pnpm run build
pnpm run start:prod
```

## Tests

```bash
# tests unitarios
pnpm run test

# tests e2e
pnpm run test:e2e

# cobertura
pnpm run test:cov
```

## Calidad de código

```bash
pnpm run lint
pnpm run format
```

## Probar la API

Para probar la API se necesita una `.env` con una `DATABASE_URI` real (se parte de `.env.example`), el servidor levantado con `pnpm run start:dev` y la colección de Postman [postman/cocos-challenge.postman_collection.json](postman/cocos-challenge.postman_collection.json) importada. El detalle de cada endpoint está en [docs/API.md](docs/API.md).

Los requests de ejemplo usan el usuario 1 de la base provista.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servidor y su uptime |
| GET | `/portfolio/:userId` | Valor total de la cuenta, pesos disponibles y posiciones con su valor y su rendimiento, total y diario (404 si el usuario no existe) |
| POST | `/orders` | Envía una orden de compra o venta (MARKET o LIMIT). Se guarda siempre, también si es rechazada |
| POST | `/orders/cash` | Ingreso (`CASH_IN`) o egreso (`CASH_OUT`) de efectivo, para dar saldo a un usuario |
| GET | `/instruments?q=` | Busca instrumentos por ticker o nombre (sin distinguir mayúsculas, máximo 50 resultados) |

## Decisiones de diseño

### NestJS sobre Express

Se usa NestJS, que corre sobre Express, en lugar de Express a mano. Aporta la inyección de dependencias, que permite sustituir los repositorios por mocks en los tests; un pipe de validación global para los DTO; filtros de excepciones, que traducen los errores de negocio a códigos; y una estructura por módulos. Con Express habría que construir y mantener esas piezas. El costo es más código base (decoradores, módulos) y más dependencias para una API pequeña.

### Arquitectura en capas

Cada funcionalidad (portfolio, instrumentos, órdenes) es un módulo con controller y service, y el acceso a la base de datos está separado en una capa propia:
- **Controller:** recibe la petición y devuelve la respuesta.
- **Service:** contiene la lógica de negocio.
- **Repository:** concentra el acceso a la base de datos. La interfaz está en `src/core` y la implementación con TypeORM en `src/persistence`.

El service depende de la interfaz del repositorio, no de la implementación. Así, cambiar la forma de acceder a los datos no afecta al service y, en los tests, los repositorios se reemplazan por mocks.

### ESM y Vitest

Se usa ESM porque es el estándar de JavaScript y hacia donde va el ecosistema; implica escribir `.js` en los imports relativos. Vitest funciona de forma nativa con ESM y es más rápido que Jest.

### Configuración

- Toda la configuración es un único objeto tipado, validado al arrancar: si falta una variable obligatoria, la app no inicia. El resto del código nunca usa `process.env`.
- La base de datos se configura con una sola variable, `DATABASE_URI`.

### Base de datos

- **TypeORM con PostgreSQL**, en un módulo aparte porque es infraestructura.
- **`synchronize: false`:** arrancar la app no debe poder modificar las tablas. Los cambios de esquema no los hace la app: irían en scripts SQL versionados.
- **Pool de conexiones acotado:** reutiliza conexiones y evita saturar la base si llegan demasiadas peticiones. Mínimo 2, máximo 10, cierre de inactivas a los 30 s y espera máxima de 5 s. Todos los valores son opcionales y configurables.

### Cálculo del portfolio

- **Se calcula al consultar, a partir de `orders`:** solo cuentan las órdenes `FILLED`, recorridas en orden cronológico. Así las posiciones nunca quedan desincronizadas con las órdenes y no hace falta una tabla extra.
- **Rendimiento con costo promedio móvil:** cada compra suma cantidad y costo; cada venta resta cantidad y el costo proporcional al promedio de ese momento. El rendimiento compara el valor actual (último `close`) con el costo de lo que sigue en cartera.
- **Precisión decimal:** los montos viven en `numeric(10,2)`, que es exacto, y `pg` los entrega como string. La aritmética se hace con `decimal.js` en lugar de `number` para no acumular errores de punto flotante (`0.1 + 0.2`), y el redondeo a 2 decimales ocurre solo al devolver la respuesta.
- **Con mucho volumen**, recorrer todo el historial en cada consulta deja de ser razonable: la alternativa es guardar las posiciones en una tabla (ver "Mejoras").

### Errores de la API

Los errores de negocio responden solo con un código estable, por ejemplo `{ "error": "USER_NOT_FOUND" }`. El estado HTTP ya viaja en la respuesta y no se repite en el cuerpo. No se envía un mensaje de texto: el cliente traduce el código al idioma de su usuario.

Los errores de validación (400) indican qué campo falló y por qué regla, también con códigos:

```json
{ "error": "VALIDATION_FAILED", "details": [{ "field": "q", "code": "IS_NOT_EMPTY" }] }
```

### Envío de órdenes

El contrato de cada endpoint (campos, respuestas y errores) está en [docs/API.md](docs/API.md). A continuación se describen las decisiones.

- **MARKET** se ejecuta al último `close` y queda `FILLED`. **LIMIT** exige `price` y queda `NEW`. Enviar `price` en una MARKET responde 400: ignorarlo en silencio podría dar a entender que se aplicó un límite.
- **Rechazo:** si una compra no alcanza el saldo, o una venta no tiene acciones suficientes, la orden se guarda como `REJECTED` con el precio al que se habría ejecutado y la API responde 201. Un cuerpo mal formado responde 400 y no se guarda nada.
- **El saldo y la tenencia se calculan leyendo las órdenes:** el usuario no tiene un saldo guardado en ninguna tabla, así que para validar una orden se calcula el balance actual a partir de todas sus órdenes `FILLED`, con las mismas funciones que usa el portfolio para que ambos siempre coincidan. El costo es que cada orden lee el historial completo; con mucho volumen lo correcto sería guardar el saldo y las posiciones (ver "Cálculo del portfolio").
- **Cada orden se guarda en una transacción con bloqueo.** Como el saldo se deriva de las órdenes, dos órdenes simultáneas del mismo usuario leerían el mismo saldo, ambas pasarían la validación y el saldo quedaría negativo. Para evitarlo, la transacción bloquea la fila del usuario (`SELECT ... FOR UPDATE`): la segunda orden espera a que termine la primera y entonces lee el saldo ya actualizado. Los demás usuarios no se ven afectados.
- **Las órdenes `NEW` no reservan fondos:** el saldo se valida solo al enviarlas.
- **Efectivo:** `POST /orders/cash` registra la transferencia como una orden en el instrumento de moneda, con `type` MARKET, `price` 1 y estado `FILLED`. Un egreso mayor al saldo se guarda `REJECTED`. `amount` es un entero porque `size` es entero en la base.

### Alcance y supuestos

- **No hay autenticación**, siguiendo el enunciado del challenge: el `userId` viaja en la petición.
- **La base de datos no se modifica:** se trabaja con el esquema provisto.
- **Los ingresos y egresos de efectivo son en pesos argentinos (ARS) enteros, sin centavos.** En la tabla `orders`, la cantidad de cada orden (`size`) es un número entero, y los movimientos de efectivo guardan su monto en ese mismo campo. El saldo disponible, en cambio, sí puede tener centavos, porque las compras y ventas se calculan como cantidad por precio.

### Seguridad y rendimiento de la API

- **Helmet:** agrega cabeceras HTTP de seguridad y oculta que el servidor usa Express.
- **Compresión (gzip):** reduce el tamaño de las respuestas y el ancho de banda consumido.
- **Límite de peticiones por cliente:** por defecto 100 por minuto; el health check está excluido. Es configurable.
- **Validación estricta de entrada:** se rechaza cualquier campo o parámetro no declarado.

## Mejoras

### Tabla de posiciones (`positions`)

**Estado:** implementada en la rama `improvements`; `main` no la incluye.

Hoy el saldo y la tenencia se calculan leyendo todas las órdenes `FILLED` del usuario, tanto al consultar el portfolio como al validar cada orden. La mejora es guardarlos en una tabla `positions`, que se actualiza en la misma transacción en que se guarda la orden. Esto modifica el esquema, por lo que requiere un script SQL.

- **Una fila por usuario e instrumento**, con la cantidad, el costo de lo que sigue en cartera y la fecha de actualización. El efectivo es una fila más, y es la que se bloquea al crear una orden.
- **El valor de mercado no se guarda:** cambia con cada precio nuevo de `marketdata`, así que se sigue calculando al consultar.
- **Qué mejora:** validar una orden lee una o dos filas en lugar de todo el historial, y el portfolio deja de recorrer las órdenes.
- **Qué cuesta:** la tabla debe coincidir siempre con lo que resultaría de las órdenes, así que cada orden ejecutada tiene que actualizarla de forma atómica.

**Migración de usuarios existentes (no implementada):** quienes ya tienen órdenes no tienen filas en `positions` y aparecerían con saldo 0 y sin acciones. Antes de usar esta mejora con datos existentes haría falta un script que recorra el historial de `orders` de cada usuario y cargue sus posiciones en la tabla nueva, con las mismas reglas de cálculo.

### Alta de usuarios (`POST /users`)

**Estado:** implementada en la rama `improvements`; `main` no la incluye.

El endpoint crea el usuario junto con su fila de efectivo en cero, en una sola transacción, así que todo usuario nace con su saldo. Sin él, los usuarios solo pueden llegar a la base desde fuera de la API.

### Otras mejoras propuestas (no implementadas)

- **Idempotencia:** una clave por petición (por ejemplo, un encabezado `Idempotency-Key`) guardada junto a la orden, para que reenviar la misma petición devuelva la orden original en lugar de crear otra. Es distinto del bloqueo: el bloqueo evita el saldo negativo entre órdenes distintas; la idempotencia evita duplicar la misma. Requiere una columna o tabla nueva.
- **Cancelación de órdenes (`CANCELLED`):** solo las órdenes en estado `NEW`, que pasarían a `CANCELLED`.
- **Tiempo máximo de espera del bloqueo (`lock_timeout`, no configurado):** la transacción es corta, así que en condiciones normales la espera es de milisegundos. Pero si una transacción se quedara trabada, las siguientes órdenes del mismo usuario esperarían sin límite, y cada espera mantiene ocupada una conexión del pool. Para evitarlo hay que configurar en la base de datos el parámetro `lock_timeout` de PostgreSQL (por ejemplo, `ALTER ROLE <usuario> SET lock_timeout = '5s'`): pasado ese tiempo, la espera falla en lugar de prolongarse. Esta configuración es de la base y no forma parte del código entregado.

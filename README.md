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

La rama `improvements` necesita además la tabla `positions`, que se crea con [sql/001_create_positions.sql](sql/001_create_positions.sql). En la colección, el request **Crear usuario** guarda el id devuelto en la variable `userId` y el resto de los requests la usan: se empieza por ese y luego se agrega saldo con **Agregar saldo (CASH_IN)**.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servidor y su uptime |
| POST | `/users` | Crea un usuario y su fila de efectivo en cero |
| GET | `/portfolio/:userId` | Valor total de la cuenta, pesos disponibles y posiciones con su valor y su rendimiento, total y diario (404 si el usuario no existe) |
| POST | `/orders` | Envía una orden de compra o venta (MARKET o LIMIT). Se guarda siempre, también si es rechazada |
| POST | `/orders/cash` | Ingreso (`CASH_IN`) o egreso (`CASH_OUT`) de efectivo, para dar saldo a un usuario |
| GET | `/instruments?q=` | Busca instrumentos por ticker o nombre (sin distinguir mayúsculas, máximo 50 resultados) |

## Decisiones de diseño

### NestJS sobre Express

Se usa NestJS, que corre sobre Express, en lugar de Express a mano. Aporta la inyección de dependencias, que permite sustituir los repositorios por mocks en los tests; un pipe de validación global para los DTO; filtros de excepciones, que traducen los errores de negocio a códigos; y una estructura por módulos. Con Express habría que construir y mantener esas piezas. El costo es más código base (decoradores, módulos) y más dependencias para una API pequeña.

### Arquitectura en capas

Cada funcionalidad (portfolio, instrumentos, órdenes, usuarios) es un módulo con controller y service, y el acceso a la base de datos está separado en una capa propia:
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
- **`synchronize: false`:** arrancar la app no debe poder modificar las tablas. Los cambios de esquema no los hace la app: van en scripts SQL versionados en [sql/](sql/).
- **Pool de conexiones acotado:** reutiliza conexiones y evita saturar la base si llegan demasiadas peticiones. Mínimo 2, máximo 10, cierre de inactivas a los 30 s y espera máxima de 5 s. Todos los valores son opcionales y configurables.

### Cálculo del portfolio

- **Se lee de la tabla `positions`:** el efectivo es su fila de moneda y el resto son las tenencias; el valor de mercado y los retornos se calculan con el último precio de `marketdata`. Ver "Mejoras".
- **Rendimiento con costo promedio móvil:** cada compra suma cantidad y costo; cada venta resta cantidad y el costo proporcional al promedio de ese momento (se actualiza al ejecutarse la orden). El rendimiento compara el valor actual (último `close`) con el costo de lo que sigue en cartera.
- **Precisión decimal:** los montos viven en `numeric(10,2)`, que es exacto, y `pg` los entrega como string. La aritmética se hace con `decimal.js` en lugar de `number` para no acumular errores de punto flotante (`0.1 + 0.2`), y el redondeo a 2 decimales ocurre solo al devolver la respuesta.
- **Versión base:** en `main` no existe la tabla de posiciones; el portfolio y la validación de órdenes derivan todo recorriendo las órdenes `FILLED`. La rama `improvements` lo reemplaza por `positions`.

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
- **El saldo y la tenencia se leen de `positions`:** para validar una orden se leen el efectivo (en una compra) o el activo (en una venta). No se recorre el historial de órdenes.
- **Cada orden se guarda en una transacción con bloqueo.** Dos órdenes simultáneas del mismo usuario leerían el mismo saldo, ambas pasarían la validación y el saldo quedaría negativo. Para evitarlo, la transacción bloquea la fila del efectivo (`SELECT ... FOR UPDATE`): la segunda orden espera a que termine la primera y entonces lee el saldo ya actualizado. Los demás usuarios no se ven afectados. La orden y las dos filas modificadas se confirman juntas, o no se confirma ninguna.
- **El saldo se calcula en el código, no con un `UPDATE` atómico.** Con la fila del efectivo bloqueada, nadie puede modificarla entre que se lee y se guarda, así que el nuevo saldo y la nueva tenencia se calculan con funciones puras y se guarda el resultado. De este modo las reglas (costo promedio, rechazo de órdenes) quedan en el código, con tests, y no en SQL. Si algo falla se deshace todo: no se guarda la orden ni cambia ningún saldo.
- **Las órdenes `NEW` no reservan fondos:** el saldo se valida solo al enviarlas.
- **Efectivo:** `POST /orders/cash` registra la transferencia como una orden en el instrumento de moneda, con `type` MARKET, `price` 1 y estado `FILLED`. Un egreso mayor al saldo se guarda `REJECTED`. `amount` es un entero porque `size` es entero en la base.

### Alcance y supuestos

- **No hay autenticación**, siguiendo el enunciado del challenge: el `userId` viaja en la petición.
- **La base de datos:** se trabaja con el esquema provisto y solo se agrega la tabla `positions`, que se crea con un script SQL.
- **Los ingresos y egresos de efectivo son en pesos argentinos (ARS) enteros, sin centavos.** En la tabla `orders`, la cantidad de cada orden (`size`) es un número entero, y los movimientos de efectivo guardan su monto en ese mismo campo. El saldo disponible, en cambio, sí puede tener centavos, porque las compras y ventas se calculan como cantidad por precio.

### Seguridad y rendimiento de la API

- **Helmet:** agrega cabeceras HTTP de seguridad y oculta que el servidor usa Express.
- **Compresión (gzip):** reduce el tamaño de las respuestas y el ancho de banda consumido.
- **Límite de peticiones por cliente:** por defecto 100 por minuto; el health check está excluido. Es configurable.
- **Validación estricta de entrada:** se rechaza cualquier campo o parámetro no declarado.

## Mejoras

### Tabla de posiciones (`positions`)

**Estado:** implementada en la rama `improvements`; `main` no la incluye.

En la versión base el saldo y la tenencia se calculan leyendo todas las órdenes `FILLED` del usuario, tanto al consultar el portfolio como al validar cada orden. En `improvements` se guardan en una tabla `positions`, que se actualiza en la misma transacción en que se guarda la orden. Esto modifica el esquema: el script está en [sql/001_create_positions.sql](sql/001_create_positions.sql).

- **Una fila por usuario e instrumento**, con la cantidad, el costo de lo que sigue en cartera y la fecha de actualización. El costo promedio no se guarda: se calcula como `costo / cantidad`.
- **El costo lleva 6 decimales y la cantidad 2.** El saldo siempre cabe en centavos (un precio de 2 decimales por una cantidad entera), pero el costo cambia con una división en cada venta (`costo × size / cantidad`) que puede no terminar: vender 1 de 3 acciones con costo 1.000 deja 666,666… Con 2 decimales ese redondeo se repetiría en cada venta y el error se acumularía. En una simulación de 200 secuencias de 200 operaciones, el error máximo fue de unos 6 centavos con 2 decimales y de menos de una millonésima con 6.
- **`quantity` es `NUMERIC(18,2)`** porque en la fila del efectivo guarda el saldo, que puede tener centavos: aunque los ingresos y egresos sean enteros, las compras y ventas suman y restan `size × price` (3 acciones a 925,85 dejan 7.222,45). Las acciones siempre son enteras: su cantidad sale de `orders.size`, que es entero en la base y se valida como entero en la API, así que no pueden entrar fracciones.
- **El efectivo es una fila más**, del instrumento de moneda, con los pesos disponibles como cantidad. Esa fila nunca se elimina y es la que se bloquea (`SELECT ... FOR UPDATE`) al crear una orden: es el saldo.
- **Ciclo de vida de las filas:** la primera compra de un activo crea la fila, y cuando la cantidad llega a 0 la fila se elimina. Cada orden ejecutada modifica a la vez la fila del instrumento y la del efectivo, dentro de la misma transacción.
- **El valor de mercado no se guarda:** cambia con cada precio nuevo de `marketdata`, así que se sigue calculando al consultar.
- **Qué mejora:** validar una orden lee una o dos filas en lugar de todo el historial, y el portfolio deja de recorrer las órdenes.
- **Qué cuesta:** la tabla debe coincidir siempre con lo que resultaría de las órdenes, así que cada orden ejecutada tiene que actualizarla de forma atómica. Un test reproduce una secuencia completa de movimientos y comprueba el efectivo y la tenencia resultantes.

**Migración de usuarios existentes (no implementada):** quienes ya tienen órdenes no tienen filas en `positions` y aparecerían con saldo 0 y sin acciones. Antes de usar esta mejora con datos existentes haría falta un script que recorra el historial de `orders` de cada usuario y cargue sus posiciones en la tabla nueva, con las mismas reglas de cálculo.

### Alta de usuarios (`POST /users`)

**Estado:** implementada en la rama `improvements`; `main` no la incluye.

El endpoint crea el usuario junto con su fila de efectivo en cero, en una sola transacción, así que todo usuario nace con su saldo. Sin él, los usuarios solo podrían llegar a la base desde fuera de la API. Si un usuario anterior a esta mejora no tiene la fila de efectivo, se crea la primera vez que opera (solo si no existe).

Queda pendiente responder 409 si el email o el número de cuenta ya existen, en lugar de dejar pasar el error de la base.

### Otras mejoras propuestas (no implementadas)

- **Idempotencia:** una clave por petición (por ejemplo, un encabezado `Idempotency-Key`) guardada junto a la orden, para que reenviar la misma petición devuelva la orden original en lugar de crear otra. Es distinto del bloqueo: el bloqueo evita el saldo negativo entre órdenes distintas; la idempotencia evita duplicar la misma. Requiere una columna o tabla nueva.
- **Cancelación de órdenes (`CANCELLED`):** solo las órdenes en estado `NEW`, que pasarían a `CANCELLED`.
- **Tiempo máximo de espera del bloqueo (`lock_timeout`, no configurado):** la transacción es corta, así que en condiciones normales la espera es de milisegundos. Pero si una transacción se quedara trabada, las siguientes órdenes del mismo usuario esperarían sin límite, y cada espera mantiene ocupada una conexión del pool. Para evitarlo hay que configurar en la base de datos el parámetro `lock_timeout` de PostgreSQL (por ejemplo, `ALTER ROLE <usuario> SET lock_timeout = '5s'`): pasado ese tiempo, la espera falla en lugar de prolongarse. Esta configuración es de la base y no forma parte del código entregado.

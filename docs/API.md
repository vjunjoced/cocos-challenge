# API

Referencia de los endpoints. Las decisiones de diseño y sus motivos están en el [README](../README.md); una colección lista para usar está en [postman/](../postman/cocos-challenge.postman_collection.json).

| Método | Ruta | Descripción |
|---|---|---|
| GET | [`/health`](#get-health) | Estado del servidor |
| POST | [`/users`](#post-users) | Crea un usuario y su fila de efectivo |
| GET | [`/instruments`](#get-instruments) | Busca instrumentos por ticker o nombre |
| GET | [`/portfolio/:userId`](#get-portfoliouserid) | Cuenta del usuario y sus posiciones |
| POST | [`/orders`](#post-orders) | Envía una orden de compra o venta |
| POST | [`/orders/cash`](#post-orderscash) | Ingresa o retira efectivo |

## Convenciones

- **Formato:** JSON. Los montos son números con hasta 2 decimales.
- **Errores de negocio:** el cuerpo trae solo un código estable. El estado HTTP no se repite en el cuerpo y no se envía un mensaje de texto: el cliente traduce el código.

  ```json
  { "error": "USER_NOT_FOUND" }
  ```

- **Errores de validación (`400`):** indican qué campo falló y por qué regla.

  ```json
  { "error": "VALIDATION_FAILED", "details": [{ "field": "q", "code": "IS_NOT_EMPTY" }] }
  ```

  Un campo no declarado se rechaza con el código `NOT_ALLOWED`.
- **Límite de peticiones:** 100 por minuto y por cliente (configurable). Al superarlo se responde `429`. `/health` está excluido.

### Códigos de error

| Código | Estado | Cuándo |
|---|---|---|
| `VALIDATION_FAILED` | 400 | El cuerpo, los parámetros o la query no cumplen las reglas. Trae `details` |
| `NOT_TRADABLE` | 400 | Se intenta operar el instrumento de efectivo (viene dentro de `details`) |
| `USER_NOT_FOUND` | 404 | El usuario no existe |
| `INSTRUMENT_NOT_FOUND` | 404 | El instrumento no existe |
| `PRICE_NOT_FOUND` | 404 | Orden `MARKET` de un instrumento sin precio de mercado |

## GET /health

**Respuesta `200`**

```json
{ "status": "ok", "uptime": 1234 }
```

`uptime` está en segundos.

## GET /instruments

Busca por ticker o nombre, sin distinguir mayúsculas. Devuelve como máximo 50 resultados.

| Query | Obligatorio | Descripción |
|---|---|---|
| `q` | sí | Texto a buscar, no vacío, máximo 50 caracteres |

**Respuesta `200`**

```json
[ { "id": 47, "ticker": "PAMP", "name": "Pampa Holding", "type": "ACCIONES" } ]
```

**Errores:** `400 VALIDATION_FAILED` (falta `q` o hay parámetros desconocidos).

## GET /portfolio/:userId

Valor total de la cuenta, pesos disponibles y posiciones.

| Parámetro | Descripción |
|---|---|
| `userId` | Entero ≥ 1 |

**Respuesta `200`**

```json
{
  "totalValue": 910900,
  "availableCash": 707100,
  "positions": [
    {
      "instrumentId": 47,
      "ticker": "PAMP",
      "name": "Pampa Holding",
      "quantity": 40,
      "marketValue": 38000,
      "totalReturnPercentage": 2.15,
      "dailyReturnPercentage": 1.06
    }
  ]
}
```

| Campo | Descripción |
|---|---|
| `totalValue` | Pesos disponibles más el valor de mercado de las posiciones |
| `availableCash` | Pesos disponibles |
| `quantity` | Acciones que tiene hoy |
| `marketValue` | `quantity` por el último `close` |
| `totalReturnPercentage` | Rendimiento desde la compra, contra el costo promedio móvil |
| `dailyReturnPercentage` | Cambio del precio entre `previousClose` y `close` |

Un usuario sin movimientos devuelve `0`, `0` y `positions` vacío. Las posiciones vienen ordenadas por ticker.

**Errores:** `404 USER_NOT_FOUND`, `400 VALIDATION_FAILED` (id inválido).

## POST /users

Crea un usuario y su fila de efectivo en cero, en una sola transacción.

**Cuerpo**

| Campo | Obligatorio | Valores | Descripción |
|---|---|---|---|
| `email` | sí | email válido, máximo 255 caracteres | Correo del usuario |
| `accountNumber` | sí | texto no vacío, máximo 255 caracteres | Número de cuenta |

El `id` no se envía: lo asigna la base. Cualquier campo no declarado se rechaza con `NOT_ALLOWED`.

```json
{ "email": "nuevo@cocos.com", "accountNumber": "20001" }
```

**Respuesta `201`**

```json
{ "id": 5, "email": "nuevo@cocos.com", "accountNumber": "20001" }
```

**Errores:** `400 VALIDATION_FAILED`.

## POST /orders

Envía una orden de compra o venta. La orden siempre se guarda, también si es rechazada.

**Cuerpo**

| Campo | Obligatorio | Valores | Descripción |
|---|---|---|---|
| `userId` | sí | entero ≥ 1 | Usuario que envía la orden |
| `instrumentId` | sí | entero ≥ 1 | Activo que se compra o vende |
| `side` | sí | `BUY` o `SELL` | Compra o venta |
| `type` | sí | `MARKET` o `LIMIT` | A precio de mercado o a un precio límite |
| `size` | uno de los dos | entero ≥ 1 | Cantidad exacta de acciones |
| `amount` | uno de los dos | número > 0, máximo 2 decimales | Monto en pesos a invertir |
| `price` | solo en `LIMIT` | número > 0, máximo 2 decimales | Precio al que se quiere ejecutar. No se acepta en `MARKET` |

Hay que enviar `size` **o** `amount`, nunca los dos ni ninguno. Con `size` se indica cuántas acciones; con `amount`, cuánta plata, y se compra el máximo de acciones enteras que alcanza, sin fracciones.

```json
{ "userId": 1, "instrumentId": 47, "side": "BUY", "type": "MARKET", "amount": 5000 }
```

**Respuesta `201`**

```json
{
  "id": 24,
  "userId": 1,
  "instrumentId": 47,
  "side": "BUY",
  "type": "MARKET",
  "size": 5,
  "price": 925.85,
  "status": "FILLED",
  "datetime": "2026-11-01T17:59:23.656Z"
}
```

**Estado de la orden**

| `status` | Cuándo |
|---|---|
| `FILLED` | `MARKET` con saldo (compra) o acciones (venta) suficientes. Se ejecuta al último `close` |
| `NEW` | `LIMIT` con saldo o acciones suficientes. Queda al precio enviado |
| `REJECTED` | No alcanza el saldo (compra) ni las acciones (venta), o el monto no llega a una acción. Se guarda con el precio al que se habría ejecutado y también responde `201` |

**Errores:** `400 VALIDATION_FAILED`, `404 USER_NOT_FOUND`, `404 INSTRUMENT_NOT_FOUND`, `404 PRICE_NOT_FOUND`, `400` con `NOT_TRADABLE` en `details`.

## POST /orders/cash

Ingreso (`CASH_IN`) o egreso (`CASH_OUT`) de efectivo. Sirve para dar saldo a un usuario. Se guarda como una orden del instrumento de moneda, con `type` `MARKET` y `price` 1.

**Cuerpo**

| Campo | Obligatorio | Valores | Descripción |
|---|---|---|---|
| `userId` | sí | entero ≥ 1 | Usuario |
| `side` | sí | `CASH_IN` o `CASH_OUT` | Ingreso o egreso |
| `amount` | sí | entero ≥ 1 | Pesos, sin decimales |

```json
{ "userId": 1, "side": "CASH_IN", "amount": 100000 }
```

**Respuesta `201`:** la orden guardada, con el mismo formato que `POST /orders`. Un egreso mayor al saldo se guarda `REJECTED`.

Si el usuario es anterior a la tabla de posiciones y no tiene fila de efectivo, se crea al operar.

**Errores:** `400 VALIDATION_FAILED`, `404 USER_NOT_FOUND`.

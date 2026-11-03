-- Mejora: tabla de posiciones.
-- Una fila por usuario e instrumento. El efectivo es el instrumento de tipo
-- MONEDA: su `quantity` son los pesos disponibles (con centavos) y su `cost`
-- es 0. Las filas de acciones se eliminan al llegar a cantidad 0; la del
-- efectivo nunca se elimina.
-- `cost` es el costo de lo que sigue en cartera (costo promedio móvil); el
-- costo promedio no se guarda, se calcula como cost / quantity. Lleva 6
-- decimales para que el redondeo de cada venta no se acumule.
-- Los nombres van en minúsculas, igual que el resto de las tablas.

CREATE TABLE IF NOT EXISTS positions (
  userid       INTEGER       NOT NULL REFERENCES users (id),
  instrumentid INTEGER       NOT NULL REFERENCES instruments (id),
  quantity     NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  cost         NUMERIC(18,6) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  updatedat    TIMESTAMP     NOT NULL DEFAULT now(),
  PRIMARY KEY (userid, instrumentid)
);

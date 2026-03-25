import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  Catalogo,
  Despacho,
  DisponibilidadZona,
  ItemPedido,
  NotaCredito,
  Pedido,
  Producto,
  Promocion,
} from '../libs/logistica/src/repositories/entities';
import {
  ItemInventario,
  RegistroCompraProductoTienda,
  RegistroVentaProductoTienda,
} from '../libs/inventario/src/repositories/entities';
import {
  ItemVenta,
  ProductoExterno,
  Venta,
} from '../libs/ventas/src/repositories/entities';
import { DatabaseModule } from '../libs/shared/database/src';

const CONNECTION_RETRY_DELAY_MS = parseInt(
  process.env.DB_CONNECT_RETRY_DELAY_MS || '2000',
  10,
);
const CONNECTION_RETRY_ATTEMPTS = parseInt(
  process.env.DB_CONNECT_RETRIES || '15',
  10,
);

process.env.DB_HOST ??= '127.0.0.1';
process.env.DB_PORT ??= '5432';
process.env.DB_USERNAME ??= 'postgres';
process.env.DB_PASSWORD ??= 'postgres';
process.env.DB_NAME ??= 'chiper';

const SEED_ENTITIES = [
  Catalogo,
  Despacho,
  DisponibilidadZona,
  ItemInventario,
  ItemPedido,
  ItemVenta,
  NotaCredito,
  Pedido,
  Producto,
  ProductoExterno,
  Promocion,
  RegistroCompraProductoTienda,
  RegistroVentaProductoTienda,
  Venta,
];

@Module({
  imports: [DatabaseModule.forRoot(SEED_ENTITIES, { enableSeeder: true })],
})
class SeedDatabaseModule {}

async function bootstrapSeedContext() {
  return NestFactory.createApplicationContext(SeedDatabaseModule, {
    logger: ['log', 'warn', 'error'],
  });
}

function isRetryableConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as {
    code?: string;
    message?: string;
    cause?: unknown;
  };

  if (
    maybeError.code &&
    [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'EHOSTUNREACH',
      'ECONNRESET',
    ].includes(maybeError.code)
  ) {
    return true;
  }

  if (
    typeof maybeError.message === 'string' &&
    /connect |Connection terminated unexpectedly|database system is starting up/i.test(
      maybeError.message,
    )
  ) {
    return true;
  }

  return isRetryableConnectionError(maybeError.cause);
}

async function seedDatabase() {
  let lastError: unknown;

  for (let attempt = 1; attempt <= CONNECTION_RETRY_ATTEMPTS; attempt += 1) {
    let app:
      | Awaited<ReturnType<typeof NestFactory.createApplicationContext>>
      | undefined;

    try {
      app = await bootstrapSeedContext();
      await app.close();
      return;
    } catch (error) {
      lastError = error;

      if (app) {
        await app.close().catch(() => undefined);
      }

      if (
        attempt === CONNECTION_RETRY_ATTEMPTS ||
        !isRetryableConnectionError(error)
      ) {
        break;
      }

      console.log(
        `Waiting for Postgres (${attempt}/${CONNECTION_RETRY_ATTEMPTS}) at ${process.env.DB_HOST}:${process.env.DB_PORT}...`,
      );
      await new Promise((resolve) =>
        setTimeout(resolve, CONNECTION_RETRY_DELAY_MS),
      );
    }
  }

  throw lastError;
}

void seedDatabase().catch((error) => {
  console.error('Failed to seed database:', error);
  console.error(
    'Ensure Postgres is running with `docker compose up -d postgres` and reachable with the configured DB_* environment variables.',
  );
  process.exit(1);
});

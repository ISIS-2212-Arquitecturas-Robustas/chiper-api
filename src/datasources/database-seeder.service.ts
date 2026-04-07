/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

interface LoadSeedCounts {
  // Logística
  productos: number;
  catalogos: number;
  catalogos_productos: number;
  promociones: number;
  pedidos: number;
  items_pedido: number;
  despachos: number;
  disponibilidad_zona: number;
  notas_credito: number;
  // Inventario
  items_inventario: number;
  registros_compra_producto_tienda: number;
  registros_venta_producto_tienda: number;
  // Ventas
  productos_externos: number;
  ventas: number;
  items_venta: number;
}

interface LoadSeedConfig {
  load: LoadSeedCounts;
}

type SeedValue = string | number | null;

interface BatchInsertConfig {
  tableName: string;
  columns: string[];
  rows: SeedValue[][];
  includeTimestamps?: boolean;
  batchSize?: number;
}

/** Sentinel: recognised by batchInsert as a raw SQL expression (not quoted). */
const NOW = 'NOW()';

@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);
  private seeded = false;

  constructor(
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    if (!this.seeded) {
      const mode = process.env.SEED_MODE ?? 'default';
      if (mode === 'load') {
        await this.seedForLoad();
      } else {
        await this.seedFromSql();
      }
      this.seeded = true;
    }
  }

  // ---------------------------------------------------------------
  // Guard: skip if data already exists
  // ---------------------------------------------------------------
  private async isAlreadySeeded(): Promise<boolean> {
    const result: { count: string }[] = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM items_inventario',
    );
    return parseInt(result[0].count, 10) > 0;
  }

  // ---------------------------------------------------------------
  // Default mode – execute src/datasources/seed.sql
  // ---------------------------------------------------------------
  private async seedFromSql(): Promise<void> {
    try {
      if (await this.isAlreadySeeded()) {
        this.logger.log('Database already contains data. Skipping seed.');
        return;
      }

      this.logger.log('Starting database seeding from seed.sql…');

      const sqlPath = path.join(__dirname, 'seed.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');

      // Split on ';', drop empty lines and comment-only segments
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (const stmt of statements) {
        await this.dataSource.query(stmt);
      }

      this.logger.log('✅ Database seeding from seed.sql completed');
    } catch (error) {
      this.logger.error('❌ Error seeding from seed.sql:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------
  // Load mode – generate synthetic rows from load-seed.yaml
  // # Default (e2e-safe) seeding — unchanged behaviour
  /* npm run start
    # Load test seeding
    SEED_MODE=load npm run start
    # Adjust volume before load test
    vim src/datasources/load-seed.yaml */
  // ---------------------------------------------------------------
  private async seedForLoad(): Promise<void> {
    try {
      if (await this.isAlreadySeeded()) {
        this.logger.log('Database already contains data. Skipping load seed.');
        return;
      }

      const yamlPath = path.join(__dirname, 'load-seed.yaml');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const config = yaml.load(
        fs.readFileSync(yamlPath, 'utf8'),
      ) as LoadSeedConfig;
      const counts = config.load;

      this.logger.log(`Starting load seed – counts: ${JSON.stringify(counts)}`);

      // Reference UUIDs that mirror the docker-compose defaults
      const MONEDA_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
      const MONEDA_ID_INV = '550e8400-e29b-41d4-a716-446655440000';
      const TIENDAS = [
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc',
      ];
      const CATEGORIAS = ['Categoria 1', 'Categoria 2', 'Categoria 3'];
      const MARCAS = ['Marca A', 'Marca B', 'Marca C', 'Marca D'];
      const ESTADOS_PEDIDO = [
        'creado',
        'aprobado',
        'enAlistamiento',
        'alistado',
        'despachado',
        'entregado',
      ];
      const MOTIVOS_NC = [
        'productoVencido',
        'productoEquivocado',
        'danoEnTransporte',
      ];

      // ── 1. productos ──────────────────────────────────────────
      const productoIds = this.uuids(counts.productos);
      await this.batchInsert({
        tableName: 'productos',
        columns: [
          'id',
          '"codigoInterno"',
          '"codigoBarras"',
          'nombre',
          'marca',
          'categoria',
          'presentacion',
          '"precioBase"',
          '"monedaId"',
        ],
        rows: productoIds.map((id, i) => [
          id,
          `LOAD-${String(i + 1).padStart(5, '0')}`,
          `${7000000000000 + i}`,
          `Producto Load ${i + 1}`,
          MARCAS[i % MARCAS.length],
          CATEGORIAS[i % CATEGORIAS.length],
          `Presentacion ${(i % 3) + 1}`,
          (10 + (i % 90)).toFixed(2),
          MONEDA_ID,
        ]),
      });

      // ── 2. catalogos ──────────────────────────────────────────
      const catalogoIds = this.uuids(counts.catalogos);
      await this.batchInsert({
        tableName: 'catalogos',
        columns: [
          'id',
          '"tiendaId"',
          '"vigenciaDesde"',
          '"vigenciaHasta"',
          'zona',
        ],
        rows: catalogoIds.map((id, i) => [
          id,
          TIENDAS[i % TIENDAS.length],
          '2026-01-01 00:00:00',
          '2026-12-31 23:59:59',
          `Zona Load ${i + 1}`,
        ]),
      });

      // ── 3. catalogos_productos_productos (junction) ───────────
      const junctionCount = Math.min(
        counts.catalogos_productos,
        catalogoIds.length * productoIds.length,
      );
      await this.batchInsert({
        tableName: '"catalogos_productos_productos"',
        columns: ['"catalogosId"', '"productosId"'],
        rows: this.buildCatalogoProductoRows(
          catalogoIds,
          productoIds,
          junctionCount,
        ),
        includeTimestamps: false,
      });

      // ── 4. promociones ────────────────────────────────────────
      await this.batchInsert({
        tableName: 'promociones',
        columns: [
          'id',
          'nombre',
          '"precioPromocional"',
          '"monedaId"',
          '"productoId"',
          '"tiendaIds"',
          'inicio',
          'fin',
          'restricciones',
        ],
        rows: this.uuids(counts.promociones).map((id, i) => [
          id,
          `Promo Load ${i + 1}`,
          (5 + (i % 40)).toFixed(2),
          MONEDA_ID,
          productoIds[i % productoIds.length],
          JSON.stringify([TIENDAS[i % TIENDAS.length]]),
          '2026-03-01 00:00:00',
          '2026-06-30 23:59:59',
          (i % 200) + 1,
        ]),
      });

      // ── 5. pedidos ────────────────────────────────────────────
      const pedidoIds = this.uuids(counts.pedidos);
      await this.batchInsert({
        tableName: 'pedidos',
        columns: [
          'id',
          'identificador',
          '"tiendaId"',
          '"fechaHoraCreacion"',
          '"montoTotal"',
          '"monedaId"',
          'estado',
        ],
        rows: pedidoIds.map((id, i) => [
          id,
          `PED-LOAD-${String(i + 1).padStart(5, '0')}`,
          TIENDAS[i % TIENDAS.length],
          this.daysAgo(counts.pedidos - i),
          (20 + (i % 200)).toFixed(2),
          MONEDA_ID,
          ESTADOS_PEDIDO[i % ESTADOS_PEDIDO.length],
        ]),
      });

      // ── 6. items_pedido ───────────────────────────────────────
      await this.batchInsert({
        tableName: 'items_pedido',
        columns: [
          'id',
          '"pedidoId"',
          '"productoId"',
          'cantidad',
          '"precioUnitario"',
          'descuento',
          '"monedaId"',
          'lote',
          '"fechaVencimiento"',
        ],
        rows: this.uuids(counts.items_pedido).map((id, i) => [
          id,
          pedidoIds[i % pedidoIds.length],
          productoIds[i % productoIds.length],
          (i % 10) + 1,
          (10 + (i % 90)).toFixed(2),
          '0.00',
          MONEDA_ID,
          `LOTE-LOAD-${i + 1}`,
          '2027-12-31',
        ]),
      });

      // ── 7. despachos ──────────────────────────────────────────
      await this.batchInsert({
        tableName: 'despachos',
        columns: [
          'id',
          '"pedidoId"',
          'bodega',
          '"horaSalida"',
          '"ventanaPrometidaInicio"',
          '"ventanaPrometidaFin"',
        ],
        rows: this.uuids(counts.despachos).map((id, i) => [
          id,
          pedidoIds[i % pedidoIds.length],
          `Bodega Load ${(i % 5) + 1}`,
          '2026-03-05 08:00:00',
          '2026-03-05 10:00:00',
          '2026-03-05 18:00:00',
        ]),
      });

      // ── 8. disponibilidad_zona ────────────────────────────────
      await this.batchInsert({
        tableName: 'disponibilidad_zona',
        columns: [
          'id',
          '"catalogoId"',
          '"productoId"',
          '"cantidadDisponible"',
          '"ultimaActualizacion"',
        ],
        rows: this.uuids(counts.disponibilidad_zona).map((id, i) => [
          id,
          catalogoIds[i % catalogoIds.length],
          productoIds[i % productoIds.length],
          (i % 500) + 1,
          NOW, // raw SQL sentinel → rendered as NOW()
        ]),
      });

      // ── 9. notas_credito ──────────────────────────────────────
      await this.batchInsert({
        tableName: 'notas_credito',
        columns: [
          'id',
          '"pedidoId"',
          '"numeroDocumento"',
          'fecha',
          'motivo',
          'monto',
          '"monedaId"',
          'evidencia',
        ],
        rows: this.uuids(counts.notas_credito).map((id, i) => [
          id,
          pedidoIds[i % pedidoIds.length],
          `NC-LOAD-${String(i + 1).padStart(4, '0')}`,
          '2026-03-01',
          MOTIVOS_NC[i % MOTIVOS_NC.length],
          (1 + (i % 50)).toFixed(2),
          MONEDA_ID,
          `Evidencia load test ${i + 1}`,
        ]),
      });

      // ── 10. items_inventario ──────────────────────────────────
      const itemInvIds = this.uuids(counts.items_inventario);
      await this.batchInsert({
        tableName: 'items_inventario',
        columns: [
          'id',
          '"productoId"',
          '"tiendaId"',
          'cantidad',
          '"precioVenta"',
          '"monedaId"',
        ],
        rows: itemInvIds.map((id, i) => [
          id,
          productoIds[i % productoIds.length],
          TIENDAS[i % TIENDAS.length],
          (i % 500) + 1,
          (5 + (i % 95)).toFixed(2),
          MONEDA_ID_INV,
        ]),
      });

      // ── 11. registros_compra ──────────────────────────────────
      await this.batchInsert({
        tableName: 'registros_compra_producto_tienda',
        columns: [
          'id',
          '"tiendaId"',
          '"productoId"',
          '"compraId"',
          '"itemInventarioId"',
          '"fechaCompra"',
          'cantidad',
        ],
        rows: this.uuids(counts.registros_compra_producto_tienda).map(
          (id, i) => [
            id,
            TIENDAS[i % TIENDAS.length],
            productoIds[i % productoIds.length],
            uuidv4(),
            itemInvIds[i % itemInvIds.length],
            this.hoursAgo(counts.registros_compra_producto_tienda - i),
            (i % 100) + 1,
          ],
        ),
      });

      // ── 12. registros_venta ───────────────────────────────────
      await this.batchInsert({
        tableName: 'registros_venta_producto_tienda',
        columns: [
          'id',
          '"tiendaId"',
          '"productoId"',
          '"ventaId"',
          '"itemInventarioId"',
          '"fechaVenta"',
          'cantidad',
        ],
        rows: this.uuids(counts.registros_venta_producto_tienda).map(
          (id, i) => [
            id,
            TIENDAS[i % TIENDAS.length],
            productoIds[i % productoIds.length],
            uuidv4(),
            itemInvIds[i % itemInvIds.length],
            this.hoursAgo(counts.registros_venta_producto_tienda - i),
            (i % 50) + 1,
          ],
        ),
      });

      // ── 13. productos_externos ────────────────────────────────
      const prodExternoIds = this.uuids(counts.productos_externos);
      await this.batchInsert({
        tableName: 'productos_externos',
        columns: [
          'id',
          '"tiendaId"',
          '"codigoBarras"',
          'nombre',
          'categoria',
          '"precioBase"',
          '"monedaId"',
          'cantidad',
        ],
        rows: prodExternoIds.map((id, i) => [
          id,
          TIENDAS[i % TIENDAS.length],
          `EXT-${8000000000000 + i}`,
          `Producto Externo Load ${i + 1}`,
          CATEGORIAS[i % CATEGORIAS.length],
          (8 + (i % 50)).toFixed(2),
          MONEDA_ID_INV,
          (i % 100) + 1,
        ]),
      });

      // ── 14. ventas ────────────────────────────────────────────
      const ventaIds = this.uuids(counts.ventas);
      await this.batchInsert({
        tableName: 'ventas',
        columns: ['id', '"tiendaId"', '"fechaHora"', 'total', '"monedaId"'],
        rows: ventaIds.map((id, i) => [
          id,
          TIENDAS[i % TIENDAS.length],
          this.hoursAgo(counts.ventas - i),
          (10 + (i % 300)).toFixed(2),
          MONEDA_ID_INV,
        ]),
      });

      // ── 15. items_venta ───────────────────────────────────────
      await this.batchInsert({
        tableName: 'items_venta',
        columns: [
          'id',
          '"ventaId"',
          '"productoExternoId"',
          '"productoId"',
          'cantidad',
          '"precioUnitario"',
          '"monedaId"',
        ],
        rows: this.uuids(counts.items_venta).map((id, i) => [
          id,
          ventaIds[i % ventaIds.length],
          prodExternoIds[i % prodExternoIds.length],
          null, // productoId is nullable
          (i % 10) + 1,
          (5 + (i % 50)).toFixed(2),
          MONEDA_ID_INV,
        ]),
      });

      this.logger.log('✅ Load seed completed successfully');
    } catch (error) {
      this.logger.error('❌ Error during load seed:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------

  /** Generate `n` fresh UUIDs. */
  private uuids(n: number): string[] {
    return Array.from({ length: n }, () => uuidv4());
  }

  /** ISO datetime string for `n` days in the past. */
  private daysAgo(n: number): string {
    return new Date(Date.now() - n * 86_400_000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);
  }

  /** ISO datetime string for `n` hours in the past. */
  private hoursAgo(n: number): string {
    return new Date(Date.now() - n * 3_600_000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);
  }

  /** Generate unique catalog/product pairs up to the requested count. */
  private buildCatalogoProductoRows(
    catalogoIds: string[],
    productoIds: string[],
    count: number,
  ): SeedValue[][] {
    const rows: SeedValue[][] = [];

    for (const catalogoId of catalogoIds) {
      for (const productoId of productoIds) {
        rows.push([catalogoId, productoId]);

        if (rows.length === count) {
          return rows;
        }
      }
    }

    return rows;
  }

  /**
   * Build and execute batched INSERT statements.
   *
   * @param config            Insert configuration with explicit table and columns.
   *                          createdAt / updatedAt columns are appended when
   *                          includeTimestamps=true.
   */
  private async batchInsert(config: BatchInsertConfig): Promise<void> {
    const {
      tableName,
      columns,
      rows,
      includeTimestamps = true,
      batchSize = 500,
    } = config;
    const insertColumns = includeTimestamps
      ? [...columns, '"createdAt"', '"updatedAt"']
      : columns;
    const insertPrefix = `INSERT INTO ${tableName} (${insertColumns.join(', ')}) VALUES`;

    for (let start = 0; start < rows.length; start += batchSize) {
      const batch = rows.slice(start, start + batchSize);

      const valueClauses = batch.map((row) => {
        const colsSql = row.map((col) => {
          if (col === null) return 'NULL';
          if (col === NOW) return 'NOW()'; // raw SQL sentinel – do not quote
          if (typeof col === 'number') return String(col);
          return `'${String(col).replace(/'/g, "''")}'`; // escape single quotes
        });

        if (includeTimestamps) {
          colsSql.push('NOW()', 'NOW()');
        }

        return `(${colsSql.join(', ')})`;
      });

      await this.dataSource.query(
        `${insertPrefix}\n${valueClauses.join(',\n')}`,
      );
    }
  }

  // (legacy seed() removed – data lives in src/datasources/seed.sql)
}

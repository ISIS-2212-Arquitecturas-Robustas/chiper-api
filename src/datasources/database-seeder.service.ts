import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { DataSource, QueryRunner } from 'typeorm';

const NOW = Symbol('NOW');

const LOAD_SEED_KEYS = [
  'productos',
  'catalogos',
  'catalogos_productos',
  'promociones',
  'pedidos',
  'items_pedido',
  'despachos',
  'disponibilidad_zona',
  'notas_credito',
  'items_inventario',
  'registros_compra_producto_tienda',
  'registros_venta_producto_tienda',
  'productos_externos',
  'ventas',
  'items_venta',
] as const;

type LoadSeedKey = (typeof LOAD_SEED_KEYS)[number];
type LoadSeedCounts = Record<LoadSeedKey, number>;
type SeedValue = string | number | null | typeof NOW;

interface LoadSeedConfig {
  load?: Partial<Record<LoadSeedKey, unknown>>;
}

@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  private readonly logisticaMonedaId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  private readonly inventarioMonedaId = '550e8400-e29b-41d4-a716-446655440000';
  private readonly tiendaIds = [
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc',
  ];
  private readonly categorias = ['Categoria 1', 'Categoria 2', 'Categoria 3'];
  private readonly marcas = ['Marca A', 'Marca B', 'Marca C', 'Marca D'];
  private readonly estadosPedido = [
    'creado',
    'aprobado',
    'enAlistamiento',
    'alistado',
    'despachado',
    'entregado',
    'cancelado',
    'devuelto',
  ];
  private readonly motivosNotaCredito = [
    'productoVencido',
    'productoEquivocado',
    'danoEnTransporte',
  ];

  constructor(
    @Inject('DATA_SOURCE')
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.seedDatabase();
  }

  private async seedDatabase(): Promise<void> {
    this.logger.log('Synchronizing database schema before seeding.');
    await this.dataSource.synchronize();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.applyBaseSeed(queryRunner);

      const counts = this.loadSeedCounts();
      this.logger.log(`Top-up targets: ${JSON.stringify(counts)}`);

      const productoIds = await this.seedProductos(
        queryRunner,
        counts.productos,
      );
      const catalogoIds = await this.seedCatalogos(
        queryRunner,
        counts.catalogos,
      );
      await this.seedCatalogoProductos(
        queryRunner,
        counts.catalogos_productos,
        catalogoIds,
        productoIds,
      );
      await this.seedPromociones(queryRunner, counts.promociones, productoIds);
      const pedidoIds = await this.seedPedidos(queryRunner, counts.pedidos);
      await this.seedItemsPedido(
        queryRunner,
        counts.items_pedido,
        pedidoIds,
        productoIds,
      );
      await this.seedDespachos(queryRunner, counts.despachos, pedidoIds);
      await this.seedDisponibilidadZona(
        queryRunner,
        counts.disponibilidad_zona,
        catalogoIds,
        productoIds,
      );
      await this.seedNotasCredito(queryRunner, counts.notas_credito, pedidoIds);
      const itemInventarioIds = await this.seedItemsInventario(
        queryRunner,
        counts.items_inventario,
        productoIds,
      );
      await this.seedRegistrosCompra(
        queryRunner,
        counts.registros_compra_producto_tienda,
        itemInventarioIds,
        productoIds,
      );
      await this.seedRegistrosVenta(
        queryRunner,
        counts.registros_venta_producto_tienda,
        itemInventarioIds,
        productoIds,
      );
      const productoExternoIds = await this.seedProductosExternos(
        queryRunner,
        counts.productos_externos,
      );
      const ventaIds = await this.seedVentas(queryRunner, counts.ventas);
      await this.seedItemsVenta(
        queryRunner,
        counts.items_venta,
        ventaIds,
        productoExternoIds,
      );

      await queryRunner.commitTransaction();
      this.logger.log('✅ Database seeded successfully.');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('❌ Failed to seed database.', error as Error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async applyBaseSeed(queryRunner: QueryRunner): Promise<void> {
    const sql = fs.readFileSync(
      path.join(__dirname, 'seed.sql'),
      'utf8',
    );
    const statements = this.extractSqlStatements(sql).map((s) =>
      this.makeStatementIdempotent(s),
    );

    for (const statement of statements) {
      await queryRunner.query(statement);
    }
  }

  private loadSeedCounts(): LoadSeedCounts {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const config = yaml.load(
      fs.readFileSync(path.join(__dirname, 'load-seed.yaml'), 'utf8'),
    ) as LoadSeedConfig;
    const loadConfig = config.load ?? {};

    return LOAD_SEED_KEYS.reduce(
      (counts, key) => ({ ...counts, [key]: this.parseCount(loadConfig[key], key) }),
      {} as LoadSeedCounts,
    );
  }

  private parseCount(value: unknown, key: LoadSeedKey): number {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
      throw new Error(`Invalid load-seed count for "${key}": ${String(value)}`);
    }
    return value;
  }

  /** Strip comment lines first, then split on ';' to avoid filtering out
   *  INSERT statements that are preceded by a -- comment block. */
  private extractSqlStatements(sql: string): string[] {
    return sql
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private makeStatementIdempotent(statement: string): string {
    if (!/^INSERT\s+INTO/i.test(statement)) {
      return statement;
    }
    return `${statement} ON CONFLICT DO NOTHING`;
  }

  // ---------------------------------------------------------------
  // Per-table seeders
  // ---------------------------------------------------------------

  private async seedProductos(
    queryRunner: QueryRunner,
    targetCount: number,
  ): Promise<string[]> {
    const existingIds = await this.getIds(queryRunner, 'productos');
    const missingCount = this.getMissingCount(existingIds.length, targetCount);

    if (missingCount === 0) return existingIds;

    const insertedIds = this.uuids(missingCount);
    const startIndex = existingIds.length;

    await this.batchInsert(
      queryRunner,
      'INSERT INTO productos (id, "codigoInterno", "codigoBarras", nombre, marca, categoria, presentacion, "precioBase", "monedaId") VALUES',
      insertedIds.map((id, index) => {
        const seq = startIndex + index + 1;
        return [
          id,
          `LOAD-${String(seq).padStart(5, '0')}`,
          `${7000000000000 + seq}`,
          `Producto Load ${seq}`,
          this.marcas[index % this.marcas.length],
          this.categorias[index % this.categorias.length],
          `Presentacion ${(index % 3) + 1}`,
          (10 + (index % 90)).toFixed(2),
          this.logisticaMonedaId,
        ];
      }),
    );

    return [...existingIds, ...insertedIds];
  }

  private async seedCatalogos(
    queryRunner: QueryRunner,
    targetCount: number,
  ): Promise<string[]> {
    const existingIds = await this.getIds(queryRunner, 'catalogos');
    const missingCount = this.getMissingCount(existingIds.length, targetCount);

    if (missingCount === 0) return existingIds;

    const insertedIds = this.uuids(missingCount);
    const startIndex = existingIds.length;

    await this.batchInsert(
      queryRunner,
      'INSERT INTO catalogos (id, "tiendaId", "vigenciaDesde", "vigenciaHasta", zona) VALUES',
      insertedIds.map((id, index) => [
        id,
        this.tiendaIds[index % this.tiendaIds.length],
        '2026-01-01 00:00:00',
        '2026-12-31 23:59:59',
        `Zona Load ${startIndex + index + 1}`,
      ]),
    );

    return [...existingIds, ...insertedIds];
  }

  private async seedCatalogoProductos(
    queryRunner: QueryRunner,
    targetCount: number,
    catalogoIds: string[],
    productoIds: string[],
  ): Promise<void> {
    this.ensureReferences(catalogoIds, 'catalogos_productos_productos', 'catalogos');
    this.ensureReferences(productoIds, 'catalogos_productos_productos', 'productos');

    const existingPairs = await this.getCatalogoProductoPairs(queryRunner);
    const missingCount = this.getMissingCount(existingPairs.size, targetCount);

    if (missingCount === 0) return;

    const rows = this.buildMissingCatalogoProductoPairs(
      catalogoIds,
      productoIds,
      existingPairs,
      missingCount,
    );

    await this.batchInsert(
      queryRunner,
      'INSERT INTO "catalogos_productos_productos" ("catalogosId", "productosId") VALUES',
      rows,
    );
  }

  private async seedPromociones(
    queryRunner: QueryRunner,
    targetCount: number,
    productoIds: string[],
  ): Promise<void> {
    this.ensureReferences(productoIds, 'promociones', 'productos');

    const existingIds = await this.getIds(queryRunner, 'promociones');
    const missingCount = this.getMissingCount(existingIds.length, targetCount);

    if (missingCount === 0) return;

    const startIndex = existingIds.length;

    await this.batchInsert(
      queryRunner,
      'INSERT INTO promociones (id, nombre, "precioPromocional", "monedaId", "productoId", "tiendaIds", inicio, fin, restricciones) VALUES',
      this.uuids(missingCount).map((id, index) => [
        id,
        `Promo Load ${startIndex + index + 1}`,
        (5 + (index % 40)).toFixed(2),
        this.logisticaMonedaId,
        productoIds[index % productoIds.length],
        JSON.stringify([
          this.tiendaIds[index % this.tiendaIds.length],
          this.tiendaIds[(index + 1) % this.tiendaIds.length],
        ]),
        '2026-03-01 00:00:00',
        '2026-06-30 23:59:59',
        (index % 200) + 1,
      ]),
    );
  }

  private async seedPedidos(
    queryRunner: QueryRunner,
    targetCount: number,
  ): Promise<string[]> {
    const existingIds = await this.getIds(queryRunner, 'pedidos');
    const missingCount = this.getMissingCount(existingIds.length, targetCount);

    if (missingCount === 0) return existingIds;

    const insertedIds = this.uuids(missingCount);
    const startIndex = existingIds.length;

    await this.batchInsert(
      queryRunner,
      'INSERT INTO pedidos (id, identificador, "tiendaId", "fechaHoraCreacion", "montoTotal", "monedaId", estado) VALUES',
      insertedIds.map((id, index) => [
        id,
        `PED-LOAD-${String(startIndex + index + 1).padStart(5, '0')}`,
        this.tiendaIds[index % this.tiendaIds.length],
        this.daysAgo(missingCount - index),
        (20 + (index % 200)).toFixed(2),
        this.logisticaMonedaId,
        this.estadosPedido[index % this.estadosPedido.length],
      ]),
    );

    return [...existingIds, ...insertedIds];
  }

  private async seedItemsPedido(
    queryRunner: QueryRunner,
    targetCount: number,
    pedidoIds: string[],
    productoIds: string[],
  ): Promise<void> {
    this.ensureReferences(pedidoIds, 'items_pedido', 'pedidos');
    this.ensureReferences(productoIds, 'items_pedido', 'productos');

    const existingIds = await this.getIds(queryRunner, 'items_pedido');
    const missingCount = this.getMissingCount(existingIds.length, targetCount);

    if (missingCount === 0) return;

    const startIndex = existingIds.length;

    await this.batchInsert(
      queryRunner,
      'INSERT INTO items_pedido (id, "pedidoId", "productoId", cantidad, "precioUnitario", descuento, "monedaId", lote, "fechaVencimiento") VALUES',
      this.uuids(missingCount).map((id, index) => [
        id,
        pedidoIds[index % pedidoIds.length],
        productoIds[index % productoIds.length],
        (index % 10) + 1,
        (10 + (index % 90)).toFixed(2),
        '0.00',
        this.logisticaMonedaId,
        `LOTE-LOAD-${startIndex + index + 1}`,
        '2027-12-31',
      ]),
    );
  }

  private async seedDespachos(
    queryRunner: QueryRunner,
    targetCount: number,
    pedidoIds: string[],
  ): Promise<void> {
    this.ensureReferences(pedidoIds, 'despachos', 'pedidos');

    const existingIds = await this.getIds(queryRunner, 'despachos');
    const missingCount = this.getMissingCount(existingIds.length, targetCount);

    if (missingCount === 0) return;

    await this.batchInsert(
      queryRunner,
      'INSERT INTO despachos (id, "pedidoId", bodega, "horaSalida", "ventanaPrometidaInicio", "ventanaPrometidaFin") VALUES',
      this.uuids(missingCount).map((id, index) => [
        id,
        pedidoIds[index % pedidoIds.length],
        `Bodega Load ${(index % 5) + 1}`,
        '2026-03-05 08:00:00',
        '2026-03-05 10:00:00',
        '2026-03-05 18:00:00',
      ]),
    );
  }

  private async seedDisponibilidadZona(
    queryRunner: QueryRunner,
    targetCount: number,
    catalogoIds: string[],
    productoIds: string[],
  ): Promise<void> {
    this.ensureReferences(catalogoIds, 'disponibilidad_zona', 'catalogos');
    this.ensureReferences(productoIds, 'disponibilidad_zona', 'productos');

    const existingIds = await this.getIds(queryRunner, 'disponibilidad_zona');
    const missingCount = this.getMissingCount(existingIds.length, targetCount);

    if (missingCount === 0) return;

    await this.batchInsert(
      queryRunner,
      'INSERT INTO disponibilidad_zona (id, "catalogoId", "productoId", "cantidadDisponible", "ultimaActualizacion") VALUES',
      this.uuids(missingCount).map((id, index) => [
        id,
        catalogoIds[index % catalogoIds.length],
        productoIds[index % productoIds.length],
        (index % 500) + 1,
        NOW,
      ]),
    );
  }

  private async seedNotasCredito(
    queryRunner: QueryRunner,
    targetCount: number,
    pedidoIds: string[],
  ): Promise<void> {
    this.ensureReferences(pedidoIds, 'notas_credito', 'pedidos');

    const existingIds = await this.getIds(queryRunner, 'notas_credito');
    const missingCount = this.getMissingCount(existingIds.length, targetCount);

    if (missingCount === 0) return;

    const startIndex = existingIds.length;

    await this.batchInsert(
      queryRunner,
      'INSERT INTO notas_credito (id, "pedidoId", "numeroDocumento", fecha, motivo, monto, "monedaId", evidencia) VALUES',
      this.uuids(missingCount).map((id, index) => [
        id,
        pedidoIds[index % pedidoIds.length],
        `NC-LOAD-${String(startIndex + index + 1).padStart(4, '0')}`,
        '2026-03-01',
        this.motivosNotaCredito[index % this.motivosNotaCredito.length],
        (1 + (index % 50)).toFixed(2),
        this.logisticaMonedaId,
        `Evidencia load test ${startIndex + index + 1}`,
      ]),
    );
  }

  private async seedItemsInventario(
    queryRunner: QueryRunner,
    targetCount: number,
    productoIds: string[],
  ): Promise<string[]> {
    this.ensureReferences(productoIds, 'items_inventario', 'productos');

    const existingIds = await this.getIds(queryRunner, 'items_inventario');
    const missingCount = this.getMissingCount(existingIds.length, targetCount);

    if (missingCount === 0) return existingIds;

    const insertedIds = this.uuids(missingCount);

    await this.batchInsert(
      queryRunner,
      'INSERT INTO items_inventario (id, "productoId", "tiendaId", cantidad, "precioVenta", "monedaId") VALUES',
      insertedIds.map((id, index) => [
        id,
        productoIds[index % productoIds.length],
        this.tiendaIds[index % this.tiendaIds.length],
        (index % 500) + 1,
        (5 + (index % 95)).toFixed(2),
        this.inventarioMonedaId,
      ]),
    );

    return [...existingIds, ...insertedIds];
  }

  private async seedRegistrosCompra(
    queryRunner: QueryRunner,
    targetCount: number,
    itemInventarioIds: string[],
    productoIds: string[],
  ): Promise<void> {
    this.ensureReferences(itemInventarioIds, 'registros_compra_producto_tienda', 'items_inventario');
    this.ensureReferences(productoIds, 'registros_compra_producto_tienda', 'productos');

    const existingIds = await this.getIds(queryRunner, 'registros_compra_producto_tienda');
    const missingCount = this.getMissingCount(existingIds.length, targetCount);

    if (missingCount === 0) return;

    await this.batchInsert(
      queryRunner,
      'INSERT INTO registros_compra_producto_tienda (id, "tiendaId", "productoId", "compraId", "itemInventarioId", "fechaCompra", cantidad) VALUES',
      this.uuids(missingCount).map((id, index) => [
        id,
        this.tiendaIds[index % this.tiendaIds.length],
        productoIds[index % productoIds.length],
        randomUUID(),
        itemInventarioIds[index % itemInventarioIds.length],
        this.hoursAgo(missingCount - index),
        (index % 100) + 1,
      ]),
    );
  }

  private async seedRegistrosVenta(
    queryRunner: QueryRunner,
    targetCount: number,
    itemInventarioIds: string[],
    productoIds: string[],
  ): Promise<void> {
    this.ensureReferences(itemInventarioIds, 'registros_venta_producto_tienda', 'items_inventario');
    this.ensureReferences(productoIds, 'registros_venta_producto_tienda', 'productos');

    const existingIds = await this.getIds(queryRunner, 'registros_venta_producto_tienda');
    const missingCount = this.getMissingCount(existingIds.length, targetCount);

    if (missingCount === 0) return;

    await this.batchInsert(
      queryRunner,
      'INSERT INTO registros_venta_producto_tienda (id, "tiendaId", "productoId", "ventaId", "itemInventarioId", "fechaVenta", cantidad) VALUES',
      this.uuids(missingCount).map((id, index) => [
        id,
        this.tiendaIds[index % this.tiendaIds.length],
        productoIds[index % productoIds.length],
        randomUUID(),
        itemInventarioIds[index % itemInventarioIds.length],
        this.hoursAgo(missingCount - index),
        (index % 50) + 1,
      ]),
    );
  }

  private async seedProductosExternos(
    queryRunner: QueryRunner,
    targetCount: number,
  ): Promise<string[]> {
    const existingIds = await this.getIds(queryRunner, 'productos_externos');
    const missingCount = this.getMissingCount(existingIds.length, targetCount);

    if (missingCount === 0) return existingIds;

    const insertedIds = this.uuids(missingCount);
    const startIndex = existingIds.length;

    await this.batchInsert(
      queryRunner,
      'INSERT INTO productos_externos (id, "tiendaId", "codigoBarras", nombre, categoria, "precioBase", "monedaId", cantidad) VALUES',
      insertedIds.map((id, index) => {
        const seq = startIndex + index + 1;
        return [
          id,
          this.tiendaIds[index % this.tiendaIds.length],
          `EXT-${8000000000000 + seq}`,
          `Producto Externo Load ${seq}`,
          this.categorias[index % this.categorias.length],
          (8 + (index % 50)).toFixed(2),
          this.inventarioMonedaId,
          (index % 100) + 1,
        ];
      }),
    );

    return [...existingIds, ...insertedIds];
  }

  private async seedVentas(
    queryRunner: QueryRunner,
    targetCount: number,
  ): Promise<string[]> {
    const existingIds = await this.getIds(queryRunner, 'ventas');
    const missingCount = this.getMissingCount(existingIds.length, targetCount);

    if (missingCount === 0) return existingIds;

    const insertedIds = this.uuids(missingCount);

    await this.batchInsert(
      queryRunner,
      'INSERT INTO ventas (id, "tiendaId", "fechaHora", total, "monedaId") VALUES',
      insertedIds.map((id, index) => [
        id,
        this.tiendaIds[index % this.tiendaIds.length],
        this.hoursAgo(missingCount - index),
        (10 + (index % 300)).toFixed(2),
        this.inventarioMonedaId,
      ]),
    );

    return [...existingIds, ...insertedIds];
  }

  private async seedItemsVenta(
    queryRunner: QueryRunner,
    targetCount: number,
    ventaIds: string[],
    productoExternoIds: string[],
  ): Promise<void> {
    this.ensureReferences(ventaIds, 'items_venta', 'ventas');
    this.ensureReferences(productoExternoIds, 'items_venta', 'productos_externos');

    const existingIds = await this.getIds(queryRunner, 'items_venta');
    const missingCount = this.getMissingCount(existingIds.length, targetCount);

    if (missingCount === 0) return;

    await this.batchInsert(
      queryRunner,
      'INSERT INTO items_venta (id, "ventaId", "productoExternoId", "productoId", cantidad, "precioUnitario", "monedaId") VALUES',
      this.uuids(missingCount).map((id, index) => [
        id,
        ventaIds[index % ventaIds.length],
        productoExternoIds[index % productoExternoIds.length],
        null,
        (index % 10) + 1,
        (5 + (index % 50)).toFixed(2),
        this.inventarioMonedaId,
      ]),
    );
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------

  private ensureReferences(
    ids: string[],
    tableName: string,
    dependencyName: string,
  ): void {
    if (ids.length === 0) {
      throw new Error(
        `Cannot seed ${tableName} without existing ${dependencyName} rows.`,
      );
    }
  }

  private getMissingCount(currentCount: number, targetCount: number): number {
    return Math.max(targetCount - currentCount, 0);
  }

  private async getIds(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<string[]> {
    const rows = (await queryRunner.query(
      `SELECT id FROM ${tableName} ORDER BY id`,
    )) as Array<{ id: string }>;
    return rows.map((row) => row.id);
  }

  private async getCatalogoProductoPairs(
    queryRunner: QueryRunner,
  ): Promise<Set<string>> {
    const rows = (await queryRunner.query(
      'SELECT "catalogosId", "productosId" FROM "catalogos_productos_productos" ORDER BY "catalogosId", "productosId"',
    )) as Array<{ catalogosId: string; productosId: string }>;
    return new Set(
      rows.map((row) => `${row.catalogosId}:${row.productosId}`),
    );
  }

  private buildMissingCatalogoProductoPairs(
    catalogoIds: string[],
    productoIds: string[],
    existingPairs: Set<string>,
    missingCount: number,
  ): string[][] {
    const rows: string[][] = [];

    for (const catalogoId of catalogoIds) {
      for (const productoId of productoIds) {
        const key = `${catalogoId}:${productoId}`;
        if (existingPairs.has(key)) continue;

        existingPairs.add(key);
        rows.push([catalogoId, productoId]);

        if (rows.length === missingCount) return rows;
      }
    }

    throw new Error(
      `Unable to generate ${missingCount} unique catalogo-producto rows with the available references.`,
    );
  }

  private async batchInsert(
    queryRunner: QueryRunner,
    insertPrefix: string,
    rows: SeedValue[][],
    batchSize = 500,
  ): Promise<void> {
    if (rows.length === 0) return;

    for (let start = 0; start < rows.length; start += batchSize) {
      const batch = rows.slice(start, start + batchSize);

      const valueClauses = batch.map((row) => {
        const values = row.map((value) => {
          if (value === null) return 'NULL';
          if (value === NOW) return 'NOW()';
          if (typeof value === 'number') return String(value);
          return `'${String(value).replace(/'/g, "''")}'`;
        });
        return `(${values.join(', ')})`;
      });

      await queryRunner.query(`${insertPrefix}\n${valueClauses.join(',\n')}`);
    }
  }

  private uuids(count: number): string[] {
    return Array.from({ length: count }, () => randomUUID());
  }

  private daysAgo(days: number): string {
    return new Date(Date.now() - days * 86_400_000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);
  }

  private hoursAgo(hours: number): string {
    return new Date(Date.now() - hours * 3_600_000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);
  }
}

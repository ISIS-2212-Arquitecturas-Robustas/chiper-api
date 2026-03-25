import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { DatabaseSeederService } from './database-seeder.service';

describe('DatabaseSeederService', () => {
  let service: DatabaseSeederService;

  beforeEach(() => {
    service = new DatabaseSeederService({} as DataSource);
  });

  it('extracts all seed.sql insert statements even when blocks start with comments', () => {
    const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

    const statements = (
      service as unknown as {
        extractSqlStatements(sqlText: string): string[];
      }
    ).extractSqlStatements(sql);

    expect(statements).toHaveLength(12);
    expect(
      statements.every((statement) => statement.startsWith('INSERT INTO')),
    ).toBe(true);
  });

  it('loads integer targets from load-seed.yaml', () => {
    const counts = (
      service as unknown as {
        loadSeedCounts(): Record<string, number>;
      }
    ).loadSeedCounts();

    expect(counts.productos).toBe(50);
    expect(counts.catalogos_productos).toBe(100);
    expect(counts.items_venta).toBe(450);
  });

  it('keeps every UUID-like literal in seed.sql valid for Postgres uuid columns', () => {
    const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    const literals = Array.from(
      sql.matchAll(/'([0-9a-z-]{36})'/gi),
      (match) => match[1],
    ).filter((value) => value.split('-').length === 5);

    expect(literals.length).toBeGreaterThan(0);
    expect(
      literals.every((value) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          value,
        ),
      ),
    ).toBe(true);
  });

  it('builds unique missing catalogo-producto pairs without reusing existing ones', () => {
    const pairs = (
      service as unknown as {
        buildMissingCatalogoProductoPairs(
          catalogoIds: string[],
          productoIds: string[],
          existingPairs: Set<string>,
          missingCount: number,
        ): string[][];
      }
    ).buildMissingCatalogoProductoPairs(
      ['cat-1', 'cat-2'],
      ['prod-1', 'prod-2'],
      new Set(['cat-1:prod-1']),
      3,
    );

    expect(pairs).toEqual([
      ['cat-1', 'prod-2'],
      ['cat-2', 'prod-1'],
      ['cat-2', 'prod-2'],
    ]);
  });

  it('builds insert SQL without appending extra timestamp values', async () => {
    const queryRunner = {
      query: jest.fn().mockResolvedValue(undefined),
    };

    await (
      service as unknown as {
        batchInsert(
          runner: { query(sql: string): Promise<void> },
          insertPrefix: string,
          rows: Array<Array<string | number | null>>,
        ): Promise<void>;
      }
    ).batchInsert(queryRunner, 'INSERT INTO productos (id, nombre) VALUES', [
      ['prod-1', 'Producto 1'],
    ]);

    expect(queryRunner.query).toHaveBeenCalledWith(
      "INSERT INTO productos (id, nombre) VALUES\n('prod-1', 'Producto 1')",
    );
  });
});

import { EntitySchema } from 'typeorm';
import { createDataSource } from '../../libs/shared/database/src';

type DatabaseEntity = Function | string | EntitySchema;

export async function resetDatabase(entities: DatabaseEntity[]): Promise<void> {
  const dataSource = createDataSource(entities);

  await dataSource.initialize();
  await dataSource.dropDatabase();
  await dataSource.synchronize();
  await dataSource.destroy();
}

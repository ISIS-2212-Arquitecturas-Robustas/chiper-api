import { DynamicModule, Global, Module } from '@nestjs/common';
import { EntitySchema } from 'typeorm';
import { DatabaseLifecycle } from './database.lifecycle';
import { createDatabaseProviders } from './database.providers';

type DatabaseEntity = Function | string | EntitySchema;

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(entities: DatabaseEntity[]): DynamicModule {
    const providers = createDatabaseProviders(entities);

    return {
      module: DatabaseModule,
      global: true,
      providers: [...providers, DatabaseLifecycle],
      exports: providers,
    };
  }
}

import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { DatabaseSeederService } from './database-seeder.service';
import { DatabaseLifecycle } from './database.lifecycle';
import { createDatabaseProviders } from './database.providers';
import { DatabaseEntity, DatabaseModuleOptions } from './database.types';

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(
    entities: DatabaseEntity[],
    options: DatabaseModuleOptions = {},
  ): DynamicModule {
    const providers = createDatabaseProviders(entities);
    const additionalProviders: Provider[] = [DatabaseLifecycle];

    if (options.enableSeeder) {
      additionalProviders.push(DatabaseSeederService);
    }

    return {
      module: DatabaseModule,
      global: true,
      providers: [...providers, ...additionalProviders],
      exports: providers,
    };
  }
}

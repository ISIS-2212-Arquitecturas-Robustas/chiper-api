import { EntitySchema } from 'typeorm';

export type DatabaseEntity = Function | string | EntitySchema;

export interface DatabaseModuleOptions {
  enableSeeder?: boolean;
}

import { DatabaseSeederService } from './database-seeder.service';
import { DatabaseModule } from './database.module';

describe('DatabaseModule', () => {
  it('registers the seeder service when explicitly enabled', () => {
    const dynamicModule = DatabaseModule.forRoot([], { enableSeeder: true });

    expect(dynamicModule.providers).toContain(DatabaseSeederService);
  });

  it('does not register the seeder service by default', () => {
    const dynamicModule = DatabaseModule.forRoot([]);

    expect(dynamicModule.providers).not.toContain(DatabaseSeederService);
  });
});

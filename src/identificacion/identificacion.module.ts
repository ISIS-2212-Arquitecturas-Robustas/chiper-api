import { Module } from '@nestjs/common';
// Database
import { DatabaseModule } from '../datasources/database.module';
// Repositories
import { TiendaRepository } from './repositories';
import { repositoryProviders } from './repositories/repository.providers';
// Services
import { TiendaService } from './services';
// Controllers
import { TiendaController } from './controllers';

@Module({
  imports: [DatabaseModule],
  controllers: [TiendaController],
  providers: [
    // Repository Providers
    ...repositoryProviders,
    // Repositories
    TiendaRepository,
    // Services
    TiendaService,
  ],
  exports: [TiendaService],
})
export class IdentificacionModule {}

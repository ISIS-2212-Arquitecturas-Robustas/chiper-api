import { Module } from '@nestjs/common';

// Repositories (Data Layer)
import {
  ItemInventarioRepository,
  RegistroCompraRepository,
  RegistroVentaRepository,
} from './repositories';

// Services
import {
  ItemInventarioService,
  RegistroCompraService,
  RegistroVentaService,
} from './services';

// Controllers
import {
  ItemInventarioController,
  RegistroCompraController,
  RegistroVentaController,
} from './controllers';

// Clients Mock
import { DatabaseModule } from '../datasources/database.module';
import { ProductoClientMock, TiendaClientMock } from './clients';
import { repositoryProviders } from './repositories/repository.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [
    ItemInventarioController,
    RegistroVentaController,
    RegistroCompraController,
  ],
  providers: [
    // Repositories
    ...repositoryProviders,
    ItemInventarioRepository,
    RegistroVentaRepository,
    RegistroCompraRepository,
    // Services
    ItemInventarioService,
    RegistroVentaService,
    RegistroCompraService,
    // Mock Clients
    ProductoClientMock,
    TiendaClientMock,
  ],
  exports: [ItemInventarioService, RegistroVentaService, RegistroCompraService],
})
export class InventarioModule {}

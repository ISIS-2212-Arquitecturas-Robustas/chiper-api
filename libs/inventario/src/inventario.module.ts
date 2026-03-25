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

import { TiendaClientMock } from './clients';
import { repositoryProviders } from './repositories/repository.providers';
import { LogisticaProductosClient } from '../../shared/logistica-client/src';

@Module({
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
    TiendaClientMock,
    LogisticaProductosClient,
  ],
  exports: [ItemInventarioService, RegistroVentaService, RegistroCompraService],
})
export class InventarioModule {}

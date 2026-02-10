import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InventarioModule } from './inventario/inventario.module';
import { LogisticaModule } from './logistica/logistica.module';

@Module({
  imports: [InventarioModule, LogisticaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

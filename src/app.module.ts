import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InventarioModule } from './inventario/inventario.module';

@Module({
  imports: [InventarioModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

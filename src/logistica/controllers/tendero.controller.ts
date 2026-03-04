import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { ProductoResponseDto, QueryProductosDisponiblesDto } from '../dtos';
import { TenderoService } from '../services';

@Controller('logistics/tenderos')
export class TenderoController {
  constructor(private readonly tenderoService: TenderoService) {}

  /**
   * HU 1: Como tendero, quiero consultar los productos que alguna vez he
   * pedido, que actualmente estén en promoción y disponibles en el catálogo
   * de mi zona.
   *
   * GET /logistics/tenderos/productos-disponibles?tiendaId=<uuid>&zona=<string>
   */
  @Get('productos-disponibles')
  async getProductosDisponibles(
    @Query(new ValidationPipe({ transform: true }))
    query: QueryProductosDisponiblesDto,
  ): Promise<ProductoResponseDto[]> {
    return this.tenderoService.getProductosDisponibles(query);
  }
}

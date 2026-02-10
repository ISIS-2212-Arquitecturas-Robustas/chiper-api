import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CatalogoProducto } from './entities';

@Injectable()
export class CatalogoProductoRepository {
  constructor(
    @Inject('CATALOGO_PRODUCTO_REPOSITORY')
    private repository: Repository<CatalogoProducto>,
  ) {}

  async addProductoToCatalogo(
    catalogoId: string,
    productoId: string,
  ): Promise<CatalogoProducto> {
    const relation = this.repository.create({ catalogoId, productoId });
    return this.repository.save(relation);
  }

  async findByCatalogoId(catalogoId: string): Promise<CatalogoProducto[]> {
    return this.repository.find({
      where: { catalogoId },
      relations: ['producto'],
    });
  }

  async removeProductoFromCatalogo(
    catalogoId: string,
    productoId: string,
  ): Promise<boolean> {
    const result = await this.repository.delete({ catalogoId, productoId });
    return (result.affected ?? 0) > 0;
  }

  async exists(catalogoId: string, productoId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { catalogoId, productoId },
    });
    return count > 0;
  }
}

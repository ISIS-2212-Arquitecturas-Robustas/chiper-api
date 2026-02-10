import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { QueryProductoDto } from '../dtos';
import { Producto } from './entities';

@Injectable()
export class ProductoRepository {
  constructor(
    @Inject('PRODUCTO_REPOSITORY')
    private repository: Repository<Producto>,
  ) {}

  async create(producto: Partial<Producto>): Promise<Producto> {
    const newProducto = this.repository.create(producto);
    return this.repository.save(newProducto);
  }

  async findAll(query: QueryProductoDto): Promise<Producto[]> {
    const queryBuilder = this.repository.createQueryBuilder('producto');

    if (query.codigoInterno) {
      queryBuilder.andWhere('producto.codigoInterno = :codigoInterno', {
        codigoInterno: query.codigoInterno,
      });
    }

    if (query.codigoBarras) {
      queryBuilder.andWhere('producto.codigoBarras = :codigoBarras', {
        codigoBarras: query.codigoBarras,
      });
    }

    if (query.categoria) {
      queryBuilder.andWhere('producto.categoria = :categoria', {
        categoria: query.categoria,
      });
    }

    return queryBuilder.getMany();
  }

  async findById(id: string): Promise<Producto | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(
    id: string,
    updates: Partial<Producto>,
  ): Promise<Producto | null> {
    await this.repository.update(id, updates);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

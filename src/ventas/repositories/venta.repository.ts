import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Venta } from './entities/venta.entity';

export interface QueryVentaDto {
  tiendaId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  productoExternoId?: string;
  productoId?: string;
}

@Injectable()
export class VentaRepository {
  constructor(
    @Inject('VENTA_REPOSITORY')
    private repository: Repository<Venta>,
  ) {}

  async create(data: Partial<Venta>): Promise<Venta> {
    const venta = this.repository.create(data);
    return this.repository.save(venta);
  }

  async findAll(query: QueryVentaDto): Promise<Venta[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('venta')
      .leftJoinAndSelect('venta.items', 'items');

    if (query.tiendaId) {
      queryBuilder.andWhere('venta.tiendaId = :tiendaId', {
        tiendaId: query.tiendaId,
      });
    }

    if (query.fechaDesde) {
      queryBuilder.andWhere('venta.fechaHora >= :fechaDesde', {
        fechaDesde: query.fechaDesde,
      });
    }

    if (query.fechaHasta) {
      queryBuilder.andWhere('venta.fechaHora <= :fechaHasta', {
        fechaHasta: query.fechaHasta,
      });
    }

    if (query.productoExternoId) {
      queryBuilder.andWhere('items.productoExternoId = :productoExternoId', {
        productoExternoId: query.productoExternoId,
      });
    }

    if (query.productoId) {
      queryBuilder.andWhere('items.productoId = :productoId', {
        productoId: query.productoId,
      });
    }

    return queryBuilder.getMany();
  }

  async findById(id: string): Promise<Venta | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['items'],
    });
  }

  async update(id: string, updates: Partial<Venta>): Promise<Venta | null> {
    const venta = await this.findById(id);
    if (!venta) return null;

    // Merge updates into the existing entity
    Object.assign(venta, updates);

    // Save will cascade to items due to cascade: true
    return this.repository.save(venta);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

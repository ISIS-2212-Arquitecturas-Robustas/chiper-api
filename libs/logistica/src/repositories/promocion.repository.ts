import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { QueryPromocionDto } from '../dtos';
import { Promocion } from './entities';

@Injectable()
export class PromocionRepository {
  constructor(
    @Inject('PROMOCION_REPOSITORY')
    private repository: Repository<Promocion>,
  ) {}

  async create(promocion: Partial<Promocion>): Promise<Promocion> {
    const newPromocion = this.repository.create(promocion);
    return this.repository.save(newPromocion);
  }

  async findAll(query: QueryPromocionDto): Promise<Promocion[]> {
    const queryBuilder = this.repository.createQueryBuilder('promocion');

    if (query.nombre) {
      queryBuilder.andWhere('promocion.nombre LIKE :nombre', {
        nombre: `%${query.nombre}%`,
      });
    }

    return queryBuilder.getMany();
  }

  async findById(id: string): Promise<Promocion | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(
    id: string,
    updates: Partial<Promocion>,
  ): Promise<Promocion | null> {
    await this.repository.update(id, updates);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

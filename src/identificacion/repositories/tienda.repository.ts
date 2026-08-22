import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { QueryTiendaDto } from '../dtos';
import { Tienda } from './entities';

@Injectable()
export class TiendaRepository {
  constructor(
    @Inject('TIENDA_REPOSITORY')
    private readonly repository: Repository<Tienda>,
  ) {}

  async create(tienda: Partial<Tienda>): Promise<Tienda> {
    const nuevaTienda = this.repository.create(tienda);
    return this.repository.save(nuevaTienda);
  }

  async findAll(query: QueryTiendaDto): Promise<Tienda[]> {
    const queryBuilder = this.repository.createQueryBuilder('tienda');

    if (query.codigoInterno) {
      queryBuilder.andWhere('tienda.codigoInterno = :codigoInterno', {
        codigoInterno: query.codigoInterno,
      });
    }

    if (query.nombreComercial) {
      queryBuilder.andWhere('tienda.nombreComercial ILIKE :nombreComercial', {
        nombreComercial: `%${query.nombreComercial}%`,
      });
    }

    if (query.responsableId) {
      queryBuilder.andWhere('tienda.responsableId = :responsableId', {
        responsableId: query.responsableId,
      });
    }

    if (query.paisId) {
      queryBuilder.andWhere('tienda.paisId = :paisId', {
        paisId: query.paisId,
      });
    }

    if (query.rut) {
      queryBuilder.andWhere('tienda.rut = :rut', {
        rut: query.rut,
      });
    }

    if (query.estadoCaptacion) {
      queryBuilder.andWhere('tienda.estadoCaptacion = :estadoCaptacion', {
        estadoCaptacion: query.estadoCaptacion,
      });
    }

    return queryBuilder.getMany();
  }

  async findById(id: string): Promise<Tienda | null> {
    return this.repository.findOne({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    return this.repository.existsBy({ id });
  }

  async update(id: string, updates: Partial<Tienda>): Promise<Tienda | null> {
    await this.repository.update(id, updates);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

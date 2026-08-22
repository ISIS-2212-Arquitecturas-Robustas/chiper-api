import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { EstadoCaptacion, Tienda } from './entities';
import { TiendaRepository } from './tienda.repository';

describe('TiendaRepository', () => {
  let repository: TiendaRepository;
  let typeOrmRepository: jest.Mocked<Repository<Tienda>>;
  let queryBuilder: {
    andWhere: jest.Mock;
    getMany: jest.Mock;
  };

  const tienda: Tienda = {
    id: 'tienda-1',
    codigoInterno: 'TIENDA-001',
    nombreComercial: 'Tienda de prueba',
    responsableId: '11111111-1111-4111-8111-111111111111',
    paisId: '22222222-2222-4222-8222-222222222222',
    rut: '900123456-7',
    direccion: 'Calle 1 # 2-3',
    telefono: '3001234567',
    estadoCaptacion: EstadoCaptacion.PROSPECTO_CREADO,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    typeOrmRepository = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
      existsBy: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<Tienda>>;

    repository = new TiendaRepository(typeOrmRepository);
  });

  describe('create', () => {
    it('should create and save a tienda', async () => {
      typeOrmRepository.create.mockReturnValue(tienda as never);
      typeOrmRepository.save.mockResolvedValue(tienda);

      const result = await repository.create({
        codigoInterno: tienda.codigoInterno,
        nombreComercial: tienda.nombreComercial,
      });

      expect(typeOrmRepository.create).toHaveBeenCalled();
      expect(typeOrmRepository.save).toHaveBeenCalledWith(tienda);
      expect(result).toEqual(tienda);
    });
  });

  describe('findAll', () => {
    it('should return all tiendas without filters', async () => {
      queryBuilder.getMany.mockResolvedValue([tienda]);

      const result = await repository.findAll({});

      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'tienda',
      );
      expect(result).toEqual([tienda]);
    });

    it('should apply query filters', async () => {
      queryBuilder.getMany.mockResolvedValue([tienda]);

      await repository.findAll({
        nombreComercial: 'prueba',
        estadoCaptacion: EstadoCaptacion.PROSPECTO_CREADO,
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'tienda.nombreComercial ILIKE :nombreComercial',
        { nombreComercial: '%prueba%' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'tienda.estadoCaptacion = :estadoCaptacion',
        { estadoCaptacion: EstadoCaptacion.PROSPECTO_CREADO },
      );
    });
  });

  describe('findById', () => {
    it('should find a tienda by id', async () => {
      typeOrmRepository.findOne.mockResolvedValue(tienda);

      const result = await repository.findById('tienda-1');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'tienda-1' },
      });
      expect(result).toEqual(tienda);
    });
  });

  describe('exists', () => {
    it('should verify whether a tienda exists', async () => {
      typeOrmRepository.existsBy.mockResolvedValue(true);

      const result = await repository.exists('tienda-1');

      expect(typeOrmRepository.existsBy).toHaveBeenCalledWith({
        id: 'tienda-1',
      });
      expect(result).toBe(true);
    });
  });

  describe('update', () => {
    it('should update and return a tienda', async () => {
      const updatedTienda = {
        ...tienda,
        nombreComercial: 'Tienda actualizada',
      };

      typeOrmRepository.update.mockResolvedValue({
        affected: 1,
      } as UpdateResult);
      typeOrmRepository.findOne.mockResolvedValue(updatedTienda);

      const result = await repository.update('tienda-1', {
        nombreComercial: 'Tienda actualizada',
      });

      expect(typeOrmRepository.update).toHaveBeenCalledWith('tienda-1', {
        nombreComercial: 'Tienda actualizada',
      });
      expect(result).toEqual(updatedTienda);
    });
  });

  describe('delete', () => {
    it('should return true when a tienda is deleted', async () => {
      typeOrmRepository.delete.mockResolvedValue({
        affected: 1,
      } as DeleteResult);

      const result = await repository.delete('tienda-1');

      expect(typeOrmRepository.delete).toHaveBeenCalledWith('tienda-1');
      expect(result).toBe(true);
    });

    it('should return false when no tienda is deleted', async () => {
      typeOrmRepository.delete.mockResolvedValue({
        affected: 0,
      } as DeleteResult);

      const result = await repository.delete('non-existent');

      expect(result).toBe(false);
    });
  });
});

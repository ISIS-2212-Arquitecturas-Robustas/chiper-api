import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { QueryTiendaDto } from '../dtos';
import { EstadoCaptacion, Tienda } from './entities';
import { TiendaRepository } from './tienda.repository';

describe('TiendaRepository', () => {
  let repository: TiendaRepository;
  let typeormRepo: jest.Mocked<Repository<Tienda>>;

  beforeEach(async () => {
    const mockTypeormRepo = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TiendaRepository,
        {
          provide: 'TIENDA_REPOSITORY',
          useValue: mockTypeormRepo,
        },
      ],
    }).compile();

    repository = module.get<TiendaRepository>(TiendaRepository);
    typeormRepo = module.get('TIENDA_REPOSITORY');
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and save tienda', async () => {
      const tiendaData = {
        codigoInterno: 'T-001',
        nombreComercial: 'Tienda Central',
        responsableId: 'usuario-1',
        rut: '900123456-7',
        direccion: 'Calle Principal 123',
        telefono: '3001234567',
      };
      const createdTienda = { id: 'tienda-1', ...tiendaData };
      const savedTienda = {
        ...createdTienda,
        estadoCaptacion: EstadoCaptacion.PROSPECTO_CREADO,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      typeormRepo.create.mockReturnValue(createdTienda as any);
      typeormRepo.save.mockResolvedValue(savedTienda as any);

      const result = await repository.create(tiendaData);

      expect(typeormRepo.create).toHaveBeenCalledWith(tiendaData);
      expect(typeormRepo.save).toHaveBeenCalledWith(createdTienda);
      expect(result).toEqual(savedTienda);
    });
  });

  describe('findAll', () => {
    it('should filter by codigoInterno and estadoCaptacion', async () => {
      const query: QueryTiendaDto = {
        codigoInterno: 'T-001',
        estadoCaptacion: EstadoCaptacion.HABILITADO_BASICO,
      };
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      typeormRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await repository.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'tienda.codigoInterno = :codigoInterno',
        { codigoInterno: 'T-001' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'tienda.estadoCaptacion = :estadoCaptacion',
        { estadoCaptacion: EstadoCaptacion.HABILITADO_BASICO },
      );
    });
  });

  describe('findById', () => {
    it('should return tienda when found', async () => {
      const tienda = { id: 'tienda-1', codigoInterno: 'T-001' };
      typeormRepo.findOne.mockResolvedValue(tienda as any);

      const result = await repository.findById('tienda-1');

      expect(typeormRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'tienda-1' },
      });
      expect(result).toEqual(tienda);
    });

    it('should return null when not found', async () => {
      typeormRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return the tienda', async () => {
      const updated = { id: 'tienda-1', nombreComercial: 'Nueva Tienda' };
      typeormRepo.update.mockResolvedValue({ affected: 1 } as any);
      typeormRepo.findOne.mockResolvedValue(updated as any);

      const result = await repository.update('tienda-1', {
        nombreComercial: 'Nueva Tienda',
      });

      expect(typeormRepo.update).toHaveBeenCalledWith('tienda-1', {
        nombreComercial: 'Nueva Tienda',
      });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should return true when a row was deleted', async () => {
      typeormRepo.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await repository.delete('tienda-1');

      expect(result).toBe(true);
    });

    it('should return false when no row was deleted', async () => {
      typeormRepo.delete.mockResolvedValue({ affected: 0 } as any);

      const result = await repository.delete('non-existent');

      expect(result).toBe(false);
    });
  });
});

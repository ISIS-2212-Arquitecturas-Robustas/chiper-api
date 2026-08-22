import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateTiendaDto, QueryTiendaDto, UpdateTiendaDto } from '../dtos';
import { TiendaRepository } from '../repositories';
import { EstadoCaptacion, Tienda } from '../repositories/entities';
import { TiendaService } from './tienda.service';

describe('TiendaService', () => {
  let service: TiendaService;
  let repository: jest.Mocked<TiendaRepository>;

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

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      exists: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TiendaService,
        {
          provide: TiendaRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TiendaService>(TiendaService);
    repository = module.get(TiendaRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a tienda', async () => {
      const dto: CreateTiendaDto = {
        codigoInterno: tienda.codigoInterno,
        nombreComercial: tienda.nombreComercial,
        responsableId: tienda.responsableId,
        paisId: tienda.paisId,
        rut: tienda.rut,
        direccion: tienda.direccion,
        telefono: tienda.telefono,
      };

      repository.create.mockResolvedValue(tienda);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('tienda-1');
      expect(result.nombreComercial).toBe('Tienda de prueba');
    });
  });

  describe('findAll', () => {
    it('should return all tiendas', async () => {
      const query: QueryTiendaDto = {
        nombreComercial: 'prueba',
      };

      repository.findAll.mockResolvedValue([tienda]);

      const result = await service.findAll(query);

      expect(repository.findAll).toHaveBeenCalledWith(query);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tienda-1');
    });
  });

  describe('findById', () => {
    it('should return a tienda when found', async () => {
      repository.findById.mockResolvedValue(tienda);

      const result = await service.findById('tienda-1');

      expect(repository.findById).toHaveBeenCalledWith('tienda-1');
      expect(result.id).toBe('tienda-1');
    });

    it('should throw NotFoundException when tienda is not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('exists', () => {
    it('should return true when tienda exists', async () => {
      repository.exists.mockResolvedValue(true);

      const result = await service.exists('tienda-1');

      expect(repository.exists).toHaveBeenCalledWith('tienda-1');
      expect(result).toBe(true);
    });

    it('should return false when tienda does not exist', async () => {
      repository.exists.mockResolvedValue(false);

      const result = await service.exists('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    it('should update and return the tienda', async () => {
      const dto: UpdateTiendaDto = {
        nombreComercial: 'Tienda actualizada',
      };
      const updatedTienda = {
        ...tienda,
        nombreComercial: 'Tienda actualizada',
      };

      repository.findById.mockResolvedValue(tienda);
      repository.update.mockResolvedValue(updatedTienda);

      const result = await service.update('tienda-1', dto);

      expect(repository.update).toHaveBeenCalledWith('tienda-1', dto);
      expect(result.nombreComercial).toBe('Tienda actualizada');
    });

    it('should throw NotFoundException when tienda is not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete the tienda', async () => {
      repository.findById.mockResolvedValue(tienda);
      repository.delete.mockResolvedValue(true);

      await service.delete('tienda-1');

      expect(repository.delete).toHaveBeenCalledWith('tienda-1');
    });

    it('should throw NotFoundException when tienda is not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

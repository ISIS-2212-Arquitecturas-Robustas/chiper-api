import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateTiendaDto, UpdateTiendaDto } from '../dtos';
import { TiendaRepository } from '../repositories';
import { EstadoCaptacion } from '../repositories/entities';
import { TiendaService } from './tienda.service';

describe('TiendaService', () => {
  let service: TiendaService;
  let repository: jest.Mocked<TiendaRepository>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
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
    it('should create and return tienda', async () => {
      const dto: CreateTiendaDto = {
        codigoInterno: 'T-001',
        nombreComercial: 'Tienda Central',
        responsableId: 'usuario-1',
        rut: '900123456-7',
        direccion: 'Calle Principal 123',
        telefono: '3001234567',
      };
      const entity = {
        id: 'tienda-1',
        ...dto,
        estadoCaptacion: EstadoCaptacion.PROSPECTO_CREADO,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.create.mockResolvedValue(entity as any);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('tienda-1');
    });
  });

  describe('findAll', () => {
    it('should return mapped tiendas', async () => {
      const entities = [
        {
          id: 'tienda-1',
          codigoInterno: 'T-001',
          nombreComercial: 'Tienda Central',
          responsableId: 'usuario-1',
          rut: '900123456-7',
          direccion: 'Calle Principal 123',
          telefono: '3001234567',
          estadoCaptacion: EstadoCaptacion.PROSPECTO_CREADO,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      repository.findAll.mockResolvedValue(entities as any);

      const result = await service.findAll({});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tienda-1');
    });
  });

  describe('findById', () => {
    it('should return tienda when found', async () => {
      const entity = {
        id: 'tienda-1',
        codigoInterno: 'T-001',
        nombreComercial: 'Tienda Central',
        responsableId: 'usuario-1',
        rut: '900123456-7',
        direccion: 'Calle Principal 123',
        telefono: '3001234567',
        estadoCaptacion: EstadoCaptacion.PROSPECTO_CREADO,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findById.mockResolvedValue(entity as any);

      const result = await service.findById('tienda-1');

      expect(result.id).toBe('tienda-1');
    });

    it('should throw NotFoundException when tienda not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return tienda', async () => {
      const dto: UpdateTiendaDto = { nombreComercial: 'Nueva Tienda' };
      const entity = {
        id: 'tienda-1',
        codigoInterno: 'T-001',
        nombreComercial: 'Nueva Tienda',
        responsableId: 'usuario-1',
        rut: '900123456-7',
        direccion: 'Calle Principal 123',
        telefono: '3001234567',
        estadoCaptacion: EstadoCaptacion.PROSPECTO_CREADO,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findById.mockResolvedValue(entity as any);
      repository.update.mockResolvedValue(entity as any);

      const result = await service.update('tienda-1', dto);

      expect(repository.update).toHaveBeenCalledWith('tienda-1', dto);
      expect(result.nombreComercial).toBe('Nueva Tienda');
    });

    it('should throw NotFoundException when tienda not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete tienda', async () => {
      const entity = { id: 'tienda-1' };

      repository.findById.mockResolvedValue(entity as any);
      repository.delete.mockResolvedValue(true);

      await service.delete('tienda-1');

      expect(repository.delete).toHaveBeenCalledWith('tienda-1');
    });

    it('should throw NotFoundException when tienda not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('exists', () => {
    it('should return true when tienda exists', async () => {
      repository.findById.mockResolvedValue({ id: 'tienda-1' } as any);

      const result = await service.exists('tienda-1');

      expect(result).toBe(true);
    });

    it('should return false when tienda does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.exists('non-existent');

      expect(result).toBe(false);
    });
  });
});

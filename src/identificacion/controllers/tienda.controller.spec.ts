import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateTiendaDto,
  QueryTiendaDto,
  TiendaResponseDto,
  UpdateTiendaDto,
} from '../dtos';
import { EstadoCaptacion } from '../repositories/entities';
import { TiendaService } from '../services';
import { TiendaController } from './tienda.controller';

describe('TiendaController', () => {
  let controller: TiendaController;
  let service: jest.Mocked<TiendaService>;

  const tiendaResponse: TiendaResponseDto = {
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
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      exists: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiendaController],
      providers: [
        {
          provide: TiendaService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TiendaController>(TiendaController);
    service = module.get(TiendaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a tienda', async () => {
      const dto: CreateTiendaDto = {
        codigoInterno: 'TIENDA-001',
        nombreComercial: 'Tienda de prueba',
        responsableId: '11111111-1111-4111-8111-111111111111',
        paisId: '22222222-2222-4222-8222-222222222222',
        rut: '900123456-7',
        direccion: 'Calle 1 # 2-3',
        telefono: '3001234567',
      };

      service.create.mockResolvedValue(tiendaResponse);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(tiendaResponse);
    });
  });

  describe('findAll', () => {
    it('should return all tiendas', async () => {
      const query: QueryTiendaDto = {
        nombreComercial: 'prueba',
      };

      service.findAll.mockResolvedValue([tiendaResponse]);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual([tiendaResponse]);
    });
  });

  describe('findById', () => {
    it('should return a tienda', async () => {
      service.findById.mockResolvedValue(tiendaResponse);

      const result = await controller.findById('tienda-1');

      expect(service.findById).toHaveBeenCalledWith('tienda-1');
      expect(result).toEqual(tiendaResponse);
    });
  });

  describe('update', () => {
    it('should update a tienda', async () => {
      const dto: UpdateTiendaDto = {
        nombreComercial: 'Tienda actualizada',
      };
      const updatedResponse = {
        ...tiendaResponse,
        nombreComercial: 'Tienda actualizada',
      };

      service.update.mockResolvedValue(updatedResponse);

      const result = await controller.update('tienda-1', dto);

      expect(service.update).toHaveBeenCalledWith('tienda-1', dto);
      expect(result.nombreComercial).toBe('Tienda actualizada');
    });
  });

  describe('delete', () => {
    it('should delete a tienda', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.delete('tienda-1');

      expect(service.delete).toHaveBeenCalledWith('tienda-1');
    });
  });
});

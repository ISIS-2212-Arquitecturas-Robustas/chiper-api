import { Test, TestingModule } from '@nestjs/testing';
import { CreateTiendaDto, QueryTiendaDto, UpdateTiendaDto } from '../dtos';
import { EstadoCaptacion } from '../repositories/entities';
import { TiendaService } from '../services';
import { TiendaController } from './tienda.controller';

describe('TiendaController', () => {
  let controller: TiendaController;
  let service: jest.Mocked<TiendaService>;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
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
    it('should call service.create with dto', async () => {
      const dto: CreateTiendaDto = {
        codigoInterno: 'T-001',
        nombreComercial: 'Tienda Central',
        responsableId: 'usuario-1',
        rut: '900123456-7',
        direccion: 'Calle Principal 123',
        telefono: '3001234567',
      };
      const response = {
        id: 'tienda-1',
        ...dto,
        estadoCaptacion: EstadoCaptacion.PROSPECTO_CREADO,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.create.mockResolvedValue(response);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(response);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with query', async () => {
      const query: QueryTiendaDto = { codigoInterno: 'T-001' };
      const response = [
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

      service.findAll.mockResolvedValue(response);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(response);
    });
  });

  describe('findById', () => {
    it('should call service.findById with id', async () => {
      const response = {
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

      service.findById.mockResolvedValue(response);

      const result = await controller.findById('tienda-1');

      expect(service.findById).toHaveBeenCalledWith('tienda-1');
      expect(result).toEqual(response);
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto: UpdateTiendaDto = { nombreComercial: 'Nueva Tienda' };
      const response = {
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

      service.update.mockResolvedValue(response);

      const result = await controller.update('tienda-1', dto);

      expect(service.update).toHaveBeenCalledWith('tienda-1', dto);
      expect(result).toEqual(response);
    });
  });

  describe('delete', () => {
    it('should call service.delete with id', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.delete('tienda-1');

      expect(service.delete).toHaveBeenCalledWith('tienda-1');
    });
  });
});

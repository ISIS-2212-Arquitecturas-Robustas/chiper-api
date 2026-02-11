import { Test, TestingModule } from '@nestjs/testing';
import {
    CreateDisponibilidadZonaDto,
    QueryDisponibilidadZonaDto,
    UpdateDisponibilidadZonaDto,
} from '../dtos';
import { DisponibilidadZonaService } from '../services';
import { DisponibilidadZonaController } from './disponibilidad-zona.controller';

describe('DisponibilidadZonaController', () => {
  let controller: DisponibilidadZonaController;
  let service: jest.Mocked<DisponibilidadZonaService>;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisponibilidadZonaController],
      providers: [
        {
          provide: DisponibilidadZonaService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DisponibilidadZonaController>(DisponibilidadZonaController);
    service = module.get(DisponibilidadZonaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto: CreateDisponibilidadZonaDto = {
        zona: 'ZONA_NORTE',
        esDisponible: true,
        horaInicio: '08:00',
        horaFin: '20:00',
      };
      const response = {
        id: 'dz-1',
        ...dto,
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
    it('should call service.findAll', async () => {
      const query: QueryDisponibilidadZonaDto = {};
      const response = [
        {
          id: 'dz-1',
          zona: 'ZONA_NORTE',
          esDisponible: true,
          horaInicio: '08:00',
          horaFin: '20:00',
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
        id: 'dz-1',
        zona: 'ZONA_NORTE',
        esDisponible: true,
        horaInicio: '08:00',
        horaFin: '20:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.findById.mockResolvedValue(response);

      const result = await controller.findById('dz-1');

      expect(service.findById).toHaveBeenCalledWith('dz-1');
      expect(result).toEqual(response);
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto: UpdateDisponibilidadZonaDto = { esDisponible: false };
      const response = {
        id: 'dz-1',
        zona: 'ZONA_NORTE',
        esDisponible: false,
        horaInicio: '08:00',
        horaFin: '20:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.update.mockResolvedValue(response);

      const result = await controller.update('dz-1', dto);

      expect(service.update).toHaveBeenCalledWith('dz-1', dto);
      expect(result).toEqual(response);
    });
  });

  describe('delete', () => {
    it('should call service.delete with id', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.delete('dz-1');

      expect(service.delete).toHaveBeenCalledWith('dz-1');
    });
  });
});

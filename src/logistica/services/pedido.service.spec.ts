import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TiendaClientMock } from '../clients';
import {
    CreatePedidoDto,
    QueryPedidoDto,
    UpdatePedidoDto,
} from '../dtos';
import { PedidoRepository, ProductoRepository } from '../repositories';
import { PedidoService } from './pedido.service';

describe('PedidoService', () => {
  let service: PedidoService;
  let repository: jest.Mocked<PedidoRepository>;
  let productoRepository: jest.Mocked<ProductoRepository>;
  let tiendaClient: jest.Mocked<TiendaClientMock>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockProductoRepository = {
      findById: jest.fn(),
    };

    const mockTiendaClient = {
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedidoService,
        {
          provide: PedidoRepository,
          useValue: mockRepository,
        },
        {
          provide: ProductoRepository,
          useValue: mockProductoRepository,
        },
        {
          provide: TiendaClientMock,
          useValue: mockTiendaClient,
        },
      ],
    }).compile();

    service = module.get<PedidoService>(PedidoService);
    repository = module.get(PedidoRepository);
    productoRepository = module.get(ProductoRepository);
    tiendaClient = module.get(TiendaClientMock);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return pedido when tienda and productos exist', async () => {
      const dto: CreatePedidoDto = {
        identificador: 'PED-001',
        tiendaId: 'tienda-1',
        fechaHoraCreacion: new Date(),
        montoTotal: 1000,
        monedaId: 'usd-1',
        estado: 'PENDIENTE',
        items: [
          {
            productoId: 'prod-1',
            cantidad: 2,
            precioUnitario: 500,
            descuento: 0,
            monedaId: 'usd-1',
          },
        ],
      };
      const producto = { id: 'prod-1' };
      const entity = {
        id: 'ped-1',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      tiendaClient.exists.mockResolvedValue(true);
      productoRepository.findById.mockResolvedValue(producto as any);
      repository.create.mockResolvedValue(entity as any);

      const result = await service.create(dto);

      expect(tiendaClient.exists).toHaveBeenCalledWith('tienda-1');
      expect(productoRepository.findById).toHaveBeenCalledWith('prod-1');
      expect(repository.create).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: 'ped-1',
        identificador: 'PED-001',
        tiendaId: 'tienda-1',
      }));
    });

    it('should throw BadRequestException when tienda does not exist', async () => {
      const dto: CreatePedidoDto = {
        identificador: 'PED-001',
        tiendaId: 'non-existent',
        fechaHoraCreacion: new Date(),
        montoTotal: 1000,
        monedaId: 'usd-1',
        estado: 'PENDIENTE',
        items: [],
      };

      tiendaClient.exists.mockResolvedValue(false);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when producto does not exist', async () => {
      const dto: CreatePedidoDto = {
        identificador: 'PED-001',
        tiendaId: 'tienda-1',
        fechaHoraCreacion: new Date(),
        montoTotal: 1000,
        monedaId: 'usd-1',
        estado: 'PENDIENTE',
        items: [
          {
            productoId: 'non-existent',
            cantidad: 2,
            precioUnitario: 500,
            descuento: 0,
            monedaId: 'usd-1',
          },
        ],
      };

      tiendaClient.exists.mockResolvedValue(true);
      productoRepository.findById.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return mapped pedidos', async () => {
      const query: QueryPedidoDto = { tiendaId: 'tienda-1' };
      const entities = [
        {
          id: 'ped-1',
          identificador: 'PED-001',
          tiendaId: 'tienda-1',
          fechaHoraCreacion: new Date(),
          montoTotal: 1000,
          monedaId: 'usd-1',
          estado: 'PENDIENTE',
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      repository.findAll.mockResolvedValue(entities as any);

      const result = await service.findAll(query);

      expect(repository.findAll).toHaveBeenCalledWith(query);
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return pedido when found', async () => {
      const entity = {
        id: 'ped-1',
        identificador: 'PED-001',
        tiendaId: 'tienda-1',
        fechaHoraCreacion: new Date(),
        montoTotal: 1000,
        monedaId: 'usd-1',
        estado: 'PENDIENTE',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findById.mockResolvedValue(entity as any);

      const result = await service.findById('ped-1');

      expect(result.id).toBe('ped-1');
    });

    it('should throw NotFoundException when pedido not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return pedido', async () => {
      const dto: UpdatePedidoDto = { estado: 'COMPLETADO' };
      const entity = {
        id: 'ped-1',
        identificador: 'PED-001',
        tiendaId: 'tienda-1',
        fechaHoraCreacion: new Date(),
        montoTotal: 1000,
        monedaId: 'usd-1',
        estado: 'PENDIENTE',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updated = { ...entity, estado: 'COMPLETADO' };

      repository.findById.mockResolvedValue(entity as any);
      repository.update.mockResolvedValue(updated as any);

      const result = await service.update('ped-1', dto);

      expect(result.estado).toBe('COMPLETADO');
    });

    it('should throw NotFoundException when pedido not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete pedido', async () => {
      const entity = {
        id: 'ped-1',
        identificador: 'PED-001',
        tiendaId: 'tienda-1',
        fechaHoraCreacion: new Date(),
        montoTotal: 1000,
        monedaId: 'usd-1',
        estado: 'PENDIENTE',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findById.mockResolvedValue(entity as any);

      await service.delete('ped-1');

      expect(repository.delete).toHaveBeenCalledWith('ped-1');
    });

    it('should throw NotFoundException when pedido not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

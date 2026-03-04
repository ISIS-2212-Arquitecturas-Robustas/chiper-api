import { Test, TestingModule } from '@nestjs/testing';
import { QueryProductosDisponiblesDto } from '../dtos';
import {
  CatalogoRepository,
  DisponibilidadZonaRepository,
  PedidoRepository,
  ProductoRepository,
  PromocionRepository,
} from '../repositories';
import { TenderoService } from './tendero.service';

const TIENDA_ID = '9a2f2e7b-40c4-4c5f-a37c-baf722e18ab9';
const ZONA = 'Zona Norte';
const PRODUCTO_ID = 'prod-1';
const CATALOGO_ID = 'cat-1';

const makePromocion = (overrides: Partial<Record<string, any>> = {}) => ({
  id: 'promo-1',
  productoId: PRODUCTO_ID,
  tiendaIds: [TIENDA_ID],
  inicio: new Date(Date.now() - 1000 * 60 * 60),
  fin: new Date(Date.now() + 1000 * 60 * 60),
  ...overrides,
});

const makePedido = (productoId = PRODUCTO_ID) => ({
  id: 'pedido-1',
  tiendaId: TIENDA_ID,
  items: [{ productoId }],
});

const makeCatalogo = (zona = ZONA) => ({ id: CATALOGO_ID, zona });

const makeDisponibilidad = (cantidadDisponible = 5) => ({
  id: 'disp-1',
  catalogoId: CATALOGO_ID,
  productoId: PRODUCTO_ID,
  cantidadDisponible,
});

const makeProducto = () => ({
  id: PRODUCTO_ID,
  codigoInterno: 'PI-001',
  codigoBarras: '1234567890',
  nombre: 'Producto Test',
  marca: 'Marca A',
  categoria: 'Categoría 1',
  presentacion: '500ml',
  precioBase: 10.5,
  monedaId: 'moneda-1',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('TenderoService', () => {
  let service: TenderoService;
  let pedidoRepository: jest.Mocked<PedidoRepository>;
  let promocionRepository: jest.Mocked<PromocionRepository>;
  let catalogoRepository: jest.Mocked<CatalogoRepository>;
  let disponibilidadZonaRepository: jest.Mocked<DisponibilidadZonaRepository>;
  let productoRepository: jest.Mocked<ProductoRepository>;

  beforeEach(async () => {
    const mockPedidoRepository = { findAll: jest.fn() };
    const mockPromocionRepository = { findAll: jest.fn() };
    const mockCatalogoRepository = { findAll: jest.fn() };
    const mockDisponibilidadZonaRepository = { findAll: jest.fn() };
    const mockProductoRepository = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenderoService,
        { provide: PedidoRepository, useValue: mockPedidoRepository },
        { provide: PromocionRepository, useValue: mockPromocionRepository },
        { provide: CatalogoRepository, useValue: mockCatalogoRepository },
        {
          provide: DisponibilidadZonaRepository,
          useValue: mockDisponibilidadZonaRepository,
        },
        { provide: ProductoRepository, useValue: mockProductoRepository },
      ],
    }).compile();

    service = module.get<TenderoService>(TenderoService);
    pedidoRepository = module.get(PedidoRepository);
    promocionRepository = module.get(PromocionRepository);
    catalogoRepository = module.get(CatalogoRepository);
    disponibilidadZonaRepository = module.get(DisponibilidadZonaRepository);
    productoRepository = module.get(ProductoRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const dto: QueryProductosDisponiblesDto = { tiendaId: TIENDA_ID, zona: ZONA };

  describe('getProductosDisponibles', () => {
    it('should return products that intersect all three conditions', async () => {
      pedidoRepository.findAll.mockResolvedValue([makePedido()] as any);
      promocionRepository.findAll.mockResolvedValue([makePromocion()] as any);
      catalogoRepository.findAll.mockResolvedValue([makeCatalogo()] as any);
      disponibilidadZonaRepository.findAll.mockResolvedValue([
        makeDisponibilidad(),
      ] as any);
      productoRepository.findById.mockResolvedValue(makeProducto() as any);

      const result = await service.getProductosDisponibles(dto);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(PRODUCTO_ID);
      expect(pedidoRepository.findAll).toHaveBeenCalledWith({
        tiendaId: TIENDA_ID,
      });
      expect(promocionRepository.findAll).toHaveBeenCalledWith({});
      expect(catalogoRepository.findAll).toHaveBeenCalledWith({});
      expect(disponibilidadZonaRepository.findAll).toHaveBeenCalledWith({
        catalogoId: CATALOGO_ID,
      });
      expect(productoRepository.findById).toHaveBeenCalledWith(PRODUCTO_ID);
    });

    it('should return empty array when tendero has no prior orders', async () => {
      pedidoRepository.findAll.mockResolvedValue([]);

      const result = await service.getProductosDisponibles(dto);

      expect(result).toHaveLength(0);
      expect(promocionRepository.findAll).not.toHaveBeenCalled();
    });

    it('should return empty array when no active promotions exist for the tienda', async () => {
      pedidoRepository.findAll.mockResolvedValue([makePedido()] as any);
      // Promotion exists but expired
      promocionRepository.findAll.mockResolvedValue([
        makePromocion({ fin: new Date(Date.now() - 1000) }),
      ] as any);

      const result = await service.getProductosDisponibles(dto);

      expect(result).toHaveLength(0);
      expect(catalogoRepository.findAll).not.toHaveBeenCalled();
    });

    it('should return empty array when promotion does not belong to the tienda', async () => {
      pedidoRepository.findAll.mockResolvedValue([makePedido()] as any);
      promocionRepository.findAll.mockResolvedValue([
        makePromocion({ tiendaIds: ['other-tienda-id'] }),
      ] as any);

      const result = await service.getProductosDisponibles(dto);

      expect(result).toHaveLength(0);
    });

    it('should return empty array when no catalogs exist for the requested zona', async () => {
      pedidoRepository.findAll.mockResolvedValue([makePedido()] as any);
      promocionRepository.findAll.mockResolvedValue([makePromocion()] as any);
      catalogoRepository.findAll.mockResolvedValue([
        makeCatalogo('Zona Sur'),
      ] as any);

      const result = await service.getProductosDisponibles(dto);

      expect(result).toHaveLength(0);
      expect(disponibilidadZonaRepository.findAll).not.toHaveBeenCalled();
    });

    it('should return empty array when product has no disponibilidad (cantidadDisponible = 0)', async () => {
      pedidoRepository.findAll.mockResolvedValue([makePedido()] as any);
      promocionRepository.findAll.mockResolvedValue([makePromocion()] as any);
      catalogoRepository.findAll.mockResolvedValue([makeCatalogo()] as any);
      disponibilidadZonaRepository.findAll.mockResolvedValue([
        makeDisponibilidad(0),
      ] as any);

      const result = await service.getProductosDisponibles(dto);

      expect(result).toHaveLength(0);
    });

    it('should return empty array when previously ordered product is not in zone catalog', async () => {
      pedidoRepository.findAll.mockResolvedValue([
        makePedido('other-prod-id'),
      ] as any);
      promocionRepository.findAll.mockResolvedValue([makePromocion()] as any);
      catalogoRepository.findAll.mockResolvedValue([makeCatalogo()] as any);
      disponibilidadZonaRepository.findAll.mockResolvedValue([
        makeDisponibilidad(),
      ] as any);

      const result = await service.getProductosDisponibles(dto);

      expect(result).toHaveLength(0);
      expect(productoRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle multiple pedidos and return correct intersection', async () => {
      const PRODUCTO_2 = 'prod-2';
      const pedidos = [makePedido(PRODUCTO_ID), makePedido(PRODUCTO_2)];
      const promociones = [
        makePromocion({ productoId: PRODUCTO_ID }),
        makePromocion({ id: 'promo-2', productoId: PRODUCTO_2 }),
      ];
      const disponibilidades = [
        makeDisponibilidad(),
        {
          id: 'disp-2',
          catalogoId: CATALOGO_ID,
          productoId: PRODUCTO_2,
          cantidadDisponible: 3,
        },
      ];
      const producto2 = { ...makeProducto(), id: PRODUCTO_2 };

      pedidoRepository.findAll.mockResolvedValue(pedidos as any);
      promocionRepository.findAll.mockResolvedValue(promociones as any);
      catalogoRepository.findAll.mockResolvedValue([makeCatalogo()] as any);
      disponibilidadZonaRepository.findAll.mockResolvedValue(
        disponibilidades as any,
      );
      productoRepository.findById
        .mockResolvedValueOnce(makeProducto() as any)
        .mockResolvedValueOnce(producto2 as any);

      const result = await service.getProductosDisponibles(dto);

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toContain(PRODUCTO_ID);
      expect(result.map((r) => r.id)).toContain(PRODUCTO_2);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { CatalogoProductoRepository } from './catalogo-producto.repository';
import { CatalogoProducto } from './entities';

describe('CatalogoProductoRepository', () => {
  let repository: CatalogoProductoRepository;
  let typeormRepo: jest.Mocked<Repository<CatalogoProducto>>;

  beforeEach(async () => {
    const mockTypeormRepo = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogoProductoRepository,
        {
          provide: 'CATALOGO_PRODUCTO_REPOSITORY',
          useValue: mockTypeormRepo,
        },
      ],
    }).compile();

    repository = module.get<CatalogoProductoRepository>(
      CatalogoProductoRepository,
    );
    typeormRepo = module.get('CATALOGO_PRODUCTO_REPOSITORY');
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('addProductoToCatalogo', () => {
    it('should create and save catalogo producto relation', async () => {
      const catalogoId = 'catalogo-1';
      const productoId = 'producto-1';
      const created = { id: 'cp-1', catalogoId, productoId };
      const saved = {
        ...created,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      typeormRepo.create.mockReturnValue(created as any);
      typeormRepo.save.mockResolvedValue(saved as any);

      const result = await repository.addProductoToCatalogo(
        catalogoId,
        productoId,
      );

      expect(typeormRepo.create).toHaveBeenCalledWith({
        catalogoId,
        productoId,
      });
      expect(typeormRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(saved);
    });
  });

  describe('findByCatalogoId', () => {
    it('should find all productos for a catalog', async () => {
      const catalogoId = 'catalogo-1';
      const items: CatalogoProducto[] = [
        {
          id: 'cp-1',
          catalogoId,
          catalogo: { id: catalogoId, tiendaId: 'tienda-1' } as any,
          productoId: 'producto-1',
          producto: { id: 'producto-1', nombre: 'Product 1' } as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      typeormRepo.find.mockResolvedValue(items as any);

      const result = await repository.findByCatalogoId(catalogoId);

      expect(typeormRepo.find).toHaveBeenCalledWith({
        where: { catalogoId },
        relations: ['producto'],
      });
      expect(result).toEqual(items);
    });
  });

  describe('exists', () => {
    it('should return true when relation exists', async () => {
      const catalogoId = 'catalogo-1';
      const productoId = 'producto-1';

      typeormRepo.count.mockResolvedValue(1 as any);

      const result = await repository.exists(catalogoId, productoId);

      expect(typeormRepo.count).toHaveBeenCalledWith({
        where: { catalogoId, productoId },
      });
      expect(result).toBe(true);
    });

    it('should return false when relation does not exist', async () => {
      const catalogoId = 'catalogo-1';
      const productoId = 'producto-1';

      typeormRepo.count.mockResolvedValue(0 as any);

      const result = await repository.exists(catalogoId, productoId);

      expect(result).toBe(false);
    });
  });

  describe('removeProductoFromCatalogo', () => {
    it('should remove producto from catalog and return true', async () => {
      const catalogoId = 'catalogo-1';
      const productoId = 'producto-1';

      typeormRepo.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await repository.removeProductoFromCatalogo(
        catalogoId,
        productoId,
      );

      expect(typeormRepo.delete).toHaveBeenCalledWith({
        catalogoId,
        productoId,
      });
      expect(result).toBe(true);
    });

    it('should return false when relation not found', async () => {
      const catalogoId = 'catalogo-1';
      const productoId = 'producto-1';

      typeormRepo.delete.mockResolvedValue({ affected: 0 } as any);

      const result = await repository.removeProductoFromCatalogo(
        catalogoId,
        productoId,
      );

      expect(result).toBe(false);
    });
  });
});

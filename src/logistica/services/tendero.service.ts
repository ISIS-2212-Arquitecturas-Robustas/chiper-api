import { Injectable } from '@nestjs/common';
import { ProductoResponseDto, QueryProductosDisponiblesDto } from '../dtos';
import {
  CatalogoRepository,
  DisponibilidadZonaRepository,
  PedidoRepository,
  ProductoRepository,
  PromocionRepository,
} from '../repositories';
import { Producto } from '../repositories/entities';

@Injectable()
export class TenderoService {
  constructor(
    private readonly pedidoRepository: PedidoRepository,
    private readonly promocionRepository: PromocionRepository,
    private readonly catalogoRepository: CatalogoRepository,
    private readonly disponibilidadZonaRepository: DisponibilidadZonaRepository,
    private readonly productoRepository: ProductoRepository,
  ) {}

  async getProductosDisponibles(
    dto: QueryProductosDisponiblesDto,
  ): Promise<ProductoResponseDto[]> {
    const { tiendaId, zona } = dto as { tiendaId: string; zona: string };

    // Paso A: productos alguna vez pedidos por esta tienda
    const pedidos = await this.pedidoRepository.findAll({ tiendaId });
    const pedidoProductoIds = new Set<string>(
      pedidos.flatMap((p) => (p.items ?? []).map((i) => i.productoId)),
    );
    if (pedidoProductoIds.size === 0) return [];

    // Paso B: productos actualmente en promoción para esta tienda
    const todasPromociones = await this.promocionRepository.findAll({});
    const now = new Date();
    const promocionesActivas = todasPromociones.filter((promo) => {
      const tiendaIncluida = promo.tiendaIds.includes(tiendaId);
      const vigente = promo.inicio <= now && promo.fin >= now;
      return tiendaIncluida && vigente;
    });
    const promocionProductoIds = new Set<string>(
      promocionesActivas.map((p) => p.productoId),
    );
    if (promocionProductoIds.size === 0) return [];

    // Paso C: productos disponibles en el catálogo de la zona solicitada
    const todosCatalogos = await this.catalogoRepository.findAll({});
    const catalogosDeZona = todosCatalogos.filter((c) => c.zona === zona);
    if (catalogosDeZona.length === 0) return [];

    const disponibilidades = (
      await Promise.all(
        catalogosDeZona.map((c) =>
          this.disponibilidadZonaRepository.findAll({ catalogoId: c.id }),
        ),
      )
    )
      .flat()
      .filter((d) => d.cantidadDisponible > 0);

    const disponibleProductoIds = new Set<string>(
      disponibilidades.map((d) => d.productoId),
    );
    if (disponibleProductoIds.size === 0) return [];

    // Intersección de los tres conjuntos
    const intersectionIds = [...pedidoProductoIds].filter(
      (id) => promocionProductoIds.has(id) && disponibleProductoIds.has(id),
    );
    if (intersectionIds.length === 0) return [];

    // Obtener detalles de los productos resultantes
    const productos = await Promise.all(
      intersectionIds.map((id) => this.productoRepository.findById(id)),
    );

    return productos
      .filter((p): p is Producto => p !== null)
      .map((p) => this.mapToResponse(p));
  }

  private mapToResponse(producto: Producto): ProductoResponseDto {
    return {
      id: producto.id,
      codigoInterno: producto.codigoInterno,
      codigoBarras: producto.codigoBarras,
      nombre: producto.nombre,
      marca: producto.marca,
      categoria: producto.categoria,
      presentacion: producto.presentacion,
      precioBase: producto.precioBase,
      monedaId: producto.monedaId,
      createdAt: producto.createdAt,
      updatedAt: producto.updatedAt,
    };
  }
}

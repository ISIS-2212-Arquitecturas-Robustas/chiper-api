import { Injectable } from '@nestjs/common';

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
}

@Injectable()
export class ProductoClientMock {
  private productos: Map<string, Producto> = new Map([
    [
      '3f9f1b40-d100-4fca-b186-6bdd040d5945',
      {
        id: '3f9f1b40-d100-4fca-b186-6bdd040d5945',
        nombre: 'Producto A',
        descripcion: 'Descripción del producto A',
      },
    ],
    [
      '3f9f1b40-d100-4fca-b186-6bdd040d5946',
      {
        id: '3f9f1b40-d100-4fca-b186-6bdd040d5946',
        nombre: 'Producto B',
        descripcion: 'Descripción del producto B',
      },
    ],
    [
      '3f9f1b40-d100-4fca-b186-6bdd040d5947',
      {
        id: '3f9f1b40-d100-4fca-b186-6bdd040d5947',
        nombre: 'Producto C',
        descripcion: 'Descripción del producto C',
      },
    ],
  ]);

  async findById(id: string): Promise<Producto | null> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simula latencia
    return this.productos.get(id) || null;
  }

  async exists(id: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simula latencia
    return this.productos.has(id);
  }
}

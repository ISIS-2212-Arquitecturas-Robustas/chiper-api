import { Injectable } from '@nestjs/common';

export interface Tienda {
  id: string;
  nombre: string;
  nombreComercial: string;
  direccion: string;
  codigoInterno: string;
  rut: string;
}

@Injectable()
export class TiendaClientMock {
  private readonly tiendas = new Map<string, Tienda>([
    [
      '9a2f2e7b-40c4-4c5f-a37c-baf722e18ab9',
      {
        id: '9a2f2e7b-40c4-4c5f-a37c-baf722e18ab9',
        nombre: 'Tienda Central',
        nombreComercial: 'Tienda Central',
        direccion: 'Calle Principal 123',
        codigoInterno: 'TC001',
        rut: '123456789',
      },
    ],
    [
      '9a2f2e7b-40c4-4c5f-a37c-baf722e18aba',
      {
        id: '9a2f2e7b-40c4-4c5f-a37c-baf722e18aba',
        nombre: 'Tienda Norte',
        nombreComercial: 'Tienda Norte',
        direccion: 'Avenida Norte 456',
        codigoInterno: 'TN002',
        rut: '123456789',
      },
    ],
    [
      '9a2f2e7b-40c4-4c5f-a37c-baf722e18abb',
      {
        id: '9a2f2e7b-40c4-4c5f-a37c-baf722e18abb',
        nombre: 'Tienda Sur',
        nombreComercial: 'Tienda Sur',
        direccion: 'Boulevard Sur 789',
        codigoInterno: 'TS003',
        rut: '123456789',
      },
    ],
  ]);

  async exists(id: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return this.tiendas.has(id);
  }

  async findById(id: string): Promise<Tienda | null> {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return this.tiendas.get(id) || null;
  }

  async findByIds(ids: string[]): Promise<Tienda[]> {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return ids
      .map((id) => this.tiendas.get(id))
      .filter((tienda): tienda is Tienda => tienda !== undefined);
  }
}

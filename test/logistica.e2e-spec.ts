import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../apps/logistica/src/app.module';
import {
  Catalogo,
  Despacho,
  DisponibilidadZona,
  ItemPedido,
  NotaCredito,
  Pedido,
  Producto,
  Promocion,
} from '../libs/logistica/src/repositories/entities';
import { resetDatabase } from './support/test-database';

describe('Logistica (e2e)', () => {
  let app: INestApplication<App>;
  let productoId: string;

  beforeAll(async () => {
    await resetDatabase([
      Catalogo,
      Despacho,
      DisponibilidadZona,
      ItemPedido,
      NotaCredito,
      Pedido,
      Producto,
      Promocion,
    ]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('creates, reads, updates and deletes a producto', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/logistics/productos')
      .send({
        codigoInterno: 'TEST-PROD-001',
        codigoBarras: '1234567890123',
        nombre: 'Producto Test',
        marca: 'Marca Test',
        categoria: 'Categoria Test',
        presentacion: 'Unidad',
        precioBase: 50,
        monedaId: '550e8400-e29b-41d4-a716-446655440000',
      })
      .expect(201);

    productoId = createResponse.body.id as string;

    const listResponse = await request(app.getHttpServer())
      .get('/logistics/productos')
      .expect(200);
    expect(listResponse.body.length).toBeGreaterThan(0);

    const getResponse = await request(app.getHttpServer())
      .get(`/logistics/productos/${productoId}`)
      .expect(200);
    expect(getResponse.body.id).toBe(productoId);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/logistics/productos/${productoId}`)
      .send({ nombre: 'Producto Actualizado' })
      .expect(200);
    expect(updateResponse.body.nombre).toBe('Producto Actualizado');

    await request(app.getHttpServer())
      .delete(`/logistics/productos/${productoId}`)
      .expect(200);
  });
});

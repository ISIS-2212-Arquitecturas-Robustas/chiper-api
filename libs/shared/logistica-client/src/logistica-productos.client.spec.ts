import { ServiceUnavailableException } from '@nestjs/common';
import { LogisticaProductosClient } from './logistica-productos.client';

describe('LogisticaProductosClient', () => {
  const originalBaseUrl = process.env.LOGISTICA_BASE_URL;
  const originalTimeout = process.env.LOGISTICA_TIMEOUT_MS;
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalBaseUrl === undefined) {
      delete process.env.LOGISTICA_BASE_URL;
    } else {
      process.env.LOGISTICA_BASE_URL = originalBaseUrl;
    }

    if (originalTimeout === undefined) {
      delete process.env.LOGISTICA_TIMEOUT_MS;
    } else {
      process.env.LOGISTICA_TIMEOUT_MS = originalTimeout;
    }

    global.fetch = originalFetch;
  });

  it('returns true when logistica responds with 200', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ id: 'producto-1' }), { status: 200 }),
      );

    process.env.LOGISTICA_BASE_URL = 'http://logistica.test';
    const client = new LogisticaProductosClient();

    await expect(client.exists('producto-1')).resolves.toBe(true);
  });

  it('returns false when logistica responds with 404', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(new Response(null, { status: 404 }));

    process.env.LOGISTICA_BASE_URL = 'http://logistica.test';
    const client = new LogisticaProductosClient();

    await expect(client.exists('missing-product')).resolves.toBe(false);
  });

  it('throws ServiceUnavailableException on 5xx responses', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(new Response(null, { status: 503 }));

    process.env.LOGISTICA_BASE_URL = 'http://logistica.test';
    const client = new LogisticaProductosClient();

    await expect(client.exists('producto-1')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('throws ServiceUnavailableException on timeout/network errors', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network timeout'));

    process.env.LOGISTICA_BASE_URL = 'http://logistica.test';
    process.env.LOGISTICA_TIMEOUT_MS = '25';
    const client = new LogisticaProductosClient();

    await expect(client.exists('producto-1')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});

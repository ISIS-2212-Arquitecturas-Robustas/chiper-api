import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class LogisticaProductosClient {
  private readonly baseUrl =
    process.env.LOGISTICA_BASE_URL || 'http://localhost:3001';
  private readonly timeoutMs = parseInt(
    process.env.LOGISTICA_TIMEOUT_MS || '3000',
    10,
  );

  async exists(productoId: string): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(
        `${this.baseUrl}/logistics/productos/${productoId}`,
        {
          method: 'GET',
          signal: controller.signal,
        },
      );

      if (response.status === 404) {
        return false;
      }

      if (!response.ok) {
        throw new ServiceUnavailableException(
          'Logistica service is unavailable',
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new ServiceUnavailableException('Logistica service is unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }
}

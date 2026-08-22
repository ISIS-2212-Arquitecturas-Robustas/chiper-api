import { EstadoCaptacion } from '../../repositories/entities';

export class TiendaResponseDto {
  id: string;
  codigoInterno: string;
  nombreComercial: string;
  responsableId: string;
  paisId: string;
  rut: string;
  direccion: string;
  telefono: string;
  estadoCaptacion: EstadoCaptacion;
  createdAt: Date;
  updatedAt: Date;
}

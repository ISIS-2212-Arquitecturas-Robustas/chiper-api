import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoCaptacion } from '../../repositories/entities';

export class QueryTiendaDto {
  @IsOptional()
  @IsString()
  codigoInterno?: string;

  @IsOptional()
  @IsEnum(EstadoCaptacion)
  estadoCaptacion?: EstadoCaptacion;
}

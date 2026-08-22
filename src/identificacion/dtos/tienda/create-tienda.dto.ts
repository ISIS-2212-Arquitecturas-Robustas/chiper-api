import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { EstadoCaptacion } from '../../repositories/entities';

export class CreateTiendaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  codigoInterno: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombreComercial: string;

  @IsUUID()
  responsableId: string;

  @IsUUID()
  paisId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  rut: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  direccion: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  telefono: string;

  @IsOptional()
  @IsEnum(EstadoCaptacion)
  estadoCaptacion?: EstadoCaptacion;
}

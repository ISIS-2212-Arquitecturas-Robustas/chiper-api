import {
  IsDateString,
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePromocionDto {
  @IsString()
  @MaxLength(255)
  nombre: string;

  @IsNumber()
  @IsPositive()
  precioPromocional: number;

  @IsUUID()
  monedaId: string;

  @IsDateString()
  inicio: Date;

  @IsDateString()
  fin: Date;

  @IsInt()
  @Min(0)
  restricciones: number;
}

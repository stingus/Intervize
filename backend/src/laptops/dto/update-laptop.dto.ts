import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum LaptopStatus {
  available = 'available',
  checked_out = 'checked_out',
  maintenance = 'maintenance',
  retired = 'retired',
}

export class UpdateLaptopDto {
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsString()
  @IsOptional()
  make?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsEnum(LaptopStatus)
  @IsOptional()
  status?: LaptopStatus;
}

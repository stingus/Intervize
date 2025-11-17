import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export enum LaptopStatus {
  available = 'available',
  checked_out = 'checked_out',
  maintenance = 'maintenance',
  retired = 'retired',
}

export class CreateLaptopDto {
  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsString()
  @IsNotEmpty()
  make: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsEnum(LaptopStatus)
  @IsOptional()
  status?: LaptopStatus;
}

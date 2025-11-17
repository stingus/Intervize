import { IsNotEmpty, IsString } from 'class-validator';

export class ReportLostDto {
  @IsNotEmpty()
  @IsString()
  laptopUniqueId: string;
}

import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ReportFoundDto {
  @IsNotEmpty()
  @IsString()
  laptopUniqueId: string;

  @IsNotEmpty()
  @IsUUID()
  finderUserId: string;
}

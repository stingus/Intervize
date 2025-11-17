import { IsNotEmpty, IsString } from 'class-validator';

export class CheckinLaptopDto {
  @IsNotEmpty()
  @IsString()
  laptopUniqueId: string;
}

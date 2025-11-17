import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CheckoutLaptopDto {
  @IsNotEmpty()
  @IsString()
  laptopUniqueId: string;

  @IsNotEmpty()
  @IsUUID()
  userId: string;
}

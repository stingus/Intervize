import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      success: true,
      data: user,
      message: 'User created successfully',
    };
  }

  @Get()
  @Roles('admin')
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      success: true,
      data: users,
      message: 'Users retrieved successfully',
    };
  }

  @Get('me')
  async getMe(@CurrentUser() user: JwtPayload) {
    const userData = await this.usersService.findOne(user.sub);
    return {
      success: true,
      data: userData,
      message: 'User profile retrieved successfully',
    };
  }

  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return {
      success: true,
      data: user,
      message: 'User retrieved successfully',
    };
  }

  @Patch(':id')
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      success: true,
      data: user,
      message: 'User updated successfully',
    };
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Users can only update their own name, not email or role
    const allowedUpdates: UpdateUserDto = {
      name: updateUserDto.name,
      password: updateUserDto.password,
    };
    const updatedUser = await this.usersService.update(user.sub, allowedUpdates);
    return {
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    };
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const result = await this.usersService.remove(id);
    return {
      success: true,
      message: result.message,
    };
  }
}

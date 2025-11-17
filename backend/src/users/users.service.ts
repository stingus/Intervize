import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../config/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ErrorCode } from '../common/enums/error-codes.enum';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser && !existingUser.deletedAt) {
      throw new ConflictException({
        code: ErrorCode.BIZ_EMAIL_ALREADY_EXISTS,
        message: 'Email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash: hashedPassword,
        name: createUserDto.name,
        role: createUserDto.role || 'interviewer',
        groupName: createUserDto.groupName,
        team: createUserDto.team,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        groupName: true,
        team: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        groupName: true,
        team: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        groupName: true,
        team: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND_USER,
        message: 'User not found',
      });
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Check if user exists and is not deleted
    const existingUser = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingUser) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND_USER,
        message: 'User not found',
      });
    }

    // Check if email is being updated and already exists
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (emailExists) {
        throw new ConflictException({
          code: ErrorCode.BIZ_EMAIL_ALREADY_EXISTS,
          message: 'Email already exists',
        });
      }
    }

    // Prepare update data
    const updateData: any = {
      email: updateUserDto.email,
      name: updateUserDto.name,
      role: updateUserDto.role,
      groupName: updateUserDto.groupName,
      team: updateUserDto.team,
    };

    // Hash password if provided
    if (updateUserDto.password) {
      updateData.passwordHash = await bcrypt.hash(updateUserDto.password, 12);
    }

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        groupName: true,
        team: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async remove(id: string) {
    // Check if user exists and is not deleted
    const existingUser = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingUser) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND_USER,
        message: 'User not found',
      });
    }

    // Check if user has active checkouts
    const activeCheckout = await this.prisma.checkout.findFirst({
      where: {
        userId: id,
        status: 'active',
      },
    });

    if (activeCheckout) {
      throw new BadRequestException({
        code: ErrorCode.BIZ_USER_HAS_ACTIVE_CHECKOUT,
        message: 'Cannot delete user with active checkout',
      });
    }

    // Soft delete the user
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'User deleted successfully' };
  }
}

import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from '../dto/request/create-user.dto.js';
import { UserResponseDto } from '../dto/response/user-response.dto.js';
import { UsersService } from '../services/users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return UserResponseDto.from(await this.usersService.createUser(dto));
  }
}

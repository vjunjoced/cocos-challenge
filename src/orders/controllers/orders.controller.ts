import { Body, Controller, Post } from '@nestjs/common';
import { CreateCashMovementDto } from '../dto/request/create-cash-movement.dto.js';
import { CreateOrderDto } from '../dto/request/create-order.dto.js';
import { OrderResponseDto } from '../dto/response/order-response.dto.js';
import { OrdersService } from '../services/orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto): Promise<OrderResponseDto> {
    return OrderResponseDto.from(await this.ordersService.placeOrder(dto));
  }

  @Post('cash')
  async createCash(
    @Body() dto: CreateCashMovementDto,
  ): Promise<OrderResponseDto> {
    return OrderResponseDto.from(
      await this.ordersService.placeCashMovement(dto),
    );
  }
}

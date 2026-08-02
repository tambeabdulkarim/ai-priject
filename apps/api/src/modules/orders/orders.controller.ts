// docs/16-API-CONTRACT.md §11 (Orders).

import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListAdminOrdersQueryDto, ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // docs/16-API-CONTRACT.md: "10 requests / 15 min per user"
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @Post('orders')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.sub, dto);
  }

  @Get('orders/me')
  listMine(@CurrentUser() user: JwtPayload, @Query() query: ListOrdersQueryDto) {
    return this.ordersService.listMine(user.sub, query);
  }

  @Get('orders/:id')
  getById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.ordersService.getById(id, user.sub, user.roles);
  }

  @Get('admin/orders')
  @RequirePermissions('order:list')
  listAdmin(@Query() query: ListAdminOrdersQueryDto) {
    return this.ordersService.listAdmin(query);
  }
}

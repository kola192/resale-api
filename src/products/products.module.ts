import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AccessTokenStrategy } from 'src/auth/strategies/accessToken.strategy';
import { PrismaService } from 'src/prisma/prisma.service';
import { ErrorHandlingService } from 'src/shared/error-handling.service';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    AccessTokenStrategy,
    PrismaService,
    ErrorHandlingService,
  ],
})
export class ProductsModule {}

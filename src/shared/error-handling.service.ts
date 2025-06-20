// import {
//   ConflictException,
//   ForbiddenException,
//   Injectable,
//   Logger,
//   UnauthorizedException,
// } from '@nestjs/common';
// import {
//   BadRequestException,
//   HttpException,
//   InternalServerErrorException,
//   NotFoundException,
// } from '@nestjs/common';
// import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// @Injectable()
// export class ErrorHandlingService {
//   private readonly logger = new Logger(ErrorHandlingService.name);

//   handlePrismaAndHttpExceptions(
//     error: any,
//     defaultErrorMessage?: string,
//   ): Promise<never> {
//     if (error instanceof PrismaClientKnownRequestError) {
//       switch (error.code) {
//         case 'P2002': // Unique constraint violation
//           throw new ConflictException(defaultErrorMessage ?? error?.message);
//         case 'P2025': // Record not found
//           throw new NotFoundException(defaultErrorMessage ?? error?.message);
//         case 'P2003': // Foreign key constraint failed
//           throw new BadRequestException(defaultErrorMessage ?? error?.message);
//         default:
//           this.logger.error(`Unhandled Prisma error: ${error.code}`, error);
//           break;
//       }
//     } else if (error instanceof HttpException) {
//       throw error;
//     } else if (error.name === 'JsonWebTokenError') {
//       throw new UnauthorizedException();
//     } else if (error.name === 'TokenExpiredError') {
//       throw new UnauthorizedException();
//     } else if (error.name === 'ForbiddenError') {
//       throw new ForbiddenException(error?.message);
//     }

//     this.logger.error('Error:', error?.message);
//     throw new InternalServerErrorException();
//   }
// }

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class ErrorHandlingService {
  private readonly logger = new Logger(ErrorHandlingService.name);

  handlePrismaAndHttpExceptions(
    error: any,
    defaultErrorMessage?: string,
  ): never {
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new ConflictException(defaultErrorMessage ?? error.message);
        case 'P2025':
          throw new NotFoundException(defaultErrorMessage ?? error.message);
        case 'P2003':
          throw new BadRequestException(defaultErrorMessage ?? error.message);
        default:
          this.logger.error(`Unhandled Prisma error: ${error.code}`, error);
          throw new InternalServerErrorException('Unhandled Prisma error');
      }
    }

    if (error instanceof HttpException) {
      throw error;
    }

    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedException();
    }

    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedException();
    }

    if (error.name === 'ForbiddenError') {
      throw new ForbiddenException(error?.message);
    }

    this.logger.error('Unhandled error:', error?.message);
    throw new InternalServerErrorException();
  }
}

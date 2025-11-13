import { Catch, ArgumentsHost, ConflictException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    if (exception.code === 'P2002') {
      // Unique constraint violation
      const field = (exception.meta?.target as string[])?.[0] || 'field';
      return super.catch(
        new ConflictException(`A record with this ${field} already exists`),
        host,
      );
    }
    // Handle other Prisma errors if needed
    super.catch(exception, host);
  }
}


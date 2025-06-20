import { Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class HashUtils {
  private readonly logger = new Logger(HashUtils.name);

  async hashData(data: string): Promise<string> {
    try {
      return await argon2.hash(data);
    } catch (error) {
      this.logger.error('Error hashing data:', error);
      throw error;
    }
  }
}

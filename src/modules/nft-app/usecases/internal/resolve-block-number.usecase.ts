import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';

@Injectable()
export class ResolveBlockNumberUseCase {
  constructor(private readonly redisService: RedisService) {}

  async execute(timestamp: number): Promise<number> {
    const blocks = await this.redisService
      .getClient()
      .zrevrangebyscore('block_timestamp', timestamp, 0, 'LIMIT', 0, 1);

    if (!blocks || blocks.length === 0) {
      throw new HttpException(
        `No block found for timestamp ${timestamp}`,
        HttpStatus.NOT_FOUND,
      );
    }

    return Number(blocks[0]);
  }
}

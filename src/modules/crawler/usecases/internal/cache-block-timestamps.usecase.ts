import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';

interface BlockTimestampCache {
  [blockNumber: number]: number;
}

@Injectable()
export class CacheBlockTimestampsUseCase {
  private readonly logger = new Logger(CacheBlockTimestampsUseCase.name);

  constructor(private readonly redisService: RedisService) {}

  async execute(blockTimestampCache: BlockTimestampCache): Promise<void> {
    const blockNumbers = Object.keys(blockTimestampCache);

    if (blockNumbers.length === 0) {
      this.logger.debug('No block timestamps to cache');
      return;
    }

    try {
      const redisClient = this.redisService.getClient();
      const pipeline = redisClient.pipeline();

      for (const blockNumber of blockNumbers) {
        const timestamp = blockTimestampCache[Number(blockNumber)];
        pipeline.zadd('block_timestamp', timestamp, blockNumber);
      }

      await pipeline.exec();

      this.logger.log(
        `Successfully cached ${blockNumbers.length} block timestamps to Redis`,
      );
    } catch (error) {
      this.logger.error(`Failed to cache block timestamps: ${error.message}`);
      throw error;
    }
  }
}

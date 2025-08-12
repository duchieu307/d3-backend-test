import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { NftApp } from '../../nft-app.interface';

@Injectable()
export class CacheManagementUseCase {
  private readonly logger = new Logger(CacheManagementUseCase.name);

  constructor(private readonly redisService: RedisService) {}

  async getCachedBalance(blockNumber: number): Promise<NftApp | null> {
    try {
      const cacheKey = `balance:${blockNumber}`;
      const cachedData = await this.redisService.getClient().get(cacheKey);

      return cachedData
        ? {
            blockNumber,
            owners: JSON.parse(cachedData),
          }
        : null;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve cached balance for block ${blockNumber}: ${error.message}`,
      );
      return null;
    }
  }

  async setCacheBalance(
    blockNumber: number,
    owners: Record<string, string>,
  ): Promise<void> {
    try {
      const cacheKey = `balance:${blockNumber}`;
      await this.redisService.getClient().set(cacheKey, JSON.stringify(owners));
      this.logger.log(`Balance cached for block ${blockNumber}`);
    } catch (error) {
      this.logger.error(
        `Failed to cache balance for block ${blockNumber}: ${error.message}`,
      );
    }
  }
}

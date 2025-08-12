import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LatestBlockEntityName } from 'src/database/entities';
import { LatestBlockRepository } from 'src/database/repositories/latest-block.repository';
import { QueryRunner } from 'typeorm';

@Injectable()
export class UpdateLatestBlockUseCase {
  private readonly logger = new Logger(UpdateLatestBlockUseCase.name);
  private readonly nftContractAddress: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly latestBlockRepo: LatestBlockRepository,
  ) {
    this.nftContractAddress = this.configService.get<string>('NFT_CONTRACT');
  }

  async execute(blockNumber: number): Promise<void> {
    try {
      await this.latestBlockRepo.update(
        { contractAddress: this.nftContractAddress },
        { block: blockNumber },
      );

      this.logger.log(`Updated latest block to ${blockNumber}`);
    } catch (error) {
      this.logger.error(
        `Failed to update latest block to ${blockNumber}: ${error.message}`,
      );
      throw error;
    }
  }

  async executeInTransaction(
    queryRunner: QueryRunner,
    blockNumber: number,
  ): Promise<void> {
    try {
      await queryRunner.manager.update(
        LatestBlockEntityName,
        { contractAddress: this.nftContractAddress },
        { block: blockNumber },
      );

      this.logger.log(`Updated latest block to ${blockNumber} in transaction`);
    } catch (error) {
      this.logger.error(
        `Failed to update latest block to ${blockNumber} in transaction: ${error.message}`,
      );
      throw error;
    }
  }
}

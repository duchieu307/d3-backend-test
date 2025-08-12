import { Injectable, Logger } from '@nestjs/common';
import { CRAWLER_CONSTANT } from 'src/modules/crawler/crawler.constant';
import { sleep } from 'src/shared/helpers/sleep';
import { DataSource } from 'typeorm';
import { DetermineBlockRangeUseCase } from './internal/determine-block-range.usecase';
import { FetchContractEventsUseCase } from './internal/fetch-contract-events.usecase';
import { ProcessTransferEventsUseCase } from './internal/process-transfer-events.usecase';
import { SaveEventsToDbUseCase } from './internal/save-events-to-db.usecase';
import { CacheBlockTimestampsUseCase } from './internal/cache-block-timestamps.usecase';
import { UpdateLatestBlockUseCase } from './internal/update-latest-block.usecase';

interface BlockRange {
  fromBlock: number;
  toBlock: number;
}

@Injectable()
export class CrawlExecutionUseCase {
  private readonly logger = new Logger(CrawlExecutionUseCase.name);
  private readonly CRAWLER_ERROR_DELAY = 5000;

  constructor(
    private readonly dataSource: DataSource,
    private readonly determineBlockRangeUseCase: DetermineBlockRangeUseCase,
    private readonly fetchContractEventsUseCase: FetchContractEventsUseCase,
    private readonly processTransferEventsUseCase: ProcessTransferEventsUseCase,
    private readonly saveEventsToDbUseCase: SaveEventsToDbUseCase,
    private readonly cacheBlockTimestampsUseCase: CacheBlockTimestampsUseCase,
    private readonly updateLatestBlockUseCase: UpdateLatestBlockUseCase,
  ) {}

  async execute(): Promise<void> {
    this.logger.log('Starting blockchain event crawler');

    while (true) {
      await this.executeCrawlCycle();
    }
  }

  async executeSingleCycle(): Promise<void> {
    await this.executeCrawlCycle();
  }

  private async executeCrawlCycle(): Promise<void> {
    await sleep(CRAWLER_CONSTANT.BLOCK_SLEEP);

    try {
      const crawlBlock = await this.determineBlockRangeUseCase.execute();
      this.logger.log(
        `Crawling blocks ${crawlBlock.fromBlock} to ${crawlBlock.toBlock} (${
          crawlBlock.toBlock - crawlBlock.fromBlock + 1
        } blocks)`,
      );

      const events = await this.fetchContractEventsUseCase.execute(crawlBlock);
      this.logger.log(`Found ${events.length} events to process`);

      await this.processEvents(events, crawlBlock);

      this.logger.log(
        `Successfully processed ${events.length} events from blocks ${crawlBlock.fromBlock}-${crawlBlock.toBlock}`,
      );
    } catch (error) {
      await this.handleCrawlerError(error);
    }
  }

  private async processEvents(
    events: any[],
    crawlBlock: BlockRange,
  ): Promise<void> {
    if (events.length === 0) {
      await this.updateLatestBlockUseCase.execute(crawlBlock.toBlock + 1);
      this.logger.log('No events to process, updated latest block');
      return;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { transferEvents, blockTimestampCache } =
        await this.processTransferEventsUseCase.execute(events);

      await this.saveEventsToDbUseCase.execute(queryRunner, transferEvents);
      await this.updateLatestBlockUseCase.executeInTransaction(
        queryRunner,
        crawlBlock.toBlock + 1,
      );
      await this.cacheBlockTimestampsUseCase.execute(blockTimestampCache);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Successfully saved ${transferEvents.length} transfer events and updated block timestamps`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Transaction failed: ${error.message}`);
      this.logger.error(`Stack trace: ${error.stack}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async handleCrawlerError(error: Error): Promise<void> {
    console.log(error);
    this.logger.error(`Crawler cycle failed: ${error.message}`);
    this.logger.error(`Stack trace: ${error.stack}`);
    this.logger.log(`Retrying after ${this.CRAWLER_ERROR_DELAY}ms delay...`);

    await sleep(this.CRAWLER_ERROR_DELAY);
  }
}

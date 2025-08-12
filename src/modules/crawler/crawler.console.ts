import { Logger } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';
import { CrawlExecutionUseCase } from './usecases';

@Console()
export class CrawlerConsole {
  private readonly logger = new Logger(CrawlerConsole.name);

  constructor(private readonly crawlExecutionUseCase: CrawlExecutionUseCase) {}

  @Command({
    command: 'crawler',
    description: 'Crawl data from blockchain event',
  })
  async crawler(): Promise<void> {
    this.logger.log('Delegating crawler execution to use case');
    await this.crawlExecutionUseCase.execute();
  }
}

import { Module } from '@nestjs/common';
import { CrawlerConsole } from 'src/modules/crawler/crawler.console';
import { SharedModule } from 'src/shared/share.module';
import {
  CrawlExecutionUseCase,
  DetermineBlockRangeUseCase,
  FetchContractEventsUseCase,
  ProcessTransferEventsUseCase,
  SaveEventsToDbUseCase,
  CacheBlockTimestampsUseCase,
  UpdateLatestBlockUseCase,
} from './usecases';

@Module({
  imports: [SharedModule],
  providers: [
    CrawlerConsole,
    CrawlExecutionUseCase,
    DetermineBlockRangeUseCase,
    FetchContractEventsUseCase,
    ProcessTransferEventsUseCase,
    SaveEventsToDbUseCase,
    CacheBlockTimestampsUseCase,
    UpdateLatestBlockUseCase,
  ],
})
export class CrawlerModule {}

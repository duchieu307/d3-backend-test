import { Injectable, Logger } from '@nestjs/common';
import { TransferEntity } from 'src/database/entities/transfer.entity';
import {
  CRAWLER_CONSTANT,
  EventType,
} from 'src/modules/crawler/crawler.constant';
import { Web3Helper } from 'src/shared/helpers/web3.helper';
import Web3, { EventLog } from 'web3';

interface BlockTimestampCache {
  [blockNumber: number]: number;
}

interface ProcessedEventsResult {
  transferEvents: TransferEntity[];
  blockTimestampCache: BlockTimestampCache;
}

@Injectable()
export class ProcessTransferEventsUseCase {
  private readonly logger = new Logger(ProcessTransferEventsUseCase.name);
  private readonly web3Instance: Web3;

  constructor() {
    this.web3Instance = Web3Helper.web3Provider(process.env.RPC_URL || '');
  }

  async execute(events: EventLog[]): Promise<ProcessedEventsResult> {
    const transferEvents: TransferEntity[] = [];
    const blockTimestampCache: BlockTimestampCache = {};

    this.logger.log(`Processing ${events.length} events`);

    for (const event of events) {
      if (this.isTransferEvent(event)) {
        const transferEvent = await this.createTransferEntity(
          event,
          blockTimestampCache,
        );
        transferEvents.push(transferEvent);

        this.logger.debug(
          `Processed Transfer event: tokenId=${transferEvent.tokenId}, from=${transferEvent.from}, to=${transferEvent.to}, block=${transferEvent.blockNumber}`,
        );
      }
    }

    this.logger.log(
      `Successfully processed ${transferEvents.length} transfer events from ${events.length} total events`,
    );

    return {
      transferEvents,
      blockTimestampCache,
    };
  }

  private isTransferEvent(event: EventLog): boolean {
    return event.event === EventType.Transfer;
  }

  private async createTransferEntity(
    event: EventLog,
    blockTimestampCache: BlockTimestampCache,
  ): Promise<TransferEntity> {
    const blockNumber = Number(event.blockNumber);

    if (!blockTimestampCache[blockNumber]) {
      const block = await this.web3Instance.eth.getBlock(blockNumber);
      blockTimestampCache[blockNumber] = Number(block.timestamp);
    }

    const transferEntity = new TransferEntity();
    transferEntity.txHash = event.transactionHash;
    transferEntity.blockNumber = blockNumber;
    transferEntity.blockTimestamp = blockTimestampCache[blockNumber];
    transferEntity.from = event.returnValues.from as string;
    transferEntity.to = event.returnValues.to as string;
    transferEntity.tokenId = Number(event.returnValues.tokenId);

    return transferEntity;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NFT_CONTRACT_ABI } from 'src/configs/nft-abi';
import { CRAWLER_CONSTANT } from 'src/modules/crawler/crawler.constant';
import { sleep } from 'src/shared/helpers/sleep';
import { Web3Helper } from 'src/shared/helpers/web3.helper';
import Web3, { Contract, ContractAbi, EventLog } from 'web3';

interface BlockRange {
  fromBlock: number;
  toBlock: number;
}

@Injectable()
export class FetchContractEventsUseCase {
  private readonly logger = new Logger(FetchContractEventsUseCase.name);
  private readonly web3Instance: Web3;
  private readonly nftContract: Contract<ContractAbi>;

  // Configuration constants
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_BASE_DELAY = 2000;

  constructor(private readonly configService: ConfigService) {
    this.web3Instance = Web3Helper.web3Provider(
      this.configService.get<string>('RPC_URL'),
    );
    this.nftContract = new this.web3Instance.eth.Contract(
      NFT_CONTRACT_ABI,
      this.configService.get<string>('NFT_CONTRACT'),
    );
  }

  async execute(crawlBlock: BlockRange): Promise<EventLog[]> {
    let blockRange = crawlBlock.toBlock - crawlBlock.fromBlock;
    const fromBlock = crawlBlock.fromBlock;
    let toBlock = crawlBlock.toBlock;

    for (let attempt = 0; attempt < this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        this.logger.log(
          `Attempt ${attempt + 1}/${this.MAX_RETRY_ATTEMPTS}: Crawling ${
            blockRange + 1
          } blocks (${fromBlock} to ${toBlock})`,
        );

        const events = await this.fetchContractEvents(fromBlock, toBlock);
        this.logger.log(`Successfully retrieved ${events.length} events`);

        return events;
      } catch (error) {
        if (this.isTooManyResultsError(error)) {
          const newRange = await this.handleTooManyResults(
            blockRange,
            fromBlock,
          );
          blockRange = newRange.blockRange;
          toBlock = newRange.toBlock;
          continue;
        }

        if (attempt === this.MAX_RETRY_ATTEMPTS - 1) {
          this.logger.error(`All ${this.MAX_RETRY_ATTEMPTS} attempts failed`);
          throw error;
        }

        await this.handleRetryableError(error, attempt);
      }
    }

    throw new Error(
      `Event crawling failed after ${this.MAX_RETRY_ATTEMPTS} attempts`,
    );
  }

  private async fetchContractEvents(
    fromBlock: number,
    toBlock: number,
  ): Promise<EventLog[]> {
    return (await this.nftContract.getPastEvents('allEvents', {
      fromBlock,
      toBlock,
    })) as EventLog[];
  }

  private isTooManyResultsError(error: Error): boolean {
    return error.message.includes('more than 10000 results');
  }

  private async handleTooManyResults(
    currentRange: number,
    fromBlock: number,
  ): Promise<{ blockRange: number; toBlock: number }> {
    const newBlockRange = Math.floor(currentRange / 2);

    if (newBlockRange < CRAWLER_CONSTANT.MIN_BLOCK_RANGE) {
      throw new Error(
        `Block range ${newBlockRange} is below minimum threshold ${CRAWLER_CONSTANT.MIN_BLOCK_RANGE}`,
      );
    }

    const newToBlock = fromBlock + newBlockRange;

    this.logger.warn(
      `Too many results detected. Reducing block range from ${
        currentRange + 1
      } to ${newBlockRange + 1} blocks`,
    );

    return {
      blockRange: newBlockRange,
      toBlock: newToBlock,
    };
  }

  private async handleRetryableError(
    error: Error,
    attempt: number,
  ): Promise<void> {
    const delay = this.RETRY_BASE_DELAY * (attempt + 1);

    this.logger.warn(
      `Attempt ${attempt + 1} failed: ${
        error.message
      }. Retrying in ${delay}ms...`,
    );

    await sleep(delay);
  }
}

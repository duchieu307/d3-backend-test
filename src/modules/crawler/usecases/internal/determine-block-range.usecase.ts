import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LatestBlockEntity } from 'src/database/entities/latest-block.entity';
import { LatestBlockRepository } from 'src/database/repositories/latest-block.repository';
import { CRAWLER_CONSTANT } from 'src/modules/crawler/crawler.constant';
import { sleep } from 'src/shared/helpers/sleep';
import { Web3Helper } from 'src/shared/helpers/web3.helper';
import Web3 from 'web3';

interface BlockRange {
  fromBlock: number;
  toBlock: number;
}

@Injectable()
export class DetermineBlockRangeUseCase {
  private readonly logger = new Logger(DetermineBlockRangeUseCase.name);
  private readonly web3Instance: Web3;
  private readonly nftContractAddress: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly latestBlockRepo: LatestBlockRepository,
  ) {
    this.web3Instance = Web3Helper.web3Provider(
      this.configService.get<string>('RPC_URL'),
    );
    this.nftContractAddress = this.configService.get<string>('NFT_CONTRACT');
  }

  async execute(): Promise<BlockRange> {
    const fromBlock = await this.determineFromBlock();
    const currentBlock = await this.waitForValidBlock(fromBlock);
    const toBlock = this.calculateToBlock(fromBlock, currentBlock);

    return { fromBlock, toBlock };
  }

  private async determineFromBlock(): Promise<number> {
    const latestBlock = await this.latestBlockRepo.findOne({
      where: {
        contractAddress: this.nftContractAddress,
      },
    });

    const startBlock = Number(this.configService.get('START_BLOCK'));

    if (latestBlock) {
      return latestBlock.block;
    }

    await this.initializeLatestBlock(startBlock);
    return startBlock;
  }

  private async initializeLatestBlock(blockNumber: number): Promise<void> {
    const newLatestBlock = new LatestBlockEntity();
    newLatestBlock.block = blockNumber;
    newLatestBlock.contractAddress = this.nftContractAddress;

    await this.latestBlockRepo.save(newLatestBlock);
    this.logger.log(`Initialized latest block at ${blockNumber}`);
  }

  private async waitForValidBlock(fromBlock: number): Promise<number> {
    while (true) {
      const currentBlock = await this.web3Instance.eth.getBlockNumber();
      const currentBlockNumber = Number(currentBlock);

      if (currentBlockNumber >= fromBlock + CRAWLER_CONSTANT.BLOCK_DELAY) {
        return currentBlockNumber;
      }

      this.logger.log(
        `Waiting for valid block. Current: ${currentBlockNumber}, Required: ${
          fromBlock + CRAWLER_CONSTANT.BLOCK_DELAY
        }`,
      );

      await sleep(CRAWLER_CONSTANT.BLOCK_SLEEP);
    }
  }

  private calculateToBlock(fromBlock: number, currentBlock: number): number {
    let toBlock = fromBlock + CRAWLER_CONSTANT.BLOCK_CRAWL;
    const maxAllowedBlock = currentBlock - CRAWLER_CONSTANT.BLOCK_DELAY;

    if (toBlock > maxAllowedBlock) {
      toBlock = maxAllowedBlock;
    }

    return Math.max(toBlock, fromBlock);
  }
}

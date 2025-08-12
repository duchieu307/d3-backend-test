import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sleep } from 'src/shared/helpers/sleep';
import { Web3Helper } from 'src/shared/helpers/web3.helper';
import Web3 from 'web3';

interface BalanceResult {
  id: string;
  result: string;
  success: boolean;
  error?: string;
}

@Injectable()
export class ProcessOwnerBalancesUseCase {
  private readonly logger = new Logger(ProcessOwnerBalancesUseCase.name);
  private readonly web3Instance: Web3;

  private readonly BATCH_SIZE = 100;
  private readonly MAX_OWNERS_PER_CHUNK = 500;
  private readonly MAX_BATCH_RETRIES = 3;
  private readonly BATCH_DELAY_MS = 100;
  private readonly CHUNK_DELAY_MS = 500;

  constructor(private readonly configService: ConfigService) {
    this.web3Instance = Web3Helper.web3Provider(
      this.configService.get<string>('RPC_URL'),
    );
  }

  async execute(
    distinctOwnersArray: string[],
    blockNumber: number,
  ): Promise<Map<string, string>> {
    const blockHex = `0x${blockNumber.toString(16)}`;
    const ownerChunks = this.chunkArray(
      distinctOwnersArray,
      this.MAX_OWNERS_PER_CHUNK,
    );

    this.logger.log(
      `Processing ${ownerChunks.length} chunks, max ${this.MAX_OWNERS_PER_CHUNK} owners per chunk`,
    );

    const allBalances: BalanceResult[] = [];

    for (let chunkIndex = 0; chunkIndex < ownerChunks.length; chunkIndex++) {
      const chunkBalances = await this.processOwnerChunk(
        ownerChunks[chunkIndex],
        blockHex,
        chunkIndex + 1,
        ownerChunks.length,
      );

      allBalances.push(...chunkBalances);

      // Rate limiting between chunks
      if (chunkIndex + 1 < ownerChunks.length) {
        await sleep(this.CHUNK_DELAY_MS);
      }
    }

    this.logger.log(
      `Completed processing all chunks. Total balances retrieved: ${allBalances.length}`,
    );

    return this.convertBalancesToMap(allBalances);
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async processOwnerChunk(
    chunk: string[],
    blockHex: string,
    chunkNumber: number,
    totalChunks: number,
  ): Promise<BalanceResult[]> {
    this.logger.log(
      `Processing chunk ${chunkNumber}/${totalChunks} with ${chunk.length} owners`,
    );

    const chunkBalances: BalanceResult[] = [];

    for (let i = 0; i < chunk.length; i += this.BATCH_SIZE) {
      const batch = chunk.slice(i, i + this.BATCH_SIZE);
      const batchResults = await this.processBatchWithRetry(
        batch,
        blockHex,
        chunkNumber,
        Math.floor(i / this.BATCH_SIZE) + 1,
        Math.ceil(chunk.length / this.BATCH_SIZE),
      );

      chunkBalances.push(...batchResults);

      // Rate limiting between batches
      if (i + this.BATCH_SIZE < chunk.length) {
        await sleep(this.BATCH_DELAY_MS);
      }
    }

    return chunkBalances;
  }

  private async processBatchWithRetry(
    batch: string[],
    blockHex: string,
    chunkNumber: number,
    batchNumber: number,
    totalBatches: number,
  ): Promise<BalanceResult[]> {
    for (let retry = 0; retry <= this.MAX_BATCH_RETRIES; retry++) {
      try {
        this.logger.debug(
          `Chunk ${chunkNumber} - Processing batch ${batchNumber}/${totalBatches} (attempt ${
            retry + 1
          })`,
        );

        return await this.fetchBatchBalances(batch, blockHex);
      } catch (error) {
        this.logger.warn(
          `Chunk ${chunkNumber} batch ${batchNumber} failed (attempt ${
            retry + 1
          }): ${error.message}`,
        );

        if (retry === this.MAX_BATCH_RETRIES) {
          this.logger.error(
            `Batch failed after ${
              this.MAX_BATCH_RETRIES + 1
            } attempts, returning empty results`,
          );
          return [];
        }

        await sleep(this.calculateBackoffDelay(retry + 1, 1000, 5000));
      }
    }

    return [];
  }

  private async fetchBatchBalances(
    batch: string[],
    blockHex: string,
  ): Promise<BalanceResult[]> {
    const balancePromises = batch.map(async (address) => {
      try {
        const balance = await this.web3Instance.eth.getBalance(
          address,
          blockHex,
        );
        return {
          id: address,
          result: balance,
          success: true,
        };
      } catch (error) {
        this.logger.warn(
          `Failed to get balance for ${address}: ${error.message}`,
        );
        return {
          id: address,
          result: '0x0',
          success: false,
          error: error.message,
        };
      }
    });

    const batchResults = await Promise.allSettled(balancePromises);

    const results: BalanceResult[] = [];
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value as BalanceResult);
      } else {
        this.logger.error('Unexpected promise rejection:', result.reason);
        results.push({
          id: 'unknown',
          result: '0x0',
          success: false,
          error: 'Promise rejected',
        });
      }
    });

    return results;
  }

  private convertBalancesToMap(balances: BalanceResult[]): Map<string, string> {
    const ownerBalances = new Map<string, string>();

    balances.forEach((balance) => {
      if (balance.result && balance.result !== '0x0' && balance.success) {
        try {
          const weiValue = balance.result.toString();
          const ethBalance = this.web3Instance.utils.fromWei(weiValue, 'ether');
          ownerBalances.set(balance.id, ethBalance);
        } catch (error) {
          this.logger.warn(
            `Failed to convert balance for ${balance.id}: ${balance.result} - ${error.message}`,
          );
        }
      } else if (balance.success) {
        ownerBalances.set(balance.id, '0');
      }
    });

    return ownerBalances;
  }

  private calculateBackoffDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
  ): number {
    return Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  }
}

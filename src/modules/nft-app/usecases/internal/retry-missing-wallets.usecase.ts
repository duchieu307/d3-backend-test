import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { sleep } from 'src/shared/helpers/sleep';
import { ProcessOwnerBalancesUseCase } from './process-owner-balances.usecase';

@Injectable()
export class RetryMissingWalletsUseCase {
  private readonly logger = new Logger(RetryMissingWalletsUseCase.name);
  private readonly MAX_RETRY_ATTEMPTS = 5;

  constructor(
    private readonly processOwnerBalancesUseCase: ProcessOwnerBalancesUseCase,
  ) {}

  async execute(
    missingWallets: string[],
    blockNumber: number,
  ): Promise<Map<string, string>> {
    let currentMissingWallets = [...missingWallets];
    const finalBalances = new Map<string, string>();

    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      if (currentMissingWallets.length === 0) {
        this.logger.log('All missing wallets processed successfully');
        break;
      }

      this.logger.log(
        `Retry attempt ${attempt}/${this.MAX_RETRY_ATTEMPTS} for ${currentMissingWallets.length} wallets`,
      );

      try {
        const retryBalances = await this.processOwnerBalancesUseCase.execute(
          currentMissingWallets,
          blockNumber,
        );

        // Merge successful results
        retryBalances.forEach((value, key) => {
          finalBalances.set(key, value);
        });

        // Update missing wallets list
        const successfulWallets = Array.from(retryBalances.keys());
        currentMissingWallets = currentMissingWallets.filter(
          (wallet) => !successfulWallets.includes(wallet),
        );

        this.logger.log(
          `Retry ${attempt} completed: ${successfulWallets.length} successful, ${currentMissingWallets.length} remaining`,
        );

        // Wait before next retry if needed
        if (
          currentMissingWallets.length > 0 &&
          attempt < this.MAX_RETRY_ATTEMPTS
        ) {
          const waitTime = this.calculateBackoffDelay(attempt, 2000, 30000);
          this.logger.log(`Waiting ${waitTime}ms before next retry`);
          await sleep(waitTime);
        }
      } catch (error) {
        this.logger.error(`Retry attempt ${attempt} failed: ${error.message}`);

        if (attempt === this.MAX_RETRY_ATTEMPTS) {
          this.handleFinalRetryFailure(currentMissingWallets, finalBalances);
        } else {
          const waitTime = this.calculateBackoffDelay(attempt, 3000, 60000);
          this.logger.log(`Error recovery: waiting ${waitTime}ms before retry`);
          await sleep(waitTime);
        }
      }
    }

    return finalBalances;
  }

  private calculateBackoffDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
  ): number {
    return Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  }

  private handleFinalRetryFailure(
    failedWallets: string[],
    balances: Map<string, string>,
  ): void {
    this.logger.error(
      `Failed to process ${failedWallets.length} wallets after ${this.MAX_RETRY_ATTEMPTS} attempts`,
    );

    // Set failed wallets to 0 balance
    failedWallets.forEach((wallet) => {
      balances.set(wallet, '0');
    });

    throw new HttpException(
      `Failed to get balance for ${failedWallets.length} wallets after ${this.MAX_RETRY_ATTEMPTS} retry attempts`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

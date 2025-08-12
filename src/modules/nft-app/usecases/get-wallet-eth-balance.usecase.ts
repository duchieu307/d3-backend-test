import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LatestBlockRepository } from 'src/database/repositories';
import { NftApp } from '../nft-app.interface';
import { ResolveBlockNumberUseCase } from './internal/resolve-block-number.usecase';
import { CacheManagementUseCase } from './internal/cache-management.usecase';
import { GetDistinctOwnersUseCase } from './internal/get-distinct-owners.usecase';
import { ProcessOwnerBalancesUseCase } from './internal/process-owner-balances.usecase';
import { RetryMissingWalletsUseCase } from './internal/retry-missing-wallets.usecase';
import { ValidateTimestampUseCase } from './internal/validate-timestamp.usecase';

@Injectable()
export class GetWalletEthBalanceUseCase {
  private readonly logger = new Logger(GetWalletEthBalanceUseCase.name);
  private readonly nftContractAddress: string;
  private readonly SAVE_BLOCK_NUMBER: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly latestBlockRepo: LatestBlockRepository,
    private readonly validateTimestampUseCase: ValidateTimestampUseCase,
    private readonly resolveBlockNumberUseCase: ResolveBlockNumberUseCase,
    private readonly cacheManagementUseCase: CacheManagementUseCase,
    private readonly getDistinctOwnersUseCase: GetDistinctOwnersUseCase,
    private readonly processOwnerBalancesUseCase: ProcessOwnerBalancesUseCase,
    private readonly retryMissingWalletsUseCase: RetryMissingWalletsUseCase,
  ) {
    this.nftContractAddress = this.configService.get<string>('NFT_CONTRACT');
    this.SAVE_BLOCK_NUMBER = Number(
      this.configService.get<number>('SAVE_BLOCK_NUMBER') || 20,
    );
  }

  async execute(timestamp: number, isForceCache = false): Promise<NftApp> {
    await this.validateTimestampUseCase.execute(timestamp);
    this.logger.log(`Timestamp validation passed for: ${timestamp}`);

    const blockNumber = await this.resolveBlockNumberUseCase.execute(timestamp);
    this.logger.log(`Processing balance request for block: ${blockNumber}`);

    if (!isForceCache) {
      const cachedResult = await this.cacheManagementUseCase.getCachedBalance(
        blockNumber,
      );
      if (cachedResult) {
        this.logger.log(`Returning cached balance for block ${blockNumber}`);
        return cachedResult;
      }
    }

    this.logger.log('Cache miss. Fetching balances from blockchain');

    const distinctOwners = await this.getDistinctOwnersUseCase.execute(
      blockNumber,
    );
    this.logger.log(`Found ${distinctOwners.length} distinct owners`);

    const balanceResult = await this.processOwnerBalances(
      distinctOwners,
      blockNumber,
    );

    await this.handleCaching(balanceResult, blockNumber, distinctOwners.length);

    return balanceResult;
  }

  private async processOwnerBalances(
    distinctOwners: string[],
    blockNumber: number,
  ): Promise<NftApp> {
    const ownerBalances = await this.processOwnerBalancesUseCase.execute(
      distinctOwners,
      blockNumber,
    );

    const result: NftApp = {
      blockNumber,
      owners: Object.fromEntries(ownerBalances),
    };

    const missingWallets = this.findMissingWallets(
      distinctOwners,
      result.owners,
    );

    if (missingWallets.length > 0) {
      this.logger.warn(
        `Missing ${missingWallets.length} wallets, initiating retry process`,
      );

      const retryBalances = await this.retryMissingWalletsUseCase.execute(
        missingWallets,
        blockNumber,
      );
      this.mergeBalances(result.owners, retryBalances);

      this.logger.log(
        `After retry: ${Object.keys(result.owners).length}/${
          distinctOwners.length
        } wallets processed`,
      );
    }

    return result;
  }

  private findMissingWallets(
    allWallets: string[],
    processedOwners: Record<string, string>,
  ): string[] {
    return allWallets.filter(
      (wallet) => !processedOwners.hasOwnProperty(wallet),
    );
  }

  private mergeBalances(
    target: Record<string, string>,
    source: Map<string, string>,
  ): void {
    source.forEach((value, key) => {
      target[key] = value;
    });
  }

  private async handleCaching(
    result: NftApp,
    blockNumber: number,
    totalOwners: number,
  ): Promise<void> {
    try {
      const currentBlock = await this.latestBlockRepo.findOne({
        where: {
          contractAddress: this.nftContractAddress,
        },
      });

      const shouldCache =
        currentBlock &&
        currentBlock.block - blockNumber > this.SAVE_BLOCK_NUMBER &&
        totalOwners === Object.keys(result.owners).length;

      if (shouldCache) {
        await this.cacheManagementUseCase.setCacheBalance(
          blockNumber,
          result.owners,
        );
      }
    } catch (error) {
      this.logger.error(`Error in cache handling: ${error.message}`);
    }
  }
}

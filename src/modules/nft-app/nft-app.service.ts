import { Injectable, Logger } from '@nestjs/common';
import { NftApp } from './nft-app.interface';
import { GetWalletEthBalanceUseCase } from './usecases';

@Injectable()
export class NftAppService {
  private readonly logger = new Logger(NftAppService.name);

  constructor(
    private readonly getWalletEthBalanceUseCase: GetWalletEthBalanceUseCase,
  ) {}

  async getWalletEthBalance(
    timestamp: number,
    isForceCache = false,
  ): Promise<NftApp> {
    this.logger.log(
      `Delegating balance request to use case for timestamp: ${timestamp}`,
    );
    return await this.getWalletEthBalanceUseCase.execute(
      timestamp,
      isForceCache,
    );
  }
}

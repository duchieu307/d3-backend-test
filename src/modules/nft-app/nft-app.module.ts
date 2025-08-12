import { Module } from '@nestjs/common';
import { NftAppController } from 'src/modules/nft-app/nft-app.controller';
import { NftAppService } from 'src/modules/nft-app/nft-app.service';
import {
  GetWalletEthBalanceUseCase,
  ValidateTimestampUseCase,
  ResolveBlockNumberUseCase,
  CacheManagementUseCase,
  GetDistinctOwnersUseCase,
  ProcessOwnerBalancesUseCase,
  RetryMissingWalletsUseCase,
} from './usecases';
import { SharedModule } from 'src/shared/share.module';

@Module({
  imports: [SharedModule],
  controllers: [NftAppController],
  providers: [
    NftAppService,
    GetWalletEthBalanceUseCase,
    ValidateTimestampUseCase,
    ResolveBlockNumberUseCase,
    CacheManagementUseCase,
    GetDistinctOwnersUseCase,
    ProcessOwnerBalancesUseCase,
    RetryMissingWalletsUseCase,
  ],
  exports: [],
})
export class NftAppModule {}

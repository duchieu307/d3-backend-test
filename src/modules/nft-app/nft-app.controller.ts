import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  ParseBoolPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { NftAppService } from 'src/modules/nft-app/nft-app.service';

@Controller('nft-app')
@ApiTags('NFT App')
export class NftAppController {
  constructor(private readonly nftAppService: NftAppService) {}

  @Get()
  @ApiQuery({
    name: 'timestamp',
    description:
      'Timestamp to get the balance of all owners (must be in the past)',
    example: '1619215694000',
  })
  async getWalletEthBalance(
    @Query('timestamp', ParseIntPipe) timestamp: number,
    @Query('isForceCache', new ParseBoolPipe({ optional: true }))
    isForceCache = false,
  ) {
    try {
      return await this.nftAppService.getWalletEthBalance(
        timestamp,
        isForceCache,
      );
    } catch (error) {
      console.log('error', error);

      // Handle specific error types
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to retrieve wallet ETH balances',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from 'src/configs/database.config';
import { LatestBlockEntity, TransferEntity } from 'src/database/entities';
import {
  LatestBlockRepository,
  TransferRepository,
} from 'src/database/repositories';

export const entities = [LatestBlockEntity, TransferEntity];
export const repositories = [TransferRepository, LatestBlockRepository];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [...repositories],
  exports: [TypeOrmModule.forFeature(entities), ...repositories],
})
export class DatabaseModule {}

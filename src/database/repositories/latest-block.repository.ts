import { Injectable } from '@nestjs/common';
import { LatestBlockEntity } from 'src/database/entities/latest-block.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class LatestBlockRepository extends Repository<LatestBlockEntity> {
  constructor(dataSource: DataSource) {
    super(LatestBlockEntity, dataSource.createEntityManager());
  }
}

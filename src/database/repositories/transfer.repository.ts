import { Injectable } from '@nestjs/common';
import { TransferEntity } from 'src/database/entities/transfer.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class TransferRepository extends Repository<TransferEntity> {
  constructor(dataSource: DataSource) {
    super(TransferEntity, dataSource.createEntityManager());
  }
}

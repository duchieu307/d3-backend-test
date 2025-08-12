import { Injectable } from '@nestjs/common';
import { TransferEntity } from 'src/database/entities/transfer.entity';
import { TransferRepository } from 'src/database/repositories/transfer.repository';

@Injectable()
export class GetDistinctOwnersUseCase {
  constructor(private readonly transferRepo: TransferRepository) {}

  async execute(blockNumber: number): Promise<string[]> {
    const query = this.transferRepo
      .createQueryBuilder()
      .select('DISTINCT subtable.to', 'to')
      .from((subQuery) => {
        return subQuery
          .select('t.to', 'to')
          .addSelect('t.tokenId', 'tokenId')
          .addSelect(
            'ROW_NUMBER() OVER (PARTITION BY t.tokenId ORDER BY t.blockNumber DESC)',
            'rowNum',
          )
          .from(TransferEntity, 't')
          .where('t.blockNumber < :blockNumber', {
            blockNumber: blockNumber + 1,
          });
      }, 'subtable')
      .where('subtable.rowNum = 1');

    const owners = await query.getRawMany();
    return owners.map((owner) => owner.to);
  }
}

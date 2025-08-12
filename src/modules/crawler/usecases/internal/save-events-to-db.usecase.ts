import { Injectable, Logger } from '@nestjs/common';
import { TransferEntity } from 'src/database/entities/transfer.entity';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class SaveEventsToDbUseCase {
  private readonly logger = new Logger(SaveEventsToDbUseCase.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(
    queryRunner: QueryRunner,
    transferEvents: TransferEntity[],
  ): Promise<void> {
    if (transferEvents.length === 0) {
      this.logger.debug('No transfer events to save');
      return;
    }

    try {
      await queryRunner.manager.save(TransferEntity, transferEvents);

      this.logger.log(
        `Successfully saved ${transferEvents.length} transfer events to database`,
      );
    } catch (error) {
      this.logger.error(`Failed to save transfer events: ${error.message}`);
      throw error;
    }
  }
}

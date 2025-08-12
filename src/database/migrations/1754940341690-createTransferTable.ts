import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTransferTable1754940341690 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'transfer',
        columns: [
          {
            name: 'transferId',
            isGenerated: true,
            generationStrategy: 'increment',
            type: 'int',
            isPrimary: true,
          },
          {
            name: 'from',
            type: 'varchar',
          },
          {
            name: 'to',
            type: 'varchar',
          },
          {
            name: 'txHash',
            type: 'varchar',
          },
          {
            name: 'tokenId',
            type: 'int',
          },
          {
            name: 'blockNumber',
            type: 'int',
          },
          {
            name: 'blockTimestamp',
            type: 'bigint',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`transfer\``);
  }
}

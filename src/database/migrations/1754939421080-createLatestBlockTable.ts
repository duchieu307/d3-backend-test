import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateLatestBlockTable1754939421080 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'latestBlock',
        columns: [
          {
            name: 'latestBlockId',
            isGenerated: true,
            generationStrategy: 'increment',
            type: 'int',
            isPrimary: true,
          },
          {
            name: 'block',
            type: 'int',
          },
          {
            name: 'contractAddress',
            type: 'varchar',
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
    await queryRunner.query(`DROP TABLE \`latestBlock\``);
  }
}

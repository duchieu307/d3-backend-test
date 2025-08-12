import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export const TransferEntityName = 'transfer';
@Entity({
  name: TransferEntityName,
})
export class TransferEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  transferId: number;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column()
  tokenId: number;

  @Column()
  txHash: string;

  @Column()
  blockNumber: number;

  @Column()
  blockTimestamp: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

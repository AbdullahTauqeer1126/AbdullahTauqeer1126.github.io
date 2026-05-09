import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm'
import { User } from './User'
import { Booking } from './Booking'

export enum CommissionStatus {
  EARNED = 'earned',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  PAID = 'paid',
}

@Entity('commissions')
@Index('IDX_COMMISSION_AGENT', ['agent_id'])
@Index('IDX_COMMISSION_STATUS', ['status'])
export class Commission {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  agent_id!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'agent_id' })
  agent!: User

  @Column('uuid')
  booking_id!: string

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  commission_amount!: number

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  commission_percentage!: number

  @Column({ type: 'enum', enum: CommissionStatus, default: CommissionStatus.EARNED })
  status: CommissionStatus = CommissionStatus.EARNED

  @CreateDateColumn()
  earned_at!: Date

  @Column({ type: 'timestamp', nullable: true })
  paid_at?: Date

  @Column({ nullable: true, length: 50 })
  payment_method?: string

  @Column({ nullable: true, length: 100 })
  payment_reference?: string
}

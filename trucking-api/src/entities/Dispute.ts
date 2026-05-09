import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm'
import { User } from './User'
import { Booking } from './Booking'

export enum DisputeStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

export enum ComplaintType {
  CARGO_DAMAGE = 'cargo_damage',
  LATE_DELIVERY = 'late_delivery',
  DRIVER_BEHAVIOR = 'driver_behavior',
  WRONG_DELIVERY = 'wrong_delivery',
  OVERCHARGE = 'overcharge',
  NO_SHOW = 'no_show',
  OTHER = 'other',
}

@Entity('disputes')
@Index('IDX_DISPUTE_BOOKING', ['booking_id'])
@Index('IDX_DISPUTE_STATUS', ['status'])
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  booking_id!: string

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking

  @Column('uuid')
  complainant_id!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'complainant_id' })
  complainant!: User

  @Column('uuid', { nullable: true })
  respondent_id?: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'respondent_id' })
  respondent?: User

  @Column({ type: 'enum', enum: ComplaintType })
  complaint_type!: ComplaintType

  @Column({ type: 'text' })
  description!: string

  @Column({ type: 'simple-json', nullable: true })
  evidence?: string[]

  @Column({ type: 'enum', enum: DisputeStatus, default: DisputeStatus.OPEN })
  status: DisputeStatus = DisputeStatus.OPEN

  @Column('uuid', { nullable: true })
  assigned_to?: string

  @Column({ type: 'text', nullable: true })
  resolution?: string

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  compensation_amount?: number

  @CreateDateColumn()
  created_at!: Date

  @Column({ type: 'timestamp', nullable: true })
  resolved_at?: Date

  @UpdateDateColumn()
  updated_at!: Date
}

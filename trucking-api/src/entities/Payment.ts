import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { User } from './User'
import { Booking } from './Booking'
import { PaymentStatus, PaymentMethod } from '../types'

@Entity('payments')
@Index('IDX_BOOKING', ['booking_id'])
@Index('IDX_USER', ['user_id'])
@Index('IDX_STATUS', ['status'])
@Index('IDX_TRANSACTION', ['transaction_id'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  user_id!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User

  @Column('uuid')
  booking_id!: string

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount_prs!: number

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus = PaymentStatus.PENDING

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.WALLET,
  })
  method: PaymentMethod = PaymentMethod.WALLET

  @Column({ nullable: true, length: 100 })
  transaction_id?: string

  @Column({ nullable: true, length: 500 })
  payment_reference?: string

  @Column({ type: 'text', nullable: true })
  error_message?: string

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}

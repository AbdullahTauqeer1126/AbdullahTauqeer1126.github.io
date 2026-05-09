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
import { Truck } from './Truck'
import { BookingStatus } from '../types'

@Entity('bookings')
@Index('IDX_CUSTOMER', ['customer_id'])
@Index('IDX_TRUCK', ['truck_id'])
@Index('IDX_STATUS', ['booking_status'])
@Index('IDX_BOOKING_DATE', ['booking_date'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  customer_id!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer!: User

  @Column('uuid')
  truck_id!: string

  @ManyToOne(() => Truck)
  @JoinColumn({ name: 'truck_id' })
  truck!: Truck

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  booking_status: BookingStatus = BookingStatus.PENDING

  @Column({ length: 500 })
  pickup_address!: string

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  pickup_latitude?: number

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  pickup_longitude?: number

  @Column({ length: 500 })
  drop_address!: string

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  drop_latitude?: number

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  drop_longitude?: number

  @Column({ length: 100 })
  cargo_type!: string

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  weight_tons!: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  estimated_distance_km!: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount_prs!: number

  @Column({ type: 'text', nullable: true })
  special_instructions?: string

  @Column({ type: 'timestamp' })
  booking_date!: Date

  @Column({ type: 'timestamp', nullable: true })
  pickup_time?: Date

  @Column({ type: 'timestamp', nullable: true })
  delivery_time?: Date

  @Column({ nullable: true, length: 50 })
  payment_status?: string

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}

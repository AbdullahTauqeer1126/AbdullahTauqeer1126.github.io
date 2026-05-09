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
import { TripStatus } from '../types'

@Entity('trips')
@Index('IDX_BOOKING', ['booking_id'])
@Index('IDX_DRIVER', ['driver_id'])
@Index('IDX_TRIP_STATUS', ['trip_status'])
@Index('IDX_START_TIME', ['started_at'])
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  booking_id!: string

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking

  @Column('uuid')
  driver_id!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'driver_id' })
  driver!: User

  @Column({
    type: 'enum',
    enum: TripStatus,
    default: TripStatus.PENDING,
  })
  trip_status: TripStatus = TripStatus.PENDING

  @Column({ type: 'timestamp', nullable: true })
  started_at?: Date

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distance_km?: number

  @Column({ type: 'integer', nullable: true })
  duration_minutes?: number

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  current_latitude?: number

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  current_longitude?: number

  @Column({ type: 'timestamp', nullable: true })
  last_location_update?: Date

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  avg_speed_kmh?: number

  @Column({ type: 'text', nullable: true })
  notes?: string

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}

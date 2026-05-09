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
import { TruckType } from '../types'

@Entity('trucks')
@Index('IDX_REGISTRATION', ['registration_number'], { unique: true })
@Index('IDX_FLEET_OWNER', ['fleet_owner_id'])
@Index('IDX_TRUCK_TYPE', ['truck_type'])
@Index('IDX_AVAILABLE', ['is_available'])
export class Truck {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  fleet_owner_id!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'fleet_owner_id' })
  fleet_owner!: User

  @Column({ type: 'enum', enum: TruckType })
  truck_type!: TruckType

  @Column({ length: 20 })
  registration_number!: string

  @Column({ type: 'varchar', length: 50 })
  truck_model!: string

  @Column({ type: 'integer' })
  year_of_manufacture!: number

  @Column({ type: 'decimal', precision: 5, scale: 1 })
  capacity_tons!: number

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  base_fare_prs!: number

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  per_km_rate_prs!: number

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 0 })
  avg_rating: number = 0

  @Column({ type: 'integer', default: 0 })
  total_reviews: number = 0

  @Column({ type: 'boolean', default: false })
  is_insured: boolean = false

  @Column({ type: 'boolean', default: false })
  has_gps: boolean = false

  @Column({ type: 'boolean', default: true })
  is_available: boolean = true

  @Column({ nullable: true, length: 500 })
  document_url?: string

  @Column({ nullable: true, length: 500 })
  insurance_url?: string

  @Column({ nullable: true, length: 500 })
  photo_url?: string

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}

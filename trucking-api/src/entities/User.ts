import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm'
import { UserRole } from '../types'

@Entity('users')
@Index('IDX_EMAIL', ['email'], { unique: true })
@Index('IDX_PHONE', ['phone'], { unique: true })
@Index('IDX_ROLE', ['role'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ length: 100 })
  email!: string

  @Column({ length: 20 })
  phone!: string

  @Column({ length: 100 })
  first_name!: string

  @Column({ length: 100, nullable: true })
  last_name?: string

  @Column({ length: 255 })
  password_hash!: string

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole = UserRole.CUSTOMER

  @Column({ nullable: true, length: 500 })
  avatar_url?: string

  @Column({ type: 'boolean', default: false })
  kyc_verified: boolean = false

  @Column({ type: 'boolean', default: true })
  is_active: boolean = true

  @Column({ type: 'text', nullable: true })
  bio?: string

  @Column({ nullable: true, length: 50 })
  city?: string

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  wallet_balance?: number

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim()
    }
  }
}

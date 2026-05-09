import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm'
import { User } from './User'

export enum ExpenseCategory {
  FUEL = 'fuel',
  MAINTENANCE = 'maintenance',
  INSURANCE = 'insurance',
  TOLL = 'toll',
  DRIVER_SALARY = 'driver_salary',
  REGISTRATION = 'registration',
  PLATFORM_COMMISSION = 'platform_commission',
  OTHER = 'other',
}

@Entity('expenses')
@Index('IDX_EXPENSE_OWNER', ['fleet_owner_id'])
@Index('IDX_EXPENSE_DATE', ['expense_date'])
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  fleet_owner_id!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'fleet_owner_id' })
  fleet_owner!: User

  @Column('uuid', { nullable: true })
  truck_id?: string

  @Column({ type: 'enum', enum: ExpenseCategory })
  category!: ExpenseCategory

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number

  @Column({ type: 'date' })
  expense_date!: Date

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ nullable: true, length: 500 })
  receipt_url?: string

  @CreateDateColumn()
  created_at!: Date
}

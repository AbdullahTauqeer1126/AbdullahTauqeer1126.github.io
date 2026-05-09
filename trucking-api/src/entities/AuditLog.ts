import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm'

@Entity('audit_logs')
@Index('IDX_AUDIT_USER', ['user_id'])
@Index('IDX_AUDIT_ACTION', ['action'])
@Index('IDX_AUDIT_TIMESTAMP', ['timestamp'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid', { nullable: true })
  user_id?: string

  @Column({ length: 100 })
  action!: string // login, create_booking, approve_booking, etc.

  @Column({ length: 50 })
  resource_type!: string // booking, truck, user, payment, etc.

  @Column('uuid', { nullable: true })
  resource_id?: string

  @Column({ type: 'text', nullable: true })
  old_value?: string

  @Column({ type: 'text', nullable: true })
  new_value?: string

  @Column({ nullable: true, length: 50 })
  ip_address?: string

  @Column({ nullable: true, length: 500 })
  user_agent?: string

  @Column({ type: 'varchar', length: 20, default: 'success' })
  status: string = 'success'

  @Column({ type: 'text', nullable: true })
  reason?: string

  @CreateDateColumn()
  timestamp!: Date
}

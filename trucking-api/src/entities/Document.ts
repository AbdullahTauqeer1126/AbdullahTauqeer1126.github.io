import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm'
import { User } from './User'

export enum DocumentType {
  DRIVER_LICENSE = 'driver_license',
  CNIC = 'cnic',
  VEHICLE_REGISTRATION = 'vehicle_registration',
  FITNESS_CERTIFICATE = 'fitness_certificate',
  INSURANCE = 'insurance',
  MEDICAL_FITNESS = 'medical_fitness',
  BUSINESS_REGISTRATION = 'business_registration',
}

export enum DocumentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('documents')
@Index('IDX_DOC_USER', ['user_id'])
@Index('IDX_DOC_STATUS', ['verification_status'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  user_id!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User

  @Column('uuid', { nullable: true })
  truck_id?: string

  @Column({ type: 'enum', enum: DocumentType })
  document_type!: DocumentType

  @Column({ nullable: true, length: 100 })
  document_number?: string

  @Column({ type: 'date', nullable: true })
  issue_date?: Date

  @Column({ type: 'date', nullable: true })
  expiry_date?: Date

  @Column({ nullable: true, length: 500 })
  document_url?: string

  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.PENDING })
  verification_status: DocumentStatus = DocumentStatus.PENDING

  @Column('uuid', { nullable: true })
  verified_by?: string

  @Column({ type: 'timestamp', nullable: true })
  verified_at?: Date

  @Column({ type: 'text', nullable: true })
  rejection_reason?: string

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}

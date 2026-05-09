import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm'
import { User } from './User'
import { Booking } from './Booking'

@Entity('reviews')
@Index('IDX_REVIEW_BOOKING', ['booking_id'])
@Index('IDX_REVIEW_RATEE', ['ratee_id'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  booking_id!: string

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking

  @Column('uuid')
  rater_id!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'rater_id' })
  rater!: User

  @Column('uuid')
  ratee_id!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ratee_id' })
  ratee!: User

  @Column({ type: 'integer' })
  rating!: number // 1-5

  @Column({ type: 'text', nullable: true })
  review_text?: string

  @Column({ type: 'simple-json', nullable: true })
  categories?: {
    cleanliness?: number
    professionalism?: number
    punctuality?: number
    safety?: number
    communication?: number
  }

  @Column({ type: 'simple-json', nullable: true })
  photos?: string[]

  @Column({ type: 'text', nullable: true })
  response_from_ratee?: string

  @Column({ type: 'boolean', default: false })
  flagged_as_fake: boolean = false

  @CreateDateColumn()
  created_at!: Date
}

import axios from 'axios'
import { logger } from '../utils/logger'

interface SMSPayload {
  to: string
  message: string
  type: 'otp' | 'booking' | 'status' | 'payment' | 'general'
}

interface EmailPayload {
  to: string
  subject: string
  htmlContent: string
  type: 'confirmation' | 'receipt' | 'alert' | 'general'
}

// ========== BREVO SMS SERVICE ==========

export class BrevoSMSService {
  private apiKey = process.env.BREVO_API_KEY || ''
  private senderName = process.env.SMS_SENDER_NAME || 'RaftaarFreight'
  private apiUrl = 'https://api.brevo.com/v3/transactional/sms/send'

  async sendSMS(phoneNumber: string, message: string, type: SMSPayload['type'] = 'general'): Promise<{
    success: boolean
    messageId: string
    error?: string
  }> {
    try {
      if (!this.apiKey) {
        logger.warn('⚠️ Brevo API key not configured, logging SMS instead')
        logger.info(`📱 SMS to ${phoneNumber}: ${message}`)
        return {
          success: true,
          messageId: `LOCAL_${Date.now()}`,
        }
      }

      // Normalize Pakistan phone numbers
      let formattedPhone = phoneNumber
      if (phoneNumber.startsWith('+')) formattedPhone = phoneNumber
      else if (phoneNumber.startsWith('03')) formattedPhone = `+92${phoneNumber.slice(1)}`
      else if (phoneNumber.startsWith('3')) formattedPhone = `+923${phoneNumber}`
      else if (!phoneNumber.startsWith('92')) formattedPhone = `+92${phoneNumber}`

      const payload = {
        sender: this.senderName,
        recipient: formattedPhone,
        content: message,
      }

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      })

      logger.info(`✅ SMS sent to ${formattedPhone} (${type}): ${response.data.messageId}`)

      return {
        success: true,
        messageId: response.data.messageId,
      }
    } catch (error: any) {
      logger.error(`❌ SMS error to ${phoneNumber}:`, error.response?.data || error.message)
      return {
        success: false,
        messageId: '',
        error: error.response?.data?.message || error.message,
      }
    }
  }
}

// ========== BREVO EMAIL SERVICE ==========

export class BrevoEmailService {
  private apiKey = process.env.BREVO_API_KEY || ''
  private fromEmail = process.env.EMAIL_FROM || 'support@raftaarfreight.pk'
  private fromName = process.env.EMAIL_FROM_NAME || 'RaftaarFreight'
  private apiUrl = 'https://api.brevo.com/v3/smtp/email/send'

  async sendEmail(to: string, subject: string, htmlContent: string, type: EmailPayload['type'] = 'general'): Promise<{
    success: boolean
    messageId: string
    error?: string
  }> {
    try {
      if (!this.apiKey) {
        logger.warn('⚠️ Brevo API key not configured, logging email instead')
        logger.info(`📧 Email to ${to} [${subject}]: ${htmlContent.slice(0, 100)}...`)
        return {
          success: true,
          messageId: `LOCAL_${Date.now()}`,
        }
      }

      const payload = {
        sender: {
          email: this.fromEmail,
          name: this.fromName,
        },
        to: [
          {
            email: to,
          },
        ],
        subject,
        htmlContent,
        replyTo: {
          email: this.fromEmail,
        },
      }

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      })

      logger.info(`✅ Email sent to ${to} (${type}): ${response.data.messageId}`)

      return {
        success: true,
        messageId: response.data.messageId,
      }
    } catch (error: any) {
      logger.error(`❌ Email error to ${to}:`, error.response?.data || error.message)
      return {
        success: false,
        messageId: '',
        error: error.response?.data?.message || error.message,
      }
    }
  }
}

// ========== NOTIFICATION TEMPLATES ==========

export class NotificationTemplates {
  static bookingConfirmation(customerName: string, bookingId: string, pickupLocation: string, dropLocation: string, amount: number): string {
    return `Salam ${customerName}! 

Your booking #${bookingId.slice(-8)} is confirmed. 
📍 From: ${pickupLocation}
📍 To: ${dropLocation}
💰 Amount: PKR ${amount}

Confirm details and make payment to finalize booking.`
  }

  static driverAssigned(customerName: string, driverName: string, truckNumber: string, driverPhone: string): string {
    return `Salam ${customerName}!

Driver assigned to your booking:
👤 ${driverName}
🚚 ${truckNumber}
📞 ${driverPhone}

Your shipment is on the way!`
  }

  static tripStarted(customerName: string, driverName: string): string {
    return `Salam ${customerName}!

Trip started by ${driverName}. 
Track your shipment live on the app. 🗺️`
  }

  static deliveryCompleted(customerName: string, bookingId: string): string {
    return `Salam ${customerName}!

Your booking #${bookingId.slice(-8)} has been delivered successfully! ✅

Thank you for using RaftaarFreight.`
  }

  static paymentReceipt(customerName: string, bookingId: string, amount: number, method: string): string {
    return `Salam ${customerName}!

Payment Received ✅
Amount: PKR ${amount}
Method: ${method}
Booking: #${bookingId.slice(-8)}

Invoice will be emailed shortly.`
  }

  static paymentFailure(customerName: string, bookingId: string): string {
    return `Salam ${customerName}!

Payment failed for booking #${bookingId.slice(-8)}. 

Please try again or contact support.
📞 0800-TRUCK-PK`
  }

  static otpMessage(otp: string): string {
    return `Your RaftaarFreight OTP is: ${otp}

Valid for 5 minutes. Do not share with anyone.`
  }

  static bookingCancelled(customerName: string, bookingId: string, refundAmount: number): string {
    return `Salam ${customerName}!

Your booking #${bookingId.slice(-8)} has been cancelled.

Refund Amount: PKR ${refundAmount}
(Will be credited within 24 hours)`
  }

  static driverEarnings(driverName: string, earnings: number, tripCount: number): string {
    return `Salam ${driverName}!

Today's Earnings: PKR ${earnings}
Completed Trips: ${tripCount}

Check your dashboard for details.`
  }
}

// ========== UNIFIED NOTIFICATION SERVICE ==========

export class NotificationService {
  private sms = new BrevoSMSService()
  private email = new BrevoEmailService()
  private templates = NotificationTemplates

  // Send booking confirmation
  async sendBookingConfirmation(customerPhone: string, customerEmail: string, booking: any): Promise<void> {
    const smsMessage = this.templates.bookingConfirmation(
      booking.customer_name || 'User',
      booking.id,
      booking.pickup_address,
      booking.drop_address,
      booking.total_amount_prs
    )

    const emailContent = `
      <h2>Booking Confirmation</h2>
      <p>Booking ID: #${booking.id.slice(-8)}</p>
      <p>Pickup: ${booking.pickup_address}</p>
      <p>Drop: ${booking.drop_address}</p>
      <p>Amount: PKR ${booking.total_amount_prs}</p>
      <p><a href="${process.env.APP_URL}/customer/booking/${booking.id}">View Booking</a></p>
    `

    await Promise.all([
      this.sms.sendSMS(customerPhone, smsMessage, 'booking'),
      this.email.sendEmail(customerEmail, 'Booking Confirmation', emailContent, 'confirmation'),
    ])
  }

  // Send driver assigned notification
  async sendDriverAssigned(customerPhone: string, customerEmail: string, booking: any, driver: any, truck: any): Promise<void> {
    const smsMessage = this.templates.driverAssigned(
      booking.customer_name || 'User',
      driver.name || 'Driver',
      truck.registration_number,
      driver.phone
    )

    const emailContent = `
      <h2>Driver Assigned</h2>
      <p>Driver: ${driver.name}</p>
      <p>Truck: ${truck.registration_number}</p>
      <p>Phone: ${driver.phone}</p>
      <p>Track your shipment on the app.</p>
    `

    await Promise.all([
      this.sms.sendSMS(customerPhone, smsMessage, 'status'),
      this.email.sendEmail(customerEmail, 'Driver Assigned', emailContent, 'confirmation'),
    ])
  }

  // Send payment confirmation
  async sendPaymentConfirmation(customerPhone: string, customerEmail: string, booking: any, payment: any): Promise<void> {
    const smsMessage = this.templates.paymentReceipt(
      booking.customer_name || 'User',
      booking.id,
      payment.amount_prs,
      payment.payment_method
    )

    const emailContent = `
      <h2>Payment Received</h2>
      <p>Amount: PKR ${payment.amount_prs}</p>
      <p>Method: ${payment.payment_method}</p>
      <p>Booking: #${booking.id.slice(-8)}</p>
      <p>Status: ${payment.status}</p>
    `

    await Promise.all([
      this.sms.sendSMS(customerPhone, smsMessage, 'payment'),
      this.email.sendEmail(customerEmail, 'Payment Confirmation', emailContent, 'receipt'),
    ])
  }

  // Send delivery completed
  async sendDeliveryCompleted(customerPhone: string, customerEmail: string, booking: any): Promise<void> {
    const smsMessage = this.templates.deliveryCompleted(booking.customer_name || 'User', booking.id)

    const emailContent = `
      <h2>Delivery Completed</h2>
      <p>Your booking #${booking.id.slice(-8)} has been delivered successfully!</p>
      <p><a href="${process.env.APP_URL}/customer/booking/${booking.id}/review">Rate & Review</a></p>
    `

    await Promise.all([
      this.sms.sendSMS(customerPhone, smsMessage, 'status'),
      this.email.sendEmail(customerEmail, 'Delivery Completed', emailContent, 'confirmation'),
    ])
  }

  // Send OTP
  async sendOTP(phone: string, otp: string): Promise<void> {
    const smsMessage = this.templates.otpMessage(otp)
    await this.sms.sendSMS(phone, smsMessage, 'otp')
  }

  // Send booking cancelled
  async sendBookingCancelled(customerPhone: string, customerEmail: string, booking: any, refundAmount: number): Promise<void> {
    const smsMessage = this.templates.bookingCancelled(booking.customer_name || 'User', booking.id, refundAmount)

    const emailContent = `
      <h2>Booking Cancelled</h2>
      <p>Booking #${booking.id.slice(-8)} has been cancelled.</p>
      <p>Refund: PKR ${refundAmount} (within 24 hours)</p>
    `

    await Promise.all([
      this.sms.sendSMS(customerPhone, smsMessage, 'status'),
      this.email.sendEmail(customerEmail, 'Booking Cancelled', emailContent, 'alert'),
    ])
  }

  // Send driver earnings
  async sendDriverEarnings(driverPhone: string, driverEmail: string, driverName: string, earnings: number, tripCount: number): Promise<void> {
    const smsMessage = this.templates.driverEarnings(driverName, earnings, tripCount)

    const emailContent = `
      <h2>Today's Earnings</h2>
      <p>Total: PKR ${earnings}</p>
      <p>Trips: ${tripCount}</p>
    `

    await Promise.all([
      this.sms.sendSMS(driverPhone, smsMessage, 'general'),
      this.email.sendEmail(driverEmail, "Today's Earnings", emailContent, 'general'),
    ])
  }
}

export const notificationService = new NotificationService()

import { Router, Request, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware'
import { asyncHandler } from '../middleware/error.middleware'
import { logger } from '../utils/logger'

const router = Router()

interface InvoiceData {
  invoice_number: string
  date: string
  booking_id: string
  customer: { name: string; phone: string; email?: string; address?: string }
  pickup: string
  drop: string
  truck_type: string
  cargo_type: string
  weight_tons: number
  distance_km: number
  breakdown: {
    base_fare: number
    distance_charge: number
    surge_amount?: number
    insurance_premium?: number
    platform_fee: number
    gst_amount: number
    coupon_discount?: number
    total: number
    advance_paid: number
    balance_due: number
  }
  payment_method: string
  payment_status: string
  driver?: { name: string; phone: string }
  fleet_owner?: { name: string; company: string }
}

/**
 * Generate invoice HTML that can be converted to PDF client-side
 */
function generateInvoiceHTML(data: InvoiceData): string {
  const { breakdown: b } = data
  const lineItems = [
    { desc: 'Base Fare', amt: b.base_fare },
    { desc: `Distance Charge (${data.distance_km} km)`, amt: b.distance_charge },
    ...(b.surge_amount ? [{ desc: 'Surge Pricing', amt: b.surge_amount }] : []),
    ...(b.insurance_premium ? [{ desc: 'Cargo Insurance', amt: b.insurance_premium }] : []),
    { desc: 'Platform Fee (15%)', amt: b.platform_fee },
    { desc: 'GST (17%)', amt: b.gst_amount },
    ...(b.coupon_discount ? [{ desc: 'Coupon Discount', amt: -b.coupon_discount }] : []),
  ]

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
  body { padding: 40px; background: #fff; color: #212121; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #1B5E20; padding-bottom: 20px; }
  .logo { font-size: 28px; font-weight: 900; color: #1B5E20; }
  .logo span { color: #FF6F00; }
  .invoice-meta { text-align: right; }
  .invoice-meta h2 { font-size: 24px; color: #1B5E20; margin-bottom: 8px; }
  .invoice-meta p { font-size: 12px; color: #666; }
  .parties { display: flex; gap: 40px; margin-bottom: 30px; }
  .party { flex: 1; background: #f9f9f9; padding: 16px; border-radius: 8px; }
  .party h4 { font-size: 10px; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 8px; }
  .party p { font-size: 13px; margin-bottom: 4px; }
  .party .name { font-weight: 700; font-size: 15px; color: #212121; }
  .route { background: #E8F5E9; padding: 16px; border-radius: 8px; margin-bottom: 30px; display: flex; align-items: center; gap: 16px; }
  .route .label { font-size: 10px; text-transform: uppercase; color: #1B5E20; font-weight: 700; }
  .route .value { font-size: 14px; font-weight: 600; }
  .route .arrow { font-size: 20px; color: #1B5E20; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  th { background: #1B5E20; color: white; padding: 10px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 10px 16px; border-bottom: 1px solid #eee; font-size: 13px; }
  .amount { text-align: right; font-weight: 600; }
  .total-row td { border-top: 2px solid #1B5E20; font-weight: 900; font-size: 16px; background: #f0f0f0; }
  .payment-info { display: flex; gap: 20px; margin-bottom: 30px; }
  .payment-box { flex: 1; padding: 16px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
  .payment-box .label { font-size: 10px; color: #999; text-transform: uppercase; }
  .payment-box .value { font-size: 18px; font-weight: 900; color: #1B5E20; margin-top: 4px; }
  .payment-box.due .value { color: #FF6F00; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
  .footer p { font-size: 11px; color: #999; }
  .gst-note { background: #FFF3E0; padding: 12px; border-radius: 8px; font-size: 11px; color: #E65100; margin-bottom: 20px; }
</style></head><body>
<div class="header">
  <div><div class="logo">Truck<span>App</span> Pakistan</div><p style="font-size:12px;color:#666;margin-top:4px">Pakistan's #1 Logistics Platform</p></div>
  <div class="invoice-meta"><h2>INVOICE</h2><p><strong>${data.invoice_number}</strong></p><p>Date: ${data.date}</p><p>Booking: #${data.booking_id.slice(-8)}</p></div>
</div>
<div class="parties">
  <div class="party"><h4>Billed To</h4><p class="name">${data.customer.name}</p><p>${data.customer.phone}</p>${data.customer.email ? `<p>${data.customer.email}</p>` : ''}${data.customer.address ? `<p>${data.customer.address}</p>` : ''}</div>
  ${data.fleet_owner ? `<div class="party"><h4>Service Provider</h4><p class="name">${data.fleet_owner.company}</p><p>${data.fleet_owner.name}</p></div>` : ''}
  ${data.driver ? `<div class="party"><h4>Driver</h4><p class="name">${data.driver.name}</p><p>${data.driver.phone}</p></div>` : ''}
</div>
<div class="route">
  <div><div class="label">Pickup</div><div class="value">${data.pickup}</div></div>
  <div class="arrow">→</div>
  <div><div class="label">Drop-off</div><div class="value">${data.drop}</div></div>
  <div style="margin-left:auto;text-align:right"><div class="label">Truck / Cargo</div><div class="value">${data.truck_type} · ${data.cargo_type} · ${data.weight_tons}T</div></div>
</div>
<table><thead><tr><th>#</th><th>Description</th><th style="text-align:right">Amount (PKR)</th></tr></thead>
<tbody>
${lineItems.map((item, i) => `<tr><td>${i + 1}</td><td>${item.desc}</td><td class="amount">${item.amt < 0 ? '-' : ''}₨${Math.abs(item.amt).toLocaleString()}</td></tr>`).join('\n')}
<tr class="total-row"><td></td><td>TOTAL</td><td class="amount">₨${b.total.toLocaleString()}</td></tr>
</tbody></table>
<div class="gst-note">GST Registration: This invoice includes 17% General Sales Tax as per FBR regulations. TruckApp NTN: 1234567-8</div>
<div class="payment-info">
  <div class="payment-box"><div class="label">Payment Method</div><div class="value" style="font-size:14px;color:#212121">${data.payment_method}</div></div>
  <div class="payment-box"><div class="label">Advance Paid</div><div class="value">₨${b.advance_paid.toLocaleString()}</div></div>
  <div class="payment-box due"><div class="label">Balance Due</div><div class="value">₨${b.balance_due.toLocaleString()}</div></div>
  <div class="payment-box"><div class="label">Status</div><div class="value" style="font-size:14px;color:${data.payment_status === 'paid' ? '#1B5E20' : '#FF6F00'}">${data.payment_status.toUpperCase()}</div></div>
</div>
<div class="footer"><p>Thank you for choosing TruckApp Pakistan!</p><p>For support: support@truckapp.pk | 0800-TRUCK-APP</p><p style="margin-top:8px;font-size:10px">This is a computer-generated invoice and does not require a signature.</p></div>
</body></html>`
}

// ========== GENERATE INVOICE ==========
router.post('/generate', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { booking_id, customer, pickup, drop, truck_type, cargo_type, weight_tons,
    distance_km, breakdown, payment_method, payment_status, driver, fleet_owner } = req.body

  if (!booking_id) {
    res.status(400).json({ success: false, message: 'booking_id is required' })
    return
  }

  const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

  const invoiceData: InvoiceData = {
    invoice_number: invoiceNumber,
    date: new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' }),
    booking_id,
    customer: customer || { name: 'Customer', phone: '' },
    pickup: pickup || 'N/A',
    drop: drop || 'N/A',
    truck_type: truck_type || 'Standard',
    cargo_type: cargo_type || 'General',
    weight_tons: weight_tons || 0,
    distance_km: distance_km || 0,
    breakdown: breakdown || { base_fare: 0, distance_charge: 0, platform_fee: 0, gst_amount: 0, total: 0, advance_paid: 0, balance_due: 0 },
    payment_method: payment_method || 'N/A',
    payment_status: payment_status || 'pending',
    driver,
    fleet_owner,
  }

  const html = generateInvoiceHTML(invoiceData)

  logger.info(`📄 Invoice generated: ${invoiceNumber} for booking ${booking_id}`)

  res.json({
    success: true,
    data: {
      invoice_number: invoiceNumber,
      html,
      // Client should use window.print() or html2pdf.js to convert to PDF
    },
  })
}))

export default router

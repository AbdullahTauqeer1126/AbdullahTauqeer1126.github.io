'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Globe } from 'lucide-react'

const CONTENT = {
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: April 24, 2026',
    sections: [
      { heading: '1. Information We Collect', body: 'We collect information you provide during registration (name, email, phone, CNIC number for KYC), booking details (pickup/drop locations, cargo type and weight), payment information (processed securely via JazzCash, Easypaisa, or bank), GPS location data during active trips for real-time tracking, device information and usage analytics to improve the platform, and communications between users (chat messages, support tickets).' },
      { heading: '2. How We Use Your Information', body: 'We use your data to provide and improve our freight marketplace services, process bookings and payments, enable real-time GPS tracking during active trips, verify user identity through KYC procedures (NADRA/CNIC verification), calculate and display pricing including GST at 17%, generate tax compliance reports for fleet owners and drivers, send booking notifications, receipts, and promotional offers, detect and prevent fraud and ensure platform safety, and comply with Pakistani legal and regulatory requirements.' },
      { heading: '3. Data Storage & Security', body: 'All personal data is stored within Pakistan borders in compliance with PECA (Pakistan Electronic Crimes Act). We use industry-standard encryption (AES-256) for sensitive data including CNIC numbers, bank details, and passwords. Data is transmitted over secure connections (TLS 1.3). Access to user data is restricted to authorized personnel only. We maintain audit logs of all data access for compliance purposes.' },
      { heading: '4. Data Sharing', body: 'We share your data only with: other users involved in your booking (drivers see pickup location, customers see driver location), payment processors (JazzCash, Easypaisa, banks) for transaction processing, law enforcement agencies when required by Pakistani law (FIA, Police), and regulatory bodies (FBR for tax compliance, FIU for AML compliance). We never sell your personal data to third parties for marketing purposes.' },
      { heading: '5. Your Rights', body: 'Under Pakistani law, you have the right to: access all personal data we hold about you, correct inaccurate or incomplete data, delete your account and associated data (subject to legal retention requirements), opt out of marketing communications, export your data in a machine-readable format (JSON/CSV), and lodge a complaint with the relevant authority if you believe your rights have been violated.' },
      { heading: '6. Data Retention', body: 'We retain your data for the following periods: Account data — until account deletion + 90 days. Booking records — 7 years (FBR tax compliance requirement). Payment records — 7 years (FBR requirement). GPS location data — 1 year (or until trip dispute resolution). Chat messages — 6 months. Audit logs — 7 years (regulatory compliance). KYC documents — duration of account + 5 years.' },
      { heading: '7. Cookies & Tracking', body: 'We use essential cookies for authentication and session management. We use analytics cookies (Google Analytics) to understand platform usage. We use no third-party advertising trackers. You can control cookie preferences in your browser settings.' },
      { heading: '8. Children\'s Privacy', body: 'Our platform is not intended for users under 18 years of age. We do not knowingly collect data from minors. If we discover we have collected data from a minor, we will delete it immediately.' },
      { heading: '9. Changes to This Policy', body: 'We may update this Privacy Policy periodically. We will notify you of material changes via email and in-app notification. Continued use of the platform after changes constitutes acceptance.' },
      { heading: '10. Contact Us', body: 'For privacy-related inquiries: Email: privacy@raftaarfreight.pk | Phone: 0800-RAFTAAR (0800-723-8227) | Address: RaftaarFreight Head Office, Shahrah-e-Faisal, Karachi 74200, Pakistan. Data Protection Officer: dpo@raftaarfreight.pk' },
    ],
  },
  ur: {
    title: 'رازداری کی پالیسی',
    lastUpdated: 'آخری تازہ کاری: 24 اپریل 2026',
    sections: [
      { heading: '1. ہم کیا معلومات جمع کرتے ہیں', body: 'ہم رجسٹریشن کے دوران فراہم کردہ معلومات (نام، ای میل، فون، شناختی کارڈ نمبر)، بکنگ کی تفصیلات (پک اپ/ڈراپ مقامات، کارگو کی قسم اور وزن)، ادائیگی کی معلومات، فعال سفر کے دوران جی پی ایس لوکیشن ڈیٹا، ڈیوائس کی معلومات، اور صارفین کے درمیان مواصلات جمع کرتے ہیں۔' },
      { heading: '2. ہم آپ کی معلومات کیسے استعمال کرتے ہیں', body: 'ہم آپ کا ڈیٹا فریٹ مارکیٹ پلیس خدمات فراہم کرنے، بکنگ اور ادائیگیاں پروسیس کرنے، ریئل ٹائم جی پی ایس ٹریکنگ، KYC تصدیق، 17% جی ایس ٹی سمیت قیمتوں کا حساب، ٹیکس رپورٹیں تیار کرنے، اطلاعات بھیجنے، دھوکہ دہی سے بچاؤ، اور پاکستانی قانونی تقاضوں کی تعمیل کے لیے استعمال کرتے ہیں۔' },
      { heading: '3. ڈیٹا اسٹوریج اور سیکیورٹی', body: 'تمام ذاتی ڈیٹا پاکستان الیکٹرانک کرائمز ایکٹ کے مطابق پاکستان کی حدود میں محفوظ کیا جاتا ہے۔ ہم حساس ڈیٹا کے لیے AES-256 انکرپشن استعمال کرتے ہیں۔ ڈیٹا محفوظ کنکشنز (TLS 1.3) کے ذریعے منتقل ہوتا ہے۔' },
      { heading: '4. ڈیٹا شیئرنگ', body: 'ہم آپ کا ڈیٹا صرف بکنگ میں شامل دوسرے صارفین، ادائیگی پروسیسرز (جاز کیش، ایزی پیسہ)، قانون نافذ کرنے والے اداروں (ایف آئی اے)، اور ریگولیٹری اداروں (ایف بی آر) کے ساتھ شیئر کرتے ہیں۔ ہم کبھی بھی آپ کا ذاتی ڈیٹا تیسرے فریق کو فروخت نہیں کرتے۔' },
      { heading: '5. آپ کے حقوق', body: 'پاکستانی قانون کے تحت آپ کو یہ حقوق حاصل ہیں: اپنے تمام ذاتی ڈیٹا تک رسائی، غلط ڈیٹا کی تصحیح، اپنا اکاؤنٹ اور ڈیٹا حذف کرنا، مارکیٹنگ پیغامات سے آپٹ آؤٹ، اپنا ڈیٹا ایکسپورٹ کرنا، اور شکایت درج کرانا۔' },
      { heading: '6. ڈیٹا برقرار رکھنا', body: 'اکاؤنٹ ڈیٹا: اکاؤنٹ حذف ہونے + 90 دن تک۔ بکنگ ریکارڈز: 7 سال (ایف بی آر ٹیکس تعمیل)۔ ادائیگی ریکارڈز: 7 سال۔ جی پی ایس ڈیٹا: 1 سال۔ چیٹ پیغامات: 6 ماہ۔ آڈٹ لاگز: 7 سال۔' },
      { heading: '7. کوکیز اور ٹریکنگ', body: 'ہم تصدیق کے لیے ضروری کوکیز اور تجزیاتی کوکیز استعمال کرتے ہیں۔ ہم تھرڈ پارٹی ایڈورٹائزنگ ٹریکرز استعمال نہیں کرتے۔' },
      { heading: '8. بچوں کی رازداری', body: 'ہمارا پلیٹ فارم 18 سال سے کم عمر صارفین کے لیے نہیں ہے۔ اگر ہمیں معلوم ہو کہ ہم نے نابالغ کا ڈیٹا جمع کیا ہے تو فوری طور پر حذف کر دیں گے۔' },
      { heading: '9. پالیسی میں تبدیلیاں', body: 'ہم اس رازداری کی پالیسی کو وقتاً فوقتاً اپ ڈیٹ کر سکتے ہیں۔ اہم تبدیلیوں کی اطلاع ای میل اور ایپ کے ذریعے دی جائے گی۔' },
      { heading: '10. ہم سے رابطہ کریں', body: 'رازداری سے متعلق سوالات کے لیے: ای میل: privacy@raftaarfreight.pk | فون: 0800-723-8227 | پتہ: رفتار فریٹ ہیڈ آفس، شاہراہ فیصل، کراچی 74200, پاکستان' },
    ],
  },
}

export default function PrivacyPage() {
  const [lang, setLang] = useState<'en' | 'ur'>('en')
  const c = CONTENT[lang]

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-[#666] hover:text-[#1B5E20]">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <button onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E8F5E9] text-[#1B5E20] text-sm font-bold hover:bg-[#C8E6C9] transition-all">
            <Globe size={14} />
            {lang === 'en' ? 'اردو' : 'English'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
        <h1 className="text-3xl font-black text-[#212121] mb-2">{c.title}</h1>
        <p className="text-sm text-[#999] mb-8">{c.lastUpdated}</p>

        <div className="flex flex-col gap-8">
          {c.sections.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-black text-[#212121] mb-3">{s.heading}</h2>
              <p className="text-sm text-[#666] leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center text-sm text-[#999]">
          <p>© 2026 RaftaarFreight. All rights reserved.</p>
          <div className="flex gap-4 justify-center mt-2">
            <Link href="/terms" className="hover:text-[#1B5E20]">Terms & Conditions</Link>
            <Link href="/help" className="hover:text-[#1B5E20]">Help Center</Link>
          </div>
        </div>
      </main>
    </div>
  )
}

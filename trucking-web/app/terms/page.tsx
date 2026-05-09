'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Globe } from 'lucide-react'

const CONTENT = {
  en: {
    title: 'Terms & Conditions',
    lastUpdated: 'Last updated: April 24, 2026',
    sections: [
      { heading: '1. Acceptance of Terms', body: 'By accessing or using the RaftaarFreight platform, including our website, mobile application, and any associated services (collectively, the "Platform"), you agree to be bound by these Terms & Conditions. If you do not agree, you must stop using the Platform immediately.' },
      { heading: '2. User Accounts & Registration', body: 'You must register an account to use core features. You agree to provide accurate, complete, and current information. You are responsible for maintaining the confidentiality of your account credentials. Fleet owners must complete KYC verification including CNIC and vehicle documents. Drivers must provide a valid Commercial Driving License (CDL), CNIC, and medical fitness certificate.' },
      { heading: '3. Services & Booking', body: 'RaftaarFreight is a digital freight marketplace connecting customers with fleet owners and truck stand agents across Pakistan. We do not own or operate any trucks. Bookings require a 50% advance payment. The remaining 50% is charged upon delivery confirmation. Cancellation fees apply based on timing as described in our Cancellation Policy.' },
      { heading: '4. Payment Terms', body: 'All prices are in Pakistani Rupees (PKR) and include applicable GST at 17%. We support JazzCash, Easypaisa, bank transfer, credit/debit cards, and Cash on Delivery (COD) where available. Platform commission is 15% for standard bookings and 20% for premium/urgent bookings. Agent commission is 10% of the platform\'s share. Refunds are processed within 7-14 business days.' },
      { heading: '5. User Responsibilities', body: 'Customers must declare accurate cargo weight and type. Overloading is strictly prohibited and subject to penalties under Pakistani law. Fleet owners must ensure vehicle documentation (Registration Certificate, Insurance, Fitness Certificate) is valid. Drivers must comply with speed limits, rest hour regulations, and all traffic laws. Any fraudulent activity will result in permanent account suspension.' },
      { heading: '6. Liability & Insurance', body: 'RaftaarFreight is not liable for cargo damage, loss, or delays unless caused by gross negligence. Optional cargo insurance is available at 2% of declared cargo value. Third-party liability insurance is mandatory for all trucks on the platform. We recommend all users carry appropriate insurance coverage.' },
      { heading: '7. Dispute Resolution', body: 'Disputes are handled through our in-app complaint system. Level 1: In-app response within 48 hours. Level 2: Escalation to complaint committee within 7 days. Level 3: Ombudsman involvement if Level 2 is unsatisfactory. Users may pursue arbitration or civil court litigation if desired.' },
      { heading: '8. Data Protection', body: 'We comply with Pakistan Electronic Crimes Act (PECA). Personal data is stored within Pakistan borders. We encrypt all personally identifiable information (PII). Users have the right to access, correct, and delete their data. See our Privacy Policy for full details.' },
      { heading: '9. Termination', body: 'We reserve the right to suspend or terminate accounts for violation of these terms, fraudulent activity, or at our discretion with notice. Users may close their accounts at any time through the app settings.' },
      { heading: '10. Governing Law', body: 'These terms are governed by the laws of Pakistan. Any disputes shall be subject to the exclusive jurisdiction of the courts in Karachi, Sindh, Pakistan.' },
    ],
  },
  ur: {
    title: 'شرائط و ضوابط',
    lastUpdated: 'آخری تازہ کاری: 24 اپریل 2026',
    sections: [
      { heading: '1. شرائط کی قبولیت', body: 'رفتار فریٹ پلیٹ فارم استعمال کرنے سے آپ ان شرائط و ضوابط سے اتفاق کرتے ہیں۔ اگر آپ متفق نہیں ہیں تو براہ کرم پلیٹ فارم کا استعمال بند کر دیں۔' },
      { heading: '2. صارف اکاؤنٹ اور رجسٹریشن', body: 'بنیادی خدمات استعمال کرنے کے لیے اکاؤنٹ رجسٹریشن ضروری ہے۔ آپ درست اور مکمل معلومات فراہم کریں گے۔ فلیٹ مالکان کو شناختی کارڈ اور گاڑی کی دستاویزات کے ساتھ KYC تصدیق مکمل کرنی ہوگی۔ ڈرائیوروں کو درست کمرشل ڈرائیونگ لائسنس، شناختی کارڈ اور طبی سرٹیفکیٹ فراہم کرنا ہوگا۔' },
      { heading: '3. خدمات اور بکنگ', body: 'رفتار فریٹ ایک ڈیجیٹل فریٹ مارکیٹ پلیس ہے جو صارفین کو پاکستان بھر میں فلیٹ مالکان اور ایجنٹس سے جوڑتا ہے۔ بکنگ کے لیے 50% ایڈوانس ادائیگی ضروری ہے۔ باقی 50% ڈیلیوری کی تصدیق پر وصول کیا جائے گا۔' },
      { heading: '4. ادائیگی کی شرائط', body: 'تمام قیمتیں پاکستانی روپے میں ہیں اور 17% جی ایس ٹی شامل ہے۔ ہم جاز کیش، ایزی پیسہ، بینک ٹرانسفر اور کارڈ ادائیگی کی حمایت کرتے ہیں۔ پلیٹ فارم کمیشن 15% اور ایجنٹ کمیشن 10% ہے۔ ریفنڈ 7-14 کاروباری دنوں میں پروسیس ہوتا ہے۔' },
      { heading: '5. صارف کی ذمہ داریاں', body: 'صارفین کو کارگو کا وزن اور قسم درست بیان کرنا ضروری ہے۔ اوور لوڈنگ سختی سے ممنوع ہے۔ فلیٹ مالکان کو گاڑی کی دستاویزات کی تصدیق یقینی بنانی ہوگی۔ ڈرائیوروں کو تمام ٹریفک قوانین کی پابندی کرنی ہوگی۔' },
      { heading: '6. ذمہ داری اور انشورنس', body: 'رفتار فریٹ کارگو نقصان یا تاخیر کا ذمہ دار نہیں ہے سوائے سنگین غفلت کے۔ اختیاری کارگو انشورنس 2% پر دستیاب ہے۔ تمام گاڑیوں کے لیے تھرڈ پارٹی لائبلٹی انشورنس لازمی ہے۔' },
      { heading: '7. تنازعات کا حل', body: 'تنازعات ایپ کے شکایت نظام کے ذریعے حل کیے جاتے ہیں۔ مرحلہ 1: 48 گھنٹوں میں جواب۔ مرحلہ 2: 7 دنوں میں کمیٹی کو ایسکلیشن۔ مرحلہ 3: محتسب کی شمولیت۔' },
      { heading: '8. ڈیٹا تحفظ', body: 'ہم پاکستان الیکٹرانک کرائمز ایکٹ کی تعمیل کرتے ہیں۔ ذاتی ڈیٹا پاکستان کی حدود میں محفوظ کیا جاتا ہے۔ صارفین کو اپنا ڈیٹا حاصل کرنے، درست کرنے اور حذف کرنے کا حق ہے۔' },
      { heading: '9. اکاؤنٹ معطلی', body: 'ہم شرائط کی خلاف ورزی، دھوکہ دہی یا اپنی صوابدید پر اکاؤنٹ معطل یا ختم کرنے کا حق رکھتے ہیں۔ صارفین کسی بھی وقت اپنا اکاؤنٹ بند کر سکتے ہیں۔' },
      { heading: '10. حاکم قانون', body: 'یہ شرائط پاکستان کے قوانین کے تحت ہیں۔ تمام تنازعات کراچی، سندھ، پاکستان کی عدالتوں کے دائرہ اختیار میں ہوں گے۔' },
    ],
  },
}

export default function TermsPage() {
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
            <Link href="/privacy" className="hover:text-[#1B5E20]">Privacy Policy</Link>
            <Link href="/help" className="hover:text-[#1B5E20]">Help Center</Link>
          </div>
        </div>
      </main>
    </div>
  )
}

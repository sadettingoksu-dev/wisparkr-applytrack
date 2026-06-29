import type { Locale } from './i18n'

export interface LegalSection {
  heading: string
  body: string[]
}
export interface LegalDoc {
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}

const UPDATED_TR = 'Son güncelleme: 26 Haziran 2026'
const UPDATED_EN = 'Last updated: 26 June 2026'
const CONTACT = 'info@wisparkr.com'

export const PRIVACY: Partial<Record<Locale, LegalDoc>> = {
  tr: {
    title: 'Gizlilik Politikası',
    updated: UPDATED_TR,
    intro:
      'Wisparkr olarak gizliliğine önem veriyoruz. Bu politika, hangi verileri topladığımızı, neden topladığımızı, kimlerle paylaştığımızı ve haklarını açıklar.',
    sections: [
      {
        heading: '1. Topladığımız Veriler',
        body: [
          'Hesap bilgileri: ad, e-posta adresi ve (Google ile giriş yaparsan) profil fotoğrafın.',
          'CV içeriği: deneyim, eğitim, beceriler, projeler, sertifikalar ve yüklediğin profesyonel fotoğraf.',
          'İş başvurusu kayıtların: şirket, pozisyon, ilan metni, durum, notlar ve mülakat tarihleri.',
          'Kullanım verileri: AI özellik kullanım sayaçları ve plan/abonelik durumun.',
        ],
      },
      {
        heading: '2. Verileri Nasıl Kullanırız',
        body: [
          'Hizmeti sunmak; CV ve başvurularını yönetmek.',
          'AI özelliklerini çalıştırmak (uyum skoru, ön yazı, beceri açığı, CV cila, mock mülakat).',
          'Aboneliğini yönetmek ve sana ürünle ilgili bildirimler göndermek.',
        ],
      },
      {
        heading: '3. Üçüncü Taraf Hizmetler',
        body: [
          'Supabase — veritabanı ve kimlik doğrulama (barındırma).',
          'Anthropic (Claude) — AI özelliklerini kullandığında CV ve ilan metnin AI ile işlenmek üzere gönderilir.',
          'Lemon Squeezy — ödeme altyapısı ve resmi satıcı (merchant of record); kart bilgilerini biz görmeyiz/saklamayız.',
          'Resend — e-posta gönderimi. Vercel — uygulama barındırma.',
          'Verilerini üçüncü taraflara satmıyoruz.',
        ],
      },
      {
        heading: '4. Yapay Zeka ve Verilerin',
        body: [
          'AI özelliklerini kullandığında CV metnin ve ilgili ilan metni, sonucu üretmek için Anthropic’e işlenmek üzere iletilir.',
          'Bu veriler sağlayıcının politikalarına tabidir ve model eğitimi için kullanılmaz.',
        ],
      },
      {
        heading: '5. Çerezler',
        body: ['Yalnızca oturum açma ve kimlik doğrulama için gerekli çerezleri kullanırız. Reklam/izleme çerezi kullanmayız.'],
      },
      {
        heading: '6. Veri Saklama ve Silme',
        body: [
          'Verilerini hesabın aktif olduğu sürece saklarız.',
          `Hesabını ve verilerini silmek istersen ${CONTACT} adresinden talep edebilirsin; makul süre içinde sileriz.`,
        ],
      },
      {
        heading: '7. Haklarınız (KVKK / GDPR)',
        body: [
          'Verilerine erişme, düzeltme, silme ve taşıma hakkın vardır.',
          `Bu haklarını kullanmak için ${CONTACT} ile iletişime geçebilirsin.`,
        ],
      },
      {
        heading: '8. Güvenlik',
        body: ['Veriler şifreli bağlantı (HTTPS) üzerinden iletilir ve erişim yetkilendirme ile sınırlandırılır.'],
      },
      {
        heading: '9. Değişiklikler',
        body: ['Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişiklikleri uygulama üzerinden veya e-posta ile bildiririz.'],
      },
      {
        heading: '10. İletişim',
        body: [`Sorularını ${CONTACT} adresine iletebilirsin.`],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: UPDATED_EN,
    intro:
      'At Wisparkr we care about your privacy. This policy explains what data we collect, why, who we share it with, and your rights.',
    sections: [
      {
        heading: '1. Data We Collect',
        body: [
          'Account info: name, email address and (if you sign in with Google) your profile picture.',
          'CV content: experience, education, skills, projects, certifications and any photo you upload.',
          'Application records: company, position, job description, status, notes and interview dates.',
          'Usage data: AI feature usage counters and your plan/subscription status.',
        ],
      },
      {
        heading: '2. How We Use Data',
        body: [
          'To provide the service and manage your CV and applications.',
          'To power AI features (fit score, cover letter, skills gap, CV polish, mock interview).',
          'To manage your subscription and send product-related notifications.',
        ],
      },
      {
        heading: '3. Third-Party Services',
        body: [
          'Supabase — database and authentication (hosting).',
          'Anthropic (Claude) — when you use AI features, your CV and the relevant job text are sent for processing.',
          'Lemon Squeezy — payment processing and merchant of record; we never see or store your card details.',
          'Resend — email delivery. Vercel — application hosting.',
          'We do not sell your data to third parties.',
        ],
      },
      {
        heading: '4. AI and Your Data',
        body: [
          'When you use AI features, your CV text and the related job text are sent to Anthropic for processing to generate the result.',
          'This data is subject to the provider’s policies and is not used to train models.',
        ],
      },
      {
        heading: '5. Cookies',
        body: ['We only use cookies necessary for sign-in and authentication. We do not use advertising/tracking cookies.'],
      },
      {
        heading: '6. Retention and Deletion',
        body: [
          'We retain your data while your account is active.',
          `To delete your account and data, contact ${CONTACT}; we will delete it within a reasonable time.`,
        ],
      },
      {
        heading: '7. Your Rights (KVKK / GDPR)',
        body: ['You have the right to access, correct, delete and port your data.', `To exercise these rights, contact ${CONTACT}.`],
      },
      {
        heading: '8. Security',
        body: ['Data is transmitted over an encrypted connection (HTTPS) and access is restricted by authorization.'],
      },
      {
        heading: '9. Changes',
        body: ['We may update this policy from time to time. We will notify you of significant changes in-app or by email.'],
      },
      {
        heading: '10. Contact',
        body: [`For questions, contact ${CONTACT}.`],
      },
    ],
  },
}

export const TERMS: Partial<Record<Locale, LegalDoc>> = {
  tr: {
    title: 'Kullanım Şartları',
    updated: UPDATED_TR,
    intro: 'Wisparkr’ı kullanarak bu şartları kabul etmiş olursun. Lütfen dikkatlice oku.',
    sections: [
      {
        heading: '1. Hizmet',
        body: ['Wisparkr; iş başvurularını takip etmeni sağlayan ve AI destekli CV, ön yazı ve mülakat hazırlık araçları sunan bir platformdur.'],
      },
      {
        heading: '2. Hesabın',
        body: [
          'Kayıt sırasında doğru bilgi vermeli ve hesabını güvende tutmalısın.',
          'Hesabın altında gerçekleşen tüm etkinlikten sen sorumlusun.',
        ],
      },
      {
        heading: '3. Abonelik ve Ödeme',
        body: [
          'Ücretli planlar (Pro, Career Coach) aylık aboneliktir.',
          'Ödemeler Lemon Squeezy üzerinden alınır; Lemon Squeezy resmi satıcıdır (merchant of record).',
          'Yeni kayıtlarda 3 günlük ücretsiz tam erişimli deneme sunulur.',
          'Aboneliğini istediğin zaman iptal edebilirsin; mevcut dönem sonuna kadar erişimin devam eder.',
          'İade talepleri Lemon Squeezy’nin iade politikasına tabidir.',
        ],
      },
      {
        heading: '4. Kabul Edilebilir Kullanım',
        body: [
          'Hizmeti yasa dışı, zararlı veya başkalarının haklarını ihlal eden amaçlarla kullanamazsın.',
          'Sistemi otomatik kötüye kullanım, aşırı yükleme veya güvenlik atlatma girişimleriyle kullanmak yasaktır.',
        ],
      },
      {
        heading: '5. Yapay Zeka İçeriği',
        body: [
          'AI çıktıları (uyum skoru, ön yazı, öneriler vb.) bilgilendirme amaçlıdır ve doğruluğu garanti edilmez.',
          'Nihai kararlar ve içerik sorumluluğu sana aittir.',
        ],
      },
      {
        heading: '6. Fikri Mülkiyet',
        body: [
          'Girdiğin içerik (CV, başvurular, notlar) sana aittir.',
          'Platformun kendisi, tasarımı ve yazılımı Wisparkr’a aittir.',
        ],
      },
      {
        heading: '7. Sorumluluğun Sınırlandırılması',
        body: [
          'Hizmet "olduğu gibi" sunulur; kesintisizlik veya hatasızlık garanti edilmez.',
          'Wisparkr, kullanımdan doğan dolaylı veya sonuçsal zararlardan sorumlu değildir.',
        ],
      },
      {
        heading: '8. Fesih',
        body: [
          'Bu şartları ihlal edersen hesabını askıya alabilir veya kapatabiliriz.',
          'Sen de istediğin zaman hesabını kapatabilirsin.',
        ],
      },
      {
        heading: '9. Değişiklikler',
        body: ['Bu şartları güncelleyebiliriz. Güncelleme sonrası hizmeti kullanmaya devam etmen kabul anlamına gelir.'],
      },
      {
        heading: '10. Geçerli Hukuk',
        body: ['Bu şartlara Türkiye Cumhuriyeti hukuku uygulanır.'],
      },
      {
        heading: '11. İletişim',
        body: [`Sorularını ${CONTACT} adresine iletebilirsin.`],
      },
    ],
  },
  en: {
    title: 'Terms of Use',
    updated: UPDATED_EN,
    intro: 'By using Wisparkr you agree to these terms. Please read them carefully.',
    sections: [
      {
        heading: '1. The Service',
        body: ['Wisparkr is a platform that lets you track job applications and provides AI-powered CV, cover letter and interview preparation tools.'],
      },
      {
        heading: '2. Your Account',
        body: [
          'You must provide accurate information at sign-up and keep your account secure.',
          'You are responsible for all activity under your account.',
        ],
      },
      {
        heading: '3. Subscription and Payment',
        body: [
          'Paid plans (Pro, Career Coach) are monthly subscriptions.',
          'Payments are processed by Lemon Squeezy, which acts as the merchant of record.',
          'New sign-ups get a 5-day free full-access trial.',
          'You can cancel any time; access continues until the end of the current period.',
          'Refund requests are subject to Lemon Squeezy’s refund policy.',
        ],
      },
      {
        heading: '4. Acceptable Use',
        body: [
          'You may not use the service for unlawful or harmful purposes, or to infringe others’ rights.',
          'Automated abuse, overloading, or attempts to bypass security are prohibited.',
        ],
      },
      {
        heading: '5. AI Content',
        body: [
          'AI outputs (fit score, cover letter, suggestions, etc.) are informational and not guaranteed to be accurate.',
          'Final decisions and responsibility for content rest with you.',
        ],
      },
      {
        heading: '6. Intellectual Property',
        body: ['The content you enter (CV, applications, notes) belongs to you.', 'The platform itself, its design and software belong to Wisparkr.'],
      },
      {
        heading: '7. Limitation of Liability',
        body: [
          'The service is provided "as is"; we do not guarantee it will be uninterrupted or error-free.',
          'Wisparkr is not liable for indirect or consequential damages arising from use.',
        ],
      },
      {
        heading: '8. Termination',
        body: ['We may suspend or close your account if you violate these terms.', 'You may close your account at any time.'],
      },
      {
        heading: '9. Changes',
        body: ['We may update these terms. Continued use after an update constitutes acceptance.'],
      },
      {
        heading: '10. Governing Law',
        body: ['These terms are governed by the laws of the Republic of Türkiye.'],
      },
      {
        heading: '11. Contact',
        body: [`For questions, contact ${CONTACT}.`],
      },
    ],
  },
}

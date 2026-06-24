/**
 * Hafif çoklu dil (i18n) altyapısı. Şimdilik Türkçe (varsayılan) ve İngilizce.
 * Seçilen dil bir çerezde (`locale`) saklanır; root layout sunucuda okuyup
 * I18nProvider'a verir, böylece hydration uyumsuzluğu olmaz.
 */
export const LOCALES = ['tr', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'tr'
export const LOCALE_COOKIE = 'locale'

export function normalizeLocale(value: string | undefined | null): Locale {
  return value === 'en' ? 'en' : 'tr'
}

const tr = {
  nav: {
    features: 'Özellikler',
    pricing: 'Fiyatlandırma',
    login: 'Giriş Yap',
  },
  hero: {
    badge: 'AI destekli iş başvuru yönetimi',
    titleA: 'İş başvurularını',
    titleB: 'ile yönet',
    subtitle:
      '“Başvurdum, ne oldu?” sorusuna son. Wisparkr tüm başvuru sürecini tek bir yerden yönetmeni sağlar.',
  },
  features: {
    heading: 'Tüm ihtiyacın tek yerde',
    items: [
      {
        title: 'Kanban ile takip',
        description:
          'İş ilanı linkini yapıştır, başvurunu otomatik oluştur ve Beklemede / Mülakat / Teklif / Reddedildi sütunlarında takip et.',
      },
      {
        title: 'AI ile CV uyum skoru',
        description: "CV'ni yükle, AI ilana uyum oranını hesaplasın ve seni güçlendirecek önerileri sunsun.",
      },
      {
        title: 'Mülakat hazırlık asistanı',
        description: "Mülakat öncesi AI'a sorularını sor, şirkete özel hazırlık tüyoları al.",
      },
    ],
  },
  pricing: {
    heading: 'İhtiyacına uygun planı seç',
    subtitle: 'İstediğin zaman değiştirebilirsin.',
    popular: 'En Popüler',
    perMonth: '/ay',
    freeCta: 'Ücretsiz Başla',
    paidCta: 'Plana Geç',
    lists: {
      free: ['5 başvuru', '10 AI soru/ay', 'Temel kanban board'],
      pro: ['Sınırsız başvuru', '200 AI soru/ay', 'CV uyum skoru', 'CV otomatik uyarlama'],
      career_coach: [
        "Pro'daki her şey",
        'Sınırsız AI soru',
        'Şirket içgörüsü',
        'Maaş müzakere koçu',
        'Rakip analizi',
      ],
    },
  },
  footer: {
    rights: 'Tüm hakları saklıdır.',
  },
  showcase: {
    subtitle: 'Kariyerini hızlandıran AI destekli başvuru asistanı',
    chips: [
      'CV uyum skoru',
      'Mülakat asistanı',
      'Kanban takip',
      'AI öneriler',
      'PDF CV oluştur',
      'Paylaşılabilir CV',
    ],
    taglines: ['CV uyum skoru ile öne çık', 'AI mülakat hazırlığı', 'Tüm başvuruların tek yerde'],
  },
  login: {
    subtitle: 'Hesabına giriş yap',
    google: 'Google ile devam et',
    orEmail: 'veya e-posta ile',
    email: 'E-posta adresi',
    password: 'Şifre',
    submit: 'Giriş Yap',
    submitting: 'Giriş yapılıyor...',
    error: 'E-posta veya şifre hatalı.',
    noAccount: 'Hesabın yok mu?',
    signupLink: 'Kayıt ol',
  },
  signup: {
    subtitle: 'Ücretsiz hesabını oluştur',
    google: 'Google ile devam et',
    orEmail: 'veya e-posta ile',
    fullName: 'Ad Soyad',
    email: 'E-posta adresi',
    password: 'Şifre',
    confirm: 'Şifre tekrar',
    submit: 'Hesap Oluştur',
    submitting: 'Hesap oluşturuluyor...',
    pwMismatch: 'Şifreler eşleşmiyor.',
    pwTooShort: 'Şifre en az 8 karakter olmalıdır.',
    existingEmail:
      'Bu e-posta adresiyle zaten bir hesabın var. Google ile kayıt olduysan giriş sayfasından "Google ile devam et" ile giriş yapabilirsin.',
    strength: { min8: 'En az 8 karakter', upper: 'Büyük harf', number: 'Sayı' },
    termsPre: 'Kayıt olarak',
    terms: 'Kullanım Şartları',
    and: 've',
    privacy: 'Gizlilik Politikası',
    termsPost: "'nı kabul etmiş olursun.",
    haveAccount: 'Zaten hesabın var mı?',
    loginLink: 'Giriş yap',
    otp: {
      title: 'E-postanı doğrula',
      sentToA: 'adresine 6 haneli bir kod gönderdik. Kodu aşağıya gir.',
      verify: 'Kodu Doğrula',
      verifying: 'Doğrulanıyor...',
      resentQ: 'Kodu bulamadın mı? Spam klasörünü kontrol et veya',
      resend: 'yeniden gönder',
      resentMsg: 'Yeni kod gönderildi.',
      backToLogin: 'Giriş sayfasına dön →',
    },
  },
}

type Dictionary = typeof tr

const en: Dictionary = {
  nav: {
    features: 'Features',
    pricing: 'Pricing',
    login: 'Sign In',
  },
  hero: {
    badge: 'AI-powered job application management',
    titleA: 'Manage your job applications',
    titleB: 'with',
    subtitle:
      'No more “I applied — now what?”. Wisparkr lets you manage your entire application process from one place.',
  },
  features: {
    heading: 'Everything you need in one place',
    items: [
      {
        title: 'Track with Kanban',
        description:
          'Paste a job posting link, auto-create your application and track it across Pending / Interview / Offer / Rejected columns.',
      },
      {
        title: 'AI CV match score',
        description: 'Upload your CV, let AI calculate how well it matches the job and suggest improvements.',
      },
      {
        title: 'Interview prep assistant',
        description: 'Ask the AI your questions before an interview and get company-specific prep tips.',
      },
    ],
  },
  pricing: {
    heading: 'Choose the plan that fits you',
    subtitle: 'You can change it anytime.',
    popular: 'Most Popular',
    perMonth: '/mo',
    freeCta: 'Start Free',
    paidCta: 'Get This Plan',
    lists: {
      free: ['5 applications', '10 AI questions/mo', 'Basic kanban board'],
      pro: ['Unlimited applications', '200 AI questions/mo', 'CV match score', 'Automatic CV tailoring'],
      career_coach: [
        'Everything in Pro',
        'Unlimited AI questions',
        'Company insights',
        'Salary negotiation coach',
        'Competitor analysis',
      ],
    },
  },
  footer: {
    rights: 'All rights reserved.',
  },
  showcase: {
    subtitle: 'The AI-powered application assistant that accelerates your career',
    chips: [
      'CV match score',
      'Interview assistant',
      'Kanban tracking',
      'AI suggestions',
      'Create PDF CV',
      'Shareable CV',
    ],
    taglines: ['Stand out with CV match score', 'AI interview prep', 'All your applications in one place'],
  },
  login: {
    subtitle: 'Sign in to your account',
    google: 'Continue with Google',
    orEmail: 'or with email',
    email: 'Email address',
    password: 'Password',
    submit: 'Sign In',
    submitting: 'Signing in...',
    error: 'Incorrect email or password.',
    noAccount: "Don't have an account?",
    signupLink: 'Sign up',
  },
  signup: {
    subtitle: 'Create your free account',
    google: 'Continue with Google',
    orEmail: 'or with email',
    fullName: 'Full Name',
    email: 'Email address',
    password: 'Password',
    confirm: 'Confirm password',
    submit: 'Create Account',
    submitting: 'Creating account...',
    pwMismatch: 'Passwords do not match.',
    pwTooShort: 'Password must be at least 8 characters.',
    existingEmail:
      'You already have an account with this email. If you signed up with Google, sign in using "Continue with Google" on the login page.',
    strength: { min8: 'At least 8 characters', upper: 'Uppercase letter', number: 'Number' },
    termsPre: 'By signing up you agree to the',
    terms: 'Terms of Use',
    and: 'and',
    privacy: 'Privacy Policy',
    termsPost: '.',
    haveAccount: 'Already have an account?',
    loginLink: 'Sign in',
    otp: {
      title: 'Verify your email',
      sentToA: 'we sent a 6-digit code. Enter it below.',
      verify: 'Verify Code',
      verifying: 'Verifying...',
      resentQ: "Can't find the code? Check your spam folder or",
      resend: 'resend',
      resentMsg: 'A new code has been sent.',
      backToLogin: 'Back to sign in →',
    },
  },
}

const dictionaries: Record<Locale, Dictionary> = { tr, en }

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}

export type { Dictionary }

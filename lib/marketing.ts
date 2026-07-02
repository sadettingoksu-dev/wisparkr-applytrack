import type { Locale } from '@/lib/i18n'

/**
 * Pazarlama "chrome" metinleri (navbar üst şerit, mega-menü, promo, istatistik,
 * entegrasyon, footer sütunları).
 *
 * Neden ayrı modül? `lib/i18n.ts` sözlüğü `Dictionary = typeof tr` ile tiplenmiş;
 * oraya anahtar eklemek 5 dil bloğunu da (5600+ satır) düzenlemeyi zorunlu kılar.
 * paytr tarzı yeni landing bölümleri yalnızca sunum katmanı olduğundan, çekirdek
 * sözlüğe dokunmadan bu izole modülde tutuyoruz. Hiçbir mevcut akış etkilenmez.
 *
 * Link hedefleri yalnızca var olan public route'lardır (/pricing, /demo, /rehber,
 * /yardim, /privacy, /terms ve landing çapaları) — yeni sayfa uydurulmaz.
 */

export interface MarketingChrome {
  topbar: {
    guides: string
    help: string
    panel: string
    start: string
  }
  menu: {
    product: string
    productDesc: string
    resources: string
    resourcesDesc: string
    /** Mega-menü ürün bağlantıları (var olan çapalara/route'lara gider). */
    productLinks: { label: string; desc: string; href: string }[]
    resourceLinks: { label: string; href: string }[]
  }
  promo: { text: string; cta: string }
  stats: {
    heading: string
    subtitle: string
    items: { value: string; label: string }[]
  }
  integrations: {
    heading: string
    subtitle: string
    items: { title: string; desc: string }[]
  }
  footer: {
    tagline: string
    colProduct: string
    colResources: string
    colLegal: string
    links: {
      product: { label: string; href: string }[]
      resources: { label: string; href: string }[]
      legal: { label: string; href: string }[]
    }
  }
}

const tr: MarketingChrome = {
  topbar: { guides: 'Rehber', help: 'Yardım & Destek', panel: 'Müşteri Paneli', start: 'Ücretsiz Başla' },
  menu: {
    product: 'Ürünler',
    productDesc: 'Başvurudan teklife kadar tüm araçlar',
    resources: 'Kaynaklar',
    resourcesDesc: 'Rehberler, yardım ve demo',
    productLinks: [
      { label: 'Başvuru takibi (Kanban)', desc: 'Tüm başvurularını tek panelde yönet', href: '/#features' },
      { label: 'CV Builder', desc: 'Adım adım profesyonel CV + paylaşım linki', href: '/#features' },
      { label: 'AI CV uyum skoru', desc: 'CV’ni ilana göre puanla ve güçlendir', href: '/#features' },
      { label: 'AI ön yazı', desc: 'İlana özel ikna edici ön yazı', href: '/#features' },
      { label: 'Mülakat simülasyonu', desc: 'Şirkete özel AI mülakat provası', href: '/#features' },
      { label: 'Takvim & hatırlatmalar', desc: 'Hiçbir mülakatı kaçırma', href: '/#features' },
    ],
    resourceLinks: [
      { label: 'Rehber', href: '/rehber' },
      { label: 'Yardım Merkezi', href: '/yardim' },
      { label: 'Canlı Demo', href: '/demo' },
      { label: 'Sıkça Sorulan Sorular', href: '/#faq' },
    ],
  },
  promo: { text: 'Yeni üyelere özel — 3 gün boyunca tüm özellikler ücretsiz. Kart gerekmez.', cta: 'Hemen dene' },
  stats: {
    heading: 'Rakamlarla Wisparkr',
    subtitle: 'İş aramayı tahminden çıkarıp yönetilebilir bir sürece dönüştürüyoruz.',
    items: [
      { value: '10.000+', label: 'Yönetilen başvuru' },
      { value: '5', label: 'Desteklenen dil' },
      { value: '7/24', label: 'AI destek' },
      { value: '%100', label: 'KVKK uyumlu altyapı' },
    ],
  },
  integrations: {
    heading: 'İş akışına sorunsuz bağlanır',
    subtitle: 'Wisparkr, başvuru topladığın her yere entegre olur.',
    items: [
      { title: 'Tarayıcı eklentisi', desc: 'İlan sayfasından tek tıkla başvuru ekle.' },
      { title: 'E-posta yönlendirme', desc: 'Başvuru e-postalarını panele otomatik taşı.' },
      { title: 'Paylaşılabilir CV linki', desc: 'CV’ni tek linkle paylaş, görüntülenmeyi izle.' },
      { title: 'Çok dilli arayüz', desc: '5 dilde tam destekli deneyim.' },
    ],
  },
  footer: {
    tagline: 'AI destekli iş başvurusu yönetimi — başvurudan teklife tek panelden.',
    colProduct: 'Ürün',
    colResources: 'Kaynaklar',
    colLegal: 'Yasal',
    links: {
      product: [
        { label: 'Özellikler', href: '/#features' },
        { label: 'Fiyatlandırma', href: '/pricing' },
        { label: 'Demo', href: '/demo' },
      ],
      resources: [
        { label: 'Rehber', href: '/rehber' },
        { label: 'Yardım', href: '/yardim' },
        { label: 'SSS', href: '/#faq' },
      ],
      legal: [
        { label: 'Gizlilik Politikası', href: '/privacy' },
        { label: 'Kullanım Şartları', href: '/terms' },
      ],
    },
  },
}

const en: MarketingChrome = {
  topbar: { guides: 'Guides', help: 'Help & Support', panel: 'Customer Panel', start: 'Start Free' },
  menu: {
    product: 'Products',
    productDesc: 'Every tool from application to offer',
    resources: 'Resources',
    resourcesDesc: 'Guides, help and demo',
    productLinks: [
      { label: 'Application tracking (Kanban)', desc: 'Manage every application in one board', href: '/#features' },
      { label: 'CV Builder', desc: 'Step-by-step CV + shareable link', href: '/#features' },
      { label: 'AI CV fit score', desc: 'Score and improve your CV against the role', href: '/#features' },
      { label: 'AI cover letter', desc: 'Persuasive cover letter per posting', href: '/#features' },
      { label: 'Interview simulation', desc: 'Company-specific AI mock interview', href: '/#features' },
      { label: 'Calendar & reminders', desc: 'Never miss an interview', href: '/#features' },
    ],
    resourceLinks: [
      { label: 'Guides', href: '/rehber' },
      { label: 'Help Center', href: '/yardim' },
      { label: 'Live Demo', href: '/demo' },
      { label: 'FAQ', href: '/#faq' },
    ],
  },
  promo: { text: 'New members — all features free for 3 days. No card required.', cta: 'Try now' },
  stats: {
    heading: 'Wisparkr in numbers',
    subtitle: 'We turn the job search from guesswork into a manageable process.',
    items: [
      { value: '10,000+', label: 'Applications managed' },
      { value: '5', label: 'Supported languages' },
      { value: '24/7', label: 'AI support' },
      { value: '100%', label: 'Privacy-compliant infra' },
    ],
  },
  integrations: {
    heading: 'Fits right into your workflow',
    subtitle: 'Wisparkr connects wherever you collect applications.',
    items: [
      { title: 'Browser extension', desc: 'Add an application from any posting in one click.' },
      { title: 'Email forwarding', desc: 'Auto-import application emails into your panel.' },
      { title: 'Shareable CV link', desc: 'Share your CV with one link and track views.' },
      { title: 'Multilingual UI', desc: 'Fully supported in 5 languages.' },
    ],
  },
  footer: {
    tagline: 'AI-powered job application management — from application to offer, in one panel.',
    colProduct: 'Product',
    colResources: 'Resources',
    colLegal: 'Legal',
    links: {
      product: [
        { label: 'Features', href: '/#features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Demo', href: '/demo' },
      ],
      resources: [
        { label: 'Guides', href: '/rehber' },
        { label: 'Help', href: '/yardim' },
        { label: 'FAQ', href: '/#faq' },
      ],
      legal: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Use', href: '/terms' },
      ],
    },
  },
}

const de: MarketingChrome = {
  topbar: { guides: 'Ratgeber', help: 'Hilfe & Support', panel: 'Kundenportal', start: 'Kostenlos starten' },
  menu: {
    product: 'Produkte',
    productDesc: 'Alle Tools von der Bewerbung bis zum Angebot',
    resources: 'Ressourcen',
    resourcesDesc: 'Ratgeber, Hilfe und Demo',
    productLinks: [
      { label: 'Bewerbungs-Tracking (Kanban)', desc: 'Alle Bewerbungen in einem Board', href: '/#features' },
      { label: 'Lebenslauf-Builder', desc: 'Schritt-für-Schritt CV + teilbarer Link', href: '/#features' },
      { label: 'KI CV-Matchscore', desc: 'CV passend zur Stelle bewerten', href: '/#features' },
      { label: 'KI-Anschreiben', desc: 'Überzeugendes Anschreiben pro Stelle', href: '/#features' },
      { label: 'Interview-Simulation', desc: 'Firmenspezifisches KI-Mock-Interview', href: '/#features' },
      { label: 'Kalender & Erinnerungen', desc: 'Kein Interview verpassen', href: '/#features' },
    ],
    resourceLinks: [
      { label: 'Ratgeber', href: '/rehber' },
      { label: 'Hilfecenter', href: '/yardim' },
      { label: 'Live-Demo', href: '/demo' },
      { label: 'FAQ', href: '/#faq' },
    ],
  },
  promo: { text: 'Für neue Mitglieder — 3 Tage alle Funktionen kostenlos. Keine Karte nötig.', cta: 'Jetzt testen' },
  stats: {
    heading: 'Wisparkr in Zahlen',
    subtitle: 'Wir machen aus der Jobsuche einen planbaren Prozess statt Rätselraten.',
    items: [
      { value: '10.000+', label: 'Verwaltete Bewerbungen' },
      { value: '5', label: 'Unterstützte Sprachen' },
      { value: '24/7', label: 'KI-Support' },
      { value: '100%', label: 'Datenschutzkonforme Infra' },
    ],
  },
  integrations: {
    heading: 'Passt in deinen Workflow',
    subtitle: 'Wisparkr verbindet sich überall dort, wo du Bewerbungen sammelst.',
    items: [
      { title: 'Browser-Erweiterung', desc: 'Bewerbung von jeder Anzeige per Klick hinzufügen.' },
      { title: 'E-Mail-Weiterleitung', desc: 'Bewerbungs-E-Mails automatisch ins Panel.' },
      { title: 'Teilbarer CV-Link', desc: 'CV mit einem Link teilen und Aufrufe verfolgen.' },
      { title: 'Mehrsprachige UI', desc: 'Voll unterstützt in 5 Sprachen.' },
    ],
  },
  footer: {
    tagline: 'KI-gestützte Bewerbungsverwaltung — von der Bewerbung bis zum Angebot in einem Panel.',
    colProduct: 'Produkt',
    colResources: 'Ressourcen',
    colLegal: 'Rechtliches',
    links: {
      product: [
        { label: 'Funktionen', href: '/#features' },
        { label: 'Preise', href: '/pricing' },
        { label: 'Demo', href: '/demo' },
      ],
      resources: [
        { label: 'Ratgeber', href: '/rehber' },
        { label: 'Hilfe', href: '/yardim' },
        { label: 'FAQ', href: '/#faq' },
      ],
      legal: [
        { label: 'Datenschutz', href: '/privacy' },
        { label: 'Nutzungsbedingungen', href: '/terms' },
      ],
    },
  },
}

const es: MarketingChrome = {
  topbar: { guides: 'Guías', help: 'Ayuda y soporte', panel: 'Panel de cliente', start: 'Empezar gratis' },
  menu: {
    product: 'Productos',
    productDesc: 'Todas las herramientas, de la candidatura a la oferta',
    resources: 'Recursos',
    resourcesDesc: 'Guías, ayuda y demo',
    productLinks: [
      { label: 'Seguimiento (Kanban)', desc: 'Gestiona todas tus candidaturas en un tablero', href: '/#features' },
      { label: 'Creador de CV', desc: 'CV paso a paso + enlace para compartir', href: '/#features' },
      { label: 'Puntuación IA del CV', desc: 'Puntúa y mejora tu CV según la oferta', href: '/#features' },
      { label: 'Carta de presentación IA', desc: 'Carta persuasiva para cada oferta', href: '/#features' },
      { label: 'Simulación de entrevista', desc: 'Entrevista simulada con IA por empresa', href: '/#features' },
      { label: 'Calendario y recordatorios', desc: 'No pierdas ninguna entrevista', href: '/#features' },
    ],
    resourceLinks: [
      { label: 'Guías', href: '/rehber' },
      { label: 'Centro de ayuda', href: '/yardim' },
      { label: 'Demo en vivo', href: '/demo' },
      { label: 'Preguntas frecuentes', href: '/#faq' },
    ],
  },
  promo: { text: 'Para nuevos miembros — todas las funciones gratis 3 días. Sin tarjeta.', cta: 'Probar ahora' },
  stats: {
    heading: 'Wisparkr en cifras',
    subtitle: 'Convertimos la búsqueda de empleo en un proceso manejable, no en conjeturas.',
    items: [
      { value: '10.000+', label: 'Candidaturas gestionadas' },
      { value: '5', label: 'Idiomas soportados' },
      { value: '24/7', label: 'Soporte con IA' },
      { value: '100%', label: 'Infraestructura conforme' },
    ],
  },
  integrations: {
    heading: 'Se integra en tu flujo de trabajo',
    subtitle: 'Wisparkr se conecta allí donde recopilas candidaturas.',
    items: [
      { title: 'Extensión de navegador', desc: 'Añade una candidatura desde cualquier oferta con un clic.' },
      { title: 'Reenvío de correo', desc: 'Importa correos de candidaturas a tu panel.' },
      { title: 'Enlace de CV compartible', desc: 'Comparte tu CV con un enlace y mide las visitas.' },
      { title: 'Interfaz multilingüe', desc: 'Totalmente soportada en 5 idiomas.' },
    ],
  },
  footer: {
    tagline: 'Gestión de candidaturas con IA — de la candidatura a la oferta, en un panel.',
    colProduct: 'Producto',
    colResources: 'Recursos',
    colLegal: 'Legal',
    links: {
      product: [
        { label: 'Funciones', href: '/#features' },
        { label: 'Precios', href: '/pricing' },
        { label: 'Demo', href: '/demo' },
      ],
      resources: [
        { label: 'Guías', href: '/rehber' },
        { label: 'Ayuda', href: '/yardim' },
        { label: 'FAQ', href: '/#faq' },
      ],
      legal: [
        { label: 'Política de privacidad', href: '/privacy' },
        { label: 'Términos de uso', href: '/terms' },
      ],
    },
  },
}

const fr: MarketingChrome = {
  topbar: { guides: 'Guides', help: 'Aide et support', panel: 'Espace client', start: 'Commencer gratuitement' },
  menu: {
    product: 'Produits',
    productDesc: 'Tous les outils, de la candidature à l’offre',
    resources: 'Ressources',
    resourcesDesc: 'Guides, aide et démo',
    productLinks: [
      { label: 'Suivi des candidatures (Kanban)', desc: 'Gérez toutes vos candidatures sur un tableau', href: '/#features' },
      { label: 'Créateur de CV', desc: 'CV pas à pas + lien partageable', href: '/#features' },
      { label: 'Score IA du CV', desc: 'Évaluez et améliorez votre CV selon l’offre', href: '/#features' },
      { label: 'Lettre de motivation IA', desc: 'Lettre convaincante pour chaque offre', href: '/#features' },
      { label: 'Simulation d’entretien', desc: 'Entretien simulé par IA selon l’entreprise', href: '/#features' },
      { label: 'Calendrier et rappels', desc: 'Ne manquez aucun entretien', href: '/#features' },
    ],
    resourceLinks: [
      { label: 'Guides', href: '/rehber' },
      { label: 'Centre d’aide', href: '/yardim' },
      { label: 'Démo en direct', href: '/demo' },
      { label: 'FAQ', href: '/#faq' },
    ],
  },
  promo: { text: 'Nouveaux membres — toutes les fonctions gratuites 3 jours. Sans carte.', cta: 'Essayer' },
  stats: {
    heading: 'Wisparkr en chiffres',
    subtitle: 'Nous transformons la recherche d’emploi en un processus gérable.',
    items: [
      { value: '10 000+', label: 'Candidatures gérées' },
      { value: '5', label: 'Langues prises en charge' },
      { value: '24/7', label: 'Support IA' },
      { value: '100%', label: 'Infra conforme RGPD' },
    ],
  },
  integrations: {
    heading: 'S’intègre à votre flux de travail',
    subtitle: 'Wisparkr se connecte partout où vous collectez des candidatures.',
    items: [
      { title: 'Extension de navigateur', desc: 'Ajoutez une candidature depuis n’importe quelle annonce en un clic.' },
      { title: 'Transfert d’e-mails', desc: 'Importez automatiquement les e-mails de candidature.' },
      { title: 'Lien de CV partageable', desc: 'Partagez votre CV via un lien et suivez les vues.' },
      { title: 'Interface multilingue', desc: 'Entièrement prise en charge en 5 langues.' },
    ],
  },
  footer: {
    tagline: 'Gestion des candidatures par IA — de la candidature à l’offre, dans un seul panneau.',
    colProduct: 'Produit',
    colResources: 'Ressources',
    colLegal: 'Mentions légales',
    links: {
      product: [
        { label: 'Fonctionnalités', href: '/#features' },
        { label: 'Tarifs', href: '/pricing' },
        { label: 'Démo', href: '/demo' },
      ],
      resources: [
        { label: 'Guides', href: '/rehber' },
        { label: 'Aide', href: '/yardim' },
        { label: 'FAQ', href: '/#faq' },
      ],
      legal: [
        { label: 'Confidentialité', href: '/privacy' },
        { label: 'Conditions d’utilisation', href: '/terms' },
      ],
    },
  },
}

const MARKETING: Record<Locale, MarketingChrome> = { tr, en, de, es, fr }

export function getMarketing(locale: Locale): MarketingChrome {
  return MARKETING[locale]
}

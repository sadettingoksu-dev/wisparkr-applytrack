import type { Locale } from './i18n'

export interface GuideSection {
  heading: string
  body: string[]
}
export interface Guide {
  slug: string
  title: string
  excerpt: string
  readTime: string
  sections: GuideSection[]
}

export const GUIDES: Record<Locale, Guide[]> = {
  tr: [
    {
      slug: 'ilk-is-basvurusu-rehberi',
      title: 'İlk iş başvurusu rehberi',
      excerpt: 'Hiç başvuru yapmamış biri için sıfırdan, adım adım bir yol haritası.',
      readTime: '5 dk okuma',
      sections: [
        {
          heading: '1. Hedefini netleştir',
          body: [
            'Hangi pozisyon ve sektörde çalışmak istediğine karar ver. Belirsiz bir “herhangi bir iş” aramasından çok, 1–2 net rol belirlemek başvurularını güçlendirir.',
            'İlgilendiğin 5–10 ilanı incele; tekrar eden becerileri ve anahtar kelimeleri not al. Bunlar CV’nde mutlaka yer almalı.',
          ],
        },
        {
          heading: '2. CV’ni hazırla',
          body: [
            'CV Oluşturucu ile sıfırdan başlayabilir veya mevcut PDF’ini yükleyebilirsin. Tek sayfada, okunabilir ve abartısız tut.',
            'Her deneyim maddesinde somut sonuç ver: “Satışları %20 artırdım”, “Sayfa hızını %40 düşürdüm” gibi. Sayılar dikkat çeker.',
          ],
        },
        {
          heading: '3. İlanı ekle ve uyumu ölç',
          body: [
            'İlan linkini Wisparkr’a yapıştır; şirket, pozisyon ve açıklama otomatik dolsun.',
            'AI uyum skorunu çalıştır. 75’in altındaysa eksik becerileri ve anahtar kelimeleri CV’ne ekleyerek skoru yükselt.',
          ],
        },
        {
          heading: '4. Takip et ve hazırlan',
          body: [
            'Başvurunu Kanban board’da takip et: Beklemede → Mülakat → Teklif.',
            'Mülakat geldiğinde mülakat simülatörüyle pratik yap. Düzenli takip, fırsatların gözden kaçmasını önler.',
          ],
        },
      ],
    },
    {
      slug: 'mulakat-hazirlik-ipuclari',
      title: 'Mülakata hazırlanma ipuçları',
      excerpt: 'Mülakat öncesi yapman gereken hazırlıklar ve sık sorulan sorular.',
      readTime: '4 dk okuma',
      sections: [
        {
          heading: 'Şirketi araştır',
          body: [
            'Şirketin ürününü, misyonunu ve son haberlerini öğren. “Bizi neden seçtin?” sorusuna somut cevap verebilmelisin.',
            'İlandaki sorumlulukları kendi deneyiminle eşleştir; her biri için bir örnek hikâye hazırla.',
          ],
        },
        {
          heading: 'STAR yöntemiyle cevap ver',
          body: [
            'Davranışsal sorularda Durum (Situation), Görev (Task), Eylem (Action), Sonuç (Result) sırasını izle.',
            'Sonucu mümkünse sayıyla destekle. Kısa, net ve örnek odaklı konuş.',
          ],
        },
        {
          heading: 'Pratik yap',
          body: [
            'Wisparkr mülakat simülatörü, pozisyona özel sorular sorar ve cevaplarına AI geri bildirim verir.',
            'Sesli pratik yapmak, gerçek mülakatta akıcılığını artırır. Birkaç tur dene.',
          ],
        },
      ],
    },
    {
      slug: 'iyi-bir-on-yazi-ornegi',
      title: 'İyi bir ön yazı nasıl yazılır? (örnekle)',
      excerpt: 'Ön yazının yapısı ve kopyalayıp uyarlayabileceğin gerçek bir örnek.',
      readTime: '4 dk okuma',
      sections: [
        {
          heading: 'Ön yazı neden önemli?',
          body: [
            'Ön yazı, CV’nin söyleyemediğini anlatır: neden bu şirket, neden bu rol ve değer katacağına dair kısa bir hikâye.',
            'Kısa tut: 3–4 paragraf, en fazla yarım sayfa. Genel geçil ifadelerden kaçın; ilana özel yaz.',
          ],
        },
        {
          heading: 'Yapısı',
          body: [
            'Giriş: kim olduğun ve hangi pozisyona başvurduğun.',
            'Gövde: ilandaki 2–3 gereksinimi kendi deneyiminle, sayısal sonuçlarla eşleştir.',
            'Kapanış: şirkete katacağın değer ve görüşme isteği.',
          ],
        },
        {
          heading: 'Örnek ön yazı',
          body: [
            'Sayın İK Ekibi,',
            'TeknoSoft’ta açtığınız Frontend Developer pozisyonu için başvuruyorum. 3 yıldır React ve TypeScript ile kullanıcı odaklı arayüzler geliştiriyorum.',
            'Son rolümde sayfa yüklenme süresini %40 azaltarak dönüşüm oranını %15 artırdım ve 5 kişilik bir ekibe mentorluk yaptım. İlanınızda öne çıkan tasarım sistemi ve erişilebilirlik konularında doğrudan deneyimim var.',
            'Ürününüzü kullanıcı deneyimini önemseyen bir ekiple büyütmek beni heyecanlandırıyor. Uygun olduğunuzda deneyimimi nasıl katacağımı konuşmaktan memnuniyet duyarım.',
            'Saygılarımla, Ayşe Yılmaz',
          ],
        },
        {
          heading: 'İpucu',
          body: [
            'Wisparkr, başvuru detayında CV’ni ve ilanı dikkate alarak senin için Türkçe bir ön yazı taslağı oluşturabilir. Taslağı kendi sesinle düzenlemeyi unutma.',
          ],
        },
      ],
    },
  ],
  en: [
    {
      slug: 'ilk-is-basvurusu-rehberi',
      title: 'First job application guide',
      excerpt: 'A step-by-step roadmap from scratch for someone who has never applied.',
      readTime: '5 min read',
      sections: [
        {
          heading: '1. Clarify your target',
          body: [
            'Decide which role and industry you want. Picking 1–2 clear roles beats a vague “any job” search.',
            'Review 5–10 postings you like; note the recurring skills and keywords. These must appear in your CV.',
          ],
        },
        {
          heading: '2. Prepare your CV',
          body: [
            'Start from scratch with the CV Builder or upload your existing PDF. Keep it one page, readable and concise.',
            'Give concrete results in each bullet: “increased sales by 20%”, “cut page load time by 40%”. Numbers stand out.',
          ],
        },
        {
          heading: '3. Add the posting and measure fit',
          body: [
            'Paste the posting link into Wisparkr; company, role and description fill in automatically.',
            'Run the AI match score. If it’s below 75, add the missing skills and keywords to raise it.',
          ],
        },
        {
          heading: '4. Track and prepare',
          body: [
            'Track on the Kanban board: Pending → Interview → Offer.',
            'When an interview comes, practice with the interview simulator. Consistent tracking prevents missed opportunities.',
          ],
        },
      ],
    },
    {
      slug: 'mulakat-hazirlik-ipuclari',
      title: 'Interview preparation tips',
      excerpt: 'What to prepare before an interview and common questions.',
      readTime: '4 min read',
      sections: [
        {
          heading: 'Research the company',
          body: [
            'Learn the product, mission and recent news. You should answer “why us?” concretely.',
            'Map the posting’s responsibilities to your experience; prepare an example story for each.',
          ],
        },
        {
          heading: 'Answer with STAR',
          body: [
            'For behavioral questions use Situation, Task, Action, Result.',
            'Back the result with numbers when possible. Be concise and example-driven.',
          ],
        },
        {
          heading: 'Practice',
          body: [
            'The Wisparkr interview simulator asks role-specific questions and gives AI feedback on your answers.',
            'Speaking out loud improves your fluency in the real thing. Run a few rounds.',
          ],
        },
      ],
    },
    {
      slug: 'iyi-bir-on-yazi-ornegi',
      title: 'How to write a good cover letter (with example)',
      excerpt: 'The structure of a cover letter and a real example you can adapt.',
      readTime: '4 min read',
      sections: [
        {
          heading: 'Why it matters',
          body: [
            'A cover letter tells what your CV can’t: why this company, why this role and a short story of the value you add.',
            'Keep it short: 3–4 paragraphs, half a page max. Avoid generic phrases; tailor it to the posting.',
          ],
        },
        {
          heading: 'Structure',
          body: [
            'Intro: who you are and which role you’re applying for.',
            'Body: map 2–3 requirements from the posting to your experience with measurable results.',
            'Closing: the value you bring and a request to talk.',
          ],
        },
        {
          heading: 'Example cover letter',
          body: [
            'Dear Hiring Team,',
            'I’m applying for the Frontend Developer role at TeknoSoft. For 3 years I’ve built user-focused interfaces with React and TypeScript.',
            'In my last role I cut page load time by 40%, lifting conversion by 15%, and mentored a team of five. I have direct experience with the design-system and accessibility topics highlighted in your posting.',
            'I’d be excited to grow your product with a team that cares about user experience. I’d be glad to discuss how I can contribute whenever suits you.',
            'Best regards, Ayşe Yılmaz',
          ],
        },
        {
          heading: 'Tip',
          body: [
            'Wisparkr can draft a cover letter for you based on your CV and the posting. Remember to edit the draft in your own voice.',
          ],
        },
      ],
    },
  ],
}

export function getGuide(locale: Locale, slug: string): Guide | undefined {
  return GUIDES[locale].find((g) => g.slug === slug)
}

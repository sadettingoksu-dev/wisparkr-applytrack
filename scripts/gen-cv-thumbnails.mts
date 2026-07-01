// CV şablon thumbnail'lerini ÜRETİR — public/cv-templates/<id>.png
// Her şablonun GERÇEK PDF'i (lib/cvDocument.tsx) örnek veriyle render edilip
// ilk sayfası PNG'e çevrilir. Böylece thumbnail = kullanıcının indireceği çıktı.
//
// Çalıştırma (pdf-to-img runtime bağımlılığı değildir, sadece bu script için):
//   npm i -D pdf-to-img@4
//   npx tsx scripts/gen-cv-thumbnails.mts
//   npm un pdf-to-img            # (isteğe bağlı) tekrar temizle
//
// Şablon eklendiğinde/renk değiştiğinde tekrar çalıştırıp PNG'leri commit'le.

import zlib from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { pdf } from 'pdf-to-img'
import { renderCvPdf } from '../lib/cvDocument'
import { parseCvData } from '../lib/cv'
import { CV_TEMPLATE_IDS } from '../lib/cvTemplates'

// --- Düz renkli PNG (placeholder fotoğraf; telif-güvenli) ---
function pngChunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(Buffer.concat([typeBuf, data])) >>> 0, 0)
  return Buffer.concat([len, typeBuf, data, crc])
}
function solidPng(w: number, h: number, rgb: [number, number, number]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 2 // 8-bit RGB
  const row = Buffer.alloc(1 + w * 3)
  for (let x = 0; x < w; x++) { row[1 + x * 3] = rgb[0]; row[1 + x * 3 + 1] = rgb[1]; row[1 + x * 3 + 2] = rgb[2] }
  const raw = Buffer.concat(Array.from({ length: h }, () => row))
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', zlib.deflateSync(raw)), pngChunk('IEND', Buffer.alloc(0))])
}
const photo = 'data:image/png;base64,' + solidPng(160, 200, [203, 208, 214]).toString('base64')

const raw = {
  personal: { fullName: 'Elif Yılmaz', headline: 'Kıdemli Uzman', email: 'elif@ornek.com', phone: '0212 123 45 67', location: 'İstanbul', photo, links: [{ label: 'Web', url: 'ornek.com' }] },
  summary: 'Alanında deneyimli, analitik düşünen ve çözüm odaklı bir profesyonelim. Ekip çalışmasına yatkın, sonuç odaklı yaklaşımımla değer katarım.',
  experience: [
    { role: 'Kıdemli Uzman', company: 'Örnek Şirket', location: 'İstanbul', country: '', start: '2021', end: '2025', current: false, bullets: ['Stratejik projeleri baştan sona yönettim', 'Ekip verimliliğini artırdım'] },
    { role: 'Uzman', company: 'Deneyim A.Ş.', location: '', country: '', start: '2018', end: '2021', current: false, bullets: ['Süreç iyileştirmeleri yaptım'] },
  ],
  education: [{ school: 'Deryalar Üniversitesi', degree: 'Lisans', field: 'İşletme', location: '', gpa: '', start: '2014', end: '2018', current: false, note: '' }],
  skills: ['Proje Yönetimi', 'İletişim', 'Analiz', 'Takım Liderliği', 'Raporlama'],
  projects: [],
  languages: [{ name: 'İngilizce', level: 'İleri' }, { name: 'Almanca', level: 'Orta' }],
  certifications: [{ name: 'Proje Yönetimi Sertifikası', issuer: 'PMI', date: '2022' }],
}
const data = parseCvData(raw)
mkdirSync('public/cv-templates', { recursive: true })

for (const tpl of CV_TEMPLATE_IDS) {
  const buf = await renderCvPdf(data, tpl)
  const doc = await pdf(buf, { scale: 2 })
  const first = await doc.getPage(1)
  writeFileSync(`public/cv-templates/${tpl}.png`, first)
  console.log(tpl.padEnd(12), 'PNG', (first.length / 1024).toFixed(0) + ' KB')
}
console.log('done')

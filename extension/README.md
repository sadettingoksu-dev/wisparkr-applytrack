# ApplyTrack Tarayıcı Eklentisi (Faz 3)

LinkedIn ve Indeed ilan sayfalarında "ApplyTrack'e Kaydet" düğmesi gösterir,
tıklandığında ilanı (şirket, pozisyon, açıklama, link) tek tıkla ApplyTrack
hesabına `pending` durumunda ekler.

## Kurulum (geliştirme / kişisel kullanım)

1. Chrome'da `chrome://extensions` adresine git, "Geliştirici modu"nu aç.
2. "Paketlenmemiş öğe yükle" ile bu `extension/` klasörünü seç.
3. Eklenti simgesine tıkla:
   - **Site adresi**: ApplyTrack'in çalıştığı adres (geliştirmede
     `http://localhost:3000`, canlıda kendi domainin).
   - **Kişisel anahtar**: ApplyTrack içinde **Ayarlar > Tarayıcı Eklentisi**
     kartından kopyala.
4. Kaydet'e bas. LinkedIn'de bir ilan sayfasına (`/jobs/view/...`) veya
   Indeed'de bir ilan sayfasına (`viewjob?jk=...`) git, sağ altta çıkan
   düğmeye tıkla.

## Notlar

- Anahtar, `profiles.extension_token` ile eşleşir; sızarsa Ayarlar
  sayfasından yenilenebilir (eski anahtar anında geçersiz olur).
- İlan, kullanıcının planındaki başvuru limiti dolmuşsa eklenemez
  (`LIMIT_REACHED` hatası gösterilir).

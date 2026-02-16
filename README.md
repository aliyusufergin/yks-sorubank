# YKS Sorubank

YKS sınav hazırlığı için dijital soru havuzu ve çalışma kağıdı oluşturma uygulaması.

## Özellikler

- 📷 Soru fotoğraflarını yükle ve organize et
- 🏷️ Ders, konu, kaynak, sayfa ve soru numarası ile etiketle
- 📄 Seçili sorulardan A4 çalışma kağıtları oluştur ve yazdır
- 📦 Öğrenilen soruları arşive taşı
- 🤖 AI destekli çalışma tavsiyeleri, program ve soru çözümü (Gemini)
- 🌙 Açık / Koyu tema
- ⚙️ Ders, konu ve kitap yönetimi

## Hızlı Kurulum

### Docker ile (Önerilen)

```bash
git clone https://github.com/aliyusufergin/yks-sorubank.git
cd yks-sorubank
cp .env.example .env
docker compose up -d
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

### Doğrudan Kurulum

**Gereksinimler:** Node.js 20+

```bash
git clone https://github.com/aliyusufergin/yks-sorubank.git
cd yks-sorubank

# Ortam değişkenlerini ayarla
cp .env.example .env

# Bağımlılıkları kur
npm install

# Veritabanını oluştur
npx prisma db push

# Geliştirme sunucusunu başlat
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## Ortam Değişkenleri

`.env.example` dosyasını `.env` olarak kopyalayın:

```bash
cp .env.example .env
```

| Değişken | Açıklama | Varsayılan |
|----------|----------|------------|
| `DATABASE_URL` | SQLite veritabanı yolu | `file:../data/sorubank.db` |
| `UPLOAD_DIR` | Yüklenen dosyaların dizini | `./data/uploads` |
| `NEXT_PUBLIC_APP_URL` | Uygulama URL'si | `http://localhost:3000` |

## AI Entegrasyonu

AI özelliklerini kullanmak için:

1. [Google AI Studio](https://aistudio.google.com/) üzerinden Gemini API anahtarı alın
2. Uygulamada **Ayarlar** → **AI API Anahtarı** bölümüne yapıştırın
3. API anahtarı yalnızca tarayıcınızda (şifreli olarak) saklanır, sunucuya kaydedilmez

## Tech Stack

- **Next.js 15** (App Router, Turbopack)
- **TypeScript**
- **Tailwind CSS v4**
- **Prisma** + **SQLite**
- **Sharp** (Görüntü işleme)
- **Google Gemini AI**

## Lisans

Bu proje [GNU Affero General Public License v3.0 (AGPLv3)](LICENSE) altında lisanslanmıştır.

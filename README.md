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

### Docker Hub'dan (En Kolay)

**Gereksinimler:** [Docker Engine](https://docs.docker.com/engine/install/) 20+ ve [Docker Compose](https://docs.docker.com/compose/install/) V2

Herhangi bir klasörde `docker-compose.yml` dosyası oluşturun:

```yaml
services:
  sorubank:
    image: aliyusufergin/yks-sorubank:latest
    container_name: yks-sorubank
    ports:
      - "127.0.0.1:3939:3000"
    volumes:
      - sorubank-data:/app/data
    restart: unless-stopped
    environment:
      - DATABASE_URL=file:../data/sorubank.db
      - UPLOAD_DIR=./data/uploads
      - NEXT_PUBLIC_APP_URL=http://localhost:3939

volumes:
  sorubank-data:
```

```bash
docker compose up -d
```

Uygulama `http://localhost:3939` adresinde çalışacaktır.

> **Compose dosyası oluşturmadan tek komutla da çalıştırabilirsiniz:**
>
> ```bash
> docker run -d --name yks-sorubank \
>   -p 127.0.0.1:3939:3000 \
>   -v sorubank-data:/app/data \
>   --restart unless-stopped \
>   aliyusufergin/yks-sorubank:latest
> ```

### Kaynak Koddan Docker Build

```bash
git clone https://github.com/aliyusufergin/yks-sorubank.git
cd yks-sorubank
cp .env.example .env
docker compose up -d --build
```

Uygulama `http://localhost:3939` adresinde çalışacaktır.

> **Not:** Uygulama yalnızca kendi bilgisayarınızdan erişilebilir (`127.0.0.1`). Aynı ağdaki diğer cihazlardan (telefon, tablet vb.) erişmek istiyorsanız `docker-compose.yml` dosyasındaki port satırını şu şekilde değiştirin:
>
> ```yaml
> ports:
>   - "3939:3000"   # tüm ağdan erişime açar
> ```
>
> Ardından `http://<bilgisayarınızın-IP-adresi>:3939` ile erişebilirsiniz. IP adresinizi öğrenmek için terminalde `ip a` (Linux) veya `ipconfig` (Windows) komutunu çalıştırın.

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

## Port Değiştirme

Varsayılan port **3939**'dur. Değiştirmek istersen:

**Docker kullanıyorsan:** `docker-compose.yml` dosyasında `3939` yazan iki yeri değiştir:

```yaml
ports:
  - "127.0.0.1:YENI_PORT:3000"     # ← sadece soldaki portu değiştir
environment:
  - NEXT_PUBLIC_APP_URL=http://localhost:YENI_PORT
```

**Doğrudan kurulum kullanıyorsan:** `.env` dosyasında `NEXT_PUBLIC_APP_URL`'yi güncelle ve sunucuyu yeniden başlat:

```bash
# .env dosyasını düzenle
NEXT_PUBLIC_APP_URL=http://localhost:YENI_PORT

# Sunucuyu istediğin portta başlat
npx next dev --port YENI_PORT
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
| `NEXT_PUBLIC_APP_URL` | Uygulama URL'si | `http://localhost:3939` |

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

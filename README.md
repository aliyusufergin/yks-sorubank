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

---

## Kurulum

### Docker Hub'dan (En Kolay)

**Gereksinimler:** [Docker Engine](https://docs.docker.com/engine/install/) 20+ ve [Docker Compose](https://docs.docker.com/compose/install/) V2

**1.** Bilgisayarınızda istediğiniz bir yerde yeni bir klasör oluşturun (örneğin `yks-sorubank`).

**2.** Bu klasörün içine `docker-compose.yml` adında bir dosya oluşturun ve aşağıdaki içeriği olduğu gibi yapıştırıp kaydedin:

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

**3.** Bu klasörün bulunduğu konumda bir terminal açın ve şu komutu çalıştırın:

```bash
docker compose up -d
```

**4.** Tarayıcınızda `http://localhost:3939` adresine gidin. Uygulama hazır! 🎉

> **Alternatif — Tek komutla** (compose dosyası oluşturmadan):
>
> ```bash
> docker run -d --name yks-sorubank \
>   -p 127.0.0.1:3939:3000 \
>   -v sorubank-data:/app/data \
>   --restart unless-stopped \
>   aliyusufergin/yks-sorubank:latest
> ```

---

### Kaynak Koddan Docker Build

```bash
git clone https://github.com/aliyusufergin/yks-sorubank.git
cd yks-sorubank
cp .env.example .env
docker compose up -d --build
```

---

### Doğrudan Kurulum (Docker'sız)

**Gereksinimler:** Node.js 25+

```bash
git clone https://github.com/aliyusufergin/yks-sorubank.git
cd yks-sorubank
cp .env.example .env
npm install
npx prisma db push
npm run dev
```

Production build için:

```bash
npm run build
npm start
```

---

## Ağ Erişimi ve Port Ayarları

Uygulama varsayılan olarak **3939** portunda ve yalnızca **kendi bilgisayarınızdan** (`127.0.0.1`) erişilebilir şekilde çalışır.

### Aynı ağdaki cihazlardan erişim (telefon, tablet vb.)

`docker-compose.yml` dosyasındaki port satırını şu şekilde değiştirin:

```yaml
ports:
  - "3939:3000"       # tüm ağdan erişime açar
```

Ardından `http://<bilgisayarınızın-IP-adresi>:3939` ile erişebilirsiniz.
IP adresinizi öğrenmek için: `ip a` (Linux) · `ipconfig` (Windows).

### Port değiştirme

**Docker:** `docker-compose.yml` dosyasında iki yeri güncelleyin:

```yaml
ports:
  - "127.0.0.1:YENI_PORT:3000"
environment:
  - NEXT_PUBLIC_APP_URL=http://localhost:YENI_PORT
```

**Doğrudan kurulum:** `.env` dosyasını düzenleyin:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:YENI_PORT
npx next dev --port YENI_PORT
```

---

## Ortam Değişkenleri

| Değişken | Açıklama | Varsayılan |
|----------|----------|------------|
| `DATABASE_URL` | SQLite veritabanı yolu | `file:../data/sorubank.db` |
| `UPLOAD_DIR` | Yüklenen dosyaların dizini | `./data/uploads` |
| `NEXT_PUBLIC_APP_URL` | Uygulama URL'si | `http://localhost:3939` |

---

## AI Entegrasyonu

1. [Google AI Studio](https://aistudio.google.com/) üzerinden Gemini API anahtarı alın
2. Uygulamada **Ayarlar** → **AI API Anahtarı** bölümüne yapıştırın
3. API anahtarı yalnızca tarayıcınızda (AES-256 ile şifreli) saklanır, sunucuya kaydedilmez

---

## Tech Stack

- **Next.js 15** (App Router, Turbopack)
- **TypeScript**
- **Tailwind CSS v4**
- **Prisma** + **SQLite**
- **Sharp** (Görüntü işleme)
- **Google Gemini AI**

## Lisans

Bu proje [GNU Affero General Public License v3.0 (AGPLv3)](LICENSE) altında lisanslanmıştır.

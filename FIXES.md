# BelediyeApp - Düzeltilen Sorunlar

Bu belge, uygulamada bulunan hataların ve eksikliklerin çözümlerini açıklamaktadır.

## 🔧 Yapılan Düzeltmeler

### 1. **API Endpoint Eksiklikleri** ✅
Aşağıdaki eksik API endpoint'leri oluşturdum:

#### `/api/bildirim` 
- **GET**: Kullanıcının bildirimlerini listeler
- **POST**: Yeni bildirim oluşturur
- **PATCH**: Tüm bildirimleri "okundu" olarak işaretler

#### `/api/bildirim/[id]`
- **PATCH**: Spesifik bildirimi "okundu" olarak işaretler

#### `/api/profil`
- **GET**: Kullanıcının profil bilgilerini getirir
- **PATCH**: Profil bilgilerini günceller

#### `/api/upload/foto`
- **POST**: Fotoğraf dosyası yükler ve URL döndürür

#### `/api/talep/[id]`
- **DELETE**: Talep siler (yeni eklenen)

### 2. **Kimlik Doğrulama İyileştirmesi** ✅
- `/api/talep` GET endpoint'inde mock token kontrolü kaldırıldı
- Sadece NextAuth oturumu kontrolü yapılıyor
- E-Devlet entegrasyonu için hazırlandı

### 3. **Tip Tanımlarındaki Düzeltmeler** ✅
- `Bildirim` arayüzüne `email` alanı eklendi
- Tüm API yanıtları için uygun tip tanımlamaları yapıldı

### 4. **Zustand Store İyileştirmesi** ✅
`useTalepStore` yenilendi:
- `setYukleniyor(boolean)` metodu eklendi
- `removeTalep(id)` metodu eklendi (talep silme için)
- Loading state'i düzgün yönetilmesi sağlandı

### 5. **Veri Dosyaları** ✅
Yeni veri dosyaları için destek eklendi:
- `src/data/bildirimler.json` - Bildirimler veritabanı
- `src/data/kullanicilar.json` - Kullanıcı profilleri veritabanı

### 6. **Ortam Değişkenleri Dokümantasyonu** ✅
`.env.example` dosyası oluşturuldu ve tüm gerekli ortam değişkenleri belgelendi

## 📋 Kurulum ve Konfigürasyon

### Adım 1: Ortam Değişkenlerini Ayarla
```bash
cp .env.example .env.local
```

Ardından `.env.local` dosyasını açıp gerekli değerleri doldur:
- Google OAuth Client ID ve Secret
- NextAuth Secret (oluştur: `openssl rand -base64 32`)
- Email konfigürasyonu
- VAPID anahtarları (Push bildirimleri için)

### Adım 2: Veri Dizinini Oluştur
```bash
mkdir -p src/data
mkdir -p public/uploads/fotos
```

### Adım 3: Gerekli Dosyaları Oluştur
Aşağıdaki boş JSON dosyalarını oluştur:

**src/data/talepler.json**
```json
[]
```

**src/data/bildirimler.json**
```json
[]
```

**src/data/kullanicilar.json**
```json
[]
```

## 🚀 Uygulamayı Başlat

```bash
npm install
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## 🔐 Güvenlik Notları

1. **NextAuth Secret**: Production ortamında güçlü bir secret kullan
2. **Ortam Değişkenleri**: Asla `.env.local` dosyasını git'e commit etme
3. **CSRF Koruması**: Tüm POST, PATCH, DELETE istekleri otomatik olarak korunur
4. **Dosya Yükleme**: Sadece resim dosyaları kabul edilir (5MB limit)

## 📱 Fotoğraf Yükleme

- Desteklenen formatlar: JPG, PNG, WebP
- Maksimum dosya boyutu: 5MB
- Maksimum fotoğraf sayısı: 5 adet talep başına
- Tarayıcı tarafında otomatik sıkıştırma

## 📤 Push Bildirimleri

Push bildirimleri için VAPID anahtarları gerekli:

```bash
# VAPID anahtarları oluştur (web-push paketi kullan)
npm install -g web-push
web-push generate-vapid-keys
```

## 🐛 Hata Giderme

### "Oturum açmanız gerekiyor" hatası
- `NEXTAUTH_SECRET` ortam değişkeninin ayarlanmış olduğunu kontrol et
- `NEXTAUTH_URL` doğru şekilde ayarlanmış mı kontrol et

### "Veri okuma hatası"
- `src/data` dizininin var olduğunu kontrol et
- JSON dosyalarının geçerli olduğunu kontrol et

### Google giriş çalışmıyor
- Google Cloud Console'da Client ID ve Secret doğrunu kontrol et
- Redirect URI'nin ayarlanmış olduğunu kontrol et: `http://localhost:3000/api/auth/callback/google`

## 📚 Kullanılan Teknolojiler

- **Next.js 14.2**: React framework
- **NextAuth.js 4.24**: Kimlik doğrulama
- **TypeScript 5.4**: Tip güvenliği
- **Zustand 4.5**: State yönetimi
- **React Hook Form 7.51**: Form yönetimi
- **Tailwind CSS 3.4**: Stil
- **Axios 1.7**: HTTP istekleri

## 📖 Daha Fazla Bilgi

Diğer sayfalar:
- [API Dokümantasyonu](./API.md) - API endpoint'leri
- [Mimari](./ARCHITECTURE.md) - Uygulama mimarisi
- [Katkıda Bulunma](./CONTRIBUTING.md) - Geliştirmeye katılın

# BelediyeApp API Dokümantasyonu

## Temel Bilgiler

- **Base URL**: `/api`
- **Kimlik Doğrulama**: NextAuth + Bearer token
- **Content-Type**: `application/json`
- **Dil**: Türkçe hata mesajları

## Endpoint'ler

### 📋 Talepler (Requests)

#### `GET /api/talep`
Kullanıcının tüm taleplerini listeler.

**Parametreler:**
- `durum` (optional): Duruma göre filtre (bekliyor, isleniyor, tamamlandi, reddedildi)
- `sayfa` (optional): Sayfa numarası

**Yanıt:**
```json
{
  "items": [
    {
      "id": "bld-1234567890",
      "referansNo": "BLD-ABC123",
      "tip": "sikayet",
      "durum": "isleniyor",
      "baslik": "Yolun delinmiş olması",
      "detay": "...",
      "fotograflar": [],
      "yerBilgisi": {...},
      "belediye": {...},
      "kullanici": {...},
      "olusturmaTarihi": "2024-06-18T10:30:00Z",
      "guncellemeTarihi": "2024-06-18T10:30:00Z"
    }
  ],
  "total": 1
}
```

#### `GET /api/talep?tip=sikayet&genel=true`
**Genel şikayetleri** (tüm kullanıcılardan) listeler.

#### `GET /api/talep/[id]`
Spesifik talep detaylarını getirir.

**Yanıt:**
```json
{
  "id": "bld-1234567890",
  "referansNo": "BLD-ABC123",
  ...
}
```

#### `POST /api/talep`
Yeni talep oluşturur.

**Body:**
```json
{
  "id": "bld-1234567890",
  "referansNo": "BLD-ABC123",
  "tip": "sikayet",
  "durum": "bekliyor",
  "baslik": "Yolun delinmiş olması",
  "detay": "Yolda 2 metre çapında bir delik var...",
  "fotograflar": [],
  "yerBilgisi": {
    "il": "Manisa",
    "ilce": "Salihli",
    "mahalle": "Merkez",
    "caddeSokak": "Atatürk Cad.",
    "disKapiNo": "123",
    "icKapiNo": ""
  },
  "belediye": {...},
  "kullanici": {...},
  "olusturmaTarihi": "2024-06-18T10:30:00Z",
  "guncellemeTarihi": "2024-06-18T10:30:00Z"
}
```

#### `PATCH /api/talep/[id]`
Talep durumu veya yanıt günceller.

**Body:**
```json
{
  "durum": "tamamlandi",
  "yanit": "Sorun çözüldü, yol onarıldı"
}
```

#### `DELETE /api/talep/[id]`
Talep siler.

**Yanıt:**
```json
{
  "success": true,
  "message": "Talep silindi"
}
```

---

### 🔔 Bildirimler (Notifications)

#### `GET /api/bildirim`
Kullanıcının bildirimlerini listeler.

**Yanıt:**
```json
[
  {
    "id": "bld-1234567890",
    "tip": "talep-guncelleme",
    "baslik": "Talebinize yanıt verildi",
    "mesaj": "...",
    "okundu": false,
    "talepId": "bld-xxx",
    "talepReferansNo": "BLD-ABC123",
    "tarih": "2024-06-18T10:30:00Z",
    "email": "user@example.com"
  }
]
```

#### `POST /api/bildirim`
Yeni bildirim oluşturur.

**Body:**
```json
{
  "tip": "talep-guncelleme",
  "baslik": "Bildirim Başlığı",
  "mesaj": "Bildirim mesajı",
  "talepId": "bld-xxx",
  "talepReferansNo": "BLD-ABC123"
}
```

#### `PATCH /api/bildirim`
Tüm bildirimleri "okundu" olarak işaretler.

**Body:**
```json
{
  "action": "hepsini-okundu"
}
```

#### `PATCH /api/bildirim/[id]`
Spesifik bildirimi "okundu" olarak işaretler.

**Yanıt:**
```json
{
  "id": "bld-1234567890",
  "okundu": true,
  ...
}
```

---

### 👤 Profil (Profile)

#### `GET /api/profil`
Kullanıcının profil bilgilerini getirir.

**Yanıt:**
```json
{
  "id": "user-123",
  "adSoyad": "Ahmet Yılmaz",
  "tcKimlikNo": "12345678901",
  "telefon": "05XX-XXXXXXX",
  "email": "ahmet@example.com",
  "authProvider": "manual",
  "edevletDogrulandi": false,
  "adres": {
    "il": "Manisa",
    "ilce": "Salihli",
    "mahalle": "Merkez",
    "caddeSokak": "Atatürk Cad.",
    "disKapiNo": "123",
    "icKapiNo": ""
  },
  "belediye": {
    "id": "salihli",
    "ad": "Salihli Belediyesi",
    "il": "Manisa",
    "ilce": "Salihli"
  },
  "createdAt": "2024-06-01T10:30:00Z",
  "updatedAt": "2024-06-18T10:30:00Z"
}
```

#### `PATCH /api/profil`
Profil bilgilerini günceller.

**Body:**
```json
{
  "adSoyad": "Ahmet Yılmaz",
  "telefon": "05XX-XXXXXXX",
  "adres": {
    "il": "Manisa",
    "ilce": "Salihli",
    "mahalle": "Merkez",
    "caddeSokak": "Atatürk Cad.",
    "disKapiNo": "123",
    "icKapiNo": ""
  },
  "belediye": {
    "id": "salihli",
    "ad": "Salihli Belediyesi",
    "il": "Manisa",
    "ilce": "Salihli"
  }
}
```

---

### 📤 Dosya Yükleme (Upload)

#### `POST /api/upload/foto`
Fotoğraf dosyası yükler.

**Multipart Form Data:**
- `foto`: Fotoğraf dosyası (max 5MB)

**Yanıt:**
```json
{
  "id": "foto-1718710200000",
  "url": "/uploads/fotos/1718710200000-abc123.jpg",
  "thumbnail": "/uploads/fotos/1718710200000-abc123.jpg?thumb=true"
}
```

---

### ✉️ E-Posta (Email)

#### `POST /api/email`
Talep e-postasını gönderir.

**Body:**
```json
{
  "tip": "sikayet",
  "belediyeId": "salihli",
  "baslik": "Yolun delinmiş olması",
  "detay": "Yolda 2 metre çapında bir delik var...",
  "fotografIds": [],
  "yerBilgisi": {
    "il": "Manisa",
    "ilce": "Salihli",
    "mahalle": "Merkez",
    "caddeSokak": "Atatürk Cad.",
    "disKapiNo": "123",
    "icKapiNo": ""
  },
  "kullaniciBilgileri": {
    "adSoyad": "Ahmet Yılmaz",
    "telefon": "05XX-XXXXXXX",
    "email": "ahmet@example.com"
  }
}
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "referansNo": "BLD-ABC123",
    "message": "Talebiniz başarıyla e-posta olarak iletildi"
  }
}
```

---

## Hata Yanıtları

Tüm endpoint'ler hata durumunda aşağıdaki formatı kullanır:

```json
{
  "error": "Hata mesajı",
  "status": 400
}
```

**Yaygın HTTP Status Kodları:**
- `200`: OK
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Kimlik Doğrulama

Tüm endpoint'ler NextAuth oturumu gerektirir. İstek yapılırken:

1. NextAuth cookie'si otomatik olarak gönderilir
2. Veya Bearer token kullanılabilir:
   ```
   Authorization: Bearer <token>
   ```

---

## Rate Limiting

Mevcut sürümde rate limiting yoktur. Production ortamında eklenmesi önerilir.

---

## CORS

Şu anda CORS ayarları `localhost` ve `localhost:3000` için izin vermiştir.
Production ortamında güncellenmelidir.

---

## Tarap Tipleri (Request Types)

- `bilgi-edinme`: Bilgi Edinme
- `istek`: İstek
- `sikayet`: Şikayet
- `ihbar`: İhbar
- `oneri`: Öneri
- `tesekkur`: Teşekkür

## Talep Durumları (Request States)

- `bekliyor`: Bekliyor
- `isleniyor`: İşleniyor
- `bekleyen-bilgi`: Bilgi Bekleniyor
- `tamamlandi`: Tamamlandı
- `reddedildi`: Reddedildi

---

## Bildirim Tipleri (Notification Types)

- `talep-guncelleme`: Talep Güncellemesi
- `talep-tamamlandi`: Talep Tamamlandı
- `talep-reddedildi`: Talep Reddedildi
- `sistem`: Sistem Bildirimi

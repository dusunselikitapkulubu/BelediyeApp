// ─── Kullanıcı & Profil ────────────────────────────────────────────────────

export type AuthProvider = 'edevlet' | 'manual';

export interface Kullanici {
    id: string;
    adSoyad: string;
    tcKimlikNo: string;
    telefon: string;
    email: string;
    authProvider: AuthProvider;
    edevletDogrulandi: boolean;
    adres: Adres;
    belediye: Belediye;
    pushSubscription?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Adres {
    il: string;
    ilce: string;
    mahalle: string;
    caddeSokak: string;
    disKapiNo: string;
    icKapiNo: string;
}

export interface Belediye {
    id: string;
    ad: string;
    il: string;
    ilce: string;
    logo?: string;
    iletisim?: {
        telefon: string;
        email: string;
        website: string;
    };
}

// ─── Talep ────────────────────────────────────────────────────────────────

export type TalepTipi =
    | 'bilgi-edinme'
    | 'istek'
    | 'sikayet'
    | 'ihbar'
    | 'oneri'
    | 'tesekkur';

export type TalepDurumu =
    | 'bekliyor'
    | 'isleniyor'
    | 'bekleyen-bilgi'
    | 'tamamlandi'
    | 'reddedildi';

export interface TalepFoto {
    id: string;
    url: string;
    thumbnail: string;
    dosyaAdi: string;
    boyut: number;
    tip: string;
}

export interface TalepYerBilgisi {
    il: string;
    ilce: string;
    mahalle: string;
    caddeSokak: string;
    disKapiNo: string;
    icKapiNo: string;
    koordinat?: { lat: number; lng: number };
}

export interface Talep {
    id: string;
    referansNo: string;
    tip: TalepTipi;
    durum: TalepDurumu;
    baslik: string;
    detay: string;
    fotograflar: TalepFoto[];
    yerBilgisi: TalepYerBilgisi;
    belediye: Belediye;
    kullanici: {
        adSoyad: string;
        tcKimlikNo: string;
        telefon: string;
        email: string;
    };
    yanit?: string;
    olusturmaTarihi: string;
    guncellemeTarihi: string;
    tamamlanmaTarihi?: string;
}

export interface TalepOlusturDTO {
    tip: TalepTipi;
    baslik: string;
    detay: string;
    fotografIds: string[];
    yerBilgisi: TalepYerBilgisi;
}

// ─── Bildirim ─────────────────────────────────────────────────────────────

export type BildirimTipi =
    | 'talep-guncelleme'
    | 'talep-tamamlandi'
    | 'talep-reddedildi'
    | 'sistem';

export interface Bildirim {
    id: string;
    tip: BildirimTipi;
    baslik: string;
    mesaj: string;
    okundu: boolean;
    talepId?: string;
    talepReferansNo?: string;
    tarih: string;
}

// ─── e-Devlet ─────────────────────────────────────────────────────────────

export interface EDevletKullaniciBilgisi {
    tcKimlikNo: string;
    ad: string;
    soyad: string;
    dogumTarihi: string;
    il?: string;
    ilce?: string;
    adres?: string;
}

export interface EDevletCallbackParams {
    code: string;
    state: string;
}

// ─── API Response ─────────────────────────────────────────────────────────

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// ─── Form Types ───────────────────────────────────────────────────────────

export interface TalepFormValues {
    tip: TalepTipi;
    baslik: string;
    detay: string;
    caddeSokak: string;
    disKapiNo: string;
    icKapiNo: string;
}

export interface ProfilFormValues {
    adSoyad: string;
    telefon: string;
    email: string;
    mahalle: string;
    caddeSokak: string;
    disKapiNo: string;
    icKapiNo: string;
}

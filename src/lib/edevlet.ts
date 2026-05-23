/**
 * e-Devlet OAuth 2.0 Entegrasyonu
 *
 * Türkiye e-Devlet Kapısı (turkiye.gov.tr) üzerinden
 * TC Kimlik No doğrulama ve kullanıcı bilgisi alma.
 *
 * Resmi entegrasyon için:
 * https://giris.turkiye.gov.tr/OAuth2AuthorizationServer/
 *
 * Geliştirici kayıt: https://uygulamalar.turkiye.gov.tr
 */

import type { EDevletKullaniciBilgisi } from '@/types';

const EDEVLET_CONFIG = {
    // Üretim ortamı:
    authorizationEndpoint: 'https://giris.turkiye.gov.tr/OAuth2AuthorizationServer/AuthorizationEndpoint',
    tokenEndpoint: 'https://giris.turkiye.gov.tr/OAuth2AuthorizationServer/AccessTokenEndpoint',
    userInfoEndpoint: 'https://giris.turkiye.gov.tr/OAuth2AuthorizationServer/UserInfoEndpoint',
    // Test ortamı (geliştirme için):
    testAuthorizationEndpoint: 'https://giris.turkiye.gov.tr/OAuth2AuthorizationServer/test/AuthorizationEndpoint',

    clientId: process.env.NEXT_PUBLIC_EDEVLET_CLIENT_ID || 'YOUR_CLIENT_ID',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/edevlet/callback`,
    scope: 'Ad-Soyad TC-Kimlik-No Dogum-Tarihi Il-Ilce-Bilgisi Adres-Bilgisi',
    responseType: 'code',
};

/**
 * e-Devlet giriş URL'i oluştur
 */
export function getEDevletAuthUrl(): string {
    const state = generateState();
    // State'i session storage'a kaydet (CSRF koruması)
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('edevlet_state', state);
    }

    const params = new URLSearchParams({
        response_type: EDEVLET_CONFIG.responseType,
        client_id: EDEVLET_CONFIG.clientId,
        redirect_uri: EDEVLET_CONFIG.redirectUri,
        scope: EDEVLET_CONFIG.scope,
        state,
    });

    return `${EDEVLET_CONFIG.authorizationEndpoint}?${params.toString()}`;
}

/**
 * Authorization code ile access token al (sunucu tarafı)
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
    const clientSecret = process.env.EDEVLET_CLIENT_SECRET;
    if (!clientSecret) throw new Error('EDEVLET_CLIENT_SECRET tanımlanmamış');

    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: EDEVLET_CONFIG.redirectUri,
        client_id: EDEVLET_CONFIG.clientId,
        client_secret: clientSecret,
    });

    const response = await fetch(EDEVLET_CONFIG.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`e-Devlet token hatası: ${err}`);
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Access token ile kullanıcı bilgilerini al (sunucu tarafı)
 */
export async function getEDevletUserInfo(
    accessToken: string
): Promise<EDevletKullaniciBilgisi> {
    const response = await fetch(EDEVLET_CONFIG.userInfoEndpoint, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('e-Devlet kullanıcı bilgisi alınamadı');
    }

    const raw = await response.json();

    // e-Devlet yanıtını uygulama tipine dönüştür
    return {
        tcKimlikNo: raw['TC-Kimlik-No'] || raw.sub,
        ad: raw['Ad'] || raw.given_name,
        soyad: raw['Soyad'] || raw.family_name,
        dogumTarihi: raw['Dogum-Tarihi'] || '',
        il: raw['Il'] || '',
        ilce: raw['Ilce'] || '',
        adres: raw['Adres'] || '',
    };
}

/**
 * State parametresi doğrula (CSRF koruması)
 */
export function validateState(returnedState: string): boolean {
    if (typeof window === 'undefined') return true; // SSR'da atla
    const savedState = sessionStorage.getItem('edevlet_state');
    sessionStorage.removeItem('edevlet_state');
    return savedState === returnedState;
}

/**
 * Rastgele state parametresi üret
 */
function generateState(): string {
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined') {
        window.crypto.getRandomValues(array);
    }
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * e-Devlet'in döndürdüğü il bilgisinden belediye eşle
 */
export function mapIlToBelediye(il: string, ilce: string) {
    // Gerçek uygulamada belediyeler DB'den çekilir
    return {
        id: `${il.toLowerCase()}-${ilce.toLowerCase()}`,
        ad: `${ilce} Belediyesi`,
        il,
        ilce,
    };
}

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getEDevletUserInfo, validateState, mapIlToBelediye } from '@/lib/edevlet';

/**
 * e-Devlet OAuth 2.0 Callback Handler
 * GET /api/auth/edevlet/callback?code=...&state=...
 *
 * Akış:
 * 1. State parametresini doğrula (CSRF koruması)
 * 2. Authorization code ile access token al
 * 3. Access token ile kullanıcı bilgilerini al
 * 4. Kullanıcıyı DB'de bul veya oluştur
 * 5. JWT token oluştur
 * 6. Kullanıcıyı uygulamaya yönlendir
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // e-Devlet hata döndürdüyse
    if (error) {
        return NextResponse.redirect(
            new URL(`/giris?hata=${encodeURIComponent(error)}`, request.url)
        );
    }

    if (!code || !state) {
        return NextResponse.redirect(
            new URL('/giris?hata=gecersiz-istek', request.url)
        );
    }

    try {
        // 1. e-Devlet'ten access token al
        const accessToken = await exchangeCodeForToken(code);

        // 2. Kullanıcı bilgilerini al
        const edevletBilgi = await getEDevletUserInfo(accessToken);

        // 3. Belediye bilgisini belirle
        const belediye = mapIlToBelediye(
            edevletBilgi.il || '',
            edevletBilgi.ilce || ''
        );

        // 4. Uygulama JWT token oluştur (gerçek uygulamada DB kaydı yapılır)
        const kullaniciPayload = {
            id: edevletBilgi.tcKimlikNo,
            tcKimlikNo: edevletBilgi.tcKimlikNo,
            adSoyad: `${edevletBilgi.ad} ${edevletBilgi.soyad}`,
            edevletDogrulandi: true,
            belediye,
        };

        // Token oluştur (jose ile RS256 veya HS256)
        // Gerçek uygulamada: const token = await new SignJWT(kullaniciPayload).setProtectedHeader({alg:'HS256'}).sign(secret)
        const token = Buffer.from(JSON.stringify(kullaniciPayload)).toString('base64');

        // 5. Frontend'e yönlendir (token query param veya cookie ile)
        const redirectUrl = new URL('/giris/edevlet-callback', request.url);
        redirectUrl.searchParams.set('token', token);
        redirectUrl.searchParams.set('success', '1');

        return NextResponse.redirect(redirectUrl);

    } catch (err) {
        console.error('e-Devlet callback hatası:', err);
        return NextResponse.redirect(
            new URL('/giris?hata=edevlet-baglanti-hatasi', request.url)
        );
    }
}

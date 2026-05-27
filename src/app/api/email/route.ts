import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import nodemailer from 'nodemailer';
import { authOptions } from '@/lib/auth';
import { BELEDIYELER } from '@/lib/belediyeler';

// Talep tiplerinin Türkçe karşılıkları
const TIP_LABEL: Record<string, string> = {
    'bilgi-edinme': 'Bilgi Edinme',
    'istek': 'İstek',
    'sikayet': 'Şikayet',
    'ihbar': 'İhbar',
    'oneri': 'Öneri',
    'tesekkur': 'Teşekkür',
};

export async function POST(req: NextRequest) {
    try {
        // Oturum kontrolü
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: 'Oturum açmanız gerekiyor' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { tip, belediyeId, baslik, detay, yerBilgisi, kullaniciBilgileri } = body;

        // Seçilen belediyeyi bul ve e-posta/başlık bilgisini ayarla
        let hedefAdres = process.env.EMAIL_TO || 'belediye@example.com';
        let belediyeAd = 'Belediye Belirlenmedi';
        if (belediyeId) {
            const belediyeMatch = BELEDIYELER.find((b) => b.id === belediyeId);
            if (belediyeMatch) {
                hedefAdres = belediyeMatch.email;
                belediyeAd = belediyeMatch.ad;
            }
        }

        // Validasyon
        if (!tip || !baslik || !detay) {
            return NextResponse.json(
                { success: false, error: 'Eksik bilgi: tip, başlık ve detay zorunludur' },
                { status: 400 }
            );
        }



        const tipLabel = TIP_LABEL[tip] || tip;
        const tarih = new Date().toLocaleString('tr-TR', {
            dateStyle: 'long',
            timeStyle: 'short',
        });

        // E-posta HTML içeriği
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1a4f8a, #123968); padding: 32px 24px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 22px; letter-spacing: 0.5px; }
        .header .subtitle { color: rgba(255,255,255,0.7); font-size: 13px; margin-top: 6px; }
        .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-top: 12px; }
        .badge-bilgi-edinme { background: #dbeafe; color: #1d4ed8; }
        .badge-istek { background: #dcfce7; color: #16a34a; }
        .badge-sikayet { background: #fee2e2; color: #dc2626; }
        .badge-ihbar { background: #fce7f3; color: #db2777; }
        .badge-oneri { background: #fef3c7; color: #d97706; }
        .badge-tesekkur { background: #ccfbf1; color: #0d9488; }
        .content { padding: 24px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; margin-bottom: 8px; }
        .section-body { background: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; }
        .field { margin-bottom: 10px; }
        .field:last-child { margin-bottom: 0; }
        .field-label { font-size: 12px; color: #64748b; margin-bottom: 2px; }
        .field-value { font-size: 14px; color: #1e293b; font-weight: 500; }
        .detay-text { font-size: 14px; color: #334155; line-height: 1.7; white-space: pre-wrap; }
        .footer { background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { margin: 0; font-size: 11px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏛️ BelediyeApp - Yeni Talep</h1>
            <div style="color: rgba(255,255,255,0.9); font-size: 15px; font-weight: 500; margin-top: 4px;">${belediyeAd}</div>
            <div class="subtitle">${tarih}</div>
            <div class="badge badge-${tip}">${tipLabel}</div>
        </div>
        <div class="content">
            <div class="section">
                <div class="section-title">📌 Talep Başlığı</div>
                <div class="section-body">
                    <div class="field-value" style="font-size: 16px;">${baslik}</div>
                </div>
            </div>
            <div class="section">
                <div class="section-title">📝 Talep Detayı</div>
                <div class="section-body">
                    <div class="detay-text">${detay}</div>
                </div>
            </div>
            <div class="section">
                <div class="section-title">👤 Başvuru Sahibi</div>
                <div class="section-body">
                    <div class="field">
                        <div class="field-label">Ad Soyad</div>
                        <div class="field-value">${kullaniciBilgileri?.adSoyad || session.user.name || '—'}</div>
                    </div>
                    <div class="field">
                        <div class="field-label">E-posta</div>
                        <div class="field-value">${session.user.email}</div>
                    </div>
                    <div class="field">
                        <div class="field-label">Telefon</div>
                        <div class="field-value">${kullaniciBilgileri?.telefon || '—'}</div>
                    </div>
                </div>
            </div>
            ${yerBilgisi ? `
            <div class="section">
                <div class="section-title">📍 Yer Bilgisi</div>
                <div class="section-body">
                    <div class="field">
                        <div class="field-label">İl / İlçe</div>
                        <div class="field-value">${yerBilgisi.il || '—'} / ${yerBilgisi.ilce || '—'}</div>
                    </div>
                    <div class="field">
                        <div class="field-label">Mahalle</div>
                        <div class="field-value">${yerBilgisi.mahalle || '—'}</div>
                    </div>
                    <div class="field">
                        <div class="field-label">Cadde / Sokak</div>
                        <div class="field-value">${yerBilgisi.caddeSokak || '—'}</div>
                    </div>
                    <div class="field">
                        <div class="field-label">Kapı No</div>
                        <div class="field-value">Dış: ${yerBilgisi.disKapiNo || '—'} / İç: ${yerBilgisi.icKapiNo || '—'}</div>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
        <div class="footer">
            <p>Bu e-posta BelediyeApp üzerinden otomatik olarak gönderilmiştir.</p>
        </div>
    </div>
</body>
</html>`;

        const isGoogleUser = !!(session as any).accessToken;

        if (isGoogleUser) {
            const accessToken = (session as any).accessToken;
            
            // Gmail API için MIME mesajı
            const mimeMessage = [
                `From: "${session.user.name}" <${session.user.email}>`,
                `To: ${hedefAdres}`,
                `Subject: =?utf-8?B?${Buffer.from(`[BelediyeApp] ${belediyeAd} - ${tipLabel}: ${baslik}`).toString('base64')}?=`,
                'MIME-Version: 1.0',
                'Content-Type: text/html; charset=utf-8',
                'Content-Transfer-Encoding: base64',
                '',
                Buffer.from(htmlContent).toString('base64')
            ].join('\r\n');

            const raw = Buffer.from(mimeMessage)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ raw }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Gmail API Gönderim Hatası: ${response.status} - ${errorData}`);
            }
        } else {
            // SMTP ile gönder (Fallback)
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            await transporter.sendMail({
                from: `"BelediyeApp" <${process.env.SMTP_USER}>`,
                to: hedefAdres,
                subject: `[BelediyeApp] ${belediyeAd} - ${tipLabel}: ${baslik}`,
                html: htmlContent,
                replyTo: session.user.email,
            });
        }

        // Benzersiz referans numarası oluştur
        const referansNo = `BLD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        return NextResponse.json({
            success: true,
            data: {
                referansNo,
                message: 'Talebiniz başarıyla e-posta olarak iletildi',
            },
        });
    } catch (error) {
        console.error('E-posta gönderim hatası:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin.',
            },
            { status: 500 }
        );
    }
}

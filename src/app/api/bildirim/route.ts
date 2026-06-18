import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import type { Bildirim } from '@/types';

const BILDIRIM_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'bildirimler.json');

// Yardımcı fonksiyon: Bildirimleri oku
function readBildirimler(): Bildirim[] {
    try {
        if (!fs.existsSync(BILDIRIM_FILE_PATH)) {
            return [];
        }
        const fileContent = fs.readFileSync(BILDIRIM_FILE_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Bildirim okuma hatası:', error);
        return [];
    }
}

// Yardımcı fonksiyon: Bildirimleri yaz
function writeBildirimler(bildirimler: Bildirim[]) {
    try {
        const dirPath = path.dirname(BILDIRIM_FILE_PATH);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        fs.writeFileSync(BILDIRIM_FILE_PATH, JSON.stringify(bildirimler, null, 2), 'utf-8');
    } catch (error) {
        console.error('Bildirim yazma hatası:', error);
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Oturum açmanız gerekiyor' },
                { status: 401 }
            );
        }

        const tumBildirimler = readBildirimler();

        // Kullanıcıya ait bildirimleri filtrele
        const kullaniciBindirimler = tumBildirimler.filter(
            // FIX: session.user?.email (optional chaining)
            (b) => !b.email || b.email === session.user?.email
        );

        return NextResponse.json(kullaniciBindirimler);
    } catch (error) {
        console.error('GET bildirim hatası:', error);
        return NextResponse.json({ error: 'Bildirimler yüklenemedi' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Oturum açmanız gerekiyor' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { tip, baslik, mesaj, talepId, talepReferansNo } = body;

        if (!tip || !baslik || !mesaj) {
            return NextResponse.json(
                { error: 'Eksik bilgiler' },
                { status: 400 }
            );
        }

        const yeniBildirim: Bildirim = {
            id: `bld-${Date.now()}`,
            tip,
            baslik,
            mesaj,
            okundu: false,
            talepId: talepId || undefined,
            talepReferansNo: talepReferansNo || undefined,
            tarih: new Date().toISOString(),
            // FIX: session.user.email garantili (üstte kontrol edildi), non-null assertion ekle
            email: session.user.email!,
        };

        const tumBildirimler = readBildirimler();
        tumBildirimler.push(yeniBildirim);
        writeBildirimler(tumBildirimler);

        return NextResponse.json(yeniBildirim, { status: 201 });
    } catch (error) {
        console.error('POST bildirim hatası:', error);
        return NextResponse.json({ error: 'Bildirim oluşturulamadı' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Oturum açmanız gerekiyor' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { action } = body;

        const tumBildirimler = readBildirimler();

        if (action === 'hepsini-okundu') {
            // Tüm bildirimleri okundu olarak işaretle
            const guncellenmis = tumBildirimler.map((b) =>
                // FIX: session.user?.email (optional chaining)
                !b.email || b.email === session.user?.email
                    ? { ...b, okundu: true }
                    : b
            );
            writeBildirimler(guncellenmis);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
    } catch (error) {
        console.error('PATCH bildirim hatası:', error);
        return NextResponse.json({ error: 'Güncelleme başarısız' }, { status: 500 });
    }
}

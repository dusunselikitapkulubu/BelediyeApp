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

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Oturum açmanız gerekiyor' },
                { status: 401 }
            );
        }

        const tumBildirimler = readBildirimler();
        const bildirimIdx = tumBildirimler.findIndex((b) => b.id === params.id);

        if (bildirimIdx === -1) {
            return NextResponse.json({ error: 'Bildirim bulunamadı' }, { status: 404 });
        }

        const bildirim = tumBildirimler[bildirimIdx];

        // Kullanıcı sadece kendi bildirimlerini işaretleyebilir
        // FIX: session.user?.email (optional chaining)
        if (bildirim.email && bildirim.email !== session.user?.email) {
            return NextResponse.json(
                { error: 'Bu işlemi yapamazsınız' },
                { status: 403 }
            );
        }

        const guncellenmis: Bildirim = {
            ...bildirim,
            okundu: true,
        };

        tumBildirimler[bildirimIdx] = guncellenmis;
        writeBildirimler(tumBildirimler);

        return NextResponse.json(guncellenmis);
    } catch (error) {
        console.error('PATCH bildirim hatası:', error);
        return NextResponse.json({ error: 'Güncelleme başarısız' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import type { Talep } from '@/types';

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'talepler.json');

// Yardımcı fonksiyon: Veriyi oku
function readTalepler(): Talep[] {
    try {
        if (!fs.existsSync(DATA_FILE_PATH)) {
            return [];
        }
        const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Veri okuma hatası:', error);
        return [];
    }
}

// Yardımcı fonksiyon: Veriyi yaz
function writeTalepler(talepler: Talep[]) {
    try {
        const dirPath = path.dirname(DATA_FILE_PATH);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(talepler, null, 2), 'utf-8');
    } catch (error) {
        console.error('Veri yazma hatası:', error);
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const tipFilter = searchParams.get('tip');
        const genelFilter = searchParams.get('genel');

        const tumTalepler = readTalepler();

        // 1. Genel şikayetler listesi (Şikayetler sayfası için)
        if (tipFilter === 'sikayet' || genelFilter === 'true') {
            const sikayetler = tumTalepler.filter(t => t.tip === 'sikayet');
            // Tarihe göre yeniden eskiye sıralayalım
            sikayetler.sort((a, b) => new Date(b.olusturmaTarihi).getTime() - new Date(a.olusturmaTarihi).getTime());
            return NextResponse.json({
                items: sikayetler,
                total: sikayetler.length
            });
        }

        // 2. Kullanıcıya özel talepler listesi
        // Aktif oturumu kontrol et
        const session = await getServerSession(authOptions);
        let userEmail = session?.user?.email;

        // Eğer kullanıcı belirlenememişse boş liste dön
        if (!userEmail) {
            return NextResponse.json({
                items: [],
                total: 0
            });
        }

        const kullaniciTalepleri = tumTalepler.filter(
            t => t.kullanici?.email?.toLowerCase() === userEmail?.toLowerCase()
        );

        // Sırala
        kullaniciTalepleri.sort((a, b) => new Date(b.olusturmaTarihi).getTime() - new Date(a.olusturmaTarihi).getTime());

        return NextResponse.json({
            items: kullaniciTalepleri,
            total: kullaniciTalepleri.length
        });

    } catch (error) {
        console.error('GET talep hatası:', error);
        return NextResponse.json({ error: 'Talepler yüklenemedi' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        // Gelen veriyi doğrula
        if (!body.baslik || !body.detay || !body.tip) {
            return NextResponse.json({ error: 'Eksik alanlar var' }, { status: 400 });
        }

        const tumTalepler = readTalepler();
        
        // Yeni talebi listeye ekle
        const yeniTalep: Talep = {
            id: body.id || `bld-${Date.now()}`,
            referansNo: body.referansNo || `BLD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            tip: body.tip,
            durum: body.durum || 'bekliyor',
            baslik: body.baslik,
            detay: body.detay,
            fotograflar: body.fotograflar || [],
            yerBilgisi: body.yerBilgisi || { il: '', ilce: '', mahalle: '', caddeSokak: '', disKapiNo: '', icKapiNo: '' },
            belediye: body.belediye || { id: '', ad: '', il: '', ilce: '' },
            kullanici: body.kullanici || { adSoyad: '', tcKimlikNo: '', telefon: '', email: '' },
            olusturmaTarihi: body.olusturmaTarihi || new Date().toISOString(),
            guncellemeTarihi: body.guncellemeTarihi || new Date().toISOString(),
        };

        tumTalepler.push(yeniTalep);
        writeTalepler(tumTalepler);

        return NextResponse.json({
            success: true,
            data: yeniTalep
        });

    } catch (error) {
        console.error('POST talep hatası:', error);
        return NextResponse.json({ error: 'Talep kaydedilemedi' }, { status: 500 });
    }
}

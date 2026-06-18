import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import type { Kullanici } from '@/types';

const PROFILE_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'kullanicilar.json');

// Yardımcı fonksiyon: Kullanıcıları oku
function readKullanicilar(): Kullanici[] {
    try {
        if (!fs.existsSync(PROFILE_FILE_PATH)) {
            return [];
        }
        const fileContent = fs.readFileSync(PROFILE_FILE_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Kullanıcı okuma hatası:', error);
        return [];
    }
}

// Yardımcı fonksiyon: Kullanıcıları yaz
function writeKullanicilar(kullanicilar: Kullanici[]) {
    try {
        const dirPath = path.dirname(PROFILE_FILE_PATH);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        fs.writeFileSync(PROFILE_FILE_PATH, JSON.stringify(kullanicilar, null, 2), 'utf-8');
    } catch (error) {
        console.error('Kullanıcı yazma hatası:', error);
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

        const tumKullanicilar = readKullanicilar();
        const kullanici = tumKullanicilar.find(
            // FIX: session.user?.email (optional chaining)
            (k) => k.email?.toLowerCase() === session.user?.email?.toLowerCase()
        );

        if (!kullanici) {
            return NextResponse.json({ error: 'Profil bulunamadı' }, { status: 404 });
        }

        return NextResponse.json(kullanici);
    } catch (error) {
        console.error('GET profil hatası:', error);
        return NextResponse.json({ error: 'Profil yüklenemedi' }, { status: 500 });
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
        const tumKullanicilar = readKullanicilar();
        const kullaniciIdx = tumKullanicilar.findIndex(
            // FIX: session.user?.email (optional chaining)
            (k) => k.email?.toLowerCase() === session.user?.email?.toLowerCase()
        );

        if (kullaniciIdx === -1) {
            return NextResponse.json({ error: 'Profil bulunamadı' }, { status: 404 });
        }

        const kullanici = tumKullanicilar[kullaniciIdx];

        // Sadece izin verilen alanları güncelle
        const guncellenmis: Kullanici = {
            ...kullanici,
            adSoyad: body.adSoyad || kullanici.adSoyad,
            telefon: body.telefon || kullanici.telefon,
            adres: body.adres || kullanici.adres,
            belediye: body.belediye || kullanici.belediye,
            pushSubscription: body.pushSubscription || kullanici.pushSubscription,
            updatedAt: new Date().toISOString(),
        };

        tumKullanicilar[kullaniciIdx] = guncellenmis;
        writeKullanicilar(tumKullanicilar);

        return NextResponse.json(guncellenmis);
    } catch (error) {
        console.error('PATCH profil hatası:', error);
        return NextResponse.json({ error: 'Güncelleme başarısız' }, { status: 500 });
    }
}

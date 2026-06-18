import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const talepler = readTalepler();
        const talep = talepler.find(t => t.id === params.id);

        if (!talep) {
            return NextResponse.json({ error: 'Talep bulunamadı' }, { status: 404 });
        }

        return NextResponse.json(talep);
    } catch (error) {
        console.error('GET talep detay hatası:', error);
        return NextResponse.json({ error: 'Talep yüklenemedi' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const talepler = readTalepler();
        const talepIdx = talepler.findIndex(t => t.id === params.id);

        if (talepIdx === -1) {
            return NextResponse.json({ error: 'Talep bulunamadı' }, { status: 404 });
        }

        const talep = talepler[talepIdx];

        // Sadece izin verilen alanları güncelle
        const updatedFields: Partial<Talep> = {};
        if (body.durum !== undefined) {
            updatedFields.durum = body.durum;
            if (body.durum === 'tamamlandi') {
                if (!talep.tamamlanmaTarihi) {
                    updatedFields.tamamlanmaTarihi = new Date().toISOString();
                }
            } else {
                // Eğer tamamlandı durumundan çıkarılırsa tamamlanma tarihini temizle
                updatedFields.tamamlanmaTarihi = undefined;
            }
        }
        if (body.yanit !== undefined) {
            updatedFields.yanit = body.yanit;
        }

        const guncelTalep: Talep = {
            ...talep,
            ...updatedFields,
            guncellemeTarihi: new Date().toISOString()
        };

        talepler[talepIdx] = guncelTalep;
        writeTalepler(talepler);

        return NextResponse.json(guncelTalep);
    } catch (error) {
        console.error('PATCH talep hatası:', error);
        return NextResponse.json({ error: 'Güncelleme başarısız' }, { status: 500 });
    }
}

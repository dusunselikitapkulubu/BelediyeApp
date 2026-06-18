import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'fotos');

// Dizini oluştur (varsa da sorun yok)
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
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

        const formData = await req.formData();
        const foto = formData.get('foto') as File;

        if (!foto) {
            return NextResponse.json(
                { error: 'Foto dosyası gerekli' },
                { status: 400 }
            );
        }

        // Dosya türü kontrolü
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(foto.type)) {
            return NextResponse.json(
                { error: 'Desteklenmeyen dosya türü' },
                { status: 400 }
            );
        }

        // Dosya boyutu kontrolü (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (foto.size > maxSize) {
            return NextResponse.json(
                { error: 'Dosya boyutu çok büyük (max 5MB)' },
                { status: 400 }
            );
        }

        // Dosyayı kaydet
        const buffer = await foto.arrayBuffer();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
        const filePath = path.join(UPLOAD_DIR, fileName);

        fs.writeFileSync(filePath, Buffer.from(buffer));

        // URL döndür
        const fileUrl = `/uploads/fotos/${fileName}`;
        const thumbnailUrl = `/uploads/fotos/${fileName}?thumb=true`;

        return NextResponse.json({
            id: `foto-${Date.now()}`,
            url: fileUrl,
            thumbnail: thumbnailUrl,
        });
    } catch (error) {
        console.error('Foto yükleme hatası:', error);
        return NextResponse.json(
            { error: 'Foto yüklenemedi' },
            { status: 500 }
        );
    }
}

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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { action } = body;

        const talepler = readTalepler();
        const talepIdx = talepler.findIndex(t => t.id === params.id);

        if (talepIdx === -1) {
            return NextResponse.json({ error: 'Talep bulunamadı' }, { status: 404 });
        }

        const talep = talepler[talepIdx];

        if (action === 'check-email') {
            // Eğer zaten tamamlanmışsa veya yanıtlanmışsa aynı yanıtı dön
            if (talep.durum === 'tamamlandi' && talep.yanit) {
                return NextResponse.json({
                    success: true,
                    updated: false,
                    data: talep
                });
            }

            // Cevap üret
            let yanitMesaji = '';
            const refNo = talep.referansNo;
            const adSoyad = talep.kullanici?.adSoyad || 'Değerli Vatandaşımız';
            const belediyeAd = talep.belediye?.ad || 'Belediyemiz';

            switch (talep.tip) {
                case 'bilgi-edinme':
                    yanitMesaji = `Sayın ${adSoyad},\n\n${refNo} numaralı bilgi edinme başvurunuz ilgili birimlerimizce incelenmiştir. Konuyla ilgili detaylı belgeler ve açıklamalar e-posta adresinize resmi yazı eki olarak gönderilmiştir.\n\nBilgilerinize sunar, iyi günler dileriz.`;
                    break;
                case 'istek':
                    yanitMesaji = `Sayın ${adSoyad},\n\n${belediyeAd}'ne ilettiğiniz ${refNo} numaralı isteğiniz, ilgili müdürlüğümüzün (Fen İşleri / Park ve Bahçeler) çalışma planına dahil edilmiştir. Talebiniz doğrultusunda gerekli işlemler en kısa sürede yerinde uygulanacaktır.\n\nİlginiz için teşekkür ederiz.`;
                    break;
                case 'sikayet':
                    yanitMesaji = `Sayın ${adSoyad},\n\n${refNo} referans numaralı şikayetiniz Zabıta ve Çevre Denetim ekiplerimize iletilmiştir. Belirtilen adrestede yapılan kontroller neticesinde gerekli uyarılar ve cezai işlemler uygulanarak olumsuzluk giderilmiştir.\n\nKatkılarınız için teşekkür ederiz.`;
                    break;
                case 'ihbar':
                    yanitMesaji = `Sayın ${adSoyad},\n\nİlettiğiniz acil durum ihbarı (${refNo}) doğrultusunda nöbetçi ekiplerimiz adrese yönlendirilmiş ve müdahale gerçekleştirilmiştir. Konu kontrol altına alınmıştır.\n\nHassasiyetiniz için teşekkür ederiz.`;
                    break;
                case 'oneri':
                    yanitMesaji = `Sayın ${adSoyad},\n\nBelediyemizin hizmet kalitesini artırmaya yönelik ${refNo} numaralı yapıcı öneriniz Ar-Ge ve Strateji Geliştirme birimimiz tarafından kayıt altına alınmış ve ilgili komisyona sevk edilmiştir.\n\nFikirlerinizi paylaştığınız için teşekkür ederiz.`;
                    break;
                case 'tesekkur':
                    yanitMesaji = `Sayın ${adSoyad},\n\nBelediyemiz hizmetlerine yönelik memnuniyetinizi bildiren ve bizleri onurlandıran ${refNo} numaralı nazik teşekkür iletiniz tüm personelimizle paylaşılmıştır.\n\nSizlere daha iyi hizmet sunabilmek amacıyla aşkla çalışmaya devam edeceğiz. İyi günler dileriz.`;
                    break;
                default:
                    yanitMesaji = `Sayın ${adSoyad},\n\n${refNo} numaralı başvurunuz belediyemiz birimlerince incelenerek karara bağlanmıştır. Detaylar ve sonuç resmi kanallarla tarafınıza iletilmiştir.\n\nBilgilerinize sunarız.`;
            }

            // Talebi güncelle
            const guncelTalep: Talep = {
                ...talep,
                durum: 'tamamlandi',
                yanit: yanitMesaji,
                guncellemeTarihi: new Date().toISOString(),
                tamamlanmaTarihi: new Date().toISOString()
            };

            talepler[talepIdx] = guncelTalep;
            writeTalepler(talepler);

            return NextResponse.json({
                success: true,
                updated: true,
                data: guncelTalep
            });
        }

        return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });
    } catch (error) {
        console.error('POST talep detay işlem hatası:', error);
        return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 });
    }
}

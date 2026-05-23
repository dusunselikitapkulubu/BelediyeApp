/**
 * Fotoğraf yükleme ve sıkıştırma yardımcıları
 * Canvas API ile tarayıcı taraflı resim sıkıştırma
 */

export const FOTO_CONFIG = {
    maxBoyutMB: 5,
    maxGenislik: 1920,
    maxYukseklik: 1080,
    kalite: 0.85,
    izinliTipler: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    maxAdet: 5,
};

export interface SikistirilmisFoto {
    dosya: File;
    onizlemeUrl: string;
    orijinalBoyut: number;
    sikistirmaBoyut: number;
}

/**
 * Dosya boyutu MB cinsinden döndür
 */
export function dosyaBoyutuMB(bytes: number): number {
    return bytes / (1024 * 1024);
}

/**
 * Fotoğrafı Canvas ile sıkıştır
 */
export async function fotografSikistir(
    dosya: File,
    maxGenislik = FOTO_CONFIG.maxGenislik,
    maxYukseklik = FOTO_CONFIG.maxYukseklik,
    kalite = FOTO_CONFIG.kalite
): Promise<SikistirilmisFoto> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(dosya);

        img.onload = () => {
            URL.revokeObjectURL(url);

            let { width, height } = img;

            // Boyut sınırla (oran koru)
            if (width > maxGenislik || height > maxYukseklik) {
                const ratio = Math.min(maxGenislik / width, maxYukseklik / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context alınamadı'));

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error('Blob oluşturulamadı'));

                    const sikistirilmisDosya = new File(
                        [blob],
                        dosya.name.replace(/\.[^/.]+$/, '.jpg'),
                        { type: 'image/jpeg' }
                    );

                    const onizlemeUrl = URL.createObjectURL(blob);

                    resolve({
                        dosya: sikistirilmisDosya,
                        onizlemeUrl,
                        orijinalBoyut: dosya.size,
                        sikistirmaBoyut: blob.size,
                    });
                },
                'image/jpeg',
                kalite
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Resim yüklenemedi'));
        };

        img.src = url;
    });
}

/**
 * Dosyayı API'ye yükle ve URL döndür
 */
export async function fotografYukle(
    dosya: File,
    token: string,
    onProgress?: (pct: number) => void
): Promise<{ id: string; url: string; thumbnail: string }> {
    const formData = new FormData();
    formData.append('foto', dosya);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                resolve(data);
            } else {
                reject(new Error(`Yükleme hatası: ${xhr.statusText}`));
            }
        });

        xhr.addEventListener('error', () => reject(new Error('Ağ hatası')));

        xhr.open('POST', '/api/upload/foto');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
    });
}

/**
 * Fotoğraf doğrulama
 */
export function fotografDogrula(dosya: File): string | null {
    if (!FOTO_CONFIG.izinliTipler.includes(dosya.type)) {
        return 'Desteklenen formatlar: JPG, PNG, WebP';
    }
    if (dosyaBoyutuMB(dosya.size) > FOTO_CONFIG.maxBoyutMB) {
        return `Maksimum dosya boyutu ${FOTO_CONFIG.maxBoyutMB}MB`;
    }
    return null;
}

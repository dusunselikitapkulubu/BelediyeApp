'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, X, Upload, Loader2, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import {
    fotografSikistir, fotografYukle, fotografDogrula,
    FOTO_CONFIG, dosyaBoyutuMB,
} from '@/lib/foto';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';

interface YuklenenFoto {
    id: string;
    url: string;
    thumbnail: string;
    onizleme: string;
    dosyaAdi: string;
    boyut: number;
    yukleniyor: boolean;
    hata?: string;
    ilerleme: number;
}

interface FotoYuklemeProps {
    onChange: (fotoIds: string[]) => void;
}

export default function FotoYukleme({ onChange }: FotoYuklemeProps) {
    const { token } = useAuthStore();
    const [fotograflar, setFotograflar] = useState<YuklenenFoto[]>([]);

    const fotograf_ekle = useCallback(
        async (dosyalar: File[]) => {
            const kalanSlot = FOTO_CONFIG.maxAdet - fotograflar.length;
            if (kalanSlot <= 0) {
                toast.error(`Maksimum ${FOTO_CONFIG.maxAdet} fotoğraf eklenebilir`);
                return;
            }

            const islenecek = dosyalar.slice(0, kalanSlot);

            for (const dosya of islenecek) {
                const hataMsg = fotografDogrula(dosya);
                if (hataMsg) { toast.error(hataMsg); continue; }

                const tempId = `temp-${Date.now()}-${Math.random()}`;
                const geciciOnizleme = URL.createObjectURL(dosya);

                // Geçici giriş ekle
                setFotograflar((prev) => [
                    ...prev,
                    {
                        id: tempId, url: '', thumbnail: '',
                        onizleme: geciciOnizleme,
                        dosyaAdi: dosya.name,
                        boyut: dosya.size,
                        yukleniyor: true,
                        ilerleme: 0,
                    },
                ]);

                try {
                    // Sıkıştır
                    const sikismis = await fotografSikistir(dosya);

                    // Yükle
                    const sonuc = await fotografYukle(
                        sikismis.dosya,
                        token || '',
                        (pct: number) => {
                            setFotograflar((prev) =>
                                prev.map((f) =>
                                    f.id === tempId ? { ...f, ilerleme: pct } : f
                                )
                            );
                        }
                    );

                    URL.revokeObjectURL(geciciOnizleme);

                    setFotograflar((prev) => {
                        const yeni = prev.map((f) =>
                            f.id === tempId
                                ? {
                                    ...f, id: sonuc.id, url: sonuc.url, thumbnail: sonuc.thumbnail,
                                    onizleme: sikismis.onizlemeUrl, yukleniyor: false, ilerleme: 100
                                }
                                : f
                        );
                        // Parent'ı güncelle
                        onChange(yeni.filter((f) => !f.yukleniyor && !f.hata).map((f) => f.id));
                        return yeni;
                    });

                } catch (err) {
                    URL.revokeObjectURL(geciciOnizleme);
                    setFotograflar((prev) =>
                        prev.map((f) =>
                            f.id === tempId
                                ? { ...f, yukleniyor: false, hata: 'Yükleme başarısız', ilerleme: 0 }
                                : f
                        )
                    );
                    console.error('Fotoğraf yükleme hatası:', err);
                }
            }
        },
        [fotograflar.length, token, onChange]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: fotograf_ekle,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
        maxFiles: FOTO_CONFIG.maxAdet,
        disabled: fotograflar.length >= FOTO_CONFIG.maxAdet,
    });

    const fotografSil = (id: string) => {
        setFotograflar((prev) => {
            const yeni = prev.filter((f) => f.id !== id);
            onChange(yeni.filter((f) => !f.yukleniyor && !f.hata).map((f) => f.id));
            return yeni;
        });
    };

    return (
        <div>
            {/* Önizleme grid */}
            {fotograflar.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {fotograflar.map((foto) => (
                        <div key={foto.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                            <Image
                                src={foto.onizleme}
                                alt={foto.dosyaAdi}
                                fill
                                className="object-cover"
                                unoptimized
                            />

                            {/* Yükleme overlay */}
                            {foto.yukleniyor && (
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                                    <Loader2 size={20} className="text-white animate-spin" />
                                    <span className="text-white text-[11px] font-medium">{foto.ilerleme}%</span>
                                    <div className="w-10 h-1 bg-white/30 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white rounded-full transition-all"
                                            style={{ width: `${foto.ilerleme}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Hata overlay */}
                            {foto.hata && (
                                <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                                    <span className="text-white text-[10px] text-center px-1">{foto.hata}</span>
                                </div>
                            )}

                            {/* Sil butonu */}
                            {!foto.yukleniyor && (
                                <button
                                    type="button"
                                    onClick={() => fotografSil(foto.id)}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60
                             flex items-center justify-center"
                                >
                                    <X size={12} className="text-white" />
                                </button>
                            )}

                            {/* Boyut */}
                            {!foto.yukleniyor && !foto.hata && (
                                <div className="absolute bottom-1 left-1 bg-black/50 rounded px-1 py-0.5">
                                    <span className="text-white text-[9px]">
                                        {dosyaBoyutuMB(foto.boyut).toFixed(1)}MB
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Ekle butonu (slot varsa) */}
                    {fotograflar.length < FOTO_CONFIG.maxAdet && (
                        <div
                            {...getRootProps()}
                            className="aspect-square rounded-xl border-2 border-dashed border-gray-300
                         flex flex-col items-center justify-center cursor-pointer
                         hover:border-[#1a4f8a] hover:bg-blue-50 transition-colors"
                        >
                            <input {...getInputProps()} />
                            <Camera size={20} className="text-gray-400" />
                            <span className="text-[10px] text-gray-400 mt-1">Ekle</span>
                        </div>
                    )}
                </div>
            )}

            {/* Boş durum - Dropzone */}
            {fotograflar.length === 0 && (
                <div
                    {...getRootProps()}
                    className={`foto-dropzone ${isDragActive ? 'dragover' : ''}`}
                >
                    <input {...getInputProps()} />
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                        {isDragActive
                            ? <Upload size={22} className="text-[#1a4f8a]" />
                            : <ImageIcon size={22} className="text-gray-400" />
                        }
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                            {isDragActive ? 'Fotoğrafı bırakın' : 'Fotoğraf Ekle'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Sürükle-bırak veya seç · Maks. {FOTO_CONFIG.maxAdet} fotoğraf
                        </p>
                        <p className="text-[11px] text-gray-300 mt-0.5">
                            JPG, PNG, WebP · {FOTO_CONFIG.maxBoyutMB}MB/fotoğraf
                        </p>
                    </div>
                </div>
            )}

            {/* Kamera butonu (mobil) */}
            {fotograflar.length > 0 && fotograflar.length < FOTO_CONFIG.maxAdet && (
                <p className="text-[11px] text-gray-400 text-center mt-1">
                    {FOTO_CONFIG.maxAdet - fotograflar.length} fotoğraf daha ekleyebilirsiniz
                </p>
            )}
        </div>
    );
}

'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';
import type { Kullanici } from '@/types';

function EDevletCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setKullanici } = useAuthStore();

  useEffect(() => {
    const success = searchParams.get('success');
    const token = searchParams.get('token');
    const hata = searchParams.get('hata');

    if (hata || !success || !token) {
      toast.error('e-Devlet girişi başarısız');
      router.push('/giris');
      return;
    }

    try {
      // Token'dan kullanıcı bilgisini çöz
      const payload = JSON.parse(atob(token));

      const kullanici: Kullanici = {
        id: payload.id,
        adSoyad: payload.adSoyad,
        tcKimlikNo: payload.tcKimlikNo,
        telefon: '',
        email: '',
        authProvider: 'edevlet',
        edevletDogrulandi: true,
        adres: {
          il: payload.belediye?.il || '',
          ilce: payload.belediye?.ilce || '',
          mahalle: '', caddeSokak: '', disKapiNo: '', icKapiNo: '',
        },
        belediye: payload.belediye || {
          id: '', ad: '', il: '', ilce: '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setKullanici(kullanici, token);
      toast.success('e-Devlet ile giriş başarılı!');
      router.push('/profil?edevlet=1'); // Eksik bilgileri tamamlat
    } catch {
      toast.error('Giriş işlemi tamamlanamadı');
      router.push('/giris');
    }
  }, [searchParams, setKullanici, router]);

  const hata = searchParams.get('hata');

  if (hata) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertCircle className="text-red-600" size={32} />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Giriş Başarısız</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          e-Devlet bağlantısı sırasında bir hata oluştu.
        </p>
        <button
          onClick={() => router.push('/giris')}
          className="px-6 py-2.5 bg-[#1a4f8a] text-white rounded-xl text-sm font-medium"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <ShieldCheck className="text-green-600" size={32} />
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">e-Devlet Doğrulandı</h2>
      <p className="text-sm text-gray-500 mb-6">Bilgileriniz alınıyor, lütfen bekleyin...</p>
      <Loader2 className="animate-spin text-[#1a4f8a]" size={28} />
    </div>
  );
}

export default function EDevletCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <Loader2 className="animate-spin text-[#1a4f8a]" size={28} />
      </div>
    }>
      <EDevletCallback />
    </Suspense>
  );
}

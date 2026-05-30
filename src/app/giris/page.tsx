'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Building2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';
import type { Kullanici } from '@/types';

export default function GirisPage() {
  const router = useRouter();
  const { setKullanici } = useAuthStore();
  const [googleYukleniyor, setGoogleYukleniyor] = useState(false);
  const { data: session } = useSession();
  const [hataMesaji, setHataMesaji] = useState<string | null>(null);

  // Oturum açma hatalarını URL parametrelerinden kontrol et
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      if (error) {
        if (error === 'OAuthSignin') {
          setHataMesaji('Google giriş isteği başlatılamadı. Client ID ayarlarınızı kontrol edin.');
        } else if (error === 'OAuthCallback') {
          setHataMesaji('Google hesabıyla bağlantı kurulurken hata oluştu. Lütfen Client Secret ve Redirect URI ayarlarını kontrol edin.');
        } else if (error === 'OAuthCreateAccount' || error === 'Callback') {
          setHataMesaji('Kullanıcı hesabı oluşturulurken veya doğrulanırken bir hata oluştu.');
        } else {
          setHataMesaji(`Oturum açılamadı: ${error}`);
        }
      }
    }
  }, []);

  // Eğer zaten Google ile giriş yapmışsa yönlendir
  if (session?.user) {
    // Google kullanıcısını local store'a kaydet
    const googleKullanici: Kullanici = {
      id: (session.user as { id?: string }).id || 'google-user',
      adSoyad: session.user.name || 'Google Kullanıcısı',
      tcKimlikNo: '',
      telefon: '',
      email: session.user.email || '',
      authProvider: 'manual',
      edevletDogrulandi: false,
      adres: {
        il: 'Manisa', ilce: 'Salihli',
        mahalle: '', caddeSokak: '',
        disKapiNo: '', icKapiNo: '',
      },
      belediye: {
        id: 'salihli', ad: 'Salihli Belediyesi',
        il: 'Manisa', ilce: 'Salihli',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setKullanici(googleKullanici, 'google-session');
    router.push('/');
    return null;
  }

  // Google ile giriş
  const googleGiris = async () => {
    setGoogleYukleniyor(true);
    try {
      await signIn('google', { callbackUrl: '/giris' });
    } catch {
      toast.error('Google ile giriş başarısız');
      setGoogleYukleniyor(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-between">

      {/* Üst alan */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20 ring-4 ring-white/10">
          <Building2 size={36} className="text-white" />
        </div>
        <h1 className="text-3.5xl font-black tracking-tight text-white mb-2 bg-gradient-to-r from-white via-white to-blue-200 bg-clip-text text-transparent">BelediyeApp</h1>
        <p className="text-white/70 text-[14px] text-center leading-relaxed font-medium">
          Belediyenize istek, öneri ve şikayetlerinizi<br />kolayca iletin
        </p>
      </div>

      {/* Form kartı */}
      <div className="bg-white/95 backdrop-blur-lg border-t border-white/20 rounded-t-[32px] px-6 pt-8 pb-12 flex flex-col justify-center shadow-[0_-12px_40px_rgba(0,0,0,0.15)] min-h-[240px]">

        {/* Hata Mesajı */}
        {hataMesaji && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs leading-relaxed font-medium">
            {hataMesaji}
          </div>
        )}

        {/* Google ile giriş butonu */}
        <button
          onClick={googleGiris}
          disabled={googleYukleniyor}
          className="flex items-center justify-center gap-3 w-full py-3.5 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-[15px] active:scale-[0.98] transition-all hover:border-slate-300 hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mb-4"
        >
          {googleYukleniyor ? (
            <Loader2 size={20} className="animate-spin text-slate-500" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          <span>{googleYukleniyor ? 'Yönlendiriliyor...' : 'Google ile Giriş Yap'}</span>
        </button>

        <p className="text-center text-[11px] text-slate-400 mt-2 font-medium">
          Güvenli giriş için Google hesabınızı kullanın.
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Shield, Eye, EyeOff, Building2, Lock, Phone } from 'lucide-react';
import { getEDevletAuthUrl } from '@/lib/edevlet';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';
import type { Kullanici } from '@/types';

interface LoginForm {
  tcKimlikNo: string;
  sifre: string;
}

export default function GirisPage() {
  const router = useRouter();
  const { setKullanici } = useAuthStore();
  const [sifreGoster, setSifreGoster] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  // Manuel giriş (demo)
  const onSubmit = async (data: LoginForm) => {
    setYukleniyor(true);
    try {
      // Gerçek uygulamada API'ye istek gönderilir
      await new Promise((r) => setTimeout(r, 1200));

      const mockKullanici: Kullanici = {
        id: '1',
        adSoyad: 'Ahmet Yılmaz',
        tcKimlikNo: data.tcKimlikNo,
        telefon: '0532 123 4567',
        email: 'ahmet.yilmaz@email.com',
        authProvider: 'manual',
        edevletDogrulandi: false,
        adres: {
          il: 'Manisa', ilce: 'Salihli',
          mahalle: 'Cumhuriyet Mah.',
          caddeSokak: 'Atatürk Cad.',
          disKapiNo: '12', icKapiNo: '3',
        },
        belediye: {
          id: 'salihli', ad: 'Salihli Belediyesi',
          il: 'Manisa', ilce: 'Salihli',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setKullanici(mockKullanici, 'mock-token-123');
      toast.success('Giriş başarılı!');
      router.push('/');
    } catch {
      toast.error('Giriş başarısız');
    } finally {
      setYukleniyor(false);
    }
  };

  // e-Devlet yönlendirmesi
  const eDevletGiris = () => {
    const url = getEDevletAuthUrl();
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a4f8a] to-[#123968] flex flex-col">

      {/* Üst alan */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-5">
          <Building2 size={40} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">BelediyeApp</h1>
        <p className="text-white/70 text-[15px] text-center leading-relaxed">
          Belediyenize istek, öneri ve şikayetlerinizi<br />kolayca iletin
        </p>
      </div>

      {/* Form kartı */}
      <div className="bg-white rounded-t-3xl px-6 pt-8 pb-10">

        {/* e-Devlet butonu */}
        <button onClick={eDevletGiris} className="btn-edevlet mb-6">
          <Shield size={20} />
          <span>e-Devlet ile Giriş Yap</span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">veya</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* TC Kimlik No */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              TC Kimlik No
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                {...register('tcKimlikNo', {
                  required: 'TC Kimlik No zorunludur',
                  pattern: { value: /^[0-9]{11}$/, message: '11 haneli TC Kimlik No giriniz' },
                })}
                type="tel"
                inputMode="numeric"
                maxLength={11}
                placeholder="12345678901"
                className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl
                           text-[15px] text-gray-900 focus:border-[#1a4f8a] focus:bg-white transition-colors"
              />
            </div>
            {errors.tcKimlikNo && (
              <p className="text-xs text-red-500 mt-1">{errors.tcKimlikNo.message}</p>
            )}
          </div>

          {/* Şifre */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Şifre</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                {...register('sifre', { required: 'Şifre zorunludur' })}
                type={sifreGoster ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full h-12 pl-10 pr-10 bg-gray-50 border border-gray-200 rounded-xl
                           text-[15px] text-gray-900 focus:border-[#1a4f8a] focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setSifreGoster(!sifreGoster)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {sifreGoster ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.sifre && (
              <p className="text-xs text-red-500 mt-1">{errors.sifre.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full h-12 bg-[#1a4f8a] text-white rounded-xl font-semibold text-[15px]
                       active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Hesap oluştur veya şifremi unuttum →{' '}
          <a href="#" className="text-[#1a4f8a] font-medium">Kayıt Ol</a>
        </p>

        <p className="text-center text-[11px] text-gray-300 mt-4">
          e-Devlet girişi ile TC kimliğiniz doğrulanır ve tüm bilgileriniz otomatik doldurulur.
        </p>
      </div>
    </div>
  );
}

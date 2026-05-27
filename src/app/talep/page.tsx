'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import {
  Info, HandMetal, AlertTriangle, Eye, AlertCircle,
  Lightbulb, Heart, MapPin, User, CheckCircle2, Copy, Loader2, Mail,
} from 'lucide-react';
import { useAuthStore, useTalepStore } from '@/store';
import FotoYukleme from '@/components/forms/FotoYukleme';
import { BELEDIYELER } from '@/lib/belediyeler';
import toast from 'react-hot-toast';
import type { TalepTipi, TalepFormValues } from '@/types';

const TIP_SECENEKLER: Array<{
  value: TalepTipi; label: string; aciklama: string;
  icon: React.ReactNode; renk: string;
}> = [
    {
      value: 'bilgi-edinme', label: 'Bilgi Edinme', aciklama: 'Belediyeden bilgi almak istiyorum',
      icon: <Info size={20} />, renk: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      value: 'istek', label: 'İstek', aciklama: 'Yeni bir hizmet veya uygulama talep ediyorum',
      icon: <HandMetal size={20} />, renk: 'text-green-600 bg-green-50 border-green-200'
    },
    {
      value: 'sikayet', label: 'Şikayet', aciklama: 'Mevcut bir hizmet veya durumdan şikâyetim var',
      icon: <AlertTriangle size={20} />, renk: 'text-red-600 bg-red-50 border-red-200'
    },
    {
      value: 'ihbar', label: 'İhbar', aciklama: 'Dikkat çekilmesini istediğim bir durum var',
      icon: <Eye size={20} />, renk: 'text-pink-600 bg-pink-50 border-pink-200'
    },
    {
      value: 'oneri', label: 'Öneri', aciklama: 'Belediyeye bir fikir veya öneri sunmak istiyorum',
      icon: <Lightbulb size={20} />, renk: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      value: 'tesekkur', label: 'Teşekkür', aciklama: 'Bir hizmet veya çalışan için teşekkür etmek istiyorum',
      icon: <Heart size={20} />, renk: 'text-teal-600 bg-teal-50 border-teal-200'
    },
  ];

export default function YeniTalepPage() {
  const router = useRouter();
  const { kullanici } = useAuthStore();
  const { addTalep } = useTalepStore();
  const { data: session } = useSession();

  const [adim, setAdim] = useState<1 | 2 | 3>(1);
  const [fotoIds, setFotoIds] = useState<string[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [basariliReferans, setBasariliReferans] = useState('');

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<TalepFormValues>({
    defaultValues: {
      belediyeId: kullanici?.belediye?.id || 'salihli',
      caddeSokak: kullanici?.adres?.caddeSokak || '',
      disKapiNo: kullanici?.adres?.disKapiNo || '',
      icKapiNo: kullanici?.adres?.icKapiNo || '',
    },
  });

  const secilenTip = watch('tip');

  const onSubmit = async (data: TalepFormValues) => {
    if (!kullanici) return;
    setYukleniyor(true);

    try {
      // E-posta API'sine gönder
      const emailResponse = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tip: data.tip,
          belediyeId: data.belediyeId,
          baslik: data.baslik,
          detay: data.detay,
          fotografIds: fotoIds,
          yerBilgisi: {
            il: kullanici.adres.il,
            ilce: kullanici.adres.ilce,
            mahalle: kullanici.adres.mahalle,
            caddeSokak: data.caddeSokak,
            disKapiNo: data.disKapiNo,
            icKapiNo: data.icKapiNo,
          },
          kullaniciBilgileri: {
            adSoyad: kullanici.adSoyad,
            telefon: kullanici.telefon,
            email: kullanici.email || session?.user?.email || '',
          },
        }),
      });

      const emailResult = await emailResponse.json();

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'E-posta gönderilemedi');
      }

      // Referans numarasını kaydet
      setBasariliReferans(emailResult.data.referansNo);

      // Ayrıca yerel veritabanına kaydet
      const yeniTalep = {
        id: `local-${Date.now()}`,
        referansNo: emailResult.data.referansNo,
        tip: data.tip,
        durum: 'bekliyor' as const,
        baslik: data.baslik,
        detay: data.detay,
        fotograflar: [],
        yerBilgisi: {
          il: kullanici.adres.il,
          ilce: kullanici.adres.ilce,
          mahalle: kullanici.adres.mahalle,
          caddeSokak: data.caddeSokak,
          disKapiNo: data.disKapiNo,
          icKapiNo: data.icKapiNo,
        },
        belediye: kullanici.belediye,
        kullanici: {
          adSoyad: kullanici.adSoyad,
          tcKimlikNo: kullanici.tcKimlikNo,
          telefon: kullanici.telefon,
          email: kullanici.email || session?.user?.email || '',
        },
        olusturmaTarihi: new Date().toISOString(),
        guncellemeTarihi: new Date().toISOString(),
      };

      await fetch('/api/talep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(yeniTalep),
      });

      addTalep(yeniTalep);
      setAdim(3);
      toast.success('Talebiniz e-posta olarak başarıyla iletildi!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Talep gönderilemedi, tekrar deneyin';
      toast.error(errorMessage);
    } finally {
      setYukleniyor(false);
    }
  };

  if (!kullanici) return null;

  // Profil eksiklik kontrolü
  const profilEksik = !kullanici.adSoyad || !kullanici.telefon || !kullanici.tcKimlikNo || !kullanici.adres?.mahalle;

  // ── Adım 3: Başarı ──────────────────────────────────────────────────────
  if (adim === 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Talebiniz İletildi!</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-2">
          Talebiniz e-posta ile {kullanici.belediye?.ad || 'belediyeye'} iletildi.
        </p>
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-full px-3 py-1.5 mb-6">
          <Mail size={14} />
          <span>E-posta başarıyla gönderildi</span>
        </div>

        <div className="w-full bg-gray-50 rounded-2xl p-4 mb-6">
          <p className="text-xs text-gray-400 mb-1">Referans Numaranız</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-[#1a4f8a] tracking-widest">{basariliReferans}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(basariliReferans); toast.success('Kopyalandı'); }}
              className="p-2 bg-gray-200 rounded-lg"
            >
              <Copy size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        <button
          onClick={() => { setAdim(1); setFotoIds([]); }}
          className="w-full py-3 bg-[#1a4f8a] text-white rounded-xl font-semibold mb-3"
        >
          Yeni Talep Oluştur
        </button>
        <button
          onClick={() => router.push('/taleplerim')}
          className="w-full py-3 border border-[#1a4f8a] text-[#1a4f8a] rounded-xl font-semibold"
        >
          Taleplerime Git
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pb-8">
      {/* Profil eksik uyarısı */}
      {profilEksik && (
        <Link
          href="/profil"
          className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 mt-4 mb-1 group hover:bg-amber-100 transition-colors"
        >
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">Profil bilgileriniz eksik</p>
            <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">
              Şikayet oluşturmadan önce ad soyad, TC kimlik no, telefon ve adres bilgilerinizi profil sayfanızdan doldurunuz.
            </p>
            <span className="text-[11px] font-semibold text-amber-700 mt-1 inline-block group-hover:underline">
              Profili Düzenle →
            </span>
          </div>
        </Link>
      )}

      {/* Adım göstergesi */}
      <div className="flex items-center gap-2 pt-5 mb-6">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${adim >= s ? 'bg-[#1a4f8a] text-white' : 'bg-gray-100 text-gray-400'}`}>
              {s}
            </div>
            {s < 2 && <div className={`flex-1 h-0.5 w-8 ${adim > s ? 'bg-[#1a4f8a]' : 'bg-gray-200'}`} />}
          </div>
        ))}
        <span className="text-xs text-gray-500 ml-1">
          {adim === 1 ? 'Talep Bilgileri' : 'Yer & Fotoğraf'}
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>

        {/* ── Adım 1: Talep tipi + detay ── */}
        {adim === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Talep Tipi</h3>
              <Controller
                name="tip"
                control={control}
                rules={{ required: 'Talep tipi seçiniz' }}
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2">
                    {TIP_SECENEKLER.map((tip) => (
                      <button
                        key={tip.value}
                        type="button"
                        onClick={() => field.onChange(tip.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all
                          ${field.value === tip.value ? `border-[#1a4f8a] bg-blue-50` : 'border-gray-100 bg-white'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${tip.renk}`}>
                          {tip.icon}
                        </div>
                        <p className="text-[13px] font-semibold text-gray-800">{tip.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{tip.aciklama}</p>
                      </button>
                    ))}
                  </div>
                )}
              />
              {errors.tip && <p className="text-xs text-red-500 mt-1">{errors.tip.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">İlgili Belediye</label>
              <select
                {...register('belediyeId', { required: 'Belediye seçimi zorunludur' })}
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900
                           focus:border-[#1a4f8a] focus:bg-white transition-colors"
              >
                <option value="">Belediye Seçiniz</option>
                {BELEDIYELER.map((belediye) => (
                  <option key={belediye.id} value={belediye.id}>
                    {belediye.ad} ({belediye.il} - {belediye.ilce})
                  </option>
                ))}
              </select>
              {errors.belediyeId && <p className="text-xs text-red-500 mt-1">{errors.belediyeId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Başlık</label>
              <input
                {...register('baslik', { required: 'Başlık zorunludur', minLength: { value: 5, message: 'En az 5 karakter' } })}
                type="text"
                placeholder="Talebinizi kısaca özetleyin"
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900
                           focus:border-[#1a4f8a] focus:bg-white transition-colors"
              />
              {errors.baslik && <p className="text-xs text-red-500 mt-1">{errors.baslik.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Talep Detayı</label>
              <textarea
                {...register('detay', { required: 'Detay zorunludur', minLength: { value: 20, message: 'En az 20 karakter yazınız' } })}
                rows={5}
                placeholder="Talebinizi ayrıntılı açıklayın..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900
                           focus:border-[#1a4f8a] focus:bg-white transition-colors resize-none"
              />
              {errors.detay && <p className="text-xs text-red-500 mt-1">{errors.detay.message}</p>}
            </div>

            <button
              type="button"
              onClick={() => { if (!secilenTip) { toast.error('Lütfen talep tipi seçin'); return; } setAdim(2); }}
              className="w-full py-3.5 bg-[#1a4f8a] text-white rounded-xl font-semibold text-[15px]"
            >
              Devam Et →
            </button>
          </div>
        )}

        {/* ── Adım 2: Yer bilgisi + fotoğraf ── */}
        {adim === 2 && (
          <div className="space-y-5">

            {/* Başvuru sahibi - sadece okunur */}
            <div className="bg-blue-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <User size={16} className="text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Başvuru Sahibi Bilgileri</span>
                {session?.user && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-auto flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google ✓
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Ad Soyad', kullanici.adSoyad],
                  ['TC Kimlik', kullanici.tcKimlikNo ? '•••••' + kullanici.tcKimlikNo?.slice(-4) : '—'],
                  ['Telefon', kullanici.telefon || '—'],
                  ['E-posta', kullanici.email || session?.user?.email || '—'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-blue-500">{label}</p>
                    <p className="font-medium text-blue-800">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Yer bilgilerini göster */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={16} className="text-gray-500" />
                <span className="text-sm font-semibold text-gray-800">Yer Bilgileri</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">İl</label>
                  <input value={kullanici.adres.il} readOnly
                    className="w-full h-11 px-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">İlçe</label>
                  <input value={kullanici.adres.ilce} readOnly
                    className="w-full h-11 px-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500" />
                </div>
              </div>

              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">Belediye</label>
                <input value={kullanici.belediye?.ad} readOnly
                  className="w-full h-11 px-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500" />
              </div>

              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">Mahalle</label>
                <input value={kullanici.adres.mahalle} readOnly
                  className="w-full h-11 px-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500" />
              </div>

              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">Cadde / Sokak / Bulvar / Meydan</label>
                <input
                  {...register('caddeSokak')}
                  type="text"
                  placeholder="Ör: Atatürk Cad."
                  className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                             focus:border-[#1a4f8a] focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Dış Kapı No</label>
                  <input
                    {...register('disKapiNo')}
                    type="text" placeholder="12"
                    className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                               focus:border-[#1a4f8a] focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">İç Kapı No</label>
                  <input
                    {...register('icKapiNo')}
                    type="text" placeholder="3"
                    className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                               focus:border-[#1a4f8a] focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Fotoğraf yükleme */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Fotoğraf Ekle (İsteğe Bağlı)</h3>
              <FotoYukleme onChange={setFotoIds} />
            </div>

            {/* E-posta bilgilendirme */}
            <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3">
              <Mail size={16} className="text-blue-500 shrink-0" />
              <p className="text-[11px] text-blue-600">
                Gönder butonuna bastığınızda talebiniz otomatik olarak e-posta ile belediyeye iletilecektir.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAdim(1)}
                className="flex-1 py-3.5 border border-gray-300 text-gray-700 rounded-xl font-semibold"
              >
                ← Geri
              </button>
              <button
                type="submit"
                disabled={yukleniyor}
                className="flex-2 flex-1 py-3.5 bg-[#1a4f8a] text-white rounded-xl font-semibold
                           disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {yukleniyor ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    <span>Gönder</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

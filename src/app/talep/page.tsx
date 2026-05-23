'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import {
  Info, HandMetal, AlertTriangle, Eye,
  Lightbulb, Heart, MapPin, User, CheckCircle2, Copy,
} from 'lucide-react';
import { useAuthStore, useTalepStore } from '@/store';
import { talepAPI } from '@/lib/api';
import FotoYukleme from '@/components/forms/FotoYukleme';
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

  const [adim, setAdim] = useState<1 | 2 | 3>(1);
  const [fotoIds, setFotoIds] = useState<string[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [basariliReferans, setBasariliReferans] = useState('');

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<TalepFormValues>({
    defaultValues: {
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
      const talep = await talepAPI.olustur({
        tip: data.tip,
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
      });

      addTalep(talep.data);
      setBasariliReferans(talep.data.referansNo);
      setAdim(3);
      toast.success('Talebiniz başarıyla iletildi!');
    } catch {
      toast.error('Talep gönderilemedi, tekrar deneyin');
    } finally {
      setYukleniyor(false);
    }
  };

  if (!kullanici) return null;

  // ── Adım 3: Başarı ──────────────────────────────────────────────────────
  if (adim === 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Talebiniz Alındı!</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          {kullanici.belediye?.ad} tarafından incelemeye alınacak.<br />
          Güncellemeler bildirim olarak iletilecektir.
        </p>

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
                {kullanici.edevletDogrulandi && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">
                    e-Devlet ✓
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Ad Soyad', kullanici.adSoyad],
                  ['TC Kimlik', '•••••' + kullanici.tcKimlikNo?.slice(-4)],
                  ['Telefon', kullanici.telefon || '—'],
                  ['E-posta', kullanici.email || '—'],
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
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {yukleniyor ? 'Gönderiliyor...' : 'Gönder ✓'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

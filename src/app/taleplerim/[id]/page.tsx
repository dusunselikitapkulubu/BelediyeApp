'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, CheckCircle2, AlertCircle, Calendar,
  MapPin, User, Building2, Mail, RefreshCw, FileText, ArrowUpRight
} from 'lucide-react';
import { useAuthStore, useTalepStore } from '@/store';
import { talepAPI } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Talep, TalepTipi, TalepDurumu } from '@/types';
import toast from 'react-hot-toast';

const TIP_META: Record<TalepTipi, { label: string; cls: string }> = {
  'bilgi-edinme': { label: 'Bilgi Edinme', cls: 'tip-bilgi' },
  'istek': { label: 'İstek', cls: 'tip-istek' },
  'sikayet': { label: 'Şikayet', cls: 'tip-sikayet' },
  'ihbar': { label: 'İhbar', cls: 'tip-ihbar' },
  'oneri': { label: 'Öneri', cls: 'tip-oneri' },
  'tesekkur': { label: 'Teşekkür', cls: 'tip-tesekkur' },
};

const DURUM_META: Record<TalepDurumu, { label: string; icon: React.ReactNode; cls: string }> = {
  bekliyor: { label: 'Bekliyor', icon: <Clock size={14} />, cls: 'durum-bekliyor' },
  isleniyor: { label: 'İşleniyor', icon: <Clock size={14} />, cls: 'durum-isleniyor' },
  'bekleyen-bilgi': { label: 'Bilgi Bekleniyor', icon: <AlertCircle size={14} />, cls: 'durum-bekliyor' },
  tamamlandi: { label: 'Tamamlandı', icon: <CheckCircle2 size={14} />, cls: 'durum-tamamlandi' },
  reddedildi: { label: 'Reddedildi', icon: <AlertCircle size={14} />, cls: 'durum-reddedildi' },
};

export default function TalepDetayPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const router = useRouter();
  const { kullanici } = useAuthStore();
  const { talepler, updateTalep } = useTalepStore();
  const [talep, setTalep] = useState<Talep | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kontrolEdiliyor, setKontrolEdiliyor] = useState(false);
  const [kontrolAsamasi, setKontrolAsamasi] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!kullanici) {
      router.push('/giris');
      return;
    }

    // İlk olarak local store'dan bulmaya çalış
    const localTalep = talepler.find((t) => t.id === id);
    if (localTalep) {
      setTalep(localTalep);
      setYukleniyor(false);
    } else {
      // Bulamazsa API'den çek
      talepAPI.detay(id)
        .then((res) => {
          setTalep(res.data);
          setYukleniyor(false);
        })
        .catch(() => {
          toast.error('Talep bulunamadı.');
          router.push('/taleplerim');
        });
    }
  }, [id, kullanici, router, talepler]);

  // E-posta kontrol simülasyonu
  const handleCheckEmail = async () => {
    if (!talep) return;
    setKontrolEdiliyor(true);
    setKontrolAsamasi(1);

    try {
      // Aşama 1: Bağlantı kuruluyor (600ms)
      await new Promise((resolve) => setTimeout(resolve, 600));
      setKontrolAsamasi(2);

      // Aşama 2: Gelen kutusu sorgulanıyor (800ms)
      await new Promise((resolve) => setTimeout(resolve, 800));
      setKontrolAsamasi(3);

      // Aşama 3: Veriler güncelleniyor (600ms)
      await new Promise((resolve) => setTimeout(resolve, 600));

      const response = await talepAPI.checkEmail(talep.id);

      if (response.data.success) {
        const updatedTalep = response.data.data;
        // Local state'i ve store'u güncelle
        setTalep(updatedTalep);
        updateTalep(talep.id, updatedTalep);

        if (response.data.updated) {
          toast.success('Belediyeden gelen yanıt başarıyla senkronize edildi ve talep durumu güncellendi!');
        } else {
          toast.success('E-posta kutusu kontrol edildi. Yeni bir güncelleme bulunmuyor.');
        }
      } else {
        toast.error('E-posta sorgusu başarısız oldu.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setKontrolEdiliyor(false);
      setKontrolAsamasi(0);
    }
  };

  if (yukleniyor) {
    return (
      <div className="px-4 py-8 flex flex-col items-center justify-center min-h-[300px] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Talep detayları yükleniyor...</p>
      </div>
    );
  }

  if (!talep) return null;

  const tip = TIP_META[talep.tip];
  const durum = DURUM_META[talep.durum];

  return (
    <div className="px-4 pb-12">
      {/* Üst Alan / Geri Butonu */}
      <div className="flex items-center gap-2.5 pt-5 mb-5">
        <Link
          href="/taleplerim"
          className="w-10 h-10 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 active:scale-95 flex items-center justify-center text-slate-700 transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-gray-900 leading-tight">Talep Detayı</h2>
          <p className="text-xs text-gray-400 font-semibold">{talep.referansNo}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Talep Ana Kartı */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${tip.cls}`}>
              {tip.label}
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${durum.cls}`}>
              {durum.icon} {durum.label}
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-gray-900 leading-snug">{talep.baslik}</h3>
            <p className="text-xs text-gray-400 font-semibold flex items-center gap-1 mt-1">
              <Calendar size={12} />
              {isMounted ? (
                <>
                  {new Date(talep.olusturmaTarihi).toLocaleDateString('tr-TR', { dateStyle: 'long' })} ({formatDistanceToNow(new Date(talep.olusturmaTarihi), { addSuffix: true, locale: tr })})
                </>
              ) : (
                <span>Yükleniyor...</span>
              )}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100/60 rounded-xl p-3.5">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{talep.detay}</p>
          </div>

          {talep.fotograflar && talep.fotograflar.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ekli Fotoğraflar</h4>
              <div className="grid grid-cols-3 gap-2">
                {talep.fotograflar.map((foto, index) => (
                  <div key={index} className="aspect-square bg-slate-100 border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <img src={foto.url} alt={foto.dosyaAdi} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Kurum ve Adres Kartı */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#1a4f8a] shrink-0">
              <Building2 size={18} />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Muhatap Belediye</span>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{talep.belediye.ad}</p>
              <p className="text-xs text-gray-400 font-semibold">{talep.belediye.il} - {talep.belediye.ilce}</p>
            </div>
          </div>

          <div className="border-t border-slate-50 pt-3 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <MapPin size={18} />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Talep Adresi</span>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">
                {talep.yerBilgisi.mahalle} {talep.yerBilgisi.caddeSokak} No: {talep.yerBilgisi.disKapiNo} {talep.yerBilgisi.icKapiNo ? `İç Kapı: ${talep.yerBilgisi.icKapiNo}` : ''}
              </p>
              <p className="text-xs text-gray-400 font-semibold">{talep.yerBilgisi.il} / {talep.yerBilgisi.ilce}</p>
            </div>
          </div>
        </div>

        {/* E-posta Cevap Kontrolü / Belediye Yanıt Kartı */}
        {talep.yanit ? (
          <div className="bg-gradient-to-br from-[#1a4f8a] to-[#123968] border border-blue-900/10 rounded-2xl p-5 text-white shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold tracking-wide">Belediye Yanıtı</h4>
                  <p className="text-[10px] text-white/60 font-medium">E-posta üzerinden alındı</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/35 border border-emerald-400/20 text-emerald-300 px-2.5 py-0.5 rounded-full">
                Sonuçlandı
              </span>
            </div>

            <div className="bg-white/10 rounded-xl p-4 border border-white/5">
              <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-slate-100">{talep.yanit}</p>
            </div>

            {talep.tamamlanmaTarihi && (
              <p className="text-[10px] text-white/50 text-right font-semibold">
                Tamamlanma: {isMounted ? new Date(talep.tamamlanmaTarihi).toLocaleDateString('tr-TR', { dateStyle: 'long', timeStyle: 'short' }) : ''}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Mail size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">E-posta Yanıt Kontrolü</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Belediye bu talebinize e-posta üzerinden yanıt göndermiş olabilir. Hemen gelen kutunuzu sorgulayarak talep durumunu güncelleyebilirsiniz.
                </p>
              </div>
            </div>

            {/* Sorgulama Animasyonu / Süreci */}
            {kontrolEdiliyor && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw size={12} className="animate-spin text-blue-600" />
                    {kontrolAsamasi === 1 && 'Gmail API bağlantısı kuruluyor...'}
                    {kontrolAsamasi === 2 && 'Gelen kutusunda referans no aranıyor...'}
                    {kontrolAsamasi === 3 && 'Talep veritabanı senkronize ediliyor...'}
                  </span>
                  <span>%{Math.round((kontrolAsamasi / 3) * 100)}</span>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(kontrolAsamasi / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {!kontrolEdiliyor && (
              <button
                type="button"
                onClick={handleCheckEmail}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white rounded-xl font-semibold text-sm 
                           flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
              >
                <RefreshCw size={16} />
                <span>E-postadan Yanıtı Kontrol Et</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

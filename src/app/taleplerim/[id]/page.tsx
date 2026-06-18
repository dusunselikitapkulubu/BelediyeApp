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
  const [isMounted, setIsMounted] = useState(false);

  // Durum güncelleme state'leri
  const [seciliDurum, setSeciliDurum] = useState<TalepDurumu>('bekliyor');
  const [yanitMetni, setYanitMetni] = useState<string>('');
  const [duzenlemeModu, setDuzenlemeModu] = useState(false);
  const [guncellemeBekliyor, setGuncellemeBekliyor] = useState(false);

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
      setSeciliDurum(localTalep.durum);
      setYanitMetni(localTalep.yanit || '');
      setYukleniyor(false);
    } else {
      // Bulamazsa API'den çek
      talepAPI.detay(id)
        .then((res) => {
          setTalep(res.data);
          setSeciliDurum(res.data.durum);
          setYanitMetni(res.data.yanit || '');
          setYukleniyor(false);
        })
        .catch(() => {
          toast.error('Talep bulunamadı.');
          router.push('/taleplerim');
        });
    }
  }, [id, kullanici, router, talepler]);

  // Talep durumunu güncelle
  const handleGuncelle = async () => {
    if (!talep) return;
    setGuncellemeBekliyor(true);

    try {
      const response = await talepAPI.guncelle(talep.id, {
        durum: seciliDurum,
        yanit: yanitMetni
      });

      const updatedTalep = response.data;
      setTalep(updatedTalep);
      updateTalep(talep.id, updatedTalep);
      setDuzenlemeModu(false);
      toast.success('Talep durumu başarıyla güncellendi!');
    } catch (error) {
      console.error(error);
      toast.error('Durum güncellenirken hata oluştu.');
    } finally {
      setGuncellemeBekliyor(false);
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

        {/* Talep Durum Yönetimi / Belediye Yanıt Kartı */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#1a4f8a] shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">Talep Durumu & Yanıtı</h4>
                <p className="text-[10px] text-gray-400 font-semibold">Talebin güncel işlem bilgileri</p>
              </div>
            </div>
            {!duzenlemeModu && (
              <button
                type="button"
                onClick={() => setDuzenlemeModu(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <span>Durumu Düzenle</span>
              </button>
            )}
          </div>

          {!duzenlemeModu ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Mevcut Durum:</span>
                <span className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${durum.cls}`}>
                  {durum.icon} {durum.label}
                </span>
              </div>

              {talep.yanit ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Belediye Yanıtı / Notu</span>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{talep.yanit}</p>
                  {talep.tamamlanmaTarihi && (
                    <p className="text-[9px] text-gray-400 font-semibold text-right pt-1">
                      Sonuçlanma: {isMounted ? new Date(talep.tamamlanmaTarihi).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' }) : ''}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 font-medium italic">Henüz bir belediye yanıtı veya açıklama eklenmemiş.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Yeni Durum Seçin</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(DURUM_META) as TalepDurumu[]).map((dKey) => {
                    const dMeta = DURUM_META[dKey];
                    const isSelected = seciliDurum === dKey;
                    return (
                      <button
                        key={dKey}
                        type="button"
                        onClick={() => setSeciliDurum(dKey)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 active:scale-95
                          ${isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/10'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-slate-50/80 hover:border-gray-300'
                          }`}
                      >
                        {dMeta.icon}
                        <span>{dMeta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="yanitMetni" className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Belediye Yanıtı / Çözüm Notu
                </label>
                <textarea
                  id="yanitMetni"
                  value={yanitMetni}
                  onChange={(e) => setYanitMetni(e.target.value)}
                  placeholder="Talebe verilecek yanıtı veya yapılan işlem açıklamasını yazın..."
                  rows={4}
                  className="w-full text-sm border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl p-3 outline-none resize-none transition-all duration-200"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={guncellemeBekliyor}
                  onClick={handleGuncelle}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  {guncellemeBekliyor ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Kaydet</span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={guncellemeBekliyor}
                  onClick={() => {
                    setSeciliDurum(talep.durum);
                    setYanitMetni(talep.yanit || '');
                    setDuzenlemeModu(false);
                  }}
                  className="px-4 h-11 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl font-bold text-xs transition-all"
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
